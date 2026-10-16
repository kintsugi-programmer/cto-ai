# Automated notes

Processed, detailed notes for **every raw resource** in `Documents/Hackathon-resources/` — one note per resource (38 notes total, listed in this index).

- **No information loss**: each note keeps every fact, number, name, version, step, table row, code snippet, and Q&A answer from its source. Only page chrome (menus, cookie banners, "Copy page", GitHub UI chrome) and conversational filler are dropped.
- **Relevant**: every note ends with a "Hackathon relevance" section tying the content to the three tracks (connected data, agent memory and coordination, company brain).
- **Linked**: every note starts with its **source file** (the exact `.mhtml` / `.txt` in the folder above) and ends with related notes and, where useful, guide modules in `Documents/guide/`.
- The 19 transcript files include three exact duplicate pairs; the duplicates have short stub notes that point to the primary note (verified by `md5`).
- All notes were generated from the locally saved sources only (saved Oct 16, 2026). Where a source's original URL is known it appears in the note header.

## Reading paths

- **Run FalkorDB fast** — [docs-home](docs-home.md) → [docs-docker](docs-docker.md) → [docker-image](docker-image.md) → [guide: running FalkorDB](../../guide/03-run-falkordb.md)
- **Model and query** — [docs-getting-started](docs-getting-started.md) → [docs-cypher-reference](docs-cypher-reference.md) → [transcript-efficient-cypher](transcript-efficient-cypher.md) → [guide: Cypher basics](../../guide/04-cypher-basics.md)
- **RAG and the SDK** — [blog-what-is-graphrag](blog-what-is-graphrag.md) → [docs-integrations](docs-integrations.md) → [repo-graphrag-sdk](repo-graphrag-sdk.md) → [transcript-graphrag-sdk-1-0](transcript-graphrag-sdk-1-0.md) → [guide: GraphRAG SDK](../../guide/08-graphrag-sdk.md)
- **Agent memory** — [transcript-graphiti-zep](transcript-graphiti-zep.md) → [transcript-agentic-memory-queryweaver](transcript-agentic-memory-queryweaver.md) → [transcript-cocoindex](transcript-cocoindex.md) → [transcript-vcpedia-fractal-kg](transcript-vcpedia-fractal-kg.md) → [guide: agent memory](../../guide/10-agent-memory.md)
- **Algorithms and security** — [docs-graph-algorithms](docs-graph-algorithms.md) → [transcript-cyber-security](transcript-cyber-security.md) → [transcript-udf-farm-to-table](transcript-udf-farm-to-table.md) → [guide: graph algorithms](../../guide/09-graph-algorithms.md)
- **Scale and operations** — [transcript-cluster-scale-out](transcript-cluster-scale-out.md) → [transcript-falkordb-ama](transcript-falkordb-ama.md) → the four Cloud tier notes below
- **Event and submission** — [event-graph-hacks](event-graph-hacks.md) → [guide: hackathon playbook](../../guide/11-hackathon-playbook.md)

## FalkorDB documentation pages (8 notes)

| Note | Source | Covers |
|------|--------|--------|
| [docs-home.md](docs-home.md) | [FalkorDB Documentation _ Graph Database for GraphRAG & GenAI - FalkorDB Docs.mhtml](../FalkorDB%20Documentation%20_%20Graph%20Database%20for%20GraphRAG%20%26%20GenAI%20-%20FalkorDB%20Docs.mhtml) | What FalkorDB is, primary features, ports, MotoGP example, license (SSPLv1), FAQ |
| [docs-getting-started.md](docs-getting-started.md) | [Getting Started with FalkorDB_ Installation, Modeling & Queries - FalkorDB Docs.mhtml](../Getting%20Started%20with%20FalkorDB_%20Installation%2C%20Modeling%20%26%20Queries%20-%20FalkorDB%20Docs.mhtml) | Prerequisites (Redis 8.0.0+), model a social network, load/query via Python, FAQ |
| [docs-docker.md](docs-docker.md) | [Deploy FalkorDB with Docker and Docker Compose - FalkorDB Docs.mhtml](../Deploy%20FalkorDB%20with%20Docker%20and%20Docker%20Compose%20-%20FalkorDB%20Docs.mhtml) | 3 images, run/compose recipes, `REDIS_ARGS`/`FALKORDB_ARGS`, persistence, health checks, troubleshooting |
| [docs-browser.md](docs-browser.md) | [FalkorDB Browser_ Visual Graph Exploration and Query Interface - FalkorDB Docs.mhtml](../FalkorDB%20Browser_%20Visual%20Graph%20Exploration%20and%20Query%20Interface%20-%20FalkorDB%20Docs.mhtml) | Web UI, canvas component, graph lifecycle, REST docs at `/docs`, connection URL formats |
| [docs-client-libraries.md](docs-client-libraries.md) | [FalkorDB Client Libraries_ Python, JavaScript, Java, Go, Rust - FalkorDB Docs.mhtml](../FalkorDB%20Client%20Libraries_%20Python%2C%20JavaScript%2C%20Java%2C%20Go%2C%20Rust%20-%20FalkorDB%20Docs.mhtml) | Official clients, OGM libraries, community clients, RESP/Bolt protocols |
| [docs-integrations.md](docs-integrations.md) | [FalkorDB Integrations_ Drivers, Frameworks, and Data Pipelines - FalkorDB Docs.mhtml](../FalkorDB%20Integrations_%20Drivers%2C%20Frameworks%2C%20and%20Data%20Pipelines%20-%20FalkorDB%20Docs.mhtml) | REST API, Kafka Connect, Apache Jena, Bolt, Spring Data, Snowflake, n8n, PyTorch Geometric, Graphify, Bulk Loader |
| [docs-cypher-reference.md](docs-cypher-reference.md) | [Cypher Query Language Reference for FalkorDB - FalkorDB Docs.mhtml](../Cypher%20Query%20Language%20Reference%20for%20FalkorDB%20-%20FalkorDB%20Docs.mhtml) | Comments, clauses, functions, procedures, algorithms, indexing, OpenCypher v9 coverage, FAQ |
| [docs-graph-algorithms.md](docs-graph-algorithms.md) | [Graph Algorithms in FalkorDB_ High-Performance Network Analysis - FalkorDB Docs.mhtml](../Graph%20Algorithms%20in%20FalkorDB_%20High-Performance%20Network%20Analysis%20-%20FalkorDB%20Docs.mhtml) | Pathfinding (BFS, SPpath, A*, SSpath, MSF), centrality (PageRank, betweenness, harmonic), WCC/CDLP, MaxFlow, FAQ |

## Repos and services (6 notes)

| Note | Source | Covers |
|------|--------|--------|
| [repo-falkordb.md](repo-falkordb.md) | [FalkorDB_FalkorDB_ A super fast Graph Database... (GraphRAG).mhtml](../FalkorDB_FalkorDB_%20A%20super%20fast%20Graph%20Database%20uses%20GraphBLAS%20under%20the%20hood%20for%20its%20sparse%20adjacency%20matrix%20graph%20representation.%20Our%20goal%20is%20to%20provide%20the%20best%20Knowledge%20Graph%20for%20LLM%20%28GraphRAG%29..mhtml) | Main repo README, features, MotoGP + redis-cli usage, client tables, dev guide, repo stats |
| [repo-graphrag-sdk.md](repo-graphrag-sdk.md) | [FalkorDB_GraphRAG-SDK_ Build fast and accurate GenAI apps with GraphRAG SDK at scale 🌟.mhtml](../FalkorDB_GraphRAG-SDK_%20Build%20fast%20and%20accurate%20GenAI%20apps%20with%20GraphRAG%20SDK%20at%20scale%20%F0%9F%8C%9F.mhtml) | SDK README: benchmark table, quick start, schemas, incremental updates, examples, milestones |
| [repo-benchmark.md](repo-benchmark.md) | [FalkorDB_benchmark_ A benchmarking tool... .mhtml](../FalkorDB_benchmark_%20A%20benchmarking%20tool%20to%20evaluate%20and%20compare%20the%20performance%20of%20graph%20databases%20with%20customizable%20workloads%20and%20metrics..mhtml) | Percentile tables, install/build, CLI workflow, vendors (Neo4j, Memgraph, Postgres, Mongo, TigerGraph), Grafana/Prometheus, FAQ |
| [docker-image.md](docker-image.md) | [falkordb_falkordb - Docker Image.mhtml](../falkordb_falkordb%20-%20Docker%20Image.mhtml) | Docker Hub page, CVE-2025-55182 fix note, redis-cli MotoGP session with timings, tags |
| [cloud-sign-in.md](cloud-sign-in.md) | [Sign In.mhtml](../Sign%20In.mhtml) | Cloud sign-in page as saved: email form, validation, links, cookie notice |
| [cloud-sign-up.md](cloud-sign-up.md) | [Sign up.mhtml](../Sign%20up.mhtml) | Cloud sign-up page as saved: registration shell and links |

## Blogs and event (4 notes)

| Note | Source | Covers |
|------|--------|--------|
| [blog-falkordb-vs-neo4j.md](blog-falkordb-vs-neo4j.md) | [FalkorDB vs Neo4j_ Graph Database Performance Benchmarks.mhtml](../FalkorDB%20vs%20Neo4j_%20Graph%20Database%20Performance%20Benchmarks.mhtml) | p50/p90/p99 benchmark numbers, the 11 templated queries, RAG implications, FAQ |
| [blog-what-is-graphrag.md](blog-what-is-graphrag.md) | [What is GraphRAG_ Types, Limitations & When to Use.mhtml](../What%20is%20GraphRAG_%20Types%2C%20Limitations%20%26%20When%20to%20Use.mhtml) | RAG foundations, benefits, five GraphRAG varieties, architecture, tools, FAQ, citations |
| [blog-community-projects.md](blog-community-projects.md) | [GraphRAG & Knowledge Graphs Community Projects _ FalkordB.mhtml](../GraphRAG%20%26%20Knowledge%20Graphs%20Community%20Projects%20_%20FalkordB.mhtml) | Product FAQ answers, testimonials, community project list (BFSI, mental-health QA, code graphs, trip planning) |
| [event-graph-hacks.md](event-graph-hacks.md) | [Graph Hacks_ Context for AI Agents _ WeMakeDevs.mhtml](../Graph%20Hacks_%20Context%20for%20AI%20Agents%20_%20WeMakeDevs.mhtml) | Event facts, team panel (cto-ai, code 25F934), 3 tracks, prizes, rules, FAQ, sample Cypher |

## Webinar transcripts (19 notes)

| Note | Source | Covers |
|------|--------|--------|
| [transcript-cocoindex.md](transcript-cocoindex.md) | [Transcript.txt](../Transcript.txt) | CocoIndex incremental context engine + FalkorDB connector; meeting-notes knowledge graph demo |
| [transcript-agentic-memory-queryweaver.md](transcript-agentic-memory-queryweaver.md) | [Transcript copy 14.txt](../Transcript%20copy%2014.txt) | Agentic memory architecture: QueryWeaver memory types, profile, episodes, schema graph |
| [transcript-vcpedia-fractal-kg.md](transcript-vcpedia-fractal-kg.md) | [Transcript copy 16.txt](../Transcript%20copy%2016.txt) | VCPedia (Twitter funding KG) and Fractal KG, ontology guidance, string interning, constraints |
| [transcript-graphiti-zep.md](transcript-graphiti-zep.md) | [Transcript copy 15.txt](../Transcript%20copy%2015.txt) | Zep Graphiti: bi-temporal facts, invalidation, hybrid retrieval, La Liga demo, model sizing |
| [transcript-cluster-scale-out.md](transcript-cluster-scale-out.md) | [Transcript copy 17.txt](../Transcript%20copy%2017.txt) | Multi-tenancy and cluster scale-out: QPS numbers, hash slots, replica lag, no cross-graph queries |
| [transcript-text-to-sql-cypher.md](transcript-text-to-sql-cypher.md) | [Transcript copy 13.txt](../Transcript%20copy%2013.txt) | Text2SQL/Text2Cypher: Query Weaver pipeline, Ponder Labs dbt graph agent, Graphiti memory |
| [transcript-graphrag-sdk-1-0.md](transcript-graphrag-sdk-1-0.md) | [Transcript copy 11.txt](../Transcript%20copy%2011.txt) | GraphRAG SDK 1.0 deep dive: why RAG fails, benchmarks, ontology, costs, limitations |
| [transcript-falkordb-ama.md](transcript-falkordb-ama.md) | [Transcript copy 12.txt](../Transcript%20copy%2012.txt) | AMA: MST algorithm, Kuzu migration, multi-tenancy, multiply tips, Query Weaver |
| [transcript-efficient-cypher.md](transcript-efficient-cypher.md) | [Transcript copy 18.txt](../Transcript%20copy%2018.txt) | Efficient Cypher workshop: EXPLAIN/PROFILE, WITH barriers, indexes, filter trees, matrix internals |
| [transcript-cyber-security.md](transcript-cyber-security.md) | [Transcript copy 2.txt](../Transcript%20copy%202.txt) | Cybersecurity: WannaCry Monte Carlo simulation UDF, Log4Shell dependency paths, max-flow data leak |
| [transcript-udf-farm-to-table.md](transcript-udf-farm-to-table.md) | [Transcript copy 3.txt](../Transcript%20copy%203.txt) | UDFs in FalkorDB: libraries, QuickJS, register, traversal API, produce-supply-chain demo, Flex |
| [transcript-snowflake-app.md](transcript-snowflake-app.md) | [Transcript copy.txt](../Transcript%20copy.txt) | FalkorDB-native Snowflake app: bind/project/query/persist, zero-ETL, flight-path demo |
| [transcript-cloud-free.md](transcript-cloud-free.md) | [Transcript copy 10.txt](../Transcript%20copy%2010.txt) | Cloud Free tier setup walkthrough (create → connect → Browser) |
| [transcript-cloud-startup.md](transcript-cloud-startup.md) | [Transcript copy 9.txt](../Transcript%20copy%209.txt) | Cloud Startup tier setup (TLS, persistence, memory) |
| [transcript-cloud-pro.md](transcript-cloud-pro.md) | [Transcript copy 8.txt](../Transcript%20copy%208.txt) | Cloud Pro tier setup (replication/cluster, zones, replicas) |
| [transcript-cloud-enterprise.md](transcript-cloud-enterprise.md) | [Transcript copy 7.txt](../Transcript%20copy%207.txt) | Cloud Enterprise tier setup (public/private network, endpoints, audit logs) |
| [transcript-efficient-cypher-copy-6-dup.md](transcript-efficient-cypher-copy-6-dup.md) | [Transcript copy 6.txt](../Transcript%20copy%206.txt) | Exact duplicate of `Transcript copy 18.txt` → points to the Cypher note |
| [transcript-cyber-security-copy-5-dup.md](transcript-cyber-security-copy-5-dup.md) | [Transcript copy 5.txt](../Transcript%20copy%205.txt) | Exact duplicate of `Transcript copy 2.txt` → points to the cybersecurity note |
| [transcript-snowflake-app-copy-4-dup.md](transcript-snowflake-app-copy-4-dup.md) | [Transcript copy 4.txt](../Transcript%20copy%204.txt) | Exact duplicate of `Transcript copy.txt` → points to the Snowflake note |

## Link list (1 note)

| Note | Source | Covers |
|------|--------|--------|
| [links.md](links.md) | [Links.txt](../Links.txt) | All 41 links preserved in order with annotations, repeats identified, and the 16-video → transcript mapping (titles resolved) |

## Conventions used in these notes

- **Duplicate handling** — three transcript pairs are byte-identical (`copy` = `copy 4`, `copy 2` = `copy 5`, `copy 6` = `copy 18`); the duplicates get one-line stub notes so every raw file maps to a note without duplicating content.
- **Verbatim code** — commands, YAML, Python, and Cypher are reproduced exactly from the sources, including indentation.
- **Uncertain readings** — transcripts are ASR output; obviously garbled product names were normalized, and anything genuinely ambiguous is marked `[unclear]`.
- **Unlinked URLs** — original URLs are given when known from the saved page itself or `Links.txt`; transcripts use the YouTube video IDs resolved via `Links.txt`.
