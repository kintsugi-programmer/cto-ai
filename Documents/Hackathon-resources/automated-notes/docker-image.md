# falkordb/falkordb — Docker Hub image

> **Source:** [`falkordb_falkordb - Docker Image.mhtml`](../falkordb_falkordb%20-%20Docker%20Image.mhtml) · **Type:** Docker Hub page · **Saved:** Oct 16, 2026 · **Original URL:** https://hub.docker.com/r/falkordb/falkordb

## Overview

- Official Docker Hub page for the **`falkordb/falkordb`** image, published by `falkordb` — the fastest way to launch a FalkorDB instance locally with a single `docker run`.
- Page tagline: "A queryable Property Graph database uses sparse matrices adjacency matrix".
- Category badges: Image; Machine learning & AI; Developer tools; Databases & storage. Page counters: 16 and 1M+.
- Security announcement up top: **React2Shell (CVE-2025-55182) is fixed starting from version v4.14.9**.
- The page ships a full redis-cli walkthrough (MotoGP graph) plus a raw-Redis-command Python example — enough to smoke-test the database in under a minute.
- Publisher updated the repository about 7 hours before the save; the `latest` tag last updated about 15 hours before the save, size 185.6 MB.

## Security

- React2Shell (CVE-2025-55182) is fixed starting from version v4.14.9.

## What is FalkorDB

- Objective: create an outstanding Knowledge Graph specifically for Large Language Models (LLM) that boasts exceptionally low latency, ensuring swift delivery of information through the Graph Database, known as **KG-RAG**.
- FalkorDB is the first queryable Property Graph database to use **sparse matrices** to represent the adjacency matrix in graphs, and **linear algebra** to query the graph.

### Primary features

- Adopting the Property Graph Model
- Nodes (vertices) and Relationships (edges) that may have attributes
- Nodes can have multiple labels
- Relationships have a relationship type
- Graphs represented as sparse adjacency matrices
- OpenCypher with proprietary extensions as a query language
- Queries are translated into linear algebra expressions

- To see FalkorDB in action, visit Demos.
- Page quickstart navigation: Trying FalkorDB · Build · Start · Use from any client · Documentation.

## Quickstart

### Give it a try

To quickly try out FalkorDB, launch an instance using docker:

```bash
docker run -p 6379:6379 -p 3000:3000 -it --rm falkordb/falkordb:edge
```

Once loaded, you can interact with FalkorDB using `redis-cli`. The walkthrough creates a small graph representing a subset of motorcycle riders and teams taking part in the MotoGP league, then starts querying the data.

### MotoGP example with redis-cli

Create the graph:

```bash
$ redis-cli
127.0.0.1:6379> GRAPH.QUERY MotoGP "CREATE (:Rider {name:'Valentino Rossi'})-[:rides]->(:Team {name:'Yamaha'}), (:Rider {name:'Dani Pedrosa'})-[:rides]->(:Team {name:'Honda'}), (:Rider {name:'Andrea Dovizioso'})-[:rides]->(:Team {name:'Ducati'})"
1) 1) Labels added: 2
   2) Nodes created: 6
   3) Properties set: 6
   4) Relationships created: 3
   5) "Query internal execution time: 0.399000 milliseconds"
```

Who's riding for team Yamaha?

```bash
127.0.0.1:6379> GRAPH.QUERY MotoGP "MATCH (r:Rider)-[:rides]->(t:Team) WHERE t.name = 'Yamaha' RETURN r.name, t.name"
1) 1) "r.name"
   2) "t.name"
2) 1) 1) "Valentino Rossi"
      2) "Yamaha"
3) 1) "Query internal execution time: 0.625399 milliseconds"
```

How many riders represent team Ducati?

```bash
127.0.0.1:6379> GRAPH.QUERY MotoGP "MATCH (r:Rider)-[:rides]->(t:Team {name:'Ducati'}) RETURN count(r)"
1) 1) "count(r)"
2) 1) 1) (integer) 1
3) 1) "Query internal execution time: 0.624435 milliseconds"
```

## Using FalkorDB

- You can call FalkorDB's commands from any Redis client.

### With redis-cli

```bash
$ redis-cli
127.0.0.1:6379> GRAPH.QUERY social "CREATE (:person {name: 'roi', age: 33, gender: 'male', status: 'married'})"
```

### With any other client

- You can interact with FalkorDB using your client's ability to send raw Redis commands. Depending on your client of choice, the exact method for doing that may vary.

#### Python example

This code snippet shows how to use FalkorDB with raw Redis commands from Python via redis-py:

```python
import redis

r = redis.StrictRedis()
reply = r.execute_command('GRAPH.QUERY', 'social', "CREATE (:person {name:'roi', age:33, gender:'male', status:'married'})")
```

## License

- Licensed under your choice of the Server Side Public License v1 (SSPLv1). See LICENSE.

## Tag summary

- **Recent tags:** `latest`
- **Content type:** Image
- **Digest:** `sha256:b0bdcac2c…` (truncated on page)
- **Size:** 185.6 MB
- **Last updated:** about 15 hours ago

Pull command:

```bash
docker pull falkordb/falkordb
```

## Key facts and numbers

- Image: `falkordb/falkordb` (publisher: falkordb); page says "Updated about 7 hours ago" at the top, `latest` tag last updated about 15 hours ago.
- Pull command: `docker pull falkordb/falkordb`.
- Quickstart tag: `falkordb/falkordb:edge`; run command publishes ports 6379 and 3000.
- Tag summary: content type Image · digest `sha256:b0bdcac2c…` · size **185.6 MB**.
- Page counters: 16 and 1M+.
- MotoGP create graph: 2 labels added, 6 nodes created, 6 properties set, 3 relationships created; internal execution time 0.399000 ms.
- Query "Who's riding for team Yamaha?": returns Valentino Rossi / Yamaha; internal execution time 0.625399 ms.
- Query "How many riders represent team Ducati?": `count(r)` = 1; internal execution time 0.624435 ms.
- MotoGP riders/teams in the dataset: Valentino Rossi (Yamaha), Dani Pedrosa (Honda), Andrea Dovizioso (Ducati).
- Security: React2Shell (CVE-2025-55182) fixed starting from v4.14.9.
- License: Server Side Public License v1 (SSPLv1).
- Query language: OpenCypher with proprietary extensions; queries translated into linear algebra expressions.
- Categories: Machine learning & AI, Developer tools, Databases & storage.

## Code, commands and queries

Pull the image:

```bash
docker pull falkordb/falkordb
```

Run a throwaway instance:

```bash
docker run -p 6379:6379 -p 3000:3000 -it --rm falkordb/falkordb:edge
```

Create the MotoGP graph:

```bash
$ redis-cli
127.0.0.1:6379> GRAPH.QUERY MotoGP "CREATE (:Rider {name:'Valentino Rossi'})-[:rides]->(:Team {name:'Yamaha'}), (:Rider {name:'Dani Pedrosa'})-[:rides]->(:Team {name:'Honda'}), (:Rider {name:'Andrea Dovizioso'})-[:rides]->(:Team {name:'Ducati'})"
1) 1) Labels added: 2
   2) Nodes created: 6
   3) Properties set: 6
   4) Relationships created: 3
   5) "Query internal execution time: 0.399000 milliseconds"
```

Query the MotoGP graph:

```bash
127.0.0.1:6379> GRAPH.QUERY MotoGP "MATCH (r:Rider)-[:rides]->(t:Team) WHERE t.name = 'Yamaha' RETURN r.name, t.name"
1) 1) "r.name"
   2) "t.name"
2) 1) 1) "Valentino Rossi"
      2) "Yamaha"
3) 1) "Query internal execution time: 0.625399 milliseconds"
127.0.0.1:6379> GRAPH.QUERY MotoGP "MATCH (r:Rider)-[:rides]->(t:Team {name:'Ducati'}) RETURN count(r)"
1) 1) "count(r)"
2) 1) 1) (integer) 1
3) 1) "Query internal execution time: 0.624435 milliseconds"
```

Raw Redis command from redis-cli:

```bash
$ redis-cli
127.0.0.1:6379> GRAPH.QUERY social "CREATE (:person {name: 'roi', age: 33, gender: 'male', status: 'married'})"
```

Raw Redis command from Python:

```python
import redis

r = redis.StrictRedis()
reply = r.execute_command('GRAPH.QUERY', 'social', "CREATE (:person {name:'roi', age:33, gender:'male', status:'married'})")
```

## Hackathon relevance

- One command gets FalkorDB running for local development (`docker run ... falkordb/falkordb:edge`) — pair it with the Python client or GraphRAG SDK to stand up the context layer for any track.
- The MotoGP redis-cli session doubles as a 60-second smoke test: verify connection, write a small graph, and read sub-millisecond query timings before wiring agents to it.
- Pin a version ≥ v4.14.9 in `docker run`/Compose to avoid the React2Shell CVE (CVE-2025-55182) when packaging a demo.
- The raw-Redis-command Python example is a fallback pattern for any language that can send raw Redis commands — useful when a client library is missing during a hack.
- SSPLv1 licensing is worth noting if your hackathon submission redistributes the image or its code.

## Related notes

- `docs-docker.md` — full FalkorDB Docker and Docker Compose deployment guide beyond this image page.
- `repo-falkordb.md` — the main FalkorDB repository (features, build from source, stats).
- `../../guide/03-run-falkordb.md` — beginner guide module on running FalkorDB locally.
