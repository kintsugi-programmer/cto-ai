# Graph Algorithms in FalkorDB: High-Performance Network Analysis

> **Source:** [`Graph Algorithms in FalkorDB_ High-Performance Network Analysis - FalkorDB Docs.mhtml`](../Graph%20Algorithms%20in%20FalkorDB_%20High-Performance%20Network%20Analysis%20-%20FalkorDB%20Docs.mhtml) · **Type:** docs page · **Saved:** Oct 16, 2026 · **Original URL:** https://docs.falkordb.com/algorithms/

## Overview

- Overview page for FalkorDB's built-in algorithm library: "a suite of graph algorithms optimized for high-performance graph analytics."
- All algorithms are invoked via the **`CALL algo.<name>()` interface** and are built for speed and scalability using **matrix-based computation**.
- Four algorithm families: **pathfinding** (BFS, SPpath, A*, SSpath, MSF), **centrality measures** (PageRank, Betweenness, Harmonic), **community detection** (WCC, CDLP), and **network flow** (MaxFlow).
- The page summarizes each algorithm in one sentence and links to its individual documentation page.
- Ends with a five-question FAQ: call syntax, large-graph performance, SPpaths vs SSpaths, filtering nodes/edges, and choosing a community-detection algorithm.
- Page meta description: "Explore FalkorDB's high-performance graph algorithms including pathfinding (BFS, shortest path), centrality measures (PageRank, betweenness), and community detection (WCC, CDLP)."

**Docs navigation:** Home (Overview, Data Types, Support), Getting Started, Cypher Language, Algorithms (BFS, Betweenness Centrality, CDLP, PageRank, algo.SPpaths, algo.AStar, algo.SSpaths, WCC, Harmonic Centrality, Max Flow, MSF), UDFs, Commands, Operations, The FalkorDB Design, References.

## Table of Contents

- Pathfinding Algorithms
- Centrality Measures
- Community Detection
- Network Flow Algorithms

## Pathfinding Algorithms

- **BFS** — Performs a breadth-first search starting from a source node and optionally stopping at target nodes or maximum depth.
- **SPpath** — Computes the shortest paths between a source and one or more destination nodes. (Sidebar names it `algo.SPpaths`.)
- **A* Search** — Finds the shortest path between two nodes using A* search guided by a geographic (haversine) heuristic — fast on spatial graphs where nodes have coordinates. (Sidebar names it `algo.AStar`.)
- **SSpath** — Enumerates all paths from a single source node to other nodes, based on constraints like edge filters and depth. (Sidebar names it `algo.SSpaths`.)
- **MSF** — Computes the Minimum Spanning Forest of a graph, finding the minimum spanning tree for each connected component.

Note: for path expressions like `shortestPath()` used directly in Cypher queries, refer to the **Cypher Path Functions** section — that is a separate feature from the `CALL algo.*` procedures.

## Centrality Measures

- **PageRank** — Computes the PageRank score of each node in the graph, representing its influence based on the structure of incoming links.
- **Betweenness Centrality** — Calculates the number of shortest paths that pass through each node, indicating its importance as a connector in the graph.
- **Harmonic Centrality** — Measures node importance using the sum of inverse shortest-path distances to all reachable nodes, making it robust on disconnected graphs.

## Community Detection

- **WCC (Weakly Connected Components)** — Finds weakly connected components in a graph, where each node is reachable from others ignoring edge directions.
- **CDLP (Community Detection Label Propagation)** — Detects communities in a network by propagating labels through the graph structure.

## Network Flow Algorithms

- **MaxFlow** — Computes the maximum amount of flow that can be routed through a directed, weighted graph from one or more source nodes to one or more sink (target) nodes.

## Frequently Asked Questions

### How do I call a graph algorithm in FalkorDB?

- All algorithms are invoked using the `CALL algo.<name>()` syntax within a Cypher query. Each algorithm returns results via `YIELD` clauses. See individual algorithm pages for specific syntax.

### Are FalkorDB algorithms optimized for large graphs?

- Yes. FalkorDB algorithms use matrix-based computation for high performance and scalability, leveraging sparse matrix representations internally.

### What is the difference between algo.SPpaths and algo.SSpaths?

- `algo.SPpaths` finds shortest paths between a single source and a single target node. `algo.SSpaths` finds shortest paths from a single source to all reachable nodes. Use SPpaths for point-to-point queries and SSpaths for broader exploration.

### Can I filter which nodes and edges are included in an algorithm?

- Yes. Most algorithms accept optional `nodeLabels` and `relationshipTypes` parameters that let you restrict computation to specific subsets of the graph.

### Which algorithm should I use for community detection?

- Use **WCC** to find disconnected components (groups of nodes connected by any path). Use **CDLP** (Label Propagation) to detect densely connected communities within a connected graph. See WCC and CDLP for details.

## Key facts and numbers

- **11 algorithms** featured across 4 categories:
  - Pathfinding (5): BFS, SPpath/`algo.SPpaths`, A*/`algo.AStar`, SSpath/`algo.SSpaths`, MSF.
  - Centrality (3): PageRank, Betweenness Centrality, Harmonic Centrality.
  - Community detection (2): WCC, CDLP.
  - Network flow (1): MaxFlow.
- Invocation interface: `CALL algo.<name>()` inside a Cypher query; results returned via `YIELD` clauses.
- A* heuristic is geographic (**haversine**) — fast on spatial graphs where nodes have coordinates.
- Harmonic Centrality is **robust on disconnected graphs** (sum of inverse shortest-path distances to all reachable nodes).
- WCC ignores edge directions; CDLP detects communities by propagating labels through the graph structure.
- MaxFlow operates on a **directed, weighted** graph, from one or more source nodes to one or more sink (target) nodes.
- FAQ count on the page: **5 questions** answered.
- Implementation detail: **matrix-based computation** over **sparse matrix representations**, the same core that makes FalkorDB fast broadly.
- `shortestPath()` path expressions in plain Cypher are documented separately under Cypher Path Functions.

## Code, commands and queries

- Calling convention for every algorithm (verbatim from the page):

```cypher
CALL algo.<name>()
```

- Results come back through `YIELD` clauses; each individual algorithm page documents its exact syntax.
- Optional filtering parameters accepted by most algorithms: `nodeLabels` and `relationshipTypes` (restrict computation to specific subsets of the graph).
- `shortestPath()` is used directly in Cypher queries (see Cypher Path Functions), not through the `CALL algo.*` procedures.

## Hackathon relevance

- Rank important entities in a knowledge graph with **PageRank** and **Betweenness Centrality** so the agent's context layer surfaces the most influential nodes first.
- Cluster agent memories or notes into themes with **WCC** and **CDLP** — a natural fit for the agent-memory and coordination track.
- **BFS**, **SPpaths**, and **SSpaths** power multi-hop traversal and pathfinding over a company brain ("how is X connected to Y?").
- **MaxFlow** models capacity, routing, and resource-allocation problems over directed weighted graphs in the connected-data track.
- Scope analytics per subgraph with `nodeLabels` / `relationshipTypes` (e.g., one subgraph per agent) instead of running whole-graph computations.

## Related notes

- `docs-cypher-reference.md` — algorithms are invoked from Cypher via `CALL algo.<name>()` and `YIELD`.
- `transcript-cyber-security.md` — walkthrough that applies FalkorDB graph analysis to security/network data.
- `transcript-falkordb-ama.md` — FalkorDB team Q&A that touches on the algorithm suite and engine performance.
- `../../guide/09-graph-algorithms.md` — the hackathon guide module on graph algorithms.
