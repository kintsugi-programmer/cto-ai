# FalkorDB vs Neo4j: Graph Database Performance Benchmarks

> **Source:** [`FalkorDB vs Neo4j_ Graph Database Performance Benchmarks.mhtml`](../FalkorDB%20vs%20Neo4j_%20Graph%20Database%20Performance%20Benchmarks.mhtml) · **Type:** blog post · **Saved:** Oct 16, 2026 · **Original URL:** https://www.falkordb.com/blog/graph-database-performance-benchmarks-falkordb-vs-neo4j/

## Overview

- FalkorDB blog post by **Avi Avni** (Chief Architect at FalkorDB), published **December 2, 2024**, updated **August 23, 2026**; reports benchmark wins for FalkorDB over Neo4j on **aggregate expansion operations**.
- Headline claim: FalkorDB holds **sub-140ms response times at p99**, while Neo4j shows **multi-second latencies** under similar conditions.
- Methodology: **11 templated queries**, randomly chosen, with an effective **82% read / 18% write** mix; latency measured end-to-end from client request to receive-and-parse of the result set.
- The post includes the exact Cypher queries used, the test environment, a RAG implications table, production considerations, and a FAQ (migration, requirements, persistence, languages, production readiness, libgomp fix).
- Results are explorable live via [Analyze the benchmark results](https://benchmark.falkordb.com/).
- Updated technical note: FalkorDB has since completed a **ground-up rewrite of its core engine in Rust**, available as a preview, closing **100+ memory-safety bugs** from the original C implementation with zero query/API/integration changes.

## Benchmark setup

- New [performance benchmarks](https://benchmark.falkordb.com/) results demonstrate FalkorDB's significant performance advantages in **aggregate expansion operations** [compared to Neo4j](https://www.falkordb.com/blog/falkordb-vs-neo4j-for-ai-applications/). The data reveals consistent **sub-140ms response times at p99**, while Neo4j experiences **multi-second latencies** under similar conditions.
- The benchmark is composed of **11 templated queries**, which represent a general usage of classic graph operations.
- Latency is measured from the client initial request and up to the receive and parse of the result-set.
- The queries are chosen randomly, so the read/write ratio should be about the same as the ratio between read and write queries in the templates: **82% Read, 18% Write**.

## Performance metrics

The benchmark results show FalkorDB's clear performance advantages:

| Load level | FalkorDB | Neo4j |
|---|---|---|
| Median (p50) | 55ms | 577.5ms |
| High load (p90) | 108ms | 4784.1ms |
| Peak load (p99) | 136.2ms | 46923.8ms |

- **Median (p50) performance:** FalkorDB processes queries in **55ms** compared to Neo4j's **577.5ms**.
- **High load (p90):** FalkorDB maintains **108ms** response time versus Neo4j's **4784.1ms**.
- **Peak load (p99):** FalkorDB delivers **136.2ms** latency while Neo4j reaches **46923.8ms**.

## Technical analysis

- FalkorDB demonstrates **stability across workload levels**: the latency increase from p50 to p99 stays within a **2.5x factor**, indicating predictable performance under varying loads.
- The benchmark, conducted on a **16-CPU system with 32GB RAM**, shows FalkorDB's efficient resource utilization. This translates to **lower infrastructure requirements and reduced operational costs**.
- Since this benchmark was first published, FalkorDB has completed a **ground-up rewrite of its core engine in Rust**:
  - closing **more than 100 open memory-safety bugs** inherited from the original C implementation,
  - while requiring **no changes** to existing Cypher queries, APIs, or integrations.
  - Internal benchmarking shows the new Rust engine **matching the C engine's performance and, in many workloads, already exceeding it**.
  - The Rust engine is **currently available as a preview** — see the deep dive on [rewriting FalkorDB in Rust](https://www.falkordb.com/blog/rewriting-falkordb-in-rust/) for the full story.

## FalkorDB Delivers Superior Performance in Graph Database Benchmarks

### Cypher queries used

| Query | Description |
|---|---|
| `CYPHER id = 2237 MATCH (s:User {id: $id})-->()-->(n:User) RETURN DISTINCT n.id` | 2 hops traversal from a single source |
| `CYPHER id = 952 MATCH (s:User {id: $id})-->()-->(n:User) WHERE n.age >= 18 RETURN DISTINCT n.id` | 2 hops traversal from a single source, filter destination |
| `CYPHER from = 1256 to = 4849 MATCH (n:User {id: $from}), (m:User {id: $to}) WITH n, m CREATE (n)-[e:Temp]->(m) RETURN e` | Create an edge between two existing nodes |
| `CYPHER id = 4702 MATCH (s:User {id: $id})-->(n:User) RETURN n.id` | Find all neighbors of a node |
| `CYPHER id = 6618 CREATE (n:UserTemp {id : $id}) RETURN n` | Create a new node |
| `CYPHER id = 1719 MATCH (n:User {id : $id}) RETURN n` | Find a specific node |

- (The published page renders relationship arrows with an en-dash glyph — `–>` — because its CMS converts `--` typographically. The `-->` form is the intended Cypher syntax and is used here so the queries can be copied and run. See "Code, commands and queries" below.)

## Implications on RAG (Retrieval augmented generation)

| Feature | FalkorDB | Neo4j | Impact on RAG |
|---|---|---|---|
| Query Latency | Sub-140ms | >4s | Higher throughput |
| Multi-tenancy | Native | Limited | Better resource utilization |
| GraphRAG Support | Built-in | Custom | Faster implementation |
| Scaling Model | Horizontal | Vertical | |

## Benchmark dataset and environment

- The benchmark utilized the **SNAP Pokec social network dataset**, focusing on **aggregate expansion operations** — a common workload in production environments.
- Testing was performed on:
  - Architecture: **x86_64**
  - CPU: **8 cores / 16 threads**
  - Memory: **32GB RAM**
  - Platform: **Linux-based GitHub Actions Runner**

## Production considerations

FalkorDB supports:

- [Cypher query language](https://docs.falkordb.com/cypher/) compatibility
- Redis persistence mechanisms
- Major programming language integrations
- Multi-tenant deployments
- Horizontal scaling capabilities

These results demonstrate FalkorDB's capability to handle **mission-critical graph database workloads** while maintaining consistent performance under pressure.

## Benchmarks FAQ

- **Can I migrate from Neo4j to FalkorDB?** — Yes, FalkorDB supports the Cypher query language, making migration from Neo4j straightforward. Migration tools are in development.
- **What are the minimum system requirements?** — FalkorDB requires a Linux/Unix system with **4GB RAM minimum**. For production environments, **16GB RAM is recommended**.
- **Which query language does FalkorDB use?** — FalkorDB uses the Cypher query language, similar to Neo4j, making migration straightforward.
- **Does FalkorDB support data persistence?** — Yes, through Redis persistence mechanisms (**RDB/AOF**). Additional persistence options are in development.
- **Does FalkorDB support common programming languages?** — Yes, through Redis clients and the [Bolt protocol](https://www.falkordb.com/blog/released-falkordb-4-0-a1-vector-search-index-bolt-protocol/), supporting major languages including **Python, Java, Go, and Node.js**.
- **Is FalkorDB production-ready?** — Yes, FalkorDB is stable for production use, being a continuation of the **production-tested RedisGraph codebase**.
- **What should I do if I get "libgomp.so.1: cannot open shared object file"?** — Install OpenMP:
  - Ubuntu: `apt-get install libgomp1`
  - RHEL/CentOS: `yum install libgomp`
  - OSX: `brew install libomp`

## Author

- **Avi Avni** — Chief Architect at FalkorDB, specializing in graph database architectures for generative AI and retrieval-augmented generation workflows.
- Over **11 years** of startup consulting experience; previously designed **GraphMatrix**—a full Cypher graph database—at Sela and led **RedisGraph** from inception to enterprise readiness for Redis' Tier 1 clients.
- Contact: `avi.avni@falkordb.com`

## Key facts and numbers

- Published **December 2, 2024**; updated **August 23, 2026**; saved to the hackathon resource collection **Oct 16, 2026**.
- Benchmark = **11 templated queries**; **82% Read / 18% Write**; random query selection.
- Latency measured from client initial request to receive-and-parse of the result-set.
- **p50:** 55ms (FalkorDB) vs 577.5ms (Neo4j).
- **p90:** 108ms (FalkorDB) vs 4784.1ms (Neo4j).
- **p99:** 136.2ms (FalkorDB) vs 46923.8ms (Neo4j).
- FalkorDB p50→p99 latency increase stays within a **2.5x factor**.
- Analysis system: **16-CPU, 32GB RAM**; test environment: **x86_64, 8 cores/16 threads, 32GB RAM, Linux-based GitHub Actions Runner**.
- Dataset: **SNAP Pokec** social network; workload: **aggregate expansion operations**.
- Rust rewrite: ground-up, closed **100+ memory-safety bugs**, no changes to Cypher queries/APIs/integrations, performance matching and sometimes exceeding the C engine, **preview** availability.
- Minimum requirements: Linux/Unix, **4GB RAM** min; **16GB RAM** recommended for production.
- Persistence: Redis **RDB/AOF**.
- Languages: Python, Java, Go, Node.js (via Redis clients and the Bolt protocol).
- Author: **11 years** startup consulting; GraphMatrix at Sela; led RedisGraph — contact `avi.avni@falkordb.com`.

## Code, commands and queries

The six example queries published in the post (arrows normalized from the page's en-dash glyphs to standard `-->` Cypher):

```cypher
CYPHER id = 2237 MATCH (s:User {id: $id})-->()-->(n:User) RETURN DISTINCT n.id
```

- 2 hops traversal from a single source.

```cypher
CYPHER id = 952 MATCH (s:User {id: $id})-->()-->(n:User) WHERE n.age >= 18 RETURN DISTINCT n.id
```

- 2 hops traversal from a single source, filter destination.

```cypher
CYPHER from = 1256 to = 4849 MATCH (n:User {id: $from}), (m:User {id: $to}) WITH n, m CREATE (n)-[e:Temp]->(m) RETURN e
```

- Create an edge between two existing nodes.

```cypher
CYPHER id = 4702 MATCH (s:User {id: $id})-->(n:User) RETURN n.id
```

- Find all neighbors of a node.

```cypher
CYPHER id = 6618 CREATE (n:UserTemp {id : $id}) RETURN n
```

- Create a new node.

```cypher
CYPHER id = 1719 MATCH (n:User {id : $id}) RETURN n
```

- Find a specific node.

System fix for the `libgomp.so.1` error:

```bash
# Ubuntu
apt-get install libgomp1
# RHEL/CentOS
yum install libgomp
# OSX
brew install libomp
```

## Hackathon relevance

- The benchmarked workload — **aggregate expansion** (multi-hop traversal and neighbor expansion) — is exactly the query shape a GraphRAG retriever or agent runs when it expands context from a starting entity in FalkorDB.
- **Sub-140ms p99** keeps multi-hop context assembly inside an interactive agent loop; Neo4j's seconds-scale p99 would stall tool calls and demos.
- The **82/18 read/write mix** mirrors agent-memory traffic (mostly recall, occasional new facts/edges) — useful when sizing your hackathon deployment.
- **Native multi-tenancy and horizontal scaling** support the "company brain" track, where several agents or teams query one shared graph.
- Use [benchmark.falkordb.com](https://benchmark.falkordb.com/) (and the FalkorDB benchmark tool) to validate your own query mix before demo day; the post's templated queries are a ready-made starting workload.

## Related notes

- [repo-benchmark.md](repo-benchmark.md) — the open-source FalkorDB benchmarking tool behind customizable workloads like the ones in this post.
- [repo-falkordb.md](repo-falkordb.md) — the main engine repo, including GraphBLAS sparse-matrix internals and the Rust rewrite context.
- [docs-graph-algorithms.md](docs-graph-algorithms.md) — algorithms and network-analysis operations that overlap with aggregate expansion workloads.
- [../../guide/02-falkordb.md](../../guide/02-falkordb.md) — beginner guide module introducing FalkorDB and why it targets GraphRAG/GenAI.
