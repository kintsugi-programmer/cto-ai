# FalkorDB: What It Is and How It Works

**FalkorDB** is an open-source **graph database** built for AI agents and GraphRAG. In this hackathon it must be the primary graph database and support a central part of the product.

## Key facts

- **Type**: ultra-fast, multi-tenant graph database, built as a **Redis module**.
- **Goal**: provide the best knowledge graph for LLMs (GraphRAG).
- **License**: Server Side Public License v1 (SSPLv1).
- **Engine**: originally C, now rewritten in **Rust**.
  - The rewrite closed more than 100 memory-safety bugs while keeping all Cypher queries, APIs, and integrations working.
- **Community**: 10.2k GitHub stars, 566 forks, 89 releases.
- **Published claims**: up to 496x faster than Neo4j, 6x better memory efficiency, 10,000+ graphs in a single instance.

## How it works: the one big idea

- FalkorDB stores each graph as a **sparse adjacency matrix**, a compact grid of "who connects to whom".
- Queries are translated into **linear algebra** instead of row-by-row lookups.
- It is the first queryable property graph database to use sparse matrices, powered by **GraphBLAS** underneath.
- The payoff: fast traversals and a low memory footprint.

## What you can do with it

- **Property graph model**: nodes with labels and properties, relationships with types and properties.
- **OpenCypher** query language with FalkorDB extensions.
- **Three index types**: range (exact match and comparisons), full-text (RediSearch), and vector (similarity on embeddings).
- **Graph algorithms** built in: PageRank, shortest path, community detection, and more.
- **Protocols**: RESP (Redis) and Bolt (Neo4j-compatible drivers).
- **UDFs**: user-defined functions written in JavaScript, grouped into UDF libraries.

## Multi-tenancy and scale-out

- One instance holds **thousands of isolated graphs**; each user, agent, or tenant gets its own.
- Isolation is just a graph name: `db.select_graph("tenant_42")`.
- **Scale-out**: when one instance is not enough, add servers to a cluster instead of redesigning your data model.
- **Read scaling**: route read-only queries to replicas with `ro_query()` in the Python client.

## Performance in numbers

- **FalkorDB vs Neo4j** (published benchmark, aggregate expansion workload, 82% reads and 18% writes).
  - **p50**: 55 ms vs 577.5 ms - 10.5x faster.
  - **p90**: 108 ms vs 4,784.1 ms - 44.3x faster.
  - **p99**: 136.2 ms vs 46,923.8 ms - 344.5x faster.
- Latency grows less than **2.5x from p50 to p99**, so performance stays predictable under load.
- The workload is exactly what agents do: expand relationships around a node.

## Integrations you may use

- **GraphRAG SDK** (official), **QueryWeaver**, **MCP**, **Graphiti**, **Cognee**, **LangChain**, **LlamaIndex**.
- REST API, Kafka Connect, Spring Data, n8n GraphRAG nodes, PyTorch Geometric, and a Snowflake native app that runs graph operations inside Snowflake with zero ETL.

For the hackathon the takeaway is simple: FalkorDB gives your agent a graph it can read and write on every step, memory that survives between sessions, and traversals fast enough to run inside an agent loop.
