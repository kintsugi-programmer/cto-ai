# Cypher Basics

**Cypher** is the query language of FalkorDB. It is declarative: you describe the **pattern** you want, and the database finds it. FalkorDB implements OpenCypher with extra features like vector search and graph algorithms.

## The shape of a query

- A query is one or more **clauses** run in order.
- Patterns use ASCII art: `(node)` for nodes and `-[:REL]->` for relationships.

```cypher
// Find all friends of Alice
MATCH (alice:User {name: 'Alice'})-[:FRIENDS_WITH]->(friend)
RETURN friend.name AS Friend
```

- **MATCH** - find a pattern in the graph.
- **OPTIONAL MATCH** - like MATCH, but keeps rows even when nothing matches.
- **WHERE** - filter results.
- **RETURN** - choose what to output; `AS` renames columns.
- **ORDER BY / SKIP / LIMIT** - sort and page results.
- **CREATE** - make new nodes and relationships.
- **MERGE** - create the pattern only if it does not exist yet.
- **SET / REMOVE** - change properties and labels.
- **DELETE** - remove nodes and relationships.
- **WITH** - pass results between parts of a query.
- **UNWIND** - turn a list into rows.
- **FOREACH / CALL {} / UNION** - loops, subqueries, and combined results.

## Model and load a small graph

- Example: a social network where `User` and `Post` are node types.
  - `User` has `id`, `name`, `email`.
  - `Post` has `id`, `content`, `date`.
  - `FRIENDS_WITH` connects users; `CREATED` connects a user to a post.

```cypher
CREATE (alice:User {id: 1, name: "Alice", email: "alice@example.com"})
CREATE (bob:User {id: 2, name: "Bob", email: "bob@example.com"})
CREATE (post1:Post {id: 101, content: "Hello World!", date: 1701388800})
CREATE (alice)-[:FRIENDS_WITH {since: 1640995200}]->(bob)
CREATE (alice)-[:CREATED {time: 1701388800}]->(post1)
```

- Then ask questions by following the arrows:

```cypher
// Posts created by Bob
MATCH (bob:User {name: 'Bob'})-[:CREATED]->(post:Post)
RETURN post.content AS PostContent
```

## Comments and parameters

- **Comments**: `// single line` and `/* multi-line */`, anywhere whitespace is allowed.
- **Parameters** keep queries safe and reusable.

```cypher
CYPHER name='Alice' MATCH (n {name: $name}) RETURN n
```

- Each client library also provides its own method for passing parameters safely.

## Indexes

- **Range index** - exact-match and comparison filters. Create one on properties you filter often.
- **Full-text index** - text search with stemming and scoring.
- **Vector index** - similarity search over embeddings; the basis of semantic retrieval for agents.

Cypher is pattern matching. Describe the shape of the answer you want with nodes and arrows, and let the database do the walking. The full clause reference is in the Cypher docs saved in the resources folder.
