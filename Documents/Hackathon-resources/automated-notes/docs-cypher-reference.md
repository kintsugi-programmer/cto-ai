# Cypher Query Language Reference for FalkorDB

> **Source:** [`Cypher Query Language Reference for FalkorDB - FalkorDB Docs.mhtml`](../Cypher%20Query%20Language%20Reference%20for%20FalkorDB%20-%20FalkorDB%20Docs.mhtml) · **Type:** docs page · **Saved:** Oct 16, 2026 · **Original URL:** https://docs.falkordb.com/cypher/

**Docs navigation (sidebar):** Documentation · Integrations · AI Tools · Browser · Home (Overview, Data Types, Support) · Getting Started · Cypher Language (Cheat Sheet, MATCH, OPTIONAL MATCH, WHERE, RETURN, ORDER BY, SKIP, LIMIT, CREATE, DELETE, SET, MERGE, WITH, UNION, UNWIND, FOREACH, CALL, LOAD CSV, Functions, Procedures, Indexing, Cypher Coverage, REMOVE, Known Limitations) · Algorithms · UDFs · Commands · Operations · The FalkorDB Design · References. A docs-site banner points to the documentation index at `/llms.txt`.

## Overview

- **Page purpose:** the complete Cypher query language reference for FalkorDB, covering clauses (MATCH, CREATE, DELETE), functions, procedures, algorithms, and indexing for graph queries.
- **Language status:** FalkorDB supports the **OpenCypher** query language with **proprietary extensions**.
- **What Cypher is:** a declarative graph query language that lets you express **what data to retrieve** from a graph using **pattern matching, filtering, and projections**.
- **Scope:** a complete reference for all supported Cypher clauses, functions, procedures, and indexing capabilities.
- **In a hurry:** the **Cypher cheat sheet** condenses the syntax on this page — patterns, clauses, functions, indexing, procedures, and vector search — into a single quick-reference page.
- **See also:** **Data Types** — reference for all node, relationship, scalar, temporal, and collection types used in Cypher queries.
- **On this page:** Comments, Clauses, Functions, Procedures, Algorithms, Indexing, Frequently Asked Questions.

## Comments

FalkorDB Cypher supports **two comment styles** that can be placed anywhere whitespace is allowed:

| Style | Syntax | Description |
| --- | --- | --- |
| Single-line | `// comment text` | Everything from `//` to the end of the line is ignored |
| Multi-line | `/* comment text */` | Everything between `/*` and `*/` is ignored (may span multiple lines) |

- Multiple consecutive comments are **fully supported**.
- Comments can be **embedded mid-query**.

Example from the page:

```cypher
// Find all people named Alice
MATCH (a:Person {name: 'Alice'})
/* Return their
   friends */
RETURN a
```

## Clauses

A Cypher query consists of one or more clauses. The page links every supported clause:

- MATCH
- OPTIONAL MATCH
- WHERE
- RETURN
- ORDER BY
- SKIP
- LIMIT
- CREATE
- MERGE
- DELETE
- REMOVE
- SET
- WITH
- UNION
- UNWIND
- FOREACH
- CALL {}

## Functions

- See the list of available functions.

## Procedures

- See the list of available procedures.

## Algorithms

- See the list of available graph algorithms.

## Indexing

- See how to use indexing.

## Frequently Asked Questions

**What version of Cypher does FalkorDB support?**
FalkorDB implements a subset of the **OpenCypher specification (version 9)** with proprietary extensions for **indexing, vector search, and graph algorithms**. See the Cypher coverage page for full details.

**How is FalkorDB Cypher different from Neo4j Cypher?**
FalkorDB supports the core OpenCypher clauses and functions but adds unique features like **built-in vector indexing**, **full-text search via RediSearch**, and **native graph algorithms (PageRank, BFS, shortest paths)**. Some advanced Neo4j-specific features like **label expressions** are not yet supported.

**Can I use parameterized queries in FalkorDB?**
Yes. Use the **`CYPHER` prefix** to set parameters, e.g. `CYPHER name='Alice' MATCH (n {name: $name}) RETURN n`. Each client library also provides its own method for passing parameters safely.

**Does FalkorDB support comments in Cypher queries?**
Yes. FalkorDB supports **single-line comments with `//`** and **multi-line comments with `/* ... */`**. Comments can be placed anywhere whitespace is allowed.

**What indexing options are available in FalkorDB?**
FalkorDB supports **three index types**: **Range indexes** for exact-match and comparison filters, **Full-text indexes** for text search with stemming and scoring, and **Vector indexes** for similarity search on embeddings.

## Key facts and numbers

- Cypher support: a **subset of the OpenCypher specification, version 9**, plus proprietary extensions for **indexing, vector search, and graph algorithms**.
- FalkorDB-only features vs Neo4j: **built-in vector indexing**, **full-text search via RediSearch**, and **native graph algorithms**: **PageRank**, **BFS**, **shortest paths**.
- Neo4j features **not yet supported**: advanced Neo4j-specific features such as **label expressions**.
- Comment styles: **2** — single-line `//` and multi-line `/* ... */`.
- Index types: **3** — **Range**, **Full-text**, **Vector**.
- Parameter syntax: `CYPHER name='Alice' MATCH (n {name: $name}) RETURN n`.
- Clause list on the page: MATCH, OPTIONAL MATCH, WHERE, RETURN, ORDER BY, SKIP, LIMIT, CREATE, MERGE, DELETE, REMOVE, SET, WITH, UNION, UNWIND, FOREACH, CALL {}.
- Reference pages linked from this hub: Cheat Sheet, Data Types, Functions, Procedures, Graph algorithms, Indexing, Cypher coverage.
- Docs-site banner advertises the complete documentation index at **`/llms.txt`**.

## Code, commands and queries

Comments example (verbatim from the page):

```cypher
// Find all people named Alice
MATCH (a:Person {name: 'Alice'})
/* Return their
   friends */
RETURN a
```

Parameterized query example (from the FAQ):

```cypher
CYPHER name='Alice' MATCH (n {name: $name}) RETURN n
```

## Hackathon relevance

- **Connected data track:** the clause list is the vocabulary your agent's query layer must generate and validate — MATCH/WHERE/RETURN for reads, CREATE/MERGE/SET for writes to the graph.
- **Agent memory and coordination:** parameterized queries via the `CYPHER` prefix (or each client library's own parameter method) let an agent pass user and event data safely instead of concatenating strings into Cypher.
- **Company brain / GraphRAG:** the FAQ names the retrieval primitives — **Vector indexes** for similarity search on embeddings and **full-text indexes via RediSearch** — that ground LLM answers on a knowledge graph.
- **Porting Neo4j demos:** the Neo4j-vs-FalkorDB FAQ flags what to avoid (**label expressions not yet supported**) and what to use instead (**native algorithms, vector indexing**).
- Use the linked **Cheat Sheet** and **Cypher coverage** pages to bound what an LLM-generated Cypher pipeline can safely emit.

## Related notes

- [`docs-getting-started.md`](docs-getting-started.md) — installation, modeling, and queries walkthrough that puts these clauses into practice.
- [`docs-graph-algorithms.md`](docs-graph-algorithms.md) — details on the native algorithms (PageRank, BFS, shortest paths) this reference links to.
- [`transcript-efficient-cypher.md`](transcript-efficient-cypher.md) — practical performance tips for writing Cypher beyond the syntax reference.
- [`../../guide/04-cypher-basics.md`](../../guide/04-cypher-basics.md) — beginner module covering the same clause set with examples.
