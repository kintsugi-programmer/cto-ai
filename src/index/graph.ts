import { CtoaiError, ErrorCodes } from "../core/errors";
import type { CtoEdge, CtoNode } from "../core/schema";

/**
 * In-memory graph engine.
 *
 * The "lite" algorithms of the file era: BFS, shortest path, blast radius,
 * PageRank, weakly connected components, label propagation. Every entry point
 * enforces a hard node cap so a huge repo fails fast with a clear error
 * instead of hanging.
 */

export interface Adjacency {
  nodes: Map<string, CtoNode>;
  out: Map<string, CtoEdge[]>;
  in: Map<string, CtoEdge[]>;
  edgeTypes: Set<string>;
  /** O(1) edge lookup by id. */
  byId: Map<string, CtoEdge>;
}

export const DEFAULT_MAX_NODES = 50_000;

export function buildAdjacency(
  nodes: CtoNode[],
  edges: CtoEdge[],
  maxNodes = DEFAULT_MAX_NODES,
): Adjacency {
  if (nodes.length > maxNodes) {
    throw new CtoaiError(
      ErrorCodes.INDEX_TOO_LARGE,
      `graph has ${nodes.length} nodes, above the cap of ${maxNodes}; raise --max-nodes to continue`,
    );
  }
  const adjacency: Adjacency = {
    nodes: new Map(nodes.map((node) => [node.id, node])),
    out: new Map(),
    in: new Map(),
    edgeTypes: new Set(edges.map((edge) => edge.type)),
    byId: new Map(edges.map((edge) => [edge.id, edge])),
  };
  for (const edge of edges) {
    const outList = adjacency.out.get(edge.from);
    if (outList === undefined) {
      adjacency.out.set(edge.from, [edge]);
    } else {
      outList.push(edge);
    }
    const inList = adjacency.in.get(edge.to);
    if (inList === undefined) {
      adjacency.in.set(edge.to, [edge]);
    } else {
      inList.push(edge);
    }
  }
  return adjacency;
}

export interface Hop {
  node: string;
  depth: number;
  /** Edge ids walked from the origin to this node. */
  via: string[];
}

/**
 * Breadth-first expansion, following outgoing edges.
 * `edgeTypes` filters which relationship types are traversable.
 */
export function bfs(
  adjacency: Adjacency,
  start: string,
  maxDepth: number,
  edgeTypes?: Set<string>,
  direction: "out" | "in" | "both" = "out",
): Hop[] {
  if (!adjacency.nodes.has(start)) {
    return [];
  }
  const visited = new Map<string, Hop>();
  visited.set(start, { node: start, depth: 0, via: [] });
  let frontier: Hop[] = [visited.get(start) as Hop];

  for (let depth = 1; depth <= maxDepth; depth += 1) {
    const next: Hop[] = [];
    for (const hop of frontier) {
      const candidates: CtoEdge[] = [];
      if (direction === "out" || direction === "both") {
        candidates.push(...(adjacency.out.get(hop.node) ?? []));
      }
      if (direction === "in" || direction === "both") {
        candidates.push(...(adjacency.in.get(hop.node) ?? []));
      }
      for (const edge of candidates) {
        if (edgeTypes !== undefined && !edgeTypes.has(edge.type)) {
          continue;
        }
        const target =
          edge.from === hop.node && edge.to !== hop.node
            ? edge.to
            : edge.to === hop.node && edge.from !== hop.node
              ? edge.from
              : null;
        if (target === null || visited.has(target)) {
          continue;
        }
        const newHop: Hop = { node: target, depth, via: [...hop.via, edge.id] };
        visited.set(target, newHop);
        next.push(newHop);
      }
    }
    frontier = next;
    if (frontier.length === 0) {
      break;
    }
  }
  return [...visited.values()];
}

/**
 * Shortest unweighted path between two nodes, following the chosen edge
 * types in either direction. Returns the node path plus the edges walked.
 */
export function shortestPath(
  adjacency: Adjacency,
  from: string,
  to: string,
  edgeTypes?: Set<string>,
  maxDepth = 8,
): { nodes: string[]; edges: string[] } | undefined {
  if (!adjacency.nodes.has(from) || !adjacency.nodes.has(to)) {
    return undefined;
  }
  if (from === to) {
    return { nodes: [from], edges: [] };
  }
  const visited = new Map<string, Hop>([[from, { node: from, depth: 0, via: [] }]]);
  let frontier: Hop[] = [visited.get(from) as Hop];

  for (let depth = 1; depth <= maxDepth; depth += 1) {
    const next: Hop[] = [];
    for (const hop of frontier) {
      const candidates = [
        ...(adjacency.out.get(hop.node) ?? []),
        ...(adjacency.in.get(hop.node) ?? []),
      ];
      for (const edge of candidates) {
        if (edgeTypes !== undefined && !edgeTypes.has(edge.type)) {
          continue;
        }
        const target = edge.from === hop.node ? edge.to : edge.from;
        if (target === hop.node || visited.has(target)) {
          continue;
        }
        const newHop: Hop = { node: target, depth, via: [...hop.via, edge.id] };
        if (target === to) {
          // `via` is already in walk order (from -> to). Walk it backwards to
          // reconstruct the node path, but return the edges in walk order.
          const edges = [...newHop.via];
          const nodes = [to];
          let cursor = to;
          for (const edgeId of [...edges].reverse()) {
            const edge = adjacency.byId.get(edgeId);
            if (edge === undefined) {
              break;
            }
            const prev = edge.from === cursor ? edge.to : edge.from;
            nodes.unshift(prev);
            cursor = prev;
          }
          return { nodes, edges };
        }
        visited.set(target, newHop);
        next.push(newHop);
      }
    }
    frontier = next;
    if (frontier.length === 0) {
      break;
    }
  }
  return undefined;
}

/**
 * Blast radius: everything that (transitively) depends on `target`, walking
 * DEPENDS_ON backwards, with an optional depth cap.
 */
export function blastRadius(
  adjacency: Adjacency,
  target: string,
  depth: number,
  edgeTypes: Set<string> = new Set(["DEPENDS_ON"]),
): Hop[] {
  return bfs(adjacency, target, depth, edgeTypes, "in");
}

/** PageRank by power iteration. Deterministic: sorted iteration order. */
export function pageRank(
  adjacency: Adjacency,
  options: { damping?: number; iterations?: number; edgeTypes?: Set<string>; tol?: number } = {},
): Map<string, number> {
  const damping = options.damping ?? 0.85;
  const iterations = options.iterations ?? 40;
  const tol = options.tol ?? 1e-8;
  const types = options.edgeTypes;

  const ids = [...adjacency.nodes.keys()].sort();
  if (ids.length === 0) {
    return new Map();
  }
  const rank = new Map<string, number>(ids.map((id) => [id, 1 / ids.length]));

  // Out-edges per node, filtered and sorted for determinism.
  const outEdges = new Map<string, CtoEdge[]>();
  for (const id of ids) {
    const edges = (adjacency.out.get(id) ?? [])
      .filter((edge) => types === undefined || types.has(edge.type))
      .sort((a, b) => (a.id < b.id ? -1 : 1));
    outEdges.set(id, edges);
  }

  for (let iteration = 0; iteration < iterations; iteration += 1) {
    const next = new Map<string, number>(ids.map((id) => [id, (1 - damping) / ids.length]));
    let dangling = 0;
    for (const id of ids) {
      const edges = outEdges.get(id) ?? [];
      const targets = new Set(edges.map((edge) => edge.to));
      const share = rank.get(id) ?? 0;
      if (targets.size === 0) {
        dangling += share;
        continue;
      }
      for (const target of [...targets].sort()) {
        next.set(target, (next.get(target) ?? 0) + (damping * share) / targets.size);
      }
    }
    for (const id of ids) {
      next.set(id, (next.get(id) ?? 0) + (damping * dangling) / ids.length);
    }
    let delta = 0;
    for (const id of ids) {
      delta += Math.abs((next.get(id) ?? 0) - (rank.get(id) ?? 0));
    }
    for (const id of ids) {
      rank.set(id, next.get(id) ?? 0);
    }
    if (delta < tol) {
      break;
    }
  }
  return rank;
}

/** Weakly connected components over undirected traversal of given types. */
export function weaklyConnectedComponents(
  adjacency: Adjacency,
  edgeTypes?: Set<string>,
): string[][] {
  const seen = new Set<string>();
  const components: string[][] = [];
  for (const id of [...adjacency.nodes.keys()].sort()) {
    if (seen.has(id)) {
      continue;
    }
    const component: string[] = [];
    const queue = [id];
    seen.add(id);
    while (queue.length > 0) {
      const current = queue.shift() as string;
      component.push(current);
      const candidates = [
        ...(adjacency.out.get(current) ?? []),
        ...(adjacency.in.get(current) ?? []),
      ];
      for (const edge of candidates) {
        if (edgeTypes !== undefined && !edgeTypes.has(edge.type)) {
          continue;
        }
        const target = edge.from === current ? edge.to : edge.from;
        if (!seen.has(target)) {
          seen.add(target);
          queue.push(target);
        }
      }
    }
    components.push(component.sort());
  }
  return components.sort((a, b) => ((a[0] ?? "") < (b[0] ?? "") ? -1 : 1));
}

/**
 * Label propagation communities. Iterations run in sorted order so the result
 * is stable across runs.
 */
export function labelPropagation(
  adjacency: Adjacency,
  edgeTypes?: Set<string>,
  maxIterations = 20,
): Map<string, number> {
  const ids = [...adjacency.nodes.keys()].sort();
  const label = new Map<string, number>(ids.map((id, index) => [id, index]));

  for (let iteration = 0; iteration < maxIterations; iteration += 1) {
    let changed = false;
    for (const id of ids) {
      const counts = new Map<number, number>();
      const candidates = [...(adjacency.out.get(id) ?? []), ...(adjacency.in.get(id) ?? [])];
      for (const edge of candidates) {
        if (edgeTypes !== undefined && !edgeTypes.has(edge.type)) {
          continue;
        }
        const target = edge.from === id ? edge.to : edge.from;
        const other = label.get(target);
        if (other === undefined) {
          continue;
        }
        counts.set(other, (counts.get(other) ?? 0) + 1);
      }
      if (counts.size === 0) {
        continue;
      }
      // Pick the most frequent label; ties break on the smallest label.
      let best = label.get(id) as number;
      let bestCount = -1;
      for (const candidate of [...counts.keys()].sort((a, b) => a - b)) {
        const count = counts.get(candidate) ?? 0;
        if (count > bestCount) {
          bestCount = count;
          best = candidate;
        }
      }
      if (best !== label.get(id)) {
        label.set(id, best);
        changed = true;
      }
    }
    if (!changed) {
      break;
    }
  }
  return label;
}
