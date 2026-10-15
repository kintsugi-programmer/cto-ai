# FalkorDB from Python

The **Python client** is the fastest way to build your project. Install it, connect, and run Cypher. The same queries work in every official client.

## Install and connect

```bash
pip install falkordb
```

```python
from falkordb import FalkorDB

# Connect to a local instance (no password, default Docker setup)
client = FalkorDB(host="localhost", port=6379)
graph = client.select_graph("social")
```

- **select_graph(name)** picks a graph. If it does not exist yet, FalkorDB creates it on first write.
- **Multi-tenancy**: one instance can hold thousands of separate graphs, one per user or tenant.
- With a password, pass it in the client: `FalkorDB(host="localhost", port=6379, password="yourpassword")`.

## Create and query

```python
create_query = """
CREATE (alice:User {id: 1, name: "Alice", email: "alice@example.com"})
CREATE (bob:User {id: 2, name: "Bob", email: "bob@example.com"})
CREATE (alice)-[:FRIENDS_WITH {since: 1640995200}]->(bob)
"""
graph.query(create_query)
```

```python
# Find all friends of Alice
result = graph.ro_query("""
    MATCH (alice:User {name: 'Alice'})-[:FRIENDS_WITH]->(friend)
    RETURN friend.name AS Friend
""").result_set

for row in result:
    print(row[0])
```

- **graph.query()** runs any query, including writes.
- **graph.ro_query()** runs read-only queries and can be routed to replicas.
- **result.result_set** is a list of rows; each row is a tuple.
- **graph.delete()** clears the graph, handy while you experiment.

## The MotoGP example (small and complete)

```python
from falkordb import FalkorDB

db = FalkorDB(host='localhost', port=6379)
g = db.select_graph('MotoGP')
g.query("""CREATE
(:Rider {name:'Valentino Rossi'})-[:rides]->(:Team {name:'Yamaha'}),
(:Rider {name:'Dani Pedrosa'})-[:rides]->(:Team {name:'Honda'}),
(:Rider {name:'Andrea Dovizioso'})-[:rides]->(:Team {name:'Ducati'})""")

res = g.query("""MATCH (r:Rider)-[:rides]->(t:Team)
WHERE t.name = 'Yamaha'
RETURN r.name""")
print(res.result_set[0][0])   # Valentino Rossi
```

## Loading big datasets

- Use the **bulk loader** for CSVs; it beats thousands of individual CREATE statements.

```bash
pip install falkordb-bulk-loader
falkordb-bulk-insert GRAPHNAME -n nodes.csv -r edges.csv
```

## Other clients

- **Official**: Python (falkordb-py), Node.js (falkordb-ts), Java (jfalkordb), Rust (falkordb-rs), Go (falkordb-go), PHP, C# (NFalkorDB).
- **OGM libraries** map graph data to native language objects: `falkordb-py-orm`, `falkordb-go-orm`, and `spring-data-falkordb`.
- **Protocols**: RESP and Bolt. Bolt support means Neo4j drivers can connect experimentally, but official clients are recommended for production.

For the hackathon, the Python client plus the Browser on port 3000 is enough for the whole build loop: write code, run it, inspect the graph visually, adjust the model.
