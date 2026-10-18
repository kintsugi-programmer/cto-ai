import { z } from "zod";

import { CtoaiError, ErrorCodes } from "../core/errors";
import type { CtoNode } from "../core/schema";
import { blastRadius as runBlastRadius } from "../index/graph";
import { adjacencyOf, resolveNode, type ToolContext } from "./resolve";

/**
 * The fixed tool catalogue.
 *
 * Humans write the queries; the model picks a tool and fills in arguments;
 * every argument is resolved against the graph before anything runs. Tools
 * never compose free-hand Cypher.
 */

// --------------------------------------------------------------------------
// Schemas
// --------------------------------------------------------------------------

export const BlastRadiusArgs = z.object({
  path: z.string().min(1).describe("file or directory path, e.g. src/index.ts"),
  depth: z.number().int().min(1).max(4).default(2).describe("hops to walk, max 4"),
});

export const WhyConnectedArgs = z.object({
  from: z.string().min(1).describe("node id or path"),
  to: z.string().min(1).describe("node id or path"),
  depth: z.number().int().min(1).max(12).default(8),
});

export const LoadBearingArgs = z.object({
  limit: z.number().int().min(1).max(20).default(10),
});

export const ContextForArgs = z.object({
  task: z.string().min(1).describe("what you are about to do"),
  limit: z.number().int().min(1).max(50).default(10),
});

export const RecallArgs = z.object({
  about: z.string().min(1).describe("feature, module, or node id"),
  limit: z.number().int().min(1).max(50).default(10),
});

export const TimelineArgs = z.object({
  path: z.string().min(1).describe("node id or path"),
  limit: z.number().int().min(1).max(100).default(20),
});

export const IslandsArgs = z.object({
  limit: z.number().int().min(1).max(100).default(10),
  maxSize: z
    .number()
    .int()
    .min(1)
    .max(1000)
    .default(10)
    .describe("largest cluster treated as an island; bigger ones are reported as omitted"),
});

export const CommunitiesArgs = z.object({
  limit: z.number().int().min(1).max(100).default(10),
});

export const GuardsArgs = z.object({
  path: z.string().min(1).describe("path about to be changed"),
});

export const StatusArgs = z.object({});

// --------------------------------------------------------------------------
// Tool result envelope
// --------------------------------------------------------------------------

/**
 * Every tool answers with the same four-outcome honesty contract from the
 * event tutorial: answered (with the path walked), answered-from-memory,
 * not-in-the-graph, or unknown.
 */
export type AnswerOutcome = "answered" | "from-memory" | "not-indexed" | "unknown";

export interface ToolResult {
  tool: string;
  outcome: AnswerOutcome;
  /** One-line answer for a human or a model. */
  answer: string;
  /** Node ids the answer touched, in walk order. */
  path: string[];
  /** Structured payload, tool-specific. */
  data: Record<string, unknown>;
}

export interface ToolDefinition<Args extends z.ZodTypeAny> {
  name: string;
  description: string;
  args: Args;
  run: (ctx: ToolContext, args: z.infer<Args>) => Promise<ToolResult>;
}

// --------------------------------------------------------------------------
// Tools
// --------------------------------------------------------------------------

const blastRadius: ToolDefinition<typeof BlastRadiusArgs> = {
  name: "blast_radius",
  description:
    "Everything that depends on a file or directory, with the path walked. Ask before you change anything.",
  args: BlastRadiusArgs,
  async run(ctx, args) {
    const adjacency = await adjacencyOf(ctx);
    const target = resolveNode(adjacency, args.path);
    if (target === undefined) {
      return {
        tool: "blast_radius",
        outcome: "not-indexed",
        answer: `"${args.path}" is not in the graph. Run \`ctoai sync\` or check the path.`,
        path: [],
        data: { requested: args.path },
      };
    }
    const hops = runBlastRadius(adjacency, target.id, args.depth);
    const affected = hops.filter((hop) => hop.depth > 0);
    return {
      tool: "blast_radius",
      outcome: "answered",
      answer:
        affected.length === 0
          ? `Nothing depends on ${target.id} within ${args.depth} hop(s).`
          : `${affected.length} artifact(s) depend on ${target.id} within ${args.depth} hop(s).`,
      path: [target.id, ...affected.map((hop) => hop.node)],
      data: {
        target: target.id,
        depth: args.depth,
        traversal: "DEPENDS_ON (reverse)",
        affected: affected
          .sort((a, b) => a.depth - b.depth || (a.node < b.node ? -1 : 1))
          .map((hop) => ({ node: hop.node, depth: hop.depth, via: hop.via })),
      },
    };
  },
};

const whyConnected: ToolDefinition<typeof WhyConnectedArgs> = {
  name: "why_connected",
  description: "Shortest path between two artifacts, with every edge walked.",
  args: WhyConnectedArgs,
  async run(ctx, args) {
    const adjacency = await adjacencyOf(ctx);
    const from = resolveNode(adjacency, args.from);
    const to = resolveNode(adjacency, args.to);
    if (from === undefined || to === undefined) {
      const missing = [
        from === undefined ? args.from : undefined,
        to === undefined ? args.to : undefined,
      ]
        .filter((value): value is string => value !== undefined)
        .join(", ");
      return {
        tool: "why_connected",
        outcome: "not-indexed",
        answer: `${missing} is not in the graph.`,
        path: [],
        data: {
          missing: [from === undefined ? args.from : null, to === undefined ? args.to : null],
        },
      };
    }
    const { shortestPath } = ctx.graph;
    const found = shortestPath(adjacency, from.id, to.id, undefined, args.depth);
    if (found === undefined) {
      return {
        tool: "why_connected",
        outcome: "answered",
        answer: `No path of length <= ${args.depth} connects ${from.id} to ${to.id}.`,
        path: [],
        data: { from: from.id, to: to.id, found: false },
      };
    }
    return {
      tool: "why_connected",
      outcome: "answered",
      answer: `${from.id} connects to ${to.id} in ${found.edges.length} hop(s): ${found.nodes.join(" -> ")}`,
      path: found.nodes,
      data: { from: from.id, to: to.id, found: true, nodes: found.nodes, edges: found.edges },
    };
  },
};

const loadBearing: ToolDefinition<typeof LoadBearingArgs> = {
  name: "load_bearing",
  description: "The files the project leans on most, ranked by dependency PageRank.",
  args: LoadBearingArgs,
  async run(ctx, args) {
    const adjacency = await adjacencyOf(ctx);
    const { pageRank } = ctx.graph;
    const ranks = pageRank(adjacency, { edgeTypes: new Set(["DEPENDS_ON"]) });
    const ranked = [...ranks.entries()]
      .filter(([id]) => id.startsWith("file:"))
      .sort((a, b) => b[1] - a[1] || (a[0] < b[0] ? -1 : 1))
      .slice(0, args.limit);
    if (ranked.length === 0) {
      return {
        tool: "load_bearing",
        outcome: "not-indexed",
        answer: "No dependency edges in the graph yet; run `ctoai sync`.",
        path: [],
        data: { limit: args.limit },
      };
    }
    return {
      tool: "load_bearing",
      outcome: "answered",
      answer: `Top load-bearing file: ${ranked[0]?.[0] ?? "none"}`,
      path: ranked.map(([id]) => id),
      data: {
        limit: args.limit,
        ranked: ranked.map(([id, score]) => ({ node: id, score: Number(score.toFixed(6)) })),
      },
    };
  },
};

const contextFor: ToolDefinition<typeof ContextForArgs> = {
  name: "context_for",
  description: "The relevant subgraph for a task: lexical seed, then bounded traversal.",
  args: ContextForArgs,
  async run(ctx, args) {
    const adjacency = await adjacencyOf(ctx);
    const terms = tokenize(args.task);
    if (terms.length === 0) {
      return {
        tool: "context_for",
        outcome: "unknown",
        answer: "The task has no indexable terms.",
        path: [],
        data: { task: args.task },
      };
    }
    // Lexical seed: score nodes whose name/path match the task terms.
    const scores = new Map<string, number>();
    for (const node of adjacency.nodes.values()) {
      const haystack = `${node.id} ${node.name}`.toLowerCase();
      let score = 0;
      for (const term of terms) {
        if (haystack.includes(term)) {
          score += 1;
        }
      }
      if (score > 0) {
        scores.set(node.id, score);
      }
    }
    const seeds = [...scores.entries()]
      .sort((a, b) => b[1] - a[1] || (a[0] < b[0] ? -1 : 1))
      .slice(0, Math.max(3, Math.ceil(args.limit / 2)));

    if (seeds.length === 0) {
      return {
        tool: "context_for",
        outcome: "not-indexed",
        answer: `Nothing in the graph matches "${args.task}". Be explicit about what you need.`,
        path: [],
        data: { task: args.task, terms },
      };
    }

    // Bounded traversal from the seeds, capped at the limit.
    const { bfs } = ctx.graph;
    const seen = new Map<string, number>();
    for (const [id] of seeds) {
      for (const hop of bfs(adjacency, id, 2, undefined, "both")) {
        if (!seen.has(hop.node)) {
          seen.set(hop.node, hop.depth);
        }
      }
    }
    const picked = [...seen.entries()]
      .sort((a, b) => {
        const scoreA = scores.get(a[0]) ?? 0;
        const scoreB = scores.get(b[0]) ?? 0;
        return b[1] === 0 ? 0 : scoreB - scoreA || a[1] - b[1] || (a[0] < b[0] ? -1 : 1);
      })
      .slice(0, args.limit)
      .map(([id]) => id);

    const nodes = picked.map((id) => describeNode(adjacency.nodes.get(id))).filter(Boolean);
    return {
      tool: "context_for",
      outcome: "answered",
      answer: `${nodes.length} artifact(s) relevant to "${args.task}" (lite lexical retrieval).`,
      path: picked,
      data: { task: args.task, terms, seeds: seeds.map(([id]) => id), nodes, mode: "lite" },
    };
  },
};

const recall: ToolDefinition<typeof RecallArgs> = {
  name: "recall",
  description: "Findings, sessions, and decisions about something, newest first.",
  args: RecallArgs,
  async run(ctx, args) {
    const adjacency = await adjacencyOf(ctx);
    const target = resolveNode(adjacency, args.about);
    const needle = (target?.id ?? args.about).toLowerCase();

    // Read from the log, not the index: memory must be visible the moment it
    // is recorded, and the log is the source of truth.
    const events = await ctx.memory();
    const matches = events
      .filter((event) => {
        const text = `${event.id} ${event.text} ${event.body}`.toLowerCase();
        const aboutMatch = event.about.some((ref) => ref.toLowerCase().includes(needle));
        return aboutMatch || text.includes(needle);
      })
      .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
      .slice(0, args.limit)
      .map((event) => ({
        id: event.id,
        type: event.kind,
        text: event.text,
        createdAt: event.createdAt,
        machine: event.machine,
        about: event.about,
      }));

    if (matches.length === 0) {
      return {
        tool: "recall",
        outcome: target === undefined ? "not-indexed" : "answered",
        answer:
          target === undefined
            ? `"${args.about}" is not in the graph and no memory mentions it.`
            : `No recorded memory about ${target.id} yet.`,
        path: target === undefined ? [] : [target.id],
        data: { about: args.about, resolved: target?.id ?? null, matches: [] },
      };
    }

    return {
      tool: "recall",
      outcome: "from-memory",
      answer: `${matches.length} memory record(s) about ${target?.id ?? args.about}.`,
      path: [target?.id ?? args.about, ...matches.map((m) => m.id)],
      data: { about: args.about, resolved: target?.id ?? null, matches },
    };
  },
};

const timeline: ToolDefinition<typeof TimelineArgs> = {
  name: "timeline",
  description: "Change and decision history for one artifact.",
  args: TimelineArgs,
  async run(ctx, args) {
    const adjacency = await adjacencyOf(ctx);
    const target = resolveNode(adjacency, args.path);
    if (target === undefined) {
      return {
        tool: "timeline",
        outcome: "not-indexed",
        answer: `"${args.path}" is not in the graph.`,
        path: [],
        data: { requested: args.path },
      };
    }
    // History lives in the append-only log; the index only mirrors it.
    const events = (await ctx.memory())
      .filter((event) => event.about.some((ref) => ref === target.id))
      .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
      .slice(0, args.limit)
      .map((event) => ({
        id: event.id,
        type: event.kind,
        text: event.text,
        createdAt: event.createdAt,
      }));

    const lastCommit = target.properties.lastCommit;
    const lastCommitAt = target.properties.lastCommitAt;
    if (events.length === 0 && typeof lastCommit !== "string") {
      return {
        tool: "timeline",
        outcome: "answered",
        answer: `No recorded history for ${target.id}.`,
        path: [target.id],
        data: { target: target.id, events: [] },
      };
    }
    return {
      tool: "timeline",
      outcome: "answered",
      answer: `${events.length} recorded event(s) for ${target.id}.`,
      path: [target.id, ...events.map((event) => event.id)],
      data: {
        target: target.id,
        lastCommit: typeof lastCommit === "string" ? lastCommit : null,
        lastCommitAt: typeof lastCommitAt === "string" ? lastCommitAt : null,
        events,
      },
    };
  },
};

const islands: ToolDefinition<typeof IslandsArgs> = {
  name: "islands",
  description: "Disconnected clusters: documents or modules nothing links to.",
  args: IslandsArgs,
  async run(ctx, args) {
    const adjacency = await adjacencyOf(ctx);
    const { weaklyConnectedComponents } = ctx.graph;
    // `maxSize` normally arrives via the schema default; fall back so a
    // direct call (tests, future callers) can never filter everything out
    // with `<= undefined` and silently report "one connected mass".
    const maxSize = args.maxSize ?? 10;
    const all = weaklyConnectedComponents(adjacency);
    const islandsOnly = all.filter((component) => component.length <= maxSize);
    // Anything bigger is still disconnected - it is just not small enough to
    // be an island. Reporting it keeps the answer honest.
    const omitted = all.length - islandsOnly.length;

    if (islandsOnly.length === 0) {
      return {
        tool: "islands",
        outcome: "answered",
        answer:
          omitted === 0
            ? "No disconnected clusters: the graph is one connected mass."
            : `No clusters at or under ${maxSize} node(s); ${omitted} larger disconnected cluster(s) exist - raise maxSize to see them.`,
        path: [],
        data: { clusters: [], omitted, maxSize },
      };
    }
    const clusters = islandsOnly
      .sort((a, b) => a.length - b.length || ((a[0] ?? "") < (b[0] ?? "") ? -1 : 1))
      .slice(0, args.limit)
      .map((member) => ({
        size: member.length,
        members: member,
      }));
    return {
      tool: "islands",
      outcome: "answered",
      answer:
        `${clusters.length} disconnected cluster(s) of at most ${maxSize} node(s), smallest of size ${clusters[0]?.size ?? 0}` +
        (omitted > 0 ? `; ${omitted} larger cluster(s) omitted.` : "."),
      path: clusters.flatMap((cluster) => cluster.members).slice(0, 50),
      data: { clusters, omitted, maxSize },
    };
  },
};

const communities: ToolDefinition<typeof CommunitiesArgs> = {
  name: "communities",
  description: "Module clusters found by label propagation over all edges.",
  args: CommunitiesArgs,
  async run(ctx, args) {
    const adjacency = await adjacencyOf(ctx);
    const { labelPropagation } = ctx.graph;
    const labels = labelPropagation(adjacency);
    const grouped = new Map<number, string[]>();
    for (const [id, label] of [...labels.entries()].sort((a, b) => (a[0] < b[0] ? -1 : 1))) {
      const bucket = grouped.get(label);
      if (bucket === undefined) {
        grouped.set(label, [id]);
      } else {
        bucket.push(id);
      }
    }
    const clusters = [...grouped.values()]
      .sort((a, b) => b.length - a.length || ((a[0] ?? "") < (b[0] ?? "") ? -1 : 1))
      .slice(0, args.limit)
      .map((members) => ({ size: members.length, members }));
    return {
      tool: "communities",
      outcome: "answered",
      answer: `${clusters.length} community/clusters by label propagation.`,
      path: clusters.flatMap((cluster) => cluster.members).slice(0, 50),
      data: { clusters },
    };
  },
};

const guards: ToolDefinition<typeof GuardsArgs> = {
  name: "guards",
  description: "The rules and invariants that apply to a path.",
  args: GuardsArgs,
  async run(ctx, args) {
    const rules = await ctx.guards();
    const applicable = rules.filter((rule) => matchesGlob(args.path, rule.pattern));
    if (applicable.length === 0) {
      return {
        tool: "guards",
        outcome: "answered",
        answer: `No guard rules match ${args.path}.`,
        path: [],
        data: { path: args.path, rules: [] },
      };
    }
    return {
      tool: "guards",
      outcome: "answered",
      answer: `${applicable.length} rule(s) apply to ${args.path}.`,
      path: [],
      data: { path: args.path, rules: applicable },
    };
  },
};

const status: ToolDefinition<typeof StatusArgs> = {
  name: "status",
  description: "Context coverage, health, and index freshness.",
  args: StatusArgs,
  async run(ctx) {
    const health = await ctx.health();
    const { nodes, edges } = await ctx.snapshot();
    const specs = nodes.filter((node) => node.type === "Spec");
    return {
      tool: "status",
      outcome: "answered",
      answer: `Coverage ${health.coverage}%, ${nodes.length} nodes, ${edges.length} edges, ${specs.length} specs.`,
      path: [],
      data: { health, nodes: nodes.length, edges: edges.length, specs: specs.length },
    };
  },
};

// --------------------------------------------------------------------------
// Registry
// --------------------------------------------------------------------------

export const TOOLS = {
  blast_radius: blastRadius,
  why_connected: whyConnected,
  load_bearing: loadBearing,
  context_for: contextFor,
  recall: recall,
  timeline: timeline,
  islands: islands,
  communities: communities,
  guards: guards,
  status: status,
} as const;

export type ToolName = keyof typeof TOOLS;

export const TOOL_NAMES = Object.keys(TOOLS).sort() as ToolName[];

export function getTool(name: string): ToolDefinition<z.ZodTypeAny> {
  const tool = (TOOLS as Record<string, ToolDefinition<z.ZodTypeAny> | undefined>)[name];
  if (tool === undefined) {
    throw new CtoaiError(
      ErrorCodes.UNKNOWN_TOOL,
      `unknown tool "${name}"; available: ${TOOL_NAMES.join(", ")}`,
    );
  }
  return tool;
}

// --------------------------------------------------------------------------
// Helpers
// --------------------------------------------------------------------------

function tokenize(text: string): string[] {
  return [
    ...new Set(
      text
        .toLowerCase()
        .split(/[^a-z0-9_./-]+/)
        .map((term) => term.trim())
        .filter((term) => term.length >= 3 && !STOP_WORDS.has(term)),
    ),
  ].sort();
}

const STOP_WORDS = new Set([
  "the",
  "and",
  "for",
  "with",
  "that",
  "this",
  "from",
  "into",
  "about",
  "should",
  "would",
  "could",
  "need",
  "make",
  "when",
  "what",
  "how",
  "you",
  "are",
  "was",
  "were",
  "have",
  "has",
  "been",
  "will",
  "can",
  "all",
  "not",
]);

function describeNode(node: CtoNode | undefined): Record<string, unknown> | null {
  if (node === undefined) {
    return null;
  }
  return { id: node.id, type: node.type, name: node.name };
}

/** Glob matching with `*` and `**`, used by guards. */
export function matchesGlob(path: string, pattern: string): boolean {
  const normalizedPattern = pattern.replace(/^\.\//, "");
  const regex = globToRegex(normalizedPattern);
  return regex.test(path);
}

export function globToRegex(pattern: string): RegExp {
  let source = "";
  // A trailing slash means "this directory and everything under it".
  const normalized = pattern.endsWith("/") ? `${pattern}**` : pattern;
  for (let i = 0; i < normalized.length; i += 1) {
    const char = normalized[i];
    if (char === "*") {
      if (normalized[i + 1] === "*") {
        source += ".*";
        i += 1;
        if (normalized[i + 1] === "/") {
          i += 1;
        }
      } else {
        source += "[^/]*";
      }
      continue;
    }
    if (char === "?") {
      source += "[^/]";
      continue;
    }
    source += char?.replace(/[.+^${}()|[\]\\]/g, "\\$&") ?? "";
  }
  return new RegExp(`^${source}$`);
}
