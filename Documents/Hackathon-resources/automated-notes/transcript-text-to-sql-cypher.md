# Natural Language to SQL/Cypher — FalkorDB Workshop Ft. Graphiti (Zep) and Ponder Labs

> **Source:** [`Transcript copy 13.txt`](../Transcript%20copy%2013.txt) · **Type:** webinar transcript · **Saved:** Oct 16, 2026 · **Original URL:** https://www.youtube.com/watch?v=ic2vzvHKQEw

## Overview

- FalkorDB workshop on converting **natural language into SQL and Cypher using LLMs**, with three approaches/implementations: FalkorDB's own **QueryWeaver** text-to-SQL, **Ponder Labs'** dbt knowledge graph, and **Zep's Graphiti** as a temporal agent-memory tool.
- Agenda as stated: text to SQL, text to Cypher, dbt, and agent memory — with an open Q&A at the end (questions were shown on screen and read aloud for listeners).
- Speakers: **Dan** (FalkorDB, host), **Gal** (AI engineer, FalkorDB — two demos), **Egor** (data and AI engineer, Ponder Labs), **Preston** (software engineer, Zep; one of the creators of Graphiti, the open-source temporal knowledge graph library for AI agent context engineering). Names are normalized from ASR.
- **Ponder Labs**: tagline "smarter tools, stronger schools" — data- and AI-powered analytics for education organizations, helping turn complex information into actionable insights for students; regularly contributes to open source (dbt, Airflow, FalkorDB) and provides a data warehouse for education (ASR: "DWE" [unclear]).
- Core framing: the shared pain point is **getting the LLM to understand what you mean** so it can produce a query — most people want to "speak with your data", and writing the query itself is secondary. Text-to-SQL exists, but "what works in a demo hardly ever works in a production environment": hundreds if not thousands of tables, and vector approaches don't capture the relationships between schemas — that's where POCs fail.
- Session was roughly 50 minutes (host: "the fastest we've gone through 50 minutes"), followed by Q&A; the workshop closed with a Black Friday promo (see Logistics).

## The core problem (Dan's framing)

- The issue most people face at its core: **how to get the LLM to understand what we mean** so it can adequately produce a query for us.
- Most attendees are trying to build a system that enables them to **speak with their data**; writing the actual queries is secondary to that objective.
- Real-world angle: how can you really write a query for a database you're not familiar with — say, if you're just starting out in a new job?
- Text-to-SQL is new-ish, but the enterprise reality is **hundreds, if not thousands, of tables**.
- The failure mode: vector approaches don't capture the **relationships between schemas**. Retrieval solutions are typically asked to retrieve tables, but the semantic element / capturing relationships isn't what they were designed for — that's where POCs tend to fail.

## FalkorDB: text-to-SQL with QueryWeaver (Gal)

### The 4,000-table ERP proof of concept

- Real-life example FalkorDB faced: a POC with **large ERP data over 4,000 tables**; each table can contain **more than 100 columns** — together they **can't fit into the context window**.
- The naive vector approach achieved **very low accuracy — around 15%** — because when you search for relevant tables in the schema, there is **similarity between tables** and you can't insert the **relationships between tables** (in this example, a business relationship between tables).
- The insight: in a relational database you have schema, tables, foreign keys, and columns — an LLM can understand a schema and convert it into a query. The problem is **scale**: a large schema is hard to insert into context, and hard to search for relevant tables together with their connections; some tables are not semantically connected to your table but are still needed.

### The graph approach: schema as a semantic graph

- QueryWeaver takes the **schema of the relational database and represents it in a graph**:
  - A **semantic layer**: each column in each table is embedded **with a description**.
  - A **structural representation** with **multi-hop reasoning** between tables.
  - Each database can be represented in a **different graph with multi-tenancy**.
- This is what enables text-to-SQL over **very large schemas — over 4,000 tables**.
- Graph model (shown in FalkorDB Browser visualization):
  - **Nodes:** tables and columns.
  - **Column properties:** type, key type (e.g., primary key), description, embedding.
  - **Relationships:** a table **has** columns; columns **reference** other columns — everything in the relational database is connected in the graph.
- Traversal example: a `tasks` table and a `leads` table are connected via a primary key called `user_id` that belongs to the `users` table. If the user's question references tasks and leads and a join is needed, the `users` table must be extracted — QueryWeaver does a **variable-length traversal** and extracts **every entity in between**. That creates joins with tables that are not necessarily semantically connected to the user question but are relevant to writing syntactically correct SQL.
- In addition, it extracts **semantic relationships** and **spurs [unclear]** — the assumption being that for every table similar to the user question's descriptions, the **first-hop connection** between them can help the LLM construct the SQL.

### The pipeline: question → descriptions → graph → SQL → memory

- **Step 1 — Decompose the question:** use the LLM, with a relevant prompt, to break the natural-language question into different parts tied to different tables; the LLM aligns the question with the database and creates **table descriptions and column descriptions** that get matched to the descriptions created during graph ingestion. This closes the gap between the description you search with and the description of your database — **overcoming the semantic gap**. The output is embeddings of table/column descriptions relevant to the question, which surface the tables needed.
- **Step 2 — Retrieve from the FalkorDB graph** (see traversal example above).
- **Step 3 — Construct the SQL:** bring the extracted tables and their relationships as structure into the LLM (a GraphRAG-style approach); explain the syntax of the target database (MySQL, Postgres, whichever it is) and ask it to build the SQL. The LLM is also asked to **explain / reason through the query creation, validate it afterward**, and **retry** if needed.
- **Step 4 — Memory:** **Graphiti is used as long-term memory and personalization** — to understand the user's environment. The memory is customized with Graphiti to add **task performance tracking**: each query is saved in the graph with whether it succeeded, and the system learns over time to **avoid similar errors**. In the multi-tenant environment this memory is kept in a **separate graph**.

### Text-to-Cypher

- Very similar approach to text-to-SQL, but first it does **ontology detection**: understand the ontology of the graph (Cypher is the language of graphs), then convert to Cypher using the ontology and prompts; retrieval goes to the LLM and a natural-language answer comes back.

### Demos

- **Text-to-Cypher** (screen-captured video, played because of time):
  - Shown in the FalkorDB Browser visualization: ask a question in the chat, the system understands the ontology and creates Cypher; run the Cypher and see the examples.
  - Example question: which columns connect two tables (e.g., the tasks table and the users table) — it answered with the column to use.
  - Takeaway: you don't need to understand Cypher — you ask, get the Cypher, and can use it as a starting point to traverse the graph and understand your data better.
- **QueryWeaver text-to-SQL** (live; freshly deployed during the session, so loading took a few moments):
  - It runs a **demo CRM** that anyone can ask questions of — the demo is out for everyone and viewers were encouraged to try it.
  - Watched behavior: the question is analyzed, broken into descriptions, the SQL is created, then the database is queried and the answer generated in a user-friendly form. The generated SQL contained **several joins** — understanding the relationships is what lets it extract the data — and the output comes back as tables plus a **natural-language answer**. You can continue asking follow-up questions.

## Ponder Labs: dbt as a knowledge graph (Egor)

### What dbt is and why it's powerful

- dbt has become the **backbone of modern analytics engineering**: it lets data teams transform raw data into clean, reliable datasets with **pure SQL and version-control best practices**, so the dbt ecosystem keeps growing in scale and complexity.
- Key strengths covered:
  - **Lineage tracking:** each piece of your transformation logic is a different **model** — a DAG that looks for and prevents circular dependencies; you can trace from each source table through to your data marts. Before, people wrote SQL and created tables manually with scripts, which caused many problems.
  - **Testing:** built-in; write tests and make them **generic** across different tables, sources, seeds, and snapshots. Data quality is crucial, not a game.
  - **Modularity / DRY (don't repeat yourself):** with **Jinja** and other templating, write logic once and reuse it across tables — e.g., instead of writing 5,000 union alls for different teams, use macros and templates.
  - **Documentation:** a rich UI generated automatically from SQL — see models, tests, seeds, basically all parts of the data infrastructure, plus the script and compiled script. Lineage is the crucial part of working with data.

### Where dbt docs hits the wall

- dbt docs gives a beautiful, rich lineage graph — but it **cannot answer complicated questions** from clients and partners, especially with big dbt ecosystems.
- Scale context: the demo project is relatively small at **about 40 tables**; some companies have **a couple of thousand**; imagine a really complicated project with **3,000 different models and seeds**.
- **Blast radius analysis** example question: "What's the complete blast radius if I need to rebuild the `STG_STUDENTS` table — show me all those [downstream, unclear] models that would be affected, including their **materialization type**?"
  - The lineage view can partially answer (source + downstream dependencies), but not materialization type: some models are views, some are tables, some are incremental tables, and there are many more options.
- Two possible solutions, both bad:
  - Click through dbt docs nodes — **hours, in some cases days** — checking whether each is a view or a table and going back.
  - Build a **Python parser** over dbt's **two metadata files** (manifest and catalog) — takes time even with AI, and you must **rebuild the parser for each new question**; much more effort.

### The realization: dbt is inherently a graph

- Nodes: **models, sources, seeds, tables, views, snapshots**. Edges: **dependencies between models**. Attributes: **materialization type, when it was built, owner, the script**, and many more.
- So Ponder decided to load that whole graph with all its metadata into a **graph database**.

### Why FalkorDB

- A couple of minutes into searching, they found FalkorDB — it excelled on all the parameters they were looking for:
  - **Truly open source.**
  - **Amazing performance.**
  - **Redis ecosystem** — great because the vast majority of people are familiar with it.
  - **Modern architecture** and **super suitable for AI**.
  - **Amazing support** — support proactively connected with Egor about a couple of Cypher questions (one of those moments "when support connected me, and not me connecting support").

### The parser and the Ponder Chat agent

- Ponder created a **parser for the dbt manifest and catalog files** to load the metadata into FalkorDB (demo showed the FalkorDB UI — limited to 100 rows — with the lineage re-created, with changed node names and edge types).
- With the data in FalkorDB you get **Cypher** to extract data and answer questions **programmatically**, instead of drag-and-dropping in dbt docs.
- Even English→Cypher translation is "fairly fast", but it remains problematic: not everyone knows Cypher, and even running Cypher queries takes time to understand the nodes and edge types. That's why they built **Ponder Chat** — a **Streamlit** app integrating **LangChain** so you can talk to the graph database in **plain English**.
- The agent has two parts: it **creates the Cypher query**, then **goes to FalkorDB and executes it**. A prompt explains the different edges and nodes, the business value of the edge types, and naming ("what is called what" in FalkorDB).
- Watchable behavior: the agent plays a "ping-pong" with the FalkorDB engine — it asks something, receives nothing, tries again, rechecks itself; the full chain is visible in the UI.

### Demo questions and results

- **Blast radius (the question from earlier):** Egor had already run it ~20 minutes before, showing the same UI. The agent started running a couple of Cypher queries, received the necessary information/metadata, and returned the **whole blast radius for `STG_STUDENTS`** — level one, level two, etc. — plus the materialization types they cared about (table and views) and a summary. That run took **36 seconds**; the live demo took **1 minute and a half**.
- **Dependency complexity:** "Which models create the **longest dependency chains** in our project, and what's the **maximum depth** of any single lineage path from source to final marts?" (stated as a further example; the host steered onward for time).
- **Job orchestration:** imagine orchestrating dbt with **Airflow** or any other orchestration tool, and wanting to **split the models into different jobs**, keep looking for dependencies, and make sure there are no circular dependencies between pipelines. If running all in parallel is impossible, you want to know which pipeline to run first and what depends on what. (The model count was stated once as **20,000 models** and later as **2,000–3,000 models [unclear]**.)
  - After a few dozen Cypher queries, the agent concluded they need to build **five parallel pipelines** — not all parallel: **job 1 must run first** (probably preparation data), **jobs 2, 3, and 4 can run in parallel**, and **job 5 depends on all of them and has to run last**. All the models are listed per job, and the **execution strategy** is visible.
  - Takeaway: this is really hard to do manually — there are too many possible options and pipelines.
- Wrap-up: what started as **static metadata** became a **living, trustful, conversational knowledge graph**. FalkorDB made it possible by giving a **fast, flexible graph engine that exposes the true shape of the dbt project**. All the code is open source on **Ponder's GitHub**; also reachable via the **Ponder site, the Substack newsletter** (the blog post is there), and **LinkedIn**.

## Zep: Graphiti as temporal agent memory (Preston)

### Motivation

- Agent memory sits in the broader **context engineering** space — an evolution of RAG, or part of RAG depending on definitions.
- Traditional RAG was built around a **corpus of knowledge that changes infrequently or not at all**: static documents, ingested in a pipeline, then knowledge is found by searching that database.
- As agentic workflows became popular (an agent as an aid/tool in day-to-day work), things became **iterative**: you're not just searching a static knowledge base — you're **providing knowledge and feedback**, and agents need a way to **grow and understand from that**.
- Graphiti is built from the ground up, optimized for **adding new knowledge while not destroying old knowledge**.
- Traditional approaches are **batch-oriented** — building summaries or naive memory (summarizing a few old conversations) that **don't update**; Graphiti is deliberately not that.
- In other RAG systems, an update is a **replace** (Wikipedia page updated → discard the old page, "this is now the source of truth"). But the **breadcrumb trail** — the mistakes you made, the things that were wrong, the information that is changing — is also important. "Just because my favorite food has changed doesn't mean that my favorite food in the past is no longer relevant information."
- Graphiti is therefore a **temporally aware knowledge graph framework designed for AI agents in dynamic environments**, with **real-time updates**.

### Bi-temporality

- Bitemporal tracking separates **two timelines**:
  - **System timeline** — when the system found out the information.
  - **World timeline** — when the information actually happened.
- Example: "I told you what my favorite food is, but later if I tell you what my favorite food was when I was five — that may no longer be relevant to today even though you told me it later." Keeping the two timelines separate is very important for reasoning over the information.
- In data: **`valid_at` / `invalid_at`** store the world timeline (when things are actually true / stop being true in the real world), while **`created_at` / `expired_at`** are the system timeline (when information was actually expressed to the agent).
- **Edge invalidation** is automatic: if you say "I used to love pizza" and later "I don't love pizza anymore", the agent finds facts **contradicted** by the newly extracted information and sets their **`expired_at` and `invalid_at`** dates.

### Graph model and extraction

- Core architecture is nodes and edges; the high-level API abstracts the graph away ("add this episode", "get information relative to this query") and does the graph work under the hood.
- **Episodes** are the API entry point — JSON data structures, messages, or text data. Every episode is **also stored in the graph** as a **full log trail** of everything added — useful to fetch exact explicit pieces of information or to **rebuild the graph** if necessary.
- **Nodes (entities) and facts are automatically extracted by an LLM.** Example: "**Kendra loves Adidas shoes**" → Kendra is a node (person), with relationship "loves" to Adidas shoes, another node (label: product).
- **Temporal extraction** uses the timestamp of the messages: you don't have to spell out "I like Adidas shoes from state X to state Y" — it looks at the current timestamp, or at a timestamp you provide for when the message was said, and does temporal extraction/reasoning around that.
- Edges have **fact embeddings**; there's **hyper-edge support**, so an idea and triplet facts can attach through multiple nodes and edges — a really integrated graph.
- **Custom entities** are supported to skew the knowledge graph toward your domain.

### Retrieval and FalkorDB

- **Three-pronged search strategy** for getting information out of the graph:
  - **Semantic search** (vector-embedding based).
  - **BM25** full-text (keyword) search.
  - **Graph traversal / graph algorithms**, including **community detection** and **BFS**; **PageRank is future work**.
- All methods feed into **rerankers** that figure out which pieces are most relevant to the current query.
- FalkorDB fits because it **supports all these algorithms, and they're super fast** — one of the reasons FalkorDB is the **default graph provider for Zep's MCP server**.
- Graphiti is **available through an MCP server**: install it, hook it to your agent, and it works out of the box with FalkorDB (which has an in-process database [unclear]).
- The presentation itself was built with an LLM to be interactive ("make a presentation that you can go back and forth") — the slides were promised to be shared afterwards, along with docs.
- The host cut the talk slightly short to leave ~10 minutes for Q&A.

## Q&A

### Q1: Does what you built work for complex schemas around 50 tables with many relations?

- Gal: yes — the main idea behind QueryWeaver's text-to-SQL is **many relations between a very large amount of tables** (larger than 50), but 50 tables with many relations is **suitable to be represented by the graph**, and the extraction is where they are now.
- Dan: in real-life scenarios you don't normally encounter such a small number of tables — that size is normally reserved for a POC. Short answer: yes.

### Q2: Is this recorded / where is it posted?

- Dan: yes, definitely recorded — on **YouTube tomorrow**, and on **Discord** and all the rest of the socials.

### Q3 (Alexander): What about business logic rules that can't be extracted from the database schema?

- The question: e.g., "if column 1 equals value 1, then column 2 can only be value 2" — such rules can't be extracted from database schemas; **where is the place for these rules?**
- Gal: this is what they did in the POC he described. You can add **layers into the graph** — a layer of **business rules** connected to the relevant tables, relevant columns, and connections between tables, and use them when extracting tables.
- Example from the POC: it was necessary to extract similar tables that are connected under **folders** — e.g., different kinds of sales under the same folder in the customer hierarchy. They added this layer to the graph, so when one table from the folder is extracted, **all the tables are extracted** and the LLM gets the relevant instructions to perform the query.
- Answer: yes — save the rules into the graph as **business connections / business rules as a layer**; different layers can be added for different kinds of logic.

### Q4 (Adam): Is using QueryWeaver's MCP with Claude Code (or similar AI dev tools) the fastest way to test QueryWeaver locally on my database and evaluate the answers?

- Gal: **yes**. The fastest way is to use QueryWeaver (queryweaver.ai [unclear]) — it's on the cloud; you can try it and connect your own database. For now it supports **Postgres or MySQL**.
- You can also use the **MCP server** — it's **open source** in their GitHub repo; run the MCP server locally. If you have a database other than Postgres or MySQL, you're welcome to **contribute** and add it; more databases are being worked on.

### Q5 (Assaf): What's the difference between training my own LLM (e.g., Sonnet or GPT) to answer questions via SQL and FalkorDB doing the same thing?

- Gal: training a large language model is **very expensive and takes time** — you need the resources. And when you finish, it's only relevant to a certain time/point — the data it has reached is **static**.
- Using SQL with FalkorDB is **more dynamic**: you use the LLM's ability to understand natural language against a database that **can change over time**. At a **lower price** you can achieve similar things with more dynamics and **reduced costs**.

### Q6: Do you have to supply schema, table, and field descriptions in advance for the model to understand which fields to select?

- Gal: **yes** — but QueryWeaver has the ability to **investigate the schema** from the relational database and **extract the description**; if there is none, it **builds a description on the fly**.
- Each table also comes with **ontology** that gives the LLM the ability to understand **enums** and which type of data it needs to create and filter when it creates the SQL.
- They also **retrieve samples** from the database and give the LLM explanations of how to do the query.

### Closing remarks

- The host will append links shared by the speakers to the post-event recap; questions are pulled together into a summary, and examples of how everything was built will be sent to attendees afterward.

## Key facts and numbers

- **QueryWeaver / text-to-SQL POC:** large ERP dataset with **4,000+ tables**; **100+ columns** per table; naive vector retrieval accuracy **~15%**; the graph approach targets schemas **over 4,000 tables**.
- **Supported databases today (per Q&A):** **Postgres** and **MySQL**; more DBs being worked on; other DBs accepted via contribution; MCP server is open source.
- **dbt scale examples:** demo project **~40 tables**; real companies with **a couple of thousand**; hypothetical project **3,000 models and seeds**; macro example of replacing **5,000 union alls**; dbt metadata lives in **two files** (manifest and catalog).
- **Demo timings:** blast-radius answer pre-run **36 seconds**; live demo **1 min 30 s**; the pre-run happened **~20 minutes** earlier; the orchestration question took **a few dozen Cypher queries**.
- **Orchestration result:** **five pipelines** — job 1 first, jobs 2–4 parallel, job 5 last (depends on all).
- **Graphiti:** **bitemporal** (`valid_at`/`invalid_at` world timeline; `created_at`/`expired_at` system timeline); **three-pronged retrieval** (semantic vectors + BM25 + graph traversal/algorithms with community detection and BFS; PageRank planned); rerankers; MCP server; **default graph provider for Zep's MCP server is FalkorDB**.
- **Speakers/products named:** Dan (host), Gal (FalkorDB AI engineer), Egor (Ponder Labs data & AI engineer), Preston (Zep software engineer, Graphiti creator); QueryWeaver, Graphiti, FalkorDB Browser, Ponder Chat (Streamlit), dbt + dbt docs, Airflow, LangChain, Jinja, Claude Code (Q&A), MySQL, Postgres.
- **Session stats:** ~**50 minutes** runtime ("fastest 50 minutes"); this was the **9th workshop in the last 7 months**; the next workshop is the **last of 2025** (year recap, mistakes, projects, predictions for 2026).
- **Promo (see Logistics):** two free months on the Startup tier for eligible FalkorDB Cloud users through **September 5**.

## Hackathon relevance

- **Connected data track:** QueryWeaver's recipe is directly copyable — model the schema as a graph (table/column nodes, HAS/REFERENCES edges, descriptions + embeddings per column), retrieve with multi-hop traversal (including "glue" tables like `users` for joins), then let the LLM write/validate/retry the SQL. The 4,000-table / ~15%-accuracy numbers justify "graph over vector" in a pitch.
- **Business-rule layers:** storing business rules as extra graph layers (e.g., folder-based table grouping) is an easy differentiator for a schema-aware assistant and a concrete Cypher modeling exercise.
- **Company brain track:** the dbt knowledge graph (models/sources/seeds/snapshots as nodes, dependencies as edges, materialization/owner/script as attributes) answers blast-radius, dependency-depth, and job-orchestration questions — a ready-made "ask your data infrastructure in plain English" demo, and easy to reproduce on any public dbt project's manifest/catalog.
- **Agent memory and coordination track:** Graphiti's episode ingestion + automatic LLM entity/fact extraction, edge invalidation, and bitemporal timestamps are the reference design for temporal memory; the graph provides community detection/BFS/BM25/vector search plus rerankers to ground agent context.
- **Fast integration paths:** QueryWeaver cloud + MCP (Postgres/MySQL), and Graphiti via its MCP server with FalkorDB as the default graph provider — both avoid building the memory/schema layer from scratch during a short hackathon.

## Related notes

- [transcript-agentic-memory-queryweaver.md](transcript-agentic-memory-queryweaver.md) — the dedicated QueryWeaver session, for a deeper dive on the same text-to-SQL product demoed here.
- [transcript-graphiti-zep.md](transcript-graphiti-zep.md) — the Graphiti/Zep session covering the same temporal agent-memory system with more demo detail.
- [docs-cypher-reference.md](docs-cypher-reference.md) — Cypher syntax reference for the graph traversals (variable-length paths, joins via intermediate nodes) used in the text-to-Cypher and dbt demos.
- [../../guide/10-agent-memory.md](../../guide/10-agent-memory.md) — course module on agent memory that matches Graphiti's episode/bitemporal design.
- [../../guide/04-cypher-basics.md](../../guide/04-cypher-basics.md) — Cypher basics to build the schema-graph and dbt-lineage queries demonstrated here.

## Logistics

- Session recorded; published on **YouTube the next day**, plus Discord and the socials; LinkedIn profiles of the presenters were shown for networking, and viewers were encouraged to star the repo so it reaches more developers [ASR: "start a repo"].
- **Black Friday gift (not advertised anywhere, shared only with attendees):** through **September 5**, anyone with an up-and-running FalkorDB Cloud instance who has spoken with (or is planning to speak with) the product team qualifies for **two free months on the Startup tier** — go to the Get a Demo page, note your instance, and write **"Black Friday"**; the team will get in touch.
- This was the **9th such workshop in the last 7 months**; the next one is the **last for 2025**, recapping the year in GraphRAG/graphs, the mistakes made, projects worked on, and predictions for 2026. The presenters were invited to return next quarter and present more of what they built.
