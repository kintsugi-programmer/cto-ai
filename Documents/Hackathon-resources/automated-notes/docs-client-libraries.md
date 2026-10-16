# FalkorDB Client Libraries: Python, JavaScript, Java, Go, Rust

> **Source:** [`FalkorDB Client Libraries_ Python, JavaScript, Java, Go, Rust - FalkorDB Docs.mhtml`](../FalkorDB%20Client%20Libraries_%20Python%2C%20JavaScript%2C%20Java%2C%20Go%2C%20Rust%20-%20FalkorDB%20Docs.mhtml) · **Type:** docs page · **Saved:** Oct 16, 2026 · **Original URL:** https://docs.falkordb.com/getting-started/clients

**Docs navigation (sidebar):** Documentation · Integrations · AI Tools · Browser · Home (Overview, Data Types, Support) · Getting Started (Configuration, Client Libraries) · Cypher Language · Algorithms · UDFs · Commands · Operations · The FalkorDB Design · References. A docs-site banner points to the documentation index at `/llms.txt`.

## Overview

- Official FalkorDB client libraries for **Python, Node.js, Java, Rust, Go, PHP, and C#** with **Object-Graph Mapping (OGM)** support for **Spring Data**, plus additional community clients.
- The page is the canonical index for choosing a client per language, with links to each project's docs and package registry.
- **Official clients** are actively maintained by the FalkorDB team and support both **RESP and Bolt protocols** (FAQ).
- **OGM libraries** let you work with graph data using native language objects and structures instead of raw Cypher: `falkordb-py-orm` (Python), `falkordb-go-orm` (Go), `spring-data-falkordb` (Java).
- **Additional clients** were originally developed for **RedisGraph**; many may work with FalkorDB due to **protocol compatibility**, but they are not officially tested or supported.
- Points to the **Client Specification** for information on the tasks involved in writing your own FalkorDB client.

## Official Clients

| Project | Docs | Language | License | Author | Package |
| --- | --- | --- | --- | --- | --- |
| falkordb-py | Pydoc | Python | MIT | FalkorDB | pypi |
| falkordb-ts | JSDoc | Node.JS | MIT | FalkorDB | npm |
| jfalkordb | javadocs | Java | BSD | FalkorDB | maven |
| falkordb-rs | docs.rs | Rust | MIT | FalkorDB | crates |
| falkordb-go | godoc | Go | BSD | FalkorDB | Github |
| falkordb-php | readme | PHP | MIT | FalkorDB | Github |
| NFalkorDB | readme | C# | Apache-2.0 | FalkorDB | nuget |

## Official Object-Graph Mapping (OGM) Libraries

FalkorDB provides official Object-Graph Mapping (OGM) libraries that allow you to work with graph data using native language objects and structures.

| Project | Docs | Language | License | Author | Package |
| --- | --- | --- | --- | --- | --- |
| falkordb-py-orm | readme | Python | MIT | FalkorDB | GitHub |
| falkordb-go-orm | readme | Go | MIT | FalkorDB | GitHub |
| spring-data-falkordb | readme | Java | Apache-2.0 | FalkorDB | GitHub |

## Additional Clients

**Note:** Some clients below were originally developed for **RedisGraph**. While many may work with FalkorDB due to **protocol compatibility**, they are **not officially tested or supported**. For best results, use the official FalkorDB clients listed above.

| Project | Language | License | Author | Package |
| --- | --- | --- | --- | --- |
| nredisstack | .NET | MIT | Redis | nuget |
| falkordb_ex | Elixir | MIT | Sebastian | GitHub |
| redisgraph-rb | Ruby | BSD | Redis | GitHub |
| redgraph | Ruby | MIT | pzac | GitHub |
| redisgraph-go | Go | BSD | Redis | GitHub |
| rueidis | Go | Apache 2.0 | Rueian | GitHub |
| ioredisgraph | JavaScript | ISC | Jonah | GitHub |
| @hydre/rgraph | JavaScript | MIT | Sceat | GitHub |
| drivine | TypeScript | Apache 2.0 | liberation-data | npm |
| php-redis-graph | PHP | MIT | KJDev | GitHub |
| redisgraph_php | PHP | MIT | jpbourbon | GitHub |
| redisgraph-ex | Elixir | MIT | crflynn | GitHub |
| redisgraph-rs | Rust | MIT | malte-v | GitHub |
| redis_graph | Rust | BSD | tompro | GitHub |
| rustis | Rust | MIT | Dahomey Technologies | Crate |
| NRedisGraph | C# | BSD | tombatron | GitHub |
| RedisGraph.jl | Julia | MIT | xyxel | GitHub |

## Implementing a client

- Information on some of the tasks involved in writing a FalkorDB client can be found in the **Client Specification**.

## Frequently Asked Questions

**Which client library should I use for my project?**
Use the official client for your language: `falkordb-py` (Python), `falkordb-ts` (Node.js), `jfalkordb` (Java), `falkordb-rs` (Rust), `falkordb-go` (Go), `falkordb-php` (PHP), or `NFalkorDB` (C#). These are actively maintained by the FalkorDB team and support both **RESP and Bolt protocols**.

**Are the old RedisGraph clients compatible with FalkorDB?**
Many community clients originally built for RedisGraph may work with FalkorDB due to **protocol compatibility**, but they are **not officially tested or supported**. For best results and access to the latest features, use the official FalkorDB clients listed in the table above.

**Does FalkorDB support Object-Graph Mapping (OGM)?**
Yes. FalkorDB offers official OGM libraries for **Python (`falkordb-py-orm`)**, **Go (`falkordb-go-orm`)**, and **Java (`spring-data-falkordb`)**. These let you work with graph data using native language objects instead of writing raw Cypher queries.

**What connection protocols does FalkorDB support?**
FalkorDB supports both the **RESP protocol (Redis Serialization Protocol)** and the **Bolt protocol (used by Neo4j-compatible tools)**. You can configure the Bolt port using the **`BOLT_PORT` configuration parameter**.

**Where can I find API documentation for each client?**
Each official client has dedicated documentation: Python has **Pydoc**, Node.js has **JSDoc**, Java has **Javadocs**, Rust has **docs.rs**, and Go has **GoDoc**. Links are in the table above.

## Key facts and numbers

- Official clients cover **7** projects/languages: Python (falkordb-py), Node.JS (falkordb-ts), Java (jfalkordb), Rust (falkordb-rs), Go (falkordb-go), PHP (falkordb-php), C# (NFalkorDB).
- Official OGM libraries: **3** — falkordb-py-orm, falkordb-go-orm, spring-data-falkordb.
- Additional community clients: **17** projects across .NET, Elixir, Ruby, Go, JavaScript, TypeScript, PHP, Rust, C#, and Julia.
- Licenses seen: **MIT**, **BSD**, **Apache-2.0 / Apache 2.0**, **ISC**.
- Package registries referenced: **pypi**, **npm**, **maven**, **crates**, **nuget**, **GitHub**, **Crate**.
- Protocols: **RESP** (Redis Serialization Protocol) and **Bolt** (used by Neo4j-compatible tools); Bolt port configured via the **`BOLT_PORT`** configuration parameter.
- API docs per client: Python → **Pydoc**, Node.js → **JSDoc**, Java → **Javadocs**, Rust → **docs.rs**, Go → **GoDoc**.
- Authors: official clients and OGMs by **FalkorDB**; community clients by Redis, Sebastian, pzac, Rueian, Jonah, Sceat, liberation-data, KJDev, jpbourbon, crflynn, malte-v, tompro, Dahomey Technologies, tombatron, xyxel.
- Compatibility note: RedisGraph-era clients may work due to protocol compatibility, but are not officially tested or supported; see the **Client Specification** for implementing a client.

## Hackathon relevance

- **Pick your stack's official client first:** Python → `falkordb-py`, Node.js → `falkordb-ts`, Java → `jfalkordb`, Go → `falkordb-go`, Rust → `falkordb-rs` — each is the tested path from an agent to FalkorDB over RESP or Bolt.
- **Multi-language teams:** every teammate can connect to the same graph from their preferred language, which helps when splitting agent tooling across services.
- **Agent memory modeling:** OGM libraries (`falkordb-py-orm`, `falkordb-go-orm`, `spring-data-falkordb`) map domain objects to the graph, useful for defining and storing an agent's schema without hand-writing Cypher.
- **Neo4j-tooling interop:** the Bolt protocol and the `BOLT_PORT` parameter make it possible to point Neo4j-compatible tools at FalkorDB.
- **Vendor-risk caution:** community clients from the RedisGraph era are fine for experiments, but the FAQ warns they are untested/unsupported — prefer official clients for hackathon reliability.

## Related notes

- [`docs-getting-started.md`](docs-getting-started.md) — installation, modeling, and first queries before choosing a client library.
- [`repo-falkordb.md`](repo-falkordb.md) — the database these clients connect to (protocols, engine internals, repo stats).
- [`../../guide/05-python-client.md`](../../guide/05-python-client.md) — hands-on module for the `falkordb-py` client used in the hackathon.
