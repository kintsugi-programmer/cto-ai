# Getting Started with FalkorDB: Installation, Modeling & Queries

> **Source:** [`Getting Started with FalkorDB_ Installation, Modeling & Queries - FalkorDB Docs.mhtml`](../Getting%20Started%20with%20FalkorDB_%20Installation%2C%20Modeling%20%26%20Queries%20-%20FalkorDB%20Docs.mhtml) · **Type:** docs page · **Saved:** Oct 16, 2026 · **Original URL:** https://docs.falkordb.com/getting-started/

## Overview

- Official tutorial that walks through setting up FalkorDB, modeling a social network as a graph, and accessing it with one of the FalkorDB client libraries using the Cypher query language.
- Four steps: (1) model a social network as a graph, (2) load data into FalkorDB, (3) access the data (connect + execute Cypher), (4) explore further.
- The hardest prerequisite is called out up front: **FalkorDB requires Redis 8.0.0 or later**; all earlier versions including the Redis 7.x series are not supported.
- Prerequisites cover both setup options — Docker (quickest, no auth) or FalkorDB Cloud (free instance, no local setup) — plus installing a client (`pip install falkordb` for Python).
- Ends with an FAQ covering minimum requirements, whether Redis must be installed separately, which clients exist, what the Browser on port 3000 is, and how data modeling works.
- Docs navigation: tabs Documentation, Integrations, AI Tools, Browser; Getting Started sidebar adds Configuration and Client Libraries; the page also advertises the complete documentation index at `/llms.txt`.

## Prerequisites

### Minimum Redis version

- FalkorDB requires **Redis 8.0.0 or later**.
- Earlier versions, including the Redis 7.x series, are **not supported**.
- If self-hosting, upgrade Redis before installing or upgrading FalkorDB.

### FalkorDB instance — Option A: Docker (quickest)

```bash
docker run -p 6379:6379 -p 3000:3000 --rm falkordb/falkordb:latest
```

- Starts FalkorDB with **no authentication**.
- Built-in browser at **http://localhost:3000** to explore graphs visually.
- See Docker & Docker Compose for additional options (persistence, auth, production images).

### FalkorDB instance — Option B: FalkorDB Cloud

- Create a free FalkorDB Cloud instance and skip local setup entirely.

### Install the FalkorDB client

- Tabbed install instructions exist for Python, JavaScript, Java, and Rust; the Python one:

```bash
pip install falkordb
```

## Step 1: Model a Social Network as a Graph

- Goal: a simple social-network graph where:
  - Nodes represent `User` and `Post`.
  - Relationships connect Users with a `FRIENDS_WITH` relationship, and Users are connected via a `CREATED` relationship to Posts.

### Graph Schema

Node Types:

| Node Type | Properties | Description |
| --- | --- | --- |
| User | id, name, email | Represents a user in the social network |
| Post | id, content, date | Represents a post created by a user |

Relationship Types:

| Relationship Type | Start Node | End Node | Properties | Description |
| --- | --- | --- | --- | --- |
| FRIENDS_WITH | User | User | since | Indicates friendship between two users |
| CREATED | User | Post | time | Connects a user to their created posts |

## Step 2: Load Data into FalkorDB

- Model and load the data with the following Cypher.

### Cypher Query to Create the Data

```cypher
CREATE (alice:User {id: 1, name: "Alice", email: "alice@example.com"})
CREATE (bob:User {id: 2, name: "Bob", email: "bob@example.com"})
CREATE (charlie:User {id: 3, name: "Charlie", email: "charlie@example.com"})

CREATE (post1:Post {id: 101, content: "Hello World!", date: 1701388800})
CREATE (post2:Post {id: 102, content: "Graph Databases are awesome!", date: 1701475200})

CREATE (alice)-[:FRIENDS_WITH {since: 1640995200}]->(bob)
CREATE (bob)-[:FRIENDS_WITH {since: 1684108800}]->(charlie)
CREATE (alice)-[:CREATED {time: 1701388800}]->(post1)
CREATE (bob)-[:CREATED {time: 1701475200}]->(post2)
```

- These commands can be executed using the FalkorDB Python client or any supported client.

## Step 3: Access Your Data

### Connect to FalkorDB

- The examples connect to a local FalkorDB instance started with the `docker run` command above, which requires no password.

```python
from falkordb import FalkorDB

# Connect to FalkorDB (no authentication — default Docker setup)
client = FalkorDB(host="localhost", port=6379)
graph = client.select_graph('social')
```

- Using authentication? Start FalkorDB with a password:

```bash
docker run -p 6379:6379 -p 3000:3000 --rm \
  -e REDIS_ARGS="--requirepass yourpassword" \
  falkordb/falkordb:latest
```

- Then pass the password in the client configuration — for example `password="yourpassword"` in Python or `password: 'yourpassword'` in JavaScript, or the equivalent credential option in your client library. See Docker & Docker Compose for details.

### Execute Cypher Queries

#### Create the Graph

```python
create_query = """
CREATE (alice:User {id: 1, name: "Alice", email: "alice@example.com"})
CREATE (bob:User {id: 2, name: "Bob", email: "bob@example.com"})
CREATE (charlie:User {id: 3, name: "Charlie", email: "charlie@example.com"})

CREATE (post1:Post {id: 101, content: "Hello World!", date: 1701388800})
CREATE (post2:Post {id: 102, content: "Graph Databases are awesome!", date: 1701475200})

CREATE (alice)-[:FRIENDS_WITH {since: 1640995200}]->(bob)
CREATE (bob)-[:FRIENDS_WITH {since: 1684108800}]->(charlie)
CREATE (alice)-[:CREATED {time: 1701388800}]->(post1)
CREATE (bob)-[:CREATED {time: 1701475200}]->(post2)
"""

graph.query(create_query)
print("Graph created successfully!")
```

#### Query the Graph

```python
# Find all friends of Alice
query = """
MATCH (alice:User {name: 'Alice'})-[:FRIENDS_WITH]->(friend)
RETURN friend.name AS Friend
"""

result = graph.ro_query(query).result_set

print("Alice's friends:")
for record in result:
    print(record[0])
```

#### Query Relationships

```python
# Find posts created by Bob
query = """
MATCH (bob:User {name: 'Bob'})-[:CREATED]->(post:Post)
RETURN post.content AS PostContent
"""

result = graph.ro_query(query).result_set

print("Posts created by Bob:")
for record in result:
    print(record[0])
```

## Step 4: Explore Further

- The guide congratulates the reader: the social network graph has been modeled, loaded, and queried successfully.
- Next topics to dive into:
  - FalkorDB Browser — explore the graph visually.
  - Advanced Cypher.
  - Data Types — nodes, relationships, scalars, temporal types, and collections.
  - Database Operations.
  - GenAI Tools.
  - Agentic Memory.
- For questions or support, visit the community forums.

## Frequently Asked Questions

- **What are the minimum requirements to run FalkorDB?**
  FalkorDB requires Redis 8.0.0 or later. The quickest setup is via Docker: `docker run -p 6379:6379 -p 3000:3000 --rm falkordb/falkordb:latest`. Alternatively, use FalkorDB Cloud to skip local setup entirely.
- **Do I need to install Redis separately?**
  No. The official FalkorDB Docker images include everything needed. If self-hosting without Docker, you must install Redis 8.0.0+ separately and load the FalkorDB module. Earlier Redis versions (including 7.x) are not supported.
- **Which client libraries can I use with FalkorDB?**
  FalkorDB has official clients for Python, Node.js, Java, Rust, Go, PHP, and C#. Install them via pip, npm, Maven, Cargo, or the respective package managers. See the Client Libraries page for full details.
- **What is the FalkorDB Browser at port 3000?**
  The FalkorDB Browser is a built-in web UI for visually exploring graphs. When running the `falkordb/falkordb:latest` Docker image, open http://localhost:3000 to create, visualize, and query graphs interactively. For production, use `falkordb/falkordb-server`, which excludes the browser.
- **How do I model data in FalkorDB?**
  FalkorDB uses the Property Graph Model. Data is modeled as nodes (entities with labels and properties) connected by relationships (directed edges with a type and properties). Use the Cypher query language to create and query the graph structure.

## Key facts and numbers

- Minimum requirement: **Redis 8.0.0 or later**; Redis 7.x and earlier are not supported. Self-hosters must upgrade Redis before installing/upgrading FalkorDB, and non-Docker self-hosting requires installing Redis 8.0.0+ separately and loading the FalkorDB module.
- Ports: **6379** (server, used in `FalkorDB(host="localhost", port=6379)`) and **3000** (Browser UI at http://localhost:3000).
- Docker image: `falkordb/falkordb:latest` (includes Browser; no auth by default). Production image: `falkordb/falkordb-server` (excludes the browser).
- Auth env var example: `-e REDIS_ARGS="--requirepass yourpassword"`; client options `password="yourpassword"` (Python) / `password: 'yourpassword'` (JavaScript).
- Python client install: `pip install falkordb`.
- Sample data: users Alice (id 1), Bob (id 2), Charlie (id 3); posts 101 ("Hello World!", date 1701388800) and 102 ("Graph Databases are awesome!", date 1701475200).
- Relationship timestamps: FRIENDS_WITH since 1640995200 (Alice→Bob) and 1684108800 (Bob→Charlie); CREATED time 1701388800 (Alice→post1) and 1701475200 (Bob→post2).
- Client libraries available: Python, Node.js, Java, Rust, Go, PHP, C# — installed via pip, npm, Maven, Cargo, or respective package managers.
- Graph schema: node types User (id, name, email) and Post (id, content, date); relationship types FRIENDS_WITH (User→User, property since) and CREATED (User→Post, property time).
- Docs index advertised at `/llms.txt`; docs tabs: Documentation, Integrations, AI Tools, Browser (plus Configuration and Client Libraries under Getting Started).
- Follow-on doc topics: FalkorDB Browser, Advanced Cypher, Data Types (nodes, relationships, scalars, temporal types, collections), Database Operations, GenAI Tools, Agentic Memory, community forums.

## Code, commands and queries

Docker quick start (no auth):

```bash
docker run -p 6379:6379 -p 3000:3000 --rm falkordb/falkordb:latest
```

Docker with password:

```bash
docker run -p 6379:6379 -p 3000:3000 --rm \
  -e REDIS_ARGS="--requirepass yourpassword" \
  falkordb/falkordb:latest
```

Install the Python client:

```bash
pip install falkordb
```

Connect (no authentication — default Docker setup):

```python
from falkordb import FalkorDB

# Connect to FalkorDB (no authentication — default Docker setup)
client = FalkorDB(host="localhost", port=6379)
graph = client.select_graph('social')
```

Create the data (Cypher standalone version):

```cypher
CREATE (alice:User {id: 1, name: "Alice", email: "alice@example.com"})
CREATE (bob:User {id: 2, name: "Bob", email: "bob@example.com"})
CREATE (charlie:User {id: 3, name: "Charlie", email: "charlie@example.com"})

CREATE (post1:Post {id: 101, content: "Hello World!", date: 1701388800})
CREATE (post2:Post {id: 102, content: "Graph Databases are awesome!", date: 1701475200})

CREATE (alice)-[:FRIENDS_WITH {since: 1640995200}]->(bob)
CREATE (bob)-[:FRIENDS_WITH {since: 1684108800}]->(charlie)
CREATE (alice)-[:CREATED {time: 1701388800}]->(post1)
CREATE (bob)-[:CREATED {time: 1701475200}]->(post2)
```

Create the graph via the Python client:

```python
create_query = """
CREATE (alice:User {id: 1, name: "Alice", email: "alice@example.com"})
CREATE (bob:User {id: 2, name: "Bob", email: "bob@example.com"})
CREATE (charlie:User {id: 3, name: "Charlie", email: "charlie@example.com"})

CREATE (post1:Post {id: 101, content: "Hello World!", date: 1701388800})
CREATE (post2:Post {id: 102, content: "Graph Databases are awesome!", date: 1701475200})

CREATE (alice)-[:FRIENDS_WITH {since: 1640995200}]->(bob)
CREATE (bob)-[:FRIENDS_WITH {since: 1684108800}]->(charlie)
CREATE (alice)-[:CREATED {time: 1701388800}]->(post1)
CREATE (bob)-[:CREATED {time: 1701475200}]->(post2)
"""

graph.query(create_query)
print("Graph created successfully!")
```

Query the graph (Alice's friends):

```python
# Find all friends of Alice
query = """
MATCH (alice:User {name: 'Alice'})-[:FRIENDS_WITH]->(friend)
RETURN friend.name AS Friend
"""

result = graph.ro_query(query).result_set

print("Alice's friends:")
for record in result:
    print(record[0])
```

Query relationships (Bob's posts):

```python
# Find posts created by Bob
query = """
MATCH (bob:User {name: 'Bob'})-[:CREATED]->(post:Post)
RETURN post.content AS PostContent
"""

result = graph.ro_query(query).result_set

print("Posts created by Bob:")
for record in result:
    print(record[0])
```

## Hackathon relevance

- This is the fastest on-ramp for the hackathon: one Docker command plus `pip install falkordb` gets an agent's context layer running with zero auth locally.
- The User/Post/FRIENDS_WITH/CREATED schema is a ready-made starting model for agent memory (users, sessions, memories) and company-brain graphs (people, documents, links).
- `graph.ro_query` for reads and `graph.query` for writes is the exact client API pattern to reuse in an agent's memory tool implementations.
- The Redis 8.0.0 requirement is a key deployment gotcha when self-hosting without Docker — bundle everything in the provided image to avoid version problems.
- Auth setup (`REDIS_ARGS="--requirepass"`) matters if the hackathon demo runs on a public endpoint.

## Related notes

- [docs-home.md](docs-home.md) — docs landing page whose quick-start and MotoGP demo this guide expands on.
- [docs-docker.md](docs-docker.md) — the referenced Docker & Docker Compose page for persistence, auth, and production images.
- [docs-cypher-reference.md](docs-cypher-reference.md) — full Cypher language reference behind the CREATE/MATCH queries used here.
- [docs-client-libraries.md](docs-client-libraries.md) — client libraries page listing Python, Node.js, Java, Rust, Go, PHP, and C#.
- [../../guide/03-run-falkordb.md](../../guide/03-run-falkordb.md) — course module on running FalkorDB, mirroring the Docker step here.
- [../../guide/04-cypher-basics.md](../../guide/04-cypher-basics.md) — Cypher basics module matching Steps 2–3 of this guide.
