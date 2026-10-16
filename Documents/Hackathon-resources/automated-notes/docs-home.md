# FalkorDB Documentation Home

> **Source:** [`FalkorDB Documentation _ Graph Database for GraphRAG & GenAI - FalkorDB Docs.mhtml`](../FalkorDB%20Documentation%20_%20Graph%20Database%20for%20GraphRAG%20%26%20GenAI%20-%20FalkorDB%20Docs.mhtml) · **Type:** docs page · **Saved:** Oct 16, 2026 · **Original URL:** https://docs.falkordb.com/

## Overview

- Landing page of the official FalkorDB documentation: "the high-performance graph database for GraphRAG, Cypher queries, and knowledge graphs powering accurate GenAI applications."
- Pitch: FalkorDB is the graph platform developers use to achieve accurate GraphRAG for enterprise GenAI — an accurate, multi-tenant RAG solution powered by low-latency, scalable graph database technology.
- Purpose-built for teams working with complex, interconnected data — structured or unstructured — in real-time and interactive environments.
- Speaks OpenCypher with proprietary extensions that make graph traversal and querying practical in production.
- The page bundles the quick-start Docker command, exposed ports (6379, 3000), a full Python MotoGP demo, bulk-loader import, community links, license, and a 5-question FAQ — effectively a one-page tour of the whole product.
- Docs navigation: top-level tabs Documentation, Integrations, AI Tools, Browser; Home sidebar sections: Overview, Data Types, Support, Getting Started, Cypher Language, Algorithms, UDFs, Commands, Operations, The FalkorDB Design, References. The site also advertises its complete documentation index at `/llms.txt` for page discovery.

## Hero calls to action

- **Get started** — Run FalkorDB locally, model your first graph, and query it in a few minutes.
- **Star us on GitHub** — FalkorDB is open source. A star helps other developers find the project.
- **Try FalkorDB Cloud** — Spin up a fully managed instance for free, with no local setup at all.
- **Build GraphRAG** — Ground your GenAI application in a knowledge graph with the GraphRAG SDK.

## Primary features

- **Property graph model** — Nodes, relationships, labels, and properties, following the openCypher property graph model.
- **OpenCypher query language** — Declarative pattern matching, plus proprietary extensions layered on top of OpenCypher.
- **Full-text, vector, and range indexes** — Combine full-text search, vector similarity, and range indexing in one engine.
- **RESP and Bolt protocols** — Connect over the RESP protocol or over Bolt, whichever your stack already speaks.
- **Sparse matrix storage** — Graphs are held as sparse adjacency matrices for compact storage and fast traversal.
- **GraphRAG built in** — Turn unstructured sources into a knowledge graph and query it from your GenAI app.

## Get Started

- Launch an instance using Docker, or use FalkorDB Cloud:

```bash
docker run -p 6379:6379 -p 3000:3000 -it --rm falkordb/falkordb:latest
```

### Ports Exposed

- **6379 (FalkorDB Server)** — use this port to connect via the CLI or any FalkorDB-compatible client.
- **3000 (FalkorDB Browser)** — access the FalkorDB web UI by opening your browser at http://localhost:3000.

Once loaded, you can interact with FalkorDB using any of the supported client libraries.

**New to FalkorDB?** The docs point to the step-by-step Getting Started guide for a complete walkthrough — from setup to modeling, loading, and querying your first graph.

### MotoGP demo (Python client)

The page uses the FalkorDB Python client to create a small graph representing a subset of motorcycle riders and teams taking part in the MotoGP league, then queries it. Tabbed code exists for Python, JavaScript, Java, Rust, and Shell; the Python version shown:

```python
from falkordb import FalkorDB

# Connect to FalkorDB
db = FalkorDB(host='localhost', port=6379)

# Create the 'MotoGP' graph
g = db.select_graph('MotoGP')
# Clear out this graph in case you've run this script before.
g.delete()
g.query("""CREATE
           (:Rider {name:'Valentino Rossi'})-[:rides]->(:Team {name:'Yamaha'}),
           (:Rider {name:'Dani Pedrosa'})-[:rides]->(:Team {name:'Honda'}),
           (:Rider {name:'Andrea Dovizioso'})-[:rides]->(:Team {name:'Ducati'})""")

# Query which riders represent Yamaha?
res = g.query("""MATCH (r:Rider)-[:rides]->(t:Team)
                 WHERE t.name = 'Yamaha'
                 RETURN r.name""")

for row in res.result_set:
    print(row[0]) # Prints: "Valentino Rossi"

# Query how many riders represent team Ducati ?
res = g.query("""MATCH (r:Rider)-[:rides]->(t:Team {name:'Ducati'}) RETURN count(r)""")

print(res.result_set[0][0]) # Prints: 1
```

- Expected outputs: the Yamaha query prints `Valentino Rossi`; the Ducati count prints `1`.
- "For additional demos please visit Demos" (linked from the docs).

## Client libraries

- Language-specific clients have been written by the community and the FalkorDB team.
- The full list and links are on the Client Libraries page.

## Data import

- When loading large graphs from CSV files, use the falkordb-bulk-loader:

```bash
pip install falkordb-bulk-loader
falkordb-bulk-insert GRAPHNAME -n nodes.csv -r edges.csv
```

- The Bulk Loader documentation has the full reference.

## Community and support

- **Star FalkorDB** — star the repository to follow releases and help other developers discover the project.
- **Join the Discord** — ask questions and share what you are building with the team and the community.
- **Open a discussion** — propose ideas, report rough edges, and search past answers on the FalkorDB forum.

## License

- FalkorDB is licensed under the Server Side Public License v1 (SSPLv1).

## Frequently Asked Questions

- **What is FalkorDB and how does it differ from other graph databases?**
  FalkorDB is a high-performance graph database built as a Redis module. Unlike traditional graph databases, it uses a sparse adjacency matrix representation (based on GraphBLAS) for efficient storage and fast traversals. It supports OpenCypher queries, both RESP and Bolt protocols, and provides built-in GraphRAG capabilities for GenAI applications.
- **What are the main use cases for FalkorDB?**
  FalkorDB excels at use cases involving complex, interconnected data: social networks, recommendation engines, knowledge graphs, fraud detection, and GraphRAG for GenAI applications. Its low-latency design makes it ideal for real-time and interactive user environments.
- **How do I get started with FalkorDB?**
  The quickest way is Docker: `docker run -p 6379:6379 -p 3000:3000 -it --rm falkordb/falkordb:latest`. This starts the server and a browser UI at http://localhost:3000. Then install a client library and follow the Getting Started guide.
- **Does FalkorDB support cloud deployment?**
  Yes. FalkorDB Cloud provides a fully managed, multi-tenant graph database service. You can create a free instance and skip local setup entirely.
- **What query language does FalkorDB use?**
  FalkorDB uses OpenCypher with proprietary extensions. It supports full-text search, vector similarity search, and range indexing. See the Cypher documentation for the complete query language reference.

## Key facts and numbers

- Ports: **6379** (FalkorDB Server, CLI/client connections) and **3000** (FalkorDB Browser web UI at http://localhost:3000).
- Docker image: `falkordb/falkordb:latest`.
- MotoGP demo entities: riders Valentino Rossi (Yamaha), Dani Pedrosa (Honda), Andrea Dovizioso (Ducati); relationship type `rides`; Ducati rider count = 1.
- Bulk loader command: `falkordb-bulk-insert GRAPHNAME -n nodes.csv -r edges.csv` (installed via `pip install falkordb-bulk-loader`).
- License: Server Side Public License v1 (SSPLv1).
- Storage: sparse adjacency matrix representation based on GraphBLAS.
- Protocols: RESP and Bolt.
- Index types: full-text, vector, and range indexes in one engine.
- FAQ use cases: social networks, recommendation engines, knowledge graphs, fraud detection, GraphRAG.
- Documented client languages on code tabs: Python, JavaScript, Java, Rust, Shell.
- Docs site: complete documentation index fetchable at `/llms.txt`; docs built and hosted on Mintlify.
- Community channels: GitHub (star), Discord, discussion forum.

## Code, commands and queries

Quick start (Docker):

```bash
docker run -p 6379:6379 -p 3000:3000 -it --rm falkordb/falkordb:latest
```

Data import:

```bash
pip install falkordb-bulk-loader
falkordb-bulk-insert GRAPHNAME -n nodes.csv -r edges.csv
```

Python MotoGP demo:

```python
from falkordb import FalkorDB

# Connect to FalkorDB
db = FalkorDB(host='localhost', port=6379)

# Create the 'MotoGP' graph
g = db.select_graph('MotoGP')
# Clear out this graph in case you've run this script before.
g.delete()
g.query("""CREATE
           (:Rider {name:'Valentino Rossi'})-[:rides]->(:Team {name:'Yamaha'}),
           (:Rider {name:'Dani Pedrosa'})-[:rides]->(:Team {name:'Honda'}),
           (:Rider {name:'Andrea Dovizioso'})-[:rides]->(:Team {name:'Ducati'})""")

# Query which riders represent Yamaha?
res = g.query("""MATCH (r:Rider)-[:rides]->(t:Team)
                 WHERE t.name = 'Yamaha'
                 RETURN r.name""")

for row in res.result_set:
    print(row[0]) # Prints: "Valentino Rossi"

# Query how many riders represent team Ducati ?
res = g.query("""MATCH (r:Rider)-[:rides]->(t:Team {name:'Ducati'}) RETURN count(r)""")

print(res.result_set[0][0]) # Prints: 1
```

Cypher created inline by the demo (Rider/Team schema):

```cypher
CREATE
  (:Rider {name:'Valentino Rossi'})-[:rides]->(:Team {name:'Yamaha'}),
  (:Rider {name:'Dani Pedrosa'})-[:rides]->(:Team {name:'Honda'}),
  (:Rider {name:'Andrea Dovizioso'})-[:rides]->(:Team {name:'Ducati'})

MATCH (r:Rider)-[:rides]->(t:Team)
WHERE t.name = 'Yamaha'
RETURN r.name

MATCH (r:Rider)-[:rides]->(t:Team {name:'Ducati'}) RETURN count(r)
```

## Hackathon relevance

- The Docker one-liner is the fastest way to stand up FalkorDB as the context layer for a hackathon agent — server on 6379, Browser on 3000 for visual demos.
- The MotoGP demo shows the exact client pattern (`FalkorDB()` connect, `select_graph`, `g.query`, `result_set`) to copy for storing agent memories or connected-data graphs.
- Bulk loader (`falkordb-bulk-insert`) is the path for loading large CSV datasets into a knowledge graph during the build.
- FAQ answers give ready-made justifications for judging: low-latency real-time design, multi-tenant GraphRAG, and why a sparse-matrix (GraphBLAS) engine fits interactive agents.
- The "Build GraphRAG" CTA points directly at the GraphRAG SDK to ground GenAI apps in a knowledge graph.

## Related notes

- [docs-getting-started.md](docs-getting-started.md) — the linked step-by-step walkthrough referenced by this page's quick-start.
- [docs-cypher-reference.md](docs-cypher-reference.md) — full query-language reference for the OpenCypher + extensions noted here.
- [repo-falkordb.md](repo-falkordb.md) — source repository behind the "star us" CTA and the SSPLv1 license.
- [event-graph-hacks.md](event-graph-hacks.md) — the hackathon this documentation supports (Context for AI Agents).
- [../../guide/02-falkordb.md](../../guide/02-falkordb.md) — course-level introduction to FalkorDB matching this page's feature tour.
