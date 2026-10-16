# Building Agentic Memory with Graphs — QueryWeaver Natural Language to SQL

> **Source:** [`Transcript copy 14.txt`](../Transcript%20copy%2014.txt) · **Type:** webinar transcript · **Saved:** Oct 16, 2026 · **Original URL:** https://www.youtube.com/watch?v=XOP7bhAuhbk

## Overview

- FalkorDB workshop on **implementing agentic memory**: what an agent is, why agents need memory, why that memory should be graph-based, and what to do about privacy and scale.
- Working demo: **QueryWeaver** — FalkorDB's open-source app that converts natural language to SQL, runs it against databases (demo: Postgres CRM), and answers back in natural language.
- QueryWeaver's agent uses **three memory types**: past queries with success/failure and results, user profile (personalization), and conversation history via **Graphiti** episodes — everything connected in one graph.
- Roy Litman (CTO, FalkorDB) covers why graphs fit agentic memory: low latency, high throughput, small memory footprint, schemaless property graphs, **multi-tenancy** (a memory graph per user), Cypher, and vector/semantic indexes.
- Extended Q&A: 50+ table schemas, re-querying vs. memory, schema-graph vs. memory-graph isolation, memory retention and cleanup, real-time latency, terabyte-scale data, and fixed vs. learned ontologies.

## Speakers and agenda

- Host: **Dan** (marketing). Presenters: **Roy Litman** — CTO of FalkorDB; **Gal** — AI engineer who developed QueryWeaver and leads the implementation and demo.
- Agenda: what agents are → why they need memory → why memory should be **graph-based** → privacy and scale → demo → Q&A.
- Workshop format: mainly practical, targeted at under 60 minutes, Q&A normally at the end (burning questions can be dropped in the comments mid-session if quickly answerable).
- Question channels: Q&A panel (bottom right of the screen), Discord, or LinkedIn. Questions that can't be answered live are compiled and emailed to attendees afterwards.

## What is an agent, and why does it need memory?

- An **agent** is a software component powered by an LLM, designed to perform tasks and take actions — tool interactions, working with other agents — and to produce outputs that fit the next step of a pipeline (e.g., an agentic flow).
- The agent is given **tools** so it can perform its task well. One of those tools is **memory**.
- With memory, the agent can learn over time about:
  - its environment and the task it needs to perform,
  - the people (and other agents) it talks with,
  - how it performed previously — repeat successful steps, avoid repeating failures.
- Goal: the agent should not start from zero every time — the environment should continue growing with time.

## QueryWeaver: natural language in, SQL and answers out

- **QueryWeaver** was developed over the past month as a showcase; it is open source and free to use.
- Flow: any user question in natural language → an agent converts it to SQL → the database executes it → the user gets an answer in natural language.
- To answer well, the text-to-SQL agent gets **two tools**:
  - the **schema structure** (stored as a graph),
  - **memory retrieval**.
- Demo database: a generated **CRM database in Postgres**; the schema itself is stored in the graph, so you can watch both the schema graph and the data in Postgres.

## The three memory types

- **1. Queries and results** — saved into the graph as query nodes connected to database nodes with relationships that state **success** or **failure**; on retrieval, this preserves the context between recent queries and their results.
- **2. User profile** — represented as a node; updated each time the user introduces themselves, states a preference, or asks about the future; stored as a summary and extracted any time the agent performs a task again.
- **3. Conversation history** — done with **Graphiti**: the conversation is given to Graphiti, and the last episode is saved connected to the nodes. Everything ends up connected in one graph.

## Inserting and extracting memory

- On **every question**, the agent extracts: the user profile, the past conversation via Graphiti (the most similar facts and episodes), and similar queries with their results.
- When a **conversation ends** (in QueryWeaver, a Q&A exchange), the system:
  - extracts and **updates the user profile** from the current conversation (preferences may change; entries may be added or deleted),
  - adds the conversation to Graphiti's overall memory — the Q&A is **rephrased into a single phrase/string** to align the conversation between the database and the user and to let Graphiti extract entities,
  - saves the **query results** based on the outcome of the query.
- Episodes are written **per database and per user** — a graph memory may hold more than one database, so episodes must be scoped to a database (and this is explained in the episode description).

## Core implementation functions

- **Add new memory** — takes the conversation and history, summarizes the conversation (the "refresh" part), and adds it to Graphiti as an episode: a name plus the body of the episode, related to the database. It also updates the user information. Both operations run simultaneously, so the pipeline doesn't block on the user.
- **Save query results** — uses a **Cypher** query to connect results to the database entity; stores the user query, the SQL query, success or failure, the error, timestamp, and an **embedding** for later semantic search; relationships are typed as shown in the slides.
- **Search memories** — extracts the user profile, database facts and episodes, and similar queries; also done asynchronously; assembles everything into a single string called **"memory context"** that is provided to the LLM to convert the question to SQL.
- The whole implementation is open source and reviewable on the GitHub repo.

## Live demo: CRM database in Postgres

- The demo graph was flashed (cleared) first: it starts with only the database node and the user profile (the user ID) visible.
- Question 1: **"Please create a monthly report about my tasks over July 2025."** The question implies two concepts — a monthly report (to be understood as a future reference) and the user's identity, which the agent does not know yet, so it asks who the user is.
- The user answers with the username — **"sales rep one"** (prepared beforehand in the generated database). The agent confirms, uses it, creates SQL, executes it against the database, and returns output in natural language. The expectation is that the username is recalled in the future.
- After resetting the conversation: **"Can you generate the report that I asked last time or August?"** — the agent understood *which* report (tasks) and *who* the user is (username "rep one"), even though there were many tasks for August; it succeeded.
- Graph inspection of the three questions: each query node is connected to the database node with properties — user query, SQL query, success flag, and embeddings. The **user profile** is stored as a summary (e.g., the user identified by username, personal information) and is updated with every question to improve future questions. Entities and episodes are stored via Graphiti into the same overall graph, giving the LLM the environment it needs to perform and improve over time.
- Follow-up **"Which one of them has high priority?"** — demonstrates **walking memory** (using the last question), plus the **taxonomy feature**: the app understands lowercase "high priority" and how priority is stored in the column, and answers.
- **"Which task is due before my birthday?"** — the agent asks for the birthday; the user answers **"the 2nd of August, 2025"** (with a typo, which the LLM handled because it understands text). The agent extracted the task connected to the 1st of August.
- After another session reset: **"Tell me how many days are between all of my tasks' due date and my birthday."** Every question extracts the three memory concepts into the text-to-SQL prompt, and every successful query is inserted into the graph as part of the prompt. The agent produced a table and explained it in natural language — using preference memory, last-conversation memory, and past successes to improve the next queries.
- Complex query: **"How are the customers with the highest and lowest sales volumes and how is this company's associated account managers?"** — expected to be a candidate for failure (statistical models sometimes fail), but the agent succeeded, generating a complex SQL query with multiple joins and a multiplication, returning a natural-language explanation.
- Counterfactual on failures: if the agent has memory of **failed** queries, it learns not to repeat them (not shown live in the demo).

## The role of graphs in agentic memory (Roy, FalkorDB)

- As agents become more popular, graphs show up in more use cases: first **knowledge graphs** (recently revived), now graphs to **store memory**. In this demo, the graph also holds the entire relational database **schema**.
- For user-interaction applications you don't want the database to be the bottleneck: FalkorDB emphasizes **low latency, high throughput, and a small memory footprint**.
- **Schemaless** property-graph model shines vs. relational databases: changing a relational schema is not easy, whereas with a property graph you can add new attributes, node types, and relationship types with ease.
- Two features that matter for memory and knowledge graphs:
  - **Multi-tenancy** — maintaining multiple disjoint graphs inside a single database. Every user gets their own memory graph, so thousands of users mean thousands of memory graphs in one database.
  - A **common, well-known query language**: in FalkorDB's case, **Cypher**, which has been around a long time and which LLMs can translate natural language into.
  - Plus the **semantic index** (a.k.a. vector indexing) — another index type FalkorDB supports that is used over and over in agentic use cases.
- Practical conclusion from Dan: decide what the agent needs to remember, how it is going to store its memory, and pay attention to how it handles **privacy and scale**.

## Q&A

### Complex schemas of 50+ tables in healthcare (David)

- **Q:** Does it work for complex schemas — 50 and above tables with many relations? (Healthcare, working with "OM CDM" [unclear — likely OMOP CDM].)
- **A (Gal):** This is about the agent rather than the memory. The technique is graph-based: store the schema of the database in the graph. For large schemas — 100, even 1,000+ tables — extract the relevant parts from the question, **find entry points in the graph**, traverse between the entry points, and extract all the tables in between. This overcomes the gap between the LLM context window and a complex relational database: store the relational database as a graph, find entry points using a semantic layer, and use the graph's traversal ability to extract only the relevant connected tables.

### Re-running SQL vs. using memory (Arouch)

- **Q:** Is it going to run an SQL query every time, even when it has retrieved data from a previous prompt — if it retrieved the query earlier and the user asks again, does it use history or query the database again?
- **A (Gal):** Yes — it will convert to SQL and execute the same query against the database again. The memory part is that when you ask again something related to a previous query that was executed, the agent knows how it performed the last query and converts the question into a valid SQL query. Agreed the future could reuse the previous query **and its results** from memory — a good point.

### Schema graph vs. memory graph (attendee statement, clarified)

- Attendee's statement: you have defined a graph that maps the schema of a database (CRM in Postgres/SQL); nodes are the tables, columns are properties; during a query, the graph is expanded with user properties such as a username.
- **A (Gal):** The first half is "bang on", with one clarification — there are **two separate, completely isolated graphs**:
  - The **schema graph**: tables and columns are the nodes, and the relationships between them mirror the real relationships in the relational database (a table has columns, columns refer to other columns, columns refer to tables — that is how they connect).
  - The **memory graph**: isolated; this is achievable because FalkorDB is multi-tenant — build a graph per case and isolate it from the other graphs.
- Schema is one graph; memory is the other graph.

### How long is memory saved? Personalization storage (Smury)

- **Q:** How long is the memory saved? Are you creating another node in the graph for personalization, or is e.g. birthday information saved somewhere else?
- **A (Gal):** In the current implementation, memories stay **forever**, with time recency coming from Graphiti. Preference facts like a birthday are inserted into the profile node and stay there until the memory is erased. Timestamps are being added so that old memories that were not used for a long time can be erased — the planned approach for the future. Today, every query and every node added to the graph stays and is used in the next interaction.
- Follow-up on Graphiti: Graphiti adds **temporal data as node properties** — when the node was created, when it is valid, and when it becomes invalid in the future — and custom nodes added by the app follow Graphiti's method/ontology because that temporal feature is really useful.

### Real-time answers (Ms.)

- **Q:** Is FalkorDB capable of providing answers about data stored in its graphs in real time or near real time? Use case: an agent providing facts about certain data points and communicating results in real conference calls, where latency is critical.
- **A (Roy):** That is what FalkorDB is designed for. It really depends on the data set and the queries, but for the majority of cases FalkorDB is extremely efficient given how queries are run and data is stored. Best answer: take it for a spin. Benchmarks across different data sets and queries show unbeatable performance; feedback is welcome.

### Scaling to hundreds of gigabytes / terabytes (anonymous)

- **Q:** How feasible is it to scale FalkorDB, with or without Graphiti, to hundreds of gigabytes and potentially terabytes of data? Especially interested in memory usage, given it uses Redis so much under the hood.
- **A (Roy):** It depends on the application. In the CRM-style app Gal presented, the relational database's hundreds of gigabytes do **not** need to be stored inside the graph. If data must be stored at that scale, it matters whether it lives in a single graph or is broken into multiple graphs. FalkorDB keeps all information **in memory** — it does not want to reach out to disk to pull information needed by a query, because that would be a disaster for performance. If data is split across many graphs, you can **scale out with a FalkorDB cluster**: multiple machines, each hosting a number of graphs, spreading all data across the cluster. A blog post released a few days earlier covers this and will be sent along with the workshop recap.
- **A (Gal):** On the memory side, new memory goes through **deduplication** — finding similar nodes and deduplicating them — so the design scales if the memory is heavily used.

### Fixed ontology vs. Graphiti-defined entities (Arthur)

- **Q:** Did you leave entity/ontology creation to be defined by Graphiti, or is there a predefined schema? What are the tradeoffs?
- **A (Gal):** In the demo/application everything is defined through Graphiti's ontology as saved in the graph — **entities, episodic, and summaries** — plus custom nodes with a type property; what was shown today is defined up front, like an ontology. **Trade-off:** a fixed ontology means the same kind of memory (semantic memories) is saved the same way consistently, but there is no way to create new kinds of memory or extract other memory concepts. If the LLM is allowed to modify the ontology over time, it can learn new kinds of memories and behave more like a human — but for an agent with specific tasks, a defined ontology is what gives the agent references from the past, which is exactly what "memory" means in this application.

### Long-term cleanup and pruning (Mark Lozano)

- **Q:** For memory based on Graphiti/FalkorDB running long term — do we need a cleanup task to prune memories, or can we store without worrying too much?
- **A (Gal):** Definitely need a cleanup method — erase memories that have been in the graph a long time and were not used. It is not a worry at the beginning, but at some point there will be a lot of memories and we need to think about how to clean them; erasing long-unused memories is the current approach and needs further development.
- Dan noted this also answers the earlier question about **"bad memory"**, so it was treated as answered live.

## Key facts and numbers

- QueryWeaver: developed over the past month (at the time of the session), open source, free to use; the app URL was given as `app.query.ai` [unclear as transcribed] plus a QR code — "star" the project to support it.
- Demo database: generated CRM in **Postgres**; schema stored in the graph.
- Demo interactions: monthly report over **July 2025**; username **"sales rep one"**; birthday **2nd of August, 2025**; task connected to **1st of August**; August tasks follow-up; complex customer sales-volume / account-manager question succeeded.
- Query node properties: user query, SQL query, success/fail flag, error, timestamp, embedding.
- Memory extraction per question: user profile + Graphiti facts/episodes + similar queries → single **"memory context"** string for the LLM.
- Schema-graph technique scales to **100 / 1,000+ tables** by entry-point traversal.
- Scale guidance: hundreds of GB → terabytes across **multiple graphs** + **FalkorDB cluster** (multiple machines, each hosting several graphs); FalkorDB keeps data in memory, no disk access for query data.
- Retention: memories currently permanent; timestamps enable future cleanup of old, unused memories; Graphiti temporal properties: created / valid / invalid.
- FalkorDB highlights: low latency, high throughput, small memory footprint; schemaless property graph; multi-tenancy (multiple disjoint graphs per database); Cypher; semantic/vector index.
- Upcoming sessions: **G.V()** graph visualization (November), chatbots with persistent memory featuring two open-source community projects, and a GraphRAG text-to-SQL deep dive on QueryWeaver; sign-ups via Luma or LinkedIn.

## Hackathon relevance

- **Agent memory track:** the three-memory blueprint (query history with success/failure, user profile summary, Graphiti episodes) plus the assembled "memory context" string is a ready-made pattern for giving a hackathon agent durable, personalized memory.
- **Connected data track:** the schema-graph technique — model a relational schema as a graph, find entry points, traverse to the relevant tables — is a strong way to give an LLM only the context it needs for large schemas (100–1,000+ tables).
- **Multi-tenancy for isolation:** one disjoint graph per user (and per database) answers privacy/isolation questions cheaply; keep the schema graph and the memory graph separate as clarified in the Q&A.
- **Lifecycle management:** timestamp every memory so stale, unused memories can be pruned later; decide early whether your ontology is fixed or open to evolution.
- **Reference implementation:** QueryWeaver is open source — read it for working examples of Cypher-based result storage, embeddings on query nodes, and Graphiti episode ingestion.

## Related notes

- [transcript-graphiti-zep.md](transcript-graphiti-zep.md) — the companion workshop's deep dive on Graphiti, the temporary-graph engine QueryWeaver uses for conversation memory.
- [transcript-cocoindex.md](transcript-cocoindex.md) — related webinar on building agentic memory/context pipelines end to end.
- [../../guide/10-agent-memory.md](../../guide/10-agent-memory.md) — guide module covering agent memory concepts that this session builds on.

## Logistics

- Workshops run roughly monthly (these tend to happen once a month) and keep sessions under about 60 minutes.
- Unanswered Q&A is answered by the team offline and emailed to attendees; the presenters are also available on Discord for follow-up questions.
- Follow-up workshops announced: G.V() graph visualization in November; chatbots with persistent memory with two community open-source projects; GraphRAG text-to-SQL deep dive on QueryWeaver. Sign-ups for those come via Luma/LinkedIn invitations.
- Support requested: star the QueryWeaver repo ("hit the star button") — it helps reach more developers who will try the tool.
