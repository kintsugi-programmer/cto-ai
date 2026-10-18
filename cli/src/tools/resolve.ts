import { readFile } from "node:fs/promises";
import { join } from "node:path";

import { type CtoEvent, FileEventLog } from "../core/events";
import type { CtoEdge, CtoNode } from "../core/schema";
import type { KnowledgeStore } from "../core/store";
import type { HealthReport } from "../index/build";
import {
  type Adjacency,
  bfs,
  blastRadius,
  buildAdjacency,
  labelPropagation,
  pageRank,
  shortestPath,
  weaklyConnectedComponents,
} from "../index/graph";

/**
 * Everything a tool needs from the project: the store, a memoized snapshot,
 * a memoized adjacency, guards, and health.
 */
export interface ToolContext {
  store: KnowledgeStore;
  /** Memoized full snapshot. */
  snapshot(): Promise<{ nodes: CtoNode[]; edges: CtoEdge[] }>;
  /** Memoized in-memory adjacency. */
  adjacency(): Promise<Adjacency>;
  /** Guard rules parsed from the context files. */
  guards(): Promise<GuardRule[]>;
  /** Health report, read from index/health.json when present. */
  health(): Promise<HealthReport>;
  /**
   * Agent memory, read from the append-only log.
   *
   * The log is the source of truth for sessions, findings, and decisions;
   * the index only mirrors it. Memory tools must read here so a fact is
   * visible the moment it is recorded, without waiting for a sync.
   */
  memory(): Promise<CtoEvent[]>;
  /** Root of the project, for reading context files. */
  root: string;
  /** Graph algorithm module, injected so tests can stub it. */
  graph: GraphApi;
  maxNodes: number;
}

export interface GraphApi {
  bfs: typeof bfs;
  blastRadius: typeof blastRadius;
  pageRank: typeof pageRank;
  shortestPath: typeof shortestPath;
  weaklyConnectedComponents: typeof weaklyConnectedComponents;
  labelPropagation: typeof labelPropagation;
}

export const defaultGraphApi: GraphApi = {
  bfs,
  blastRadius,
  pageRank,
  shortestPath,
  weaklyConnectedComponents,
  labelPropagation,
};

export interface GuardRule {
  pattern: string;
  rule: string;
  source: string;
}

/** Build a ToolContext bound to one store. */
export function makeToolContext(options: {
  store: KnowledgeStore;
  root: string;
  maxNodes?: number;
  graph?: GraphApi;
  healthLoader?: () => Promise<HealthReport>;
  guardLoader?: () => Promise<GuardRule[]>;
}): ToolContext {
  let snapshotPromise: Promise<{ nodes: CtoNode[]; edges: CtoEdge[] }> | undefined;
  let adjacencyPromise: Promise<Adjacency> | undefined;
  let memoryPromise: Promise<CtoEvent[]> | undefined;

  const ctx: ToolContext = {
    store: options.store,
    root: options.root,
    maxNodes: options.maxNodes ?? 50_000,
    graph: options.graph ?? defaultGraphApi,
    memory() {
      memoryPromise ??= new FileEventLog(join(options.root, ".cto-ai", "log")).all();
      return memoryPromise;
    },
    snapshot() {
      snapshotPromise ??= options.store.load();
      return snapshotPromise;
    },
    adjacency() {
      adjacencyPromise ??= ctx
        .snapshot()
        .then((snapshot) => buildAdjacency(snapshot.nodes, snapshot.edges, ctx.maxNodes));
      return adjacencyPromise;
    },
    async guards() {
      if (options.guardLoader !== undefined) {
        return options.guardLoader();
      }
      return loadGuardsFromContext(options.root);
    },
    async health() {
      if (options.healthLoader !== undefined) {
        return options.healthLoader();
      }
      try {
        const raw = await readFile(`${options.root}/.cto-ai/index/health.json`, "utf8");
        return JSON.parse(raw) as HealthReport;
      } catch {
        return {
          coverage: 0,
          stale: 0,
          openItems: 0,
          files: 0,
          filesWithEdges: 0,
          staleFiles: 0,
        };
      }
    },
  };
  return ctx;
}

/** Adjacency accessor used by tools (memoized per context). */
export async function adjacencyOf(ctx: ToolContext): Promise<Adjacency> {
  return ctx.adjacency();
}

/**
 * Resolve a user-supplied reference to a node.
 *
 * Accepts a raw node id (`file:src/cli.ts`) or a path (`src/cli.ts`), and
 * falls back to matching by name for human convenience.
 */
export function resolveNode(adjacency: Adjacency, ref: string): CtoNode | undefined {
  const direct = adjacency.nodes.get(ref);
  if (direct !== undefined) {
    return direct;
  }
  const withFilePrefix = adjacency.nodes.get(`file:${ref}`);
  if (withFilePrefix !== undefined) {
    return withFilePrefix;
  }
  const withDirPrefix = adjacency.nodes.get(`dir:${ref}`);
  if (withDirPrefix !== undefined) {
    return withDirPrefix;
  }
  // Exact path property match.
  for (const node of adjacency.nodes.values()) {
    if (node.properties.path === ref) {
      return node;
    }
  }
  // Bare-name match, but only if unique.
  const matches = [...adjacency.nodes.values()].filter((node) => node.name === ref);
  if (matches.length === 1) {
    return matches[0];
  }
  return undefined;
}

/**
 * Guard rules live as a fenced code block under a heading containing
 * "Guard" in `.cto-ai/context/architecture.md` or `ai-workflow-rules.md`.
 * Each line is `glob = rule text`.
 */
export async function loadGuardsFromContext(root: string): Promise<GuardRule[]> {
  const rules: GuardRule[] = [];
  const files = ["architecture.md", "ai-workflow-rules.md"];
  for (const file of files) {
    let content: string;
    try {
      content = await readFile(`${root}/.cto-ai/context/${file}`, "utf8");
    } catch {
      continue;
    }
    let inGuardBlock = false;
    let currentHeading = "";
    for (const line of content.split("\n")) {
      const heading = /^#{1,6}\s+(.*)$/.exec(line);
      if (heading?.[1] !== undefined) {
        currentHeading = heading[1];
        inGuardBlock = false;
        continue;
      }
      if (/^\s*```/.test(line)) {
        if (inGuardBlock) {
          inGuardBlock = false;
          continue;
        }
        if (/guard/i.test(currentHeading)) {
          inGuardBlock = true;
        }
        continue;
      }
      if (!inGuardBlock) {
        continue;
      }
      const trimmed = line.trim();
      if (trimmed.length === 0 || trimmed.startsWith("#")) {
        continue;
      }
      const [pattern, ...rest] = trimmed.split(/\s*=\s*|\s*--\s*|\s+-\s+/);
      if (pattern === undefined || pattern.length === 0) {
        continue;
      }
      rules.push({
        pattern: pattern.trim(),
        rule: rest.join(" ").trim() || "protected",
        source: `.cto-ai/context/${file}`,
      });
    }
  }
  return rules.sort((a, b) => (a.pattern < b.pattern ? -1 : 1));
}
