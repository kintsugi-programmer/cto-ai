# FalkorDB's Native Snowflake App: Graph Analytics and Zero-ETL (Sydney → New York Flight-Path Demo)

> **Source:** [`Transcript copy.txt`](../Transcript%20copy.txt) · **Type:** webinar transcript · **Saved:** Oct 16, 2026 · **Original URL:** https://www.youtube.com/watch?v=kX7iL1DCYpM

## Overview

- Webinar presenting the **recently launched FalkorDB-native Snowflake app** — graph analytics directly inside Snowflake. The demo was built and presented by **Nassim** (the developer behind the app), with the host and panelist **Guy** fielding Q&A.
- Central selling point: **your data never leaves Snowflake** — zero-ETL graph analytics. FalkorDB runs as a **container inside the customer's Snowflake account** via **Snowpark Container Services**, so no data is shipped to an external graph system.
- Demo scenario: planning a **Taylor Swift tour** route — finding possible **multi-city flight paths from Sydney to New York** over real airport data — and comparing **Cypher graph traversal vs SQL recursive joins**: a 5-hop Cypher query returned in about **1.3 seconds**, while the equivalent SQL query with five joins was **still running when it was stopped at half a minute**.
- The session walks through the architecture (service ingestion → container execution → compute, storage, security boundaries), the in-Snowflake query workflow (**bind → project → query → persist**), and installation from the **Snowflake Marketplace**.
- FalkorDB described as: ultra-low latency, **multi-tenancy out of the box**, excellent performance, **fully open source**; the mission message — "uncover connections and glean insights that you can't with the SQL that you're running right now."
- Everything (links, code, notebook, demo) was recorded and shared afterward in a blog post; the session also announces the **Snowflake Summit** (first week of June, **booth 2719**).

## Session intro: why graph analytics in Snowflake

- The topic: **graph analytics with FalkorDB and Snowflake** around the new native app; the team wants to emphasize that **data never leaves Snowflake** (a unique selling point and key strength of the app), explain what **zero-ETL** means in this context, and how the graph query works — anchored by a demo that mimics a real-life use case.
- Framing exercise: imagine you are "the poor soul" who has to figure out the flight path for **Taylor Swift in one of her many tours** — finding the best way to get from one place to another, in this case airports.
- The demo uses a **multi-city tour planning scenario**: not planning a single flight but **multiple countries, many stops, airport connections, and strict timing**. The question asked: **what possible flight route can get her from Sydney to New York?**
- Graph databases are powerful exactly here: not searching for one flight, but searching for **connected paths between airports**.
- In SQL, route-chaining queries usually require **recursive joins**, which can become complex. With **Cypher** (the query language of graph databases, fully supported by FalkorDB), you can **follow route relationships directly and express the path more naturally**.

## Architecture: FalkorDB inside the Snowflake account

Flow, as presented: **service ingestion → container execution → compute, storage, and security boundaries**.

### Two paths for services to enter the Snowflake account

- **Custom deployment:** teams push entirely built **container services, jobs, or functions** written in languages like **C++ or Python**.
- **Snowflake Marketplace:** users deploy third-party data services like **FalkorDB** directly into the Snowflake environment. For this demo, FalkorDB is a **graph database container running inside the Snowflake account**.

### Snowpark Container Services (the container execution layer)

- The **image registry** securely stores container images, including FalkorDB and any custom code.
- A **Kubernetes-based cluster** orchestrates the containers: keeps them running and allows them to communicate with each other.
- This layer is what makes FalkorDB a **managed containerized service inside Snowflake**.

### Compute and storage

- Snowflake allocates **CPU compute resources** for the workflow: standard CPU resources handle **application logic** and **database queries**, and the **compute pool** provides runtime capacity for FalkorDB to run and answer graph queries.
- **Optimized storage** is the Snowflake data layer behind the workflow.

### Security boundary

- The service runs inside the **consumer Snowflake account boundary**: FalkorDB runs as a containerized graph engine and interacts with the Snowflake environment for the data workflow.
- Main point: **unified security boundaries** — customer data stays inside the Snowflake account **while third-party software runs there**, so the architecture prevents data exposure to a separate external graph system.

### Architecture summary (slide recap)

- FalkorDB = **graph database engine running as a containerized service**.
- **Snowpark Container Services** = the management layer that hosts and runs the containers.
- **CPU compute** = the hardware resource empowering the database and any custom functions.
- **Optimized storage** = the Snowflake data layer behind the workflow.
- The **account boundary** = the locked environment that protects privacy, governance, and data [unclear — ASR "data high authority"].
- Final takeaway: **FalkorDB runs as part of the Snowflake environment while customer data remains protected inside the Snowflake secure boundary.**

## Query workflow inside Snowflake

How Snowflake data becomes connected airport nodes and route relationships, and how Cypher traverses them (example: Sydney → New York). Each call follows **three steps inside Snowflake**: project the data into a graph → run the graph query → write the result back to Snowflake.

### 1. Project

- The load phase reads rows from a **bound Snowflake table** and maps them into a graph object.
- In the airport example, **source airport and destination airport become airport nodes**, and each row creates a **route relationship** between them: the shape changes from table rows to **connected airport nodes and route edges**.

### 2. Query

- Run the graph query on the projected graph: the query **follows outgoing connections across the graph** to find possible multi-hop flight paths.
- The demo query **starts at Sydney, follows `route` relationships up to six segments, and returns paths that reach New York**. The result is a **list of route paths and their hop count**.

### 3. Persist

- Persist the graph query result back into Snowflake: the stored result is the **set of flight paths returned by the traversal query**.
- This makes the graph output available as a **normal Snowflake table** for later SQL analysis and dashboards — the graph engine answers the connected question, and Snowflake remains the place where results are stored and consumed.

### Workflow recap

- **Bind** — Snowflake grants the app access to the table through a **controlled reference**.
- **Project** — the **LOAD CSV** phase turns table rows into graph nodes and relationships.
- **Query** — the graph runs Cypher graph queries for traversal (example: Sydney → New York path search).
- **Persist** — writing the result back into Snowflake as a **regular table** for reuse.

## Installing FalkorDB in Snowflake

- Go to the **Snowflake Marketplace** and search for **FalkorDB** — it is available as a **Snowflake native app** (the link was shared at the end of the workshop). You can get started right away.

## Live demo walkthrough

Demo flow announced: prepare the data in Snowflake → **start the native app** → load the CSV files into the graph → find possible multi-hop paths from **Sydney to New York** with Cypher → **compare the graph traversal with a SQL query**. Code and notebook were made available after the workshop.

### Prepare the Snowflake side

- The data is **real data for airports**: **airports as nodes**, a **route** as a relationship between airport nodes, plus **countries** and **airport-to-country relationships**.
- Started by creating the schema for Snowflake (something typical) and showing what the CSV files already contain (route per CSV) — something optional to run.
- Created the schema for the **four CSV files** and the main table, then loaded the **four CSV files** into Snowflake tables.
- Optional verification: checked the row **counts** for each table.
- Granted the **application permissions** for the **compute pool, warehouse, and service endpoint to bind a table** (typical Snowflake setup), then checked that the application (the native app) is ready.
- Granted the **FalkorDB native app permission to bind the table** (again typical for Snowflake).

### Build the graph (four tables, one graph)

- Pattern repeated for the next four cells: **bind the relevant Snowflake table, then load it into the graph** with **LOAD CSV**. All load into the same graph, named **`air routes`**:
  1. **airports** nodes,
  2. **countries** nodes,
  3. **route** relationships between airports,
  4. **airport-to-country** relationships.
- Optional check: queried counts to confirm all the data is inside the graph.

### Cypher vs SQL benchmark

- **4 hops, Cypher:** ran the Cypher path query — returned in around **1.6 seconds**.
- **4 stops, SQL:** also ran and returned the results for comparison (no timing given for the 4-hop SQL run); both produced all the results for the 4-stop query.
- **5 hops, Cypher:** changed the query to five segments — returned **all routes with five stops in about 1.3 seconds**.
- **5 stops, SQL:** changed the SQL query to five stops (five joins) — it was **already taking too much time**; after "a few more seconds" it was clear the query becomes much heavier. The presenter **stopped it at half a minute** to demonstrate that it was **still running**.

### Visualize in the FalkorDB Browser

- Opened the **FalkorDB Browser** to show the graph: one part of the graph with all routes and airports connected, and all the attributes of a node.
- Re-ran the **same five-hop Cypher query**: it starts from **Sydney** and finds **all possible routes all the way to New York** (zoomed in to show the target node and its attributes).
- "This is all the possible routes from Sydney to New York."

## Q&A

(The host read questions aloud for listeners without screens; answers were also to be included with the recording and notebook.)

### What is the LOAD CSV function doing?

- It takes a **CSV file**; all you need is a **graph name**. It takes the CSV **row by row** and moves that file data into the graph. (Nassim had demonstrated it at the start of the demo.)

### Are you using DFS to get all the paths between the source and the destination?

- **No manual DFS implementation.** They write a **Cypher path query**, and the **FalkorDB graph engine performs the traversal entirely** to find the best paths between source and destination.

### Can we access the full Cypher query language via Snowflake?

- **Yes** — Nassim demonstrated that you can (the host suggested the questioner could clarify if they meant something more specific).

### Why not just use SQL?

- That is what the session is all about: using SQL for graph traversal leads to **very bad performance** because you might need a **very long list of joins** — and in many cases **you don't even know how many joins you need**.
- You might have to run **all different lengths of joins — one hop, two hops, three hops, four hops, etc.** — just to get all the different accessible nodes.
- With a **graph API or Cypher**, the implementation can be **much more optimized for relationship traversal**.

### (From Tanmay) How can we update the graph knowledge bundles / make them usable for multiple purposes (e.g., relationships between people reused across business tasks and strategy)?

- Guy: not sure he fully understood the question — it seemed to be about how to update the graph.
- Bottom line given: **FalkorDB here is used for queries, not for updates**. If you want to update your data, **keep updating data in Snowflake the way you regularly do** — keep pushing updates and work with Snowflake as before.
- Only when you want to use the **FalkorDB graph engine** do you use **Cypher / the FalkorDB advanced query language**. **Changing the data does not require using the graph API.**
- The host invited Tanmay to drop a follow-up question if that did not answer it.

## Key facts and numbers

- App type: **FalkorDB-native Snowflake app**, available as a **Snowflake native app** in the **Marketplace** (search "FalkorDB").
- FalkorDB qualities cited: **ultra-low latency**, **multi-tenancy out of the box**, excellent performance, **fully open source**.
- Data promise: **data never leaves Snowflake** (zero-ETL); prevented from exposure to a separate external graph system by the unified security boundary.
- Two service-ingestion paths: **custom deployment** (container services/jobs/functions in languages like **C++** or **Python**) and **Snowflake Marketplace**.
- Platform layers: **image registry**, **Kubernetes-based cluster**, **compute pool**, **warehouse**, **service endpoint**, **Snowflake native app**, **account boundary**.
- Three workflow steps: **project → query → persist**; recap terms: **bind / project / query / persist**.
- Demo query: start at **Sydney**, follow `route` relationships **up to six segments**, return paths reaching **New York**, with **hop counts**.
- Benchmark: **4-hop Cypher ≈ 1.6 s**; **5-hop Cypher ≈ 1.3 s**; **SQL 5 stops (five joins) still running at 30 s when stopped**; 4-hop SQL also ran for comparison.
- Demo dataset: **four CSV files**; nodes = **airports**, **countries**; relationships = **route** (airport↔airport), **airport-to-country**; graph name **`air routes`**.
- Snowflake Summit: **first week of June**, **booth 2719**, plus a QR code to schedule a conversation/meeting with the team; another demo and more materials at the show.
- Presenter: **Nassim** built the native FalkorDB Snowflake app; panelist **Guy**; host read Q&A aloud.

## Code, commands and queries

Workflow and vocabulary (as presented):

```text
bind    → Snowflake grants the app access to the table through a controlled reference
project → LOAD CSV: read bound table rows; map source/destination airports to nodes
          and each row to a route relationship (rows → connected graph)
query   → Cypher traversal, e.g. start at Sydney, follow outgoing route relationships
          up to six segments, return paths that reach New York + hop counts
persist → write the returned set of flight paths back to Snowflake as a regular table
```

LOAD CSV behavior (from Q&A):

```text
LOAD CSV: takes a CSV file + a graph name; moves the CSV data row by row into the graph
```

Cypher path-query shape described in the demo (not shown verbatim in the transcript):

```cypher
// start at Sydney, follow outgoing route relationships up to five (or six) segments,
// return route paths that reach New York and their hop counts
```

## Hackathon relevance

- **Zero-ETL graph layer for company-brain projects:** if your hackathon data already lives in Snowflake, the native app adds a graph context layer without shipping data out — the bind → project → query → persist pattern is the template.
- **Cypher-vs-SQL evidence:** the 5-hop benchmark (≈1.3 s vs >30 s) is a ready-made argument for choosing FalkorDB when agents need multi-hop relationship questions answered fast.
- **Data stays governed:** agent tooling built on in-account containers keeps customer data inside the existing security boundary — useful for the "company brain" track where governance matters.
- **Simple ingestion:** `LOAD CSV` plus a graph name is a low-friction way to turn flat hackathon datasets into connected nodes/relationships.
- **Demo-friendly:** the FalkorDB Browser visualizes query results (routes to New York with node attributes), useful for showing judges the connected data.

## Related notes

- [`docs-integrations.md`](docs-integrations.md) — the integrations docs page covering drivers, frameworks, and data pipelines, incl. the Snowflake app context.
- [`transcript-text-to-sql-cypher.md`](transcript-text-to-sql-cypher.md) — translating SQL thinking into Cypher, the exact comparison this session benchmarks.
- [`../../guide/01-graph-databases.md`](../../guide/01-graph-databases.md) — why graphs beat recursive SQL joins for connected questions.
- [`../../guide/04-cypher-basics.md`](../../guide/04-cypher-basics.md) — Cypher path-matching basics behind the Sydney → New York traversal.

## Logistics

- Everything shown on screen was **recorded**; the **code and notebook** used in the demo were to be shared after the workshop in a **blog post together with the answers to the Q&A questions**.
- The **Snowflake Summit** is in the **first week of June**; FalkorDB has **booth 2719**, where they will show this demo plus another demo and more materials — a QR code allows booking a short conversation/meeting with the team.
- Contact channels: **LinkedIn, Discord, X**; the host also mentioned re-raising an important point seen on Discord — **the data does not leave Snowflake**.
