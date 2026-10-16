# FalkorDB AMA: MST Algorithm, Kuzu Migration, Multi-Tenancy, and Query Weaver

> **Source:** [`Transcript copy 12.txt`](../Transcript%20copy%2012.txt) · **Type:** webinar transcript · **Saved:** Oct 16, 2026 · **Original URL:** https://www.youtube.com/watch?v=dVXqBmlIOm0

## Overview

- Community **ask-me-anything (AMA)** session hosted by the FalkorDB team: a short product-news segment, then live Q&A from the Q&A panel, chat, and Discord (plus a recurring "fan favorite" question from a previous edition).
- Product news: the recently released **MST (Minimum Spanning Tree)** algorithm — with a **Minimum Spanning Forest** variation — and a **KuzuDB migration guide** following Kuzu's shutdown.
- The dominant theme is **multi-tenancy**: why packing tenants into one graph with labels/attributes is risky, how the Graphiti integration maps `group_id` to graph names, and how graphs spread across a Redis Cluster.
- Other topics answered: **Bolt protocol** status, **Query Weaver** (on-prem / Ollama), the day's **LangChain.js natural-language-to-Cypher** release, ontology evolution, temporal validity and **TTL**, and **high-throughput tuning tips**.
- Closes with upcoming events (graph visualization, chatbots with memory, a Query Weaver deep dive plus benchmarks) and support channels.

## Product news and updates

### MST (Minimum Spanning Tree) and the algorithm suite

- FalkorDB recently released an algorithm known as **MST — Minimum Spanning Tree**.
- A variation, **Minimum Spanning Forest**, handles graphs whose nodes form multiple different connected components.
- The entire algorithm suite can be found in the FalkorDB **documentation**; it is **a work in progress** — new algorithms are being worked on and added as development continues.
- On the horizon: **Max Flow** and **Min-Cost Max Flow** (transcript: "max flow mean cost"), seen as handy for many different sorts of applications.
- There have also been requests for another algorithm (transcript: "luane" [unclear]) that the team will try to accommodate.

### Implemented with sparse linear algebra

- FalkorDB's distinctive approach to classical graph algorithms is to implement them with **linear algebra** rather than the textbook approach.
- The classical alternative — adjacency lists — would be pretty straightforward to implement, but FalkorDB wants to run these algorithms **as fast as possible**; performance increases when using **sparse matrices** and **sparse linear algebra operations**.
- That might take a little longer to implement, but the benefits pay off. Anyone interested should look at the algorithm suite in the documentation.

### KuzuDB migration guide

- **KuzuDB** "had a great run" that came to an end about **a week and a half to two weeks** before this session; the team wished everyone there the best in building their next thing.
- For anyone wondering about an alternative or wanting to switch away from KuzuDB, the team prepared a **migration guide** in the FalkorDB documentation and blog — described as pretty straightforward and thorough, with an offer to walk through it after the session.

## Multi-tenancy, isolation, and scaling

### How FalkorDB compares with other graph databases

- Recurring question (also asked in a previous edition, including from Discord): how does FalkorDB compare with other graph databases?
- Positioning: FalkorDB delivers a **low-latency, high-throughput, multi-tenant graph database** following the same model as Neo4j and other vendors — the **property graph data model**.
- The emphasis is **performance**: all graphs are held **in memory**, represented as **sparse matrices**, and traversed using **sparse linear algebra operations** — "that gives us an edge when it comes to performance".
- **Multi-tenancy is enabled by default on the open-source version**: multiple graphs can be stored on a single instance. To grow beyond a single machine, use the **FalkorDB cluster**; a few customers run **thousands of different graphs** on a small cluster.
- Read operations scale out with a cluster by **adding additional replicas** to the masters.
- Target: **near-real-time applications** — resource management, or GenAI applications with user interaction where performance is crucial to the end-to-end user experience.

### Tenant separation: labels vs properties

- Question: do you prefer using **node labels** or **properties** to distinguish tenants, and how does the choice influence query efficiency?
- The question itself shows the **lack of support for multi-tenancy** in other graph database vendors: those without native built-in multi-tenancy "disguise" it by separating tenants using labels or attributes — packing different users into the same graph and distinguishing data with a per-user label or attribute.
- That is really not the ideal way to store multiple **disjoint graphs** in one database.
- Recommendation: use **true multi-tenancy** and keep the graphs completely separated — what FalkorDB offers.

### Multi-tenancy options with Graphiti (Brian's question)

- Context: Brian wanted more detail on **multi-tenancy options with FalkorDB** (high-level options) because he uses **Graphiti with Neo4j**, where a **`group_id` attribute segregates graphs**.
- FalkorDB offers multi-tenancy **throughout all of its tiers**; the similar offering does not exist in all tiers elsewhere — per the team, Neo4j's multi-tenancy is not readily available outside its enterprise tier.
- FalkorDB has been working with the **Graphiti** team (transcript: "Kofidi" [unclear]) to make its multi-tenancy solution available on that framework; the current status of that work needs checking.
- Why the mix-everything-in-one-graph approach is wrong (for Graphiti or any application that needs multi-tenancy but doesn't use it as intended):
  - **Security / data leakage** — the tenants' data is mixed into a single data structure (graph), so a malformed or incorrectly composed query can expose data that should never be seen by that user.
  - **Noisy neighbor** — resources are shared with other tenants; one big player can consume most of the resources while a small tenant is impacted without knowing the reason, or why a "tiny" graph turned out huge.
  - **Shared maintenance operations** — index generation or graph mutations can take a long time and affect everyone, even tenants that never run those operations.
- The team is in touch with **Graphiti** and really wants it to adopt **true multi-tenancy with FalkorDB**.
- In the existing Graphiti–FalkorDB integration, **`group_id` maps to the graph name in FalkorDB**: each group ID gets a distinct graph. This covers both the privacy and the scaling issue — one user cannot affect another account or user by using more or fewer resources, and separation gives **resource separation of both CPU and data size**.
- Related sessions: two workshops done consecutively in recent months, both on YouTube — **how to get started with Graphiti and FalkorDB**, and **how to construct (build) a knowledge graph with Graphiti and store it in FalkorDB**. At around **minute 22** of the knowledge-graph workshop, FalkorDB's lead developer on the Graphiti integration goes into exactly this multi-tenancy discussion.

### Scaling across multiple machines: sharding by hash slots

- FalkorDB runs on **Redis**; Redis has multiple ways to scale, primarily the **Redis Cluster** solution.
- When scaling with multiple machines, Redis Cluster separates keys based on **hash slots** — there are **up to 16,000 hash slots**, so theoretically you can reach up to **16,000 nodes** of horizontal scalability.
- **Each key is a different graph**, so when sharding, graphs are spread across different machines **automatically** by the Redis Cluster implementation — no need to worry about placement.
- One caveat: a specific graph (a specific key) resides in the **memory of exactly one machine** — FalkorDB does **not** shard a single graph over more than one node. Data capacity planning means fitting a graph into its node.
- To fit bigger graphs, you can **scale up specific nodes** — for example from **16 GB to 32 GB or 64 GB** of RAM.

## Q&A highlights

### Temporal validity, TTL, and the "epistemology layer" question (Kofa)

- First question: "Will you tackle the epistemology layer besides the ontology layer?" The team was **unfamiliar with the epistemology layer** and asked the asker to clarify in a follow-up; the clarification arrived later in the session.
- Answer to the clarified question: essentially **no — it is a bit out of scope at the moment**. The only relatable element of the bulleted question is that **edges and nodes** are involved, and whether they can have **temporal validity**.
- The closest existing mechanism: **TTL** associated with nodes and edges — nodes and edges whose TTL has expired can be removed.
- Roy is **not aware of any graph DB vendor that offers this as part of its core database**; to him it sounds like some sort of upper layer on top of the database, and putting those features into the core sounds unlikely.
- A related plan that might help: **user-defined functions (UDFs)** — FalkorDB plans to let users code specific functions or query/traversal statements, e.g. if they need extra weight or statistical attributes and want to traverse using those calculations. More specific specifications of the end-user queries and what is being extracted from the graph would be needed before anything is added.

### DBeaver connector and Bolt protocol (Dr. Thomas Karpati)

- Question: he uses **DBeaver** for data management — it has connection managers for all types of databases and connectors for Neo4j and OrientDB — are you planning a connector for FalkorDB?
- Roy had not heard of the product before. If thinking about SQL, the analogous thing is **ODBC**; in the graph database realm the closest thing is the **Bolt protocol**, developed and designed by **Neo4j** and adopted by a few other vendors like **Memgraph** and **Amazon Neptune**.
- FalkorDB has an **experimental implementation of Bolt** that "I think we should find the time to take into production". The team can also look at DBeaver to see what it would take to get FalkorDB involved in that product.
- Team comment: it depends what you're trying to achieve — many data-management platforms don't provide the right tools to investigate a graph from different angles (visualization, or a table view of specific query results). FalkorDB has a **native browser** plus **integrations with multiple external graph-visualization tools**; one of them will be showcased **next month**. Happy to discuss on an interactive call.
- Roy's read of the DBeaver website: it looks like a general UI for SQL databases; a Pro version supports NoSQL databases; nothing graph-related was visible. And it's not just connectors — a graph tool also needs a **visualization UI**, which is "a huge thing on its own".

### Ontology changes when data updates

- Question: how does an ontology scale when my data updates?
- Current process: when starting from scratch you define an ontology; as time passes and data evolves, the ontology may change. An ontology change can be thought of as a **schema change** (in SQL terms).
- FalkorDB is **not planning** — at least for the moment — to handle ontology changes **automatically**; it is an event the user needs to be involved in.
- Suggested flow: take more recent data, create a **new ontology**, compare it against the previous one and apply the changes — maybe new node types were added, some relationship types should no longer exist, new attributes appear, etc.
- Applying changes **backwards to previous data is a challenge**, and FalkorDB is not trying to do that at the moment. Options: **re-ingest the entire data**, or ignore previous data and **continue from the point where the new ontology is applied** (previous data would be lacking behind). The problem is not solved yet; it is an important step, and most of the work currently falls on the user to manage ontologies and update data accordingly.
- Team addition: FalkorDB is essentially **schemaless** — you can add labels and edge types on the fly and the database will not break or stop serving queries. If you want constraints to limit ingestion based on specific conditions, then you manage the **ontology and strictness yourself**, based on your own definitions.

### Query Weaver: on-prem / Ollama support (Dr. Thomas Karpati)

- Background: **Query Weaver** is a demo FalkorDB released about **three or four weeks** before this session (also described as "three weeks ago") — FalkorDB's take on **natural language to SQL**. You hook up your **Postgres**, ask questions in natural language, and it transforms the question into SQL, runs it against the database, and generates a response **once in SQL and once in plain language**. A **graph engine is powering it**. The team is benchmarking it across **two benchmarks** against other tools; the result set will be released when ready.
- Question: Query Weaver is based on **Azure and OpenAI API**, and he's interested in using it **on-prem** connected to a **local Ollama server** — do you plan to expand it to allow that?
- Roy: focus right now is on benchmarking what exists so far, plus enhancing how the **knowledge graph of database schemas** is built.
- A team member: the **code is available** and any user can take it, configure it, and try a different LLM — not very complicated — but FalkorDB itself will probably not add that directly into the codebase at this point.
- Roy: the same should happen here as with the **GraphRAG SDK** — it started with **OpenAI as the only LLM vendor**, then switched to **LiteLLM**, which allowed integrating with most LLM vendors. Query Weaver shouldn't restrict itself to a handful of vendors; it should be generic and let you **bring your own model**.
- Why Query Weaver works (Roy): it shines when the **schema catalog is large** — you cannot take the definitions of all tables and columns and feed them as context to an LLM; you'd either be **paying through the roof** or **quickly reach the context window limit**. Moreover, if you're willing to pay and haven't reached the token capacity, **too much information can throw the LLM off**.
- What Query Weaver does instead: it **creates a graph taking note of all the relationships between your tables**; for a given user question it tries to find **which tables are relevant, how they connect with one another, and which columns might be relevant** — and feeds all of that relevancy data into the model. That is what gives it an edge over text-to-SQL approaches seen so far.
- The demo screenshot (shown to support the explanation) had a **demo CRM** hooked up: Query Weaver had created the knowledge graph of that database's schemas. There were plenty of tables in this instance, and it can expand way beyond that.

### High-throughput tips for production

- Question: any tips or general practices for high throughput / high concurrency, specifically in a production setting?
- **Always profile your queries.** Make sure you don't have **untuned queries** that, within a burst of user interactions, would clog up the database and make everybody suffer. Every individual query should be profiled to run quickly.
- **Use batched queries** in some situations: instead of running 100 queries, group the payloads that change from one query to another into a single **batch** — usually an **array of objects or an array of scalars** — and let the query **iterate over each object** in the array and run against it.
- If tuning is not enough: **scale out** — identify your **read queries vs write queries**, introduce **replicas** to the cluster, map read queries to the **replicas** and write queries to the **masters**, and distribute the entire load across multiple machines.
- Team addition: another scaling option for concurrent read queries is to **add more CPUs to the same nodes** — nodes with more cores let FalkorDB use the additional cores to run queries **in parallel** and collect read-only data.

### LangChain release: natural language to Cypher

- Question about **LangChain**: the team released a LangChain update **that day** — a **TypeScript** update that lets you ask in **natural language**, converts it into **Cypher**, and prints the result. Described as a very cool feature, "all very simple, works really well".
- That release is the latest update on the LangChain integration; the asker was invited to follow up for more specifics.

### Knowledge decay over time

- Question: in a typical knowledge graph where knowledge relevance can decay over time, how should that decay be kept in consideration — date values in the knowledge node, or an alternative solution?
- Suggestion: look at frameworks like **Zep / Graphiti**, which also manage the data in the graph and handle validity — and invalidity — of data over time. Check how they define properties on nodes (and even on edges) to tackle the **date the node/edge was added**; where a timeline of validity exists, they add an **expiry date**.
- When you ask a time-based range question, calculating those properties and time frames for each element lets you get back the nodes that are relevant (or not) for that query.
- FalkorDB includes **time-based attributes** — you can store **time and duration** within nodes/attributes — but the **logic of how to treat them is up to the framework or your own application**.

### Multiple cores and Docker

- Question: do **multiple cores** help FalkorDB, and does it run in **Docker**? Answer: **yes to both**.
- FalkorDB is a **multi-threaded** database: each query is associated with a thread, and within the execution of a single query it might use **additional threads** depending on the volume of data being processed. Parallelism is used both at the **query level** (multiple queries in parallel) and **within a single query**.
- Docker: **yes** — multiple Docker images for different architectures and OSes, all available on **Docker Hub**. The team crossed **100,000 Docker pulls** about two weeks before the session.
- A slide from one of the team's workshops illustrated **linear scalability**: add more nodes and the queries per second align with however many you've added.

## Upcoming events and workshops

- Community feedback the team wholeheartedly agrees with: bring on board **clients using FalkorDB in production** to showcase what they're building so others can see how the theory comes together into a working product.
- Precedent: **Yohei Nakajima** — an investor in FalkorDB and a "vibecoder" of the technology — joined in **July**; on the FalkorDB YouTube channel there are two separate solutions of his, one **vibecoded and one not**, both with a **knowledge graph at their core** using FalkorDB.
- Event lineup being put together for **November and parts of December** (before the Christmas break):
  - **Graph visualization**.
  - **Chatbots with memory** — expanding on two other workshops done in the past (the feedback on the earlier one was to dive even deeper into the architecture): fewer slides and a deeper dive into the previously prepared **Google Colab**.
  - **Query Weaver workshop** — how it was built, how it works, why it works — released alongside the prepared **benchmark sets** to corroborate the thesis that this approach yields better results.
- Query Weaver is already usable for free at **queryweaver.ai** — log in with SSO.
- The **QR code** shown points to the **Luma** calendar where all events are posted; signing up there gets you invited to all of them automatically and sends reminders.

## Logistics

- The session was recorded.
- The team extracts the questions asked and puts answers into a **blog post**, probably within the **next 48 hours** — useful to review answers to questions asked here.
- Questions not covered live were to be answered **offline directly** to the askers.
- Support channels: **Discord** is a great way to get hold of the team (monitored daily; likely replies the same evening or next day); email works fine, but Discord is best for technical questions; the team is also building a presence on **Reddit** for community discussion.
- The format was more informal than usual ("we think it exceeded our expectations"); the team asked viewers to say if they want more AMAs. The session ended on a hard stop but the team remained available.

## Key facts and numbers

- **MST (Minimum Spanning Tree)** released recently; **Minimum Spanning Forest** variation for graphs with multiple connected components; suite is a work in progress.
- On the horizon: **Max Flow** and **Min-Cost Max Flow**; plus requests for another algorithm (transcript: "luane" [unclear]).
- **KuzuDB** shut down about **1.5 to 2 weeks** before the session; migration guide in the FalkorDB **docs and blog**.
- Algorithms implemented with **sparse matrices / sparse linear algebra operations**, not adjacency lists.
- Redis Cluster: **up to 16,000 hash slots** → theoretically up to **16,000 nodes**; **each key is a graph**; a graph never spans more than one node.
- Scale-up per node: **16 GB → 32 GB or 64 GB** for bigger graphs.
- Batch example: **100 queries → one batch** (array of objects or array of scalars).
- **100,000+ Docker pulls** crossed ~2 weeks before the session; multiple images for different architectures/OSes.
- **Bolt protocol**: developed by Neo4j; also adopted by Memgraph and Amazon Neptune; FalkorDB's implementation is **experimental** and should be taken to production.
- **Query Weaver**: released ~3–4 weeks before (also "three weeks ago"); Postgres hookup; graph engine behind it; built on Azure/OpenAI APIs (as stated in the question); **2 benchmarks** in progress; free at **queryweaver.ai** with SSO.
- **GraphRAG SDK** trajectory: OpenAI-only → **LiteLLM** → most LLM vendors.
- **LangChain.js (TypeScript)** release the same day: natural language → **Cypher**.
- Graphiti workshop: multi-tenancy discussion at ~**minute 22**; two workshops on Graphiti + FalkorDB recently on YouTube.
- Q&A blog post: within ~**48 hours**.
- Events: **November** and parts of **December**; Query Weaver workshop + benchmarks; Query Weaver free at queryweaver.ai; Luma calendar for invites/reminders.
- **Yohei Nakajima** showcased in July — two solutions, one vibecoded, both with FalkorDB knowledge graphs at the core.

## Hackathon relevance

- **Agent memory and coordination track**: FalkorDB's native multi-tenancy ("one graph per agent or user") is the exact pattern for isolating each agent's memory — the AMA explains why labels/attributes as tenant discriminators leak and how Graphiti's `group_id → graph name` mapping fixes it.
- **Company brain track**: the Graphiti integration pattern (each group/department gets its own graph while sharing one instance/cluster) is a blueprint for org-scoped knowledge graphs.
- **Connected data track**: the comparison answer doubles as a checklist of FalkorDB strengths to lean on — in-memory sparse-matrix engine, property graph model, near-real-time latency, hooks for read replicas.
- **Query Weaver** demonstrates a reusable architecture for the hackathon: turn a large schema/data catalog into a graph, compute relevance for the question, and feed only that context to the LLM — exactly the "context for AI agents" thesis.
- Performance tips (profile queries, batch with arrays, route reads to replicas, add cores) map directly onto making a hackathon demo survive concurrent users.
- Anyone migrating a Kuzu-based project can use the FalkorDB migration guide for a quick switch.

## Related notes

- `transcript-cluster-scale-out.md` — the companion workshop that demos cluster scale-out and multi-tenancy with concrete benchmarks.
- `docs-graph-algorithms.md` — the FalkorDB algorithm suite (including MSF and MaxFlow) that the MST news at the top of this AMA refers to.
- `repo-falkordb.md` — the open-source repo behind the multi-tenancy-by-default and cluster capabilities discussed here.
- `../../guide/02-falkordb.md` — guide module introducing FalkorDB's architecture for agent context.
- `../../guide/09-graph-algorithms.md` — guide module on calling FalkorDB graph algorithms.
