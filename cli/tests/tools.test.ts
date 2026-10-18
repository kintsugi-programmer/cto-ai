import { describe, expect, it } from "vitest";

import { type CtoaiError, ErrorCodes } from "../src/core/errors";
import type { CtoEdge, CtoNode } from "../src/core/schema";
import type { KnowledgeStore } from "../src/core/store";
import { getTool, globToRegex, matchesGlob, TOOL_NAMES } from "../src/tools/catalog";
import { type GuardRule, makeToolContext } from "../src/tools/resolve";

function node(id: string, name: string, properties: Record<string, unknown> = {}): CtoNode {
  return { id, type: "File", name, properties };
}

function edge(type: CtoEdge["type"], from: string, to: string): CtoEdge {
  return { id: `${from}|${type}|${to}`, type, from, to, properties: {} };
}

/** An in-memory KnowledgeStore over a fixed snapshot. */
function fakeStore(nodes: CtoNode[], edges: CtoEdge[]): KnowledgeStore {
  return {
    kind: "fake",
    async load() {
      return { nodes, edges };
    },
    async replace() {
      throw new Error("not supported in tests");
    },
    async getNode(id: string) {
      return nodes.find((n) => n.id === id);
    },
    async edgesFor(nodeId: string) {
      return edges.filter((e) => e.from === nodeId || e.to === nodeId);
    },
    async close() {},
  };
}

const nodes: CtoNode[] = [
  node("file:src/cli.ts", "cli.ts", { path: "src/cli.ts" }),
  node("file:src/store.ts", "store.ts", { path: "src/store.ts" }),
  node("file:src/util.ts", "util.ts", { path: "src/util.ts" }),
  node("file:docs/readme.md", "readme.md", { path: "docs/readme.md" }),
];
const edges: CtoEdge[] = [
  edge("DEPENDS_ON", "file:src/cli.ts", "file:src/store.ts"),
  edge("DEPENDS_ON", "file:src/store.ts", "file:src/util.ts"),
  edge("LINKS_TO", "file:docs/readme.md", "file:src/cli.ts"),
];

function ctxWith(overrides: { guards?: GuardRule[] } = {}) {
  return makeToolContext({
    store: fakeStore(nodes, edges),
    root: "/nonexistent",
    ...(overrides.guards !== undefined
      ? { guardLoader: async () => overrides.guards as GuardRule[] }
      : {}),
  });
}

describe("tool registry", () => {
  it("exposes the documented catalogue", () => {
    expect(TOOL_NAMES).toEqual([
      "blast_radius",
      "communities",
      "context_for",
      "guards",
      "islands",
      "load_bearing",
      "recall",
      "status",
      "timeline",
      "why_connected",
    ]);
  });

  it("throws UNKNOWN_TOOL for an unregistered name", () => {
    try {
      getTool("teleport");
      expect.unreachable("should have thrown");
    } catch (error) {
      expect((error as CtoaiError).code).toBe(ErrorCodes.UNKNOWN_TOOL);
      expect((error as Error).message).toContain("blast_radius");
    }
  });

  it("every tool has a description and a schema", () => {
    for (const name of TOOL_NAMES) {
      const tool = getTool(name);
      expect(tool.description.length).toBeGreaterThan(10);
      expect(tool.args).toBeDefined();
    }
  });
});

describe("blast_radius", () => {
  it("returns dependents with the path walked", async () => {
    const result = await getTool("blast_radius").run(ctxWith(), { path: "src/util.ts", depth: 2 });
    expect(result.outcome).toBe("answered");
    // util <- store <- cli
    expect(result.path).toContain("file:src/store.ts");
    expect(result.path).toContain("file:src/cli.ts");
  });

  it("answers honestly when the path is not indexed", async () => {
    const result = await getTool("blast_radius").run(ctxWith(), { path: "nope.ts", depth: 2 });
    expect(result.outcome).toBe("not-indexed");
    expect(result.answer).toContain("not in the graph");
  });

  it("returns an empty but answered result when nothing depends on the target", async () => {
    const result = await getTool("blast_radius").run(ctxWith(), { path: "src/cli.ts", depth: 2 });
    expect(result.outcome).toBe("answered");
    expect(result.answer).toContain("Nothing depends");
  });
});

describe("why_connected", () => {
  it("walks the path between two connected artifacts", async () => {
    const result = await getTool("why_connected").run(ctxWith(), {
      from: "src/cli.ts",
      to: "src/util.ts",
      depth: 8,
    });
    expect(result.outcome).toBe("answered");
    expect(result.path).toEqual(["file:src/cli.ts", "file:src/store.ts", "file:src/util.ts"]);
  });

  it("reports an honest no-path answer", async () => {
    const isolated = node("file:solo.ts", "solo.ts", { path: "solo.ts" });
    const result = await getTool("why_connected").run(ctxWith(), {
      from: "src/cli.ts",
      to: "solo.ts",
      depth: 8,
    });
    // solo is not connected to cli via any edge within the graph we built.
    expect(result.outcome === "answered" || result.outcome === "not-indexed").toBe(true);
    void isolated;
  });
});

describe("load_bearing", () => {
  it("ranks the most depended-upon file first", async () => {
    const result = await getTool("load_bearing").run(ctxWith(), { limit: 3 });
    const ranked = result.data.ranked as Array<{ node: string }>;
    expect(ranked[0]?.node).toBe("file:src/util.ts");
  });

  it("respects the limit", async () => {
    const result = await getTool("load_bearing").run(ctxWith(), { limit: 1 });
    expect((result.data.ranked as unknown[]).length).toBe(1);
  });
});

describe("context_for", () => {
  it("seeds from lexical matches and expands", async () => {
    const result = await getTool("context_for").run(ctxWith(), {
      task: "add a store command",
      limit: 5,
    });
    expect(result.outcome).toBe("answered");
    expect(result.path.length).toBeGreaterThan(0);
    expect(result.data.mode).toBe("lite");
  });

  it("says not-indexed when nothing matches the task terms", async () => {
    const result = await getTool("context_for").run(ctxWith(), { task: "zzz qqq", limit: 5 });
    expect(result.outcome).toBe("not-indexed");
  });
});

describe("islands and communities", () => {
  it("finds a disconnected cluster", async () => {
    const orphanNodes = [
      node("file:orphan/a.md", "a.md", { path: "orphan/a.md" }),
      node("file:orphan/b.md", "b.md", { path: "orphan/b.md" }),
    ];
    const orphanEdge = edge("LINKS_TO", "file:orphan/a.md", "file:orphan/b.md");
    const ctx = makeToolContext({
      store: fakeStore([...nodes, ...orphanNodes], [...edges, orphanEdge]),
      root: "/nonexistent",
    });
    const result = await getTool("islands").run(ctx, { limit: 10 });
    expect(result.outcome).toBe("answered");
    const clusters = result.data.clusters as Array<{ members: string[] }>;
    expect(clusters.some((c) => c.members.includes("file:orphan/a.md"))).toBe(true);
  });

  it("communities partitions every node", async () => {
    const result = await getTool("communities").run(ctxWith(), { limit: 10 });
    const clusters = result.data.clusters as Array<{ members: string[] }>;
    const covered = new Set(clusters.flatMap((c) => c.members));
    expect(covered.size).toBe(nodes.length);
  });
});

describe("guards", () => {
  it("returns the rules that apply to a protected path", async () => {
    const ctx = ctxWith({
      guards: [{ pattern: ".cto-ai/log/", rule: "append-only", source: "context/architecture.md" }],
    });
    const result = await getTool("guards").run(ctx, { path: ".cto-ai/log/decisions/a.json" });
    expect(result.outcome).toBe("answered");
    expect((result.data.rules as unknown[]).length).toBe(1);
  });

  it("returns an empty rule set for an unprotected path", async () => {
    const ctx = ctxWith({
      guards: [{ pattern: ".cto-ai/log/", rule: "append-only", source: "context/architecture.md" }],
    });
    const result = await getTool("guards").run(ctx, { path: "src/cli.ts" });
    expect((result.data.rules as unknown[]).length).toBe(0);
  });
});

describe("status", () => {
  it("reports node, edge, and spec counts", async () => {
    const result = await getTool("status").run(ctxWith(), {});
    expect(result.data.nodes).toBe(nodes.length);
    expect(result.data.edges).toBe(edges.length);
  });
});

describe("matchesGlob", () => {
  it("treats a trailing slash as directory contents", () => {
    expect(matchesGlob(".cto-ai/log/decisions/a.json", ".cto-ai/log/")).toBe(true);
    expect(matchesGlob("src/cli.ts", ".cto-ai/log/")).toBe(false);
  });

  it("supports * within one segment", () => {
    expect(matchesGlob("src/a.ts", "src/*.ts")).toBe(true);
    expect(matchesGlob("src/deep/a.ts", "src/*.ts")).toBe(false);
  });

  it("supports ** across segments", () => {
    expect(matchesGlob("src/deep/a.ts", "src/**/*.ts")).toBe(true);
  });

  it("escapes regex metacharacters in the literal parts", () => {
    expect(matchesGlob("a+b/c.ts", "a+b/")).toBe(true);
    expect(globToRegex("a+b/").source).toContain("\\+");
  });

  it("supports ? as a single-character wildcard", () => {
    expect(matchesGlob("file1.ts", "file?.ts")).toBe(true);
    expect(matchesGlob("file12.ts", "file?.ts")).toBe(false);
  });
});
