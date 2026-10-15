# cto-ai

## Table Of Contents
<!-- TOC -->
- [Table Of Contents](#table-of-contents)
- [Beginner guide](#beginner-guide)
- [Hackathon resources](#hackathon-resources)
<!-- /TOC -->


Working repo for the **Graph Hacks: Context for AI Agents** hackathon (powered by FalkorDB), team `cto-ai`.

## Beginner guide

A short course for absolute beginners lives inside the resource collection at `Documents/guide/`. Each file reads in 2-3 minutes and includes a diagram. Start at `00-start-here.md`.

- **Foundations**
  - `01-graph-databases.md` - nodes, edges, and why connections matter.
  - `02-falkordb.md` - what FalkorDB is and how it works.
- **Hands-on basics**
  - `03-run-falkordb.md` - Docker, Docker Compose, Cloud, and the Browser.
  - `04-cypher-basics.md` - the query language, from CREATE to MATCH.
  - `05-python-client.md` - connect, query, and bulk-load from Python.
  - `06-writing-good-cypher.md` - PROFILE, indexes, and UDFs.
- **AI concepts**
  - `07-rag-and-graphrag.md` - embeddings, RAG, and why graphs fix retrieval.
  - `08-graphrag-sdk.md` - ingest documents and get cited answers.
- **Agent patterns**
  - `09-graph-algorithms.md` - PageRank, shortest path, and more as agent tools.
  - `10-agent-memory.md` - memory across sessions and between agents.
- **Project work**
  - `11-hackathon-playbook.md` - tracks, rules, and a build checklist.
  - `12-resources-map.md` - every saved resource and where it lives.

## Hackathon resources

Everything below lives in the relative directory `Documents /Hackathon-resources /`.
(The folder names have trailing spaces — copy paths exactly as written.)

Event page
- The hackathon landing page for this event (tracks, prizes, schedule, rules, resources, submission form). — `Graph Hacks_ Context for AI Agents _ WeMakeDevs.mhtml`

FalkorDB official documentation (saved web pages)
- FalkorDB documentation home — what the database is and how the docs are organized. — `FalkorDB Documentation _ Graph Database for GraphRAG & GenAI - FalkorDB Docs.mhtml`
- Getting started guide: installation, data modeling, and running queries. — `Getting Started with FalkorDB_ Installation, Modeling & Queries - FalkorDB Docs.mhtml`
- How to deploy FalkorDB with Docker and Docker Compose. — `Deploy FalkorDB with Docker and Docker Compose - FalkorDB Docs.mhtml`
- FalkorDB Browser: the visual graph exploration and query interface. — `FalkorDB Browser_ Visual Graph Exploration and Query Interface - FalkorDB Docs.mhtml`
- Official client libraries for Python, JavaScript, Java, Go, and Rust. — `FalkorDB Client Libraries_ Python, JavaScript, Java, Go, Rust - FalkorDB Docs.mhtml`
- Integrations: drivers, frameworks, and data pipelines that connect to FalkorDB. — `FalkorDB Integrations_ Drivers, Frameworks, and Data Pipelines - FalkorDB Docs.mhtml`
- Cypher query language reference for FalkorDB. — `Cypher Query Language Reference for FalkorDB - FalkorDB Docs.mhtml`
- Graph algorithms in FalkorDB for high-performance network analysis. — `Graph Algorithms in FalkorDB_ High-Performance Network Analysis - FalkorDB Docs.mhtml`

FalkorDB repos, Docker, and cloud (saved web pages)
- FalkorDB's main GitHub repo page (fast GraphBLAS-based graph database for GraphRAG). — `FalkorDB_FalkorDB_ A super fast Graph Database uses GraphBLAS under the hood for its sparse adjacency matrix graph representation. Our goal is to provide the best Knowledge Graph for LLM (GraphRAG)..mhtml`
- The GraphRAG-SDK GitHub repo page (build GenAI apps with GraphRAG at scale). — `FalkorDB_GraphRAG-SDK_ Build fast and accurate GenAI apps with GraphRAG SDK at scale 🌟.mhtml`
- The FalkorDB `benchmark` GitHub repo page (a tool to benchmark/compare graph databases). — `FalkorDB_benchmark_ A benchmarking tool to evaluate and compare the performance of graph databases with customizable workloads and metrics..mhtml`
- Docker Hub page for the `falkordb/falkordb` image. — `falkordb_falkordb - Docker Image.mhtml`
- FalkorDB Cloud sign-in page. — `Sign In.mhtml`
- FalkorDB Cloud sign-up page. — `Sign up.mhtml`

Blog posts and articles (saved web pages)
- Benchmarks comparing FalkorDB vs Neo4j graph database performance. — `FalkorDB vs Neo4j_ Graph Database Performance Benchmarks.mhtml`
- Explainer on what GraphRAG is, its types, limitations, and when to use it. — `What is GraphRAG_ Types, Limitations & When to Use.mhtml`
- FalkorDB community projects built with GraphRAG and knowledge graphs. — `GraphRAG & Knowledge Graphs Community Projects _ FalkordB.mhtml`

Link list
- A curated list of the hackathon/FalkorDB links: docs, GitHub repos, YouTube webinar recordings, and blog posts. — `Links.txt`

Webinar / workshop transcripts (plain text)
- Interview on "Context for AI agents" with LJ (founder of CocoIndex) covering context/graph layers for agents and the FalkorDB + CocoIndex connector. — `Transcript.txt`
- "Graph & RAG" webinar: building and architecting agentic memory with graphs, plus the open-source QueryWeaver natural-language-to-SQL project. — `Transcript copy 14.txt`
- "Graph & RAG" 5th installment: guest Yoi (VC) demos knowledge-graph projects VCPedia and Fractal KG and how he builds them. — `Transcript copy 16.txt`
- "Graph & RAG" 6th installment: guest Daniel (founder of Zep/Graphiti) on building knowledge graphs for agent memory. — `Transcript copy 15.txt`
- "Graph & RAG" workshop on cluster scale-out and multi-tenancy, delivered by FalkorDB CTO Roy Litman. — `Transcript copy 17.txt`
- Workshop on natural language to SQL/Cypher using LLMs, covering Ponder Labs, dbt, and Zep's Graphiti as agent memory. — `Transcript copy 13.txt`
- Deep dive on the GraphRAG SDK 1.0 release: why standard RAG pipelines fail and how knowledge graphs help. — `Transcript copy 11.txt`
- AMA and product news, including new graph algorithms (e.g. Minimum Spanning Tree) and how they're built with sparse linear algebra. — `Transcript copy 12.txt`
- Workshop on writing efficient Cypher queries (latency, throughput, memory). — `Transcript copy 18.txt`
- Duplicate of the efficient-Cypher-queries workshop transcript. — `Transcript copy 6.txt`
- Webinar on graph algorithms for cyber security, modeling ransomware (e.g. WannaCry) spread over a network. — `Transcript copy 2.txt`
- Duplicate of the graph-algorithms-for-cyber-security webinar transcript. — `Transcript copy 5.txt`
- Walkthrough on building a form-to-table use case with user-defined functions (UDFs) in FalkorDB. — `Transcript copy 3.txt`
- Walkthrough of setting up a FalkorDB Cloud Free instance. — `Transcript copy 10.txt`
- Walkthrough of setting up a FalkorDB Cloud Startup instance. — `Transcript copy 9.txt`
- Walkthrough of setting up a FalkorDB Cloud Pro instance. — `Transcript copy 8.txt`
- Walkthrough of setting up a FalkorDB Cloud Enterprise instance. — `Transcript copy 7.txt`
- Talk on the FalkorDB-native Snowflake app (graph analytics in Snowflake, zero-ETL, flight-path demo). — `Transcript copy.txt`
- Duplicate of the FalkorDB-native Snowflake app talk transcript. — `Transcript copy 4.txt`
