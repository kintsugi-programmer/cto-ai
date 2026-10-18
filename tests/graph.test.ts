import { describe, expect, it } from "vitest";

import { type CtoaiError, ErrorCodes } from "../src/core/errors";
import type { CtoEdge, CtoNode } from "../src/core/schema";
import {
  bfs,
  blastRadius,
  buildAdjacency,
  labelPropagation,
  pageRank,
  shortestPath,
  weaklyConnectedComponents,
} from "../src/index/graph";

function node(id: string): CtoNode {
  return { id, type: "File", name: id, properties: {} };
}

function edge(type: CtoEdge["type"], from: string, to: string): CtoEdge {
  return { id: `${from}|${type}|${to}`, type, from, to, properties: {} };
}

/** a -> b -> c, plus d -> b. A classic small dependency diamond. */
const nodes = ["file:a", "file:b", "file:c", "file:d"].map(node);
const depEdges = [
  edge("DEPENDS_ON", "file:a", "file:b"),
  edge("DEPENDS_ON", "file:b", "file:c"),
  edge("DEPENDS_ON", "file:d", "file:b"),
];

describe("buildAdjacency", () => {
  it("indexes edges by direction and by id", () => {
    const adjacency = buildAdjacency(nodes, depEdges);
    expect(adjacency.out.get("file:a")?.map((e) => e.to)).toEqual(["file:b"]);
    expect(adjacency.in.get("file:b")?.map((e) => e.from)).toEqual(["file:a", "file:d"]);
    expect(adjacency.byId.get("file:a|DEPENDS_ON|file:b")?.to).toBe("file:b");
  });

  it("refuses a graph above the node cap with a clear error", () => {
    const many = Array.from({ length: 12 }, (_, i) => node(`file:${i}`));
    try {
      buildAdjacency(many, [], 5);
      expect.unreachable("should have thrown");
    } catch (error) {
      expect((error as CtoaiError).code).toBe(ErrorCodes.INDEX_TOO_LARGE);
      expect((error as Error).message).toContain("12 nodes");
    }
  });
});

describe("bfs", () => {
  it("expands outgoing edges with depth and path recorded", () => {
    const adjacency = buildAdjacency(nodes, depEdges);
    const hops = bfs(adjacency, "file:a", 2, new Set(["DEPENDS_ON"]), "out");
    const byNode = new Map(hops.map((hop) => [hop.node, hop]));
    expect(byNode.get("file:a")?.depth).toBe(0);
    expect(byNode.get("file:b")?.depth).toBe(1);
    expect(byNode.get("file:c")?.depth).toBe(2);
    // d is only reachable inbound from b, so a depth-2 outbound walk misses it.
    expect(byNode.has("file:d")).toBe(false);
  });

  it("respects the depth cap", () => {
    const adjacency = buildAdjacency(nodes, depEdges);
    const hops = bfs(adjacency, "file:a", 1, new Set(["DEPENDS_ON"]), "out");
    expect(hops.map((hop) => hop.node).sort()).toEqual(["file:a", "file:b"]);
  });

  it("returns empty for an unknown start node", () => {
    const adjacency = buildAdjacency(nodes, depEdges);
    expect(bfs(adjacency, "file:missing", 3)).toEqual([]);
  });
});

describe("shortestPath", () => {
  it("finds the direct path and the edges walked", () => {
    const adjacency = buildAdjacency(nodes, depEdges);
    const found = shortestPath(adjacency, "file:a", "file:c");
    expect(found?.nodes).toEqual(["file:a", "file:b", "file:c"]);
    expect(found?.edges).toEqual(["file:a|DEPENDS_ON|file:b", "file:b|DEPENDS_ON|file:c"]);
  });

  it("crosses undirected edges, so a source and its dependency connect both ways", () => {
    const adjacency = buildAdjacency(nodes, depEdges);
    expect(shortestPath(adjacency, "file:c", "file:d")?.nodes).toEqual([
      "file:c",
      "file:b",
      "file:d",
    ]);
  });

  it("returns the trivial path when from equals to", () => {
    const adjacency = buildAdjacency(nodes, depEdges);
    expect(shortestPath(adjacency, "file:a", "file:a")).toEqual({ nodes: ["file:a"], edges: [] });
  });

  it("returns undefined when the nodes are disconnected", () => {
    const adjacency = buildAdjacency([...nodes, node("file:lonely")], depEdges);
    expect(shortestPath(adjacency, "file:a", "file:lonely")).toBeUndefined();
  });
});

describe("blastRadius", () => {
  it("walks DEPENDS_ON backwards: dependents of c are b and (2 hops) a and d", () => {
    const adjacency = buildAdjacency(nodes, depEdges);
    const hops = blastRadius(adjacency, "file:c", 2);
    const byNode = new Map(hops.map((hop) => [hop.node, hop.depth]));
    expect(byNode.get("file:b")).toBe(1);
    expect(byNode.get("file:a")).toBe(2);
    expect(byNode.get("file:d")).toBe(2);
    expect(byNode.get("file:c")).toBe(0);
  });

  it("depth 1 and depth 4 return different service sets", () => {
    const adjacency = buildAdjacency(nodes, depEdges);
    const shallow = blastRadius(adjacency, "file:c", 1).filter((hop) => hop.depth > 0);
    const deep = blastRadius(adjacency, "file:c", 4).filter((hop) => hop.depth > 0);
    expect(shallow.map((hop) => hop.node)).toEqual(["file:b"]);
    expect(deep).toHaveLength(3);
  });
});

describe("pageRank", () => {
  it("ranks the most depended-upon node first", () => {
    const adjacency = buildAdjacency(nodes, depEdges);
    const ranks = pageRank(adjacency, { edgeTypes: new Set(["DEPENDS_ON"]) });
    const ranked = [...ranks.entries()].sort((a, b) => b[1] - a[1]);
    // c is depended on by b and nothing depends on a or d.
    expect(ranked[0]?.[0]).toBe("file:c");
  });

  it("is deterministic across calls", () => {
    const adjacency = buildAdjacency(nodes, depEdges);
    const first = pageRank(adjacency, { edgeTypes: new Set(["DEPENDS_ON"]) });
    const second = pageRank(adjacency, { edgeTypes: new Set(["DEPENDS_ON"]) });
    expect([...first.entries()]).toEqual([...second.entries()]);
  });

  it("sums to ~1 across all nodes", () => {
    const adjacency = buildAdjacency(nodes, depEdges);
    const ranks = pageRank(adjacency, {});
    const total = [...ranks.values()].reduce((sum, value) => sum + value, 0);
    expect(total).toBeCloseTo(1, 6);
  });
});

describe("weaklyConnectedComponents", () => {
  it("separates the disconnected node into its own component", () => {
    const adjacency = buildAdjacency([...nodes, node("file:lonely")], depEdges);
    const components = weaklyConnectedComponents(adjacency);
    expect(components).toHaveLength(2);
    expect(components.find((component) => component.length === 1)).toEqual(["file:lonely"]);
    expect(components.find((component) => component.length === 4)).toHaveLength(4);
  });

  it("returns a single component for a fully connected graph", () => {
    const adjacency = buildAdjacency(nodes, depEdges);
    expect(weaklyConnectedComponents(adjacency)).toHaveLength(1);
  });
});

describe("labelPropagation", () => {
  it("is deterministic and covers every node", () => {
    const adjacency = buildAdjacency(nodes, depEdges);
    const first = labelPropagation(adjacency);
    const second = labelPropagation(adjacency);
    expect([...first.entries()]).toEqual([...second.entries()]);
    expect(first.size).toBe(nodes.length);
  });

  it("clusters tightly connected nodes together", () => {
    // Two cliques joined by one weak edge.
    const cliqueNodes = ["file:x1", "file:x2", "file:x3", "file:y1", "file:y2", "file:y3"].map(
      node,
    );
    const cliqueEdges = [
      edge("DEPENDS_ON", "file:x1", "file:x2"),
      edge("DEPENDS_ON", "file:x2", "file:x3"),
      edge("DEPENDS_ON", "file:x3", "file:x1"),
      edge("DEPENDS_ON", "file:y1", "file:y2"),
      edge("DEPENDS_ON", "file:y2", "file:y3"),
      edge("DEPENDS_ON", "file:y3", "file:y1"),
      edge("DEPENDS_ON", "file:x1", "file:y1"),
    ];
    const labels = labelPropagation(buildAdjacency(cliqueNodes, cliqueEdges));
    const xLabel = labels.get("file:x1");
    // x2 is inside the x clique, so it should share x1's label.
    expect(labels.get("file:x2")).toBe(xLabel);
  });
});
