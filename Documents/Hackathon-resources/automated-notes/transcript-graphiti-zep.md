# Graphiti & Zep — Knowledge Graphs for Agent Memory (Graph & RAG #6)

> **Source:** [`Transcript copy 15.txt`](../Transcript%20copy%2015.txt) · **Type:** webinar transcript · **Saved:** Oct 16, 2026 · **Original URL:** https://www.youtube.com/watch?v=F4hwuLlISP4

## Overview

- Sixth installment of FalkorDB's **Graph & RAG** workshop series; guest **Daniel Shal [surname as transcribed]** — founder of **Zep AI**, the company behind the open-source **Graphiti** framework.
- Daniel's thesis: agent memory is not just semantic similarity — RAG misses causality and temporality, which graphs (with temporal metadata on edges) can model explicitly.
- Graphiti builds **real-time dynamic knowledge graphs**: bi-temporal facts (when a fact was extracted vs. when it was valid), **invalidate-don't-delete** conflict handling, and retrieval that seeds subgraphs with embeddings + BM25 before traversing.
- Roy (co-founder and CTO, FalkorDB) primes the session with a knowledge-graph primer (entities, attributes, relationships, facts as triplets).
- Demo by Gal: a **La Liga** knowledge graph built with Graphiti + FalkorDB from Wikipedia standings (structured) and an ESPN article (unstructured), queried across seasons — e.g. Real Madrid's 84 (last season) and 95 points (previous season).
- Q&A covers large-volume ingestion, the no-vector-store design choice, ontology building, Graphiti scale, deduplication ("Barca" ≈ "Barcelona"), model sizing (GPT-4.1 Nano, Gemini 2.5 Flash Lite), many node types, and noisy entity extraction.

## Session intro

- Host: **Dan**. **Roy** — co-founder and CTO of FalkorDB ("an ultrafast, multi-tenant, open-source graph database"). Guest: **Daniel**, founder of Zep — "they have seen a meteoric rise thanks to their very unique and very clever approach to graph building".
- Format: talk → demo (by Gal) → Q&A; questions via the Q&A box or Discord; unanswered questions get compiled, answered, and sent to everyone (typically as a blog post).
- Dan pitches FalkorDB's role: context is king — and the graph is the backend that makes agent context work.

## Knowledge graphs: a quick primer (Roy)

- Knowledge graphs are **not new** — around for **at least a decade**; they were popular back when **Google** was building its huge knowledge graph, and they are **resurfacing due to GenAI**.
- Why they fit GenAI/RAG systems: flexibility (unlike relational databases, no hassle to set up new entity types), and they emphasize the **connections** between data points.
- At the very base: a knowledge graph is a set of **entities** and the **relationships** between them.
- **Entities** can be anything — a product, a customer, whatever models your domain. Entities are usually extended by **metadata**, thought of as **attributes**: e.g. a product with a name, a price, and the date it was introduced.
- **Relationships** connect entities: e.g. Gal **owns** an iPhone 16.
- Graphs shine in the flexibility to add more entities, more entity types, and to connect them meaningfully.
- Turning graph structure into meaning: **capturing facts**. You model facts about the world (or your domain) drawn from data such as websites or PDFs. Example: your dataset says **Gal bought an iPhone 16** — capture it as a **triplet**: **subject** (Gal) — **predicate** (owns) — **object** (iPhone 16). This pattern applies to many domains.

## Why RAG alone fails for agent memory (Daniel)

- Zep AI builds **context engineering infrastructure for AI agents**: agent memory, (dynamic) GraphRAG, and **context assembly** — assembling the right context at the right time so the agent can solve problems accurately.
- **Context engineering** is a fairly new term, popularized by **Toby Lütke (Shopify)** and other AI/tech luminaries — Zep had been doing context engineering for some time without a great name for it.
- Agent memory is one of the primary use cases for context engineering — and plain RAG has a problem: **memory isn't about just finding semantically similar content**.
- Stylized e-commerce example — **Robbie**:
  - A brand preference for **Adidas shoes** is learned from a chat message (top right of the slide).
  - But Robbie's Adidas shoes **fell apart** and he's super unhappy — so his brand preference **changed**.
  - When Robbie then asks the agent *"what sneakers should I buy?"* the most relevant semantic match is the old **Adidas** fact — so the agent responds incorrectly; it doesn't recognize that the preference changed.
- What RAG misses underneath the hood:
  - **Causality** — RAG doesn't understand that Robbie's shoes were damaged, which led to disappointment, which led to a preference change.
  - **Temporality** — which fact came first, and which came next. In a vector database, messages are embedded to vectors and added; the vectors carry **no temporal nature**, so a search cannot pull out which facts have causal relationships or which came first.
- How graphs fix it: build **explicit relationships between facts** — e.g. Robbie bought Puma shoes, he likes them, therefore he has a brand preference for Puma shoes. When you add **temporal metadata to the edges/relationships**, you can understand which relationships were formed first vs. later — modeling *structurally* how relationships change in time, which cannot be done with a vector database.
- Conclusion: graphs are an amazing data structure and well suited for **context engineering**.

## Graphiti: temporally aware and graph-relational

- **Graphiti** is Zep's open-source graph framework for building **real-time dynamic knowledge graphs**; it addresses exactly the problems above. Thanks to rapid growth over the last six months, Graphiti now has a burgeoning community — contributors include **FalkorDB** and many others.
- The "secret sauce", step by step:
  - When Graphiti extracts relationships between entities, it notes **when the relationship was extracted**, and also **when the relationship was valid at** — so relative dates (yesterday, tomorrow, last week) are resolvable, and the exact date a fact became valid is recorded.
  - When a fact changes — a **new fact conflicts with a prior fact** — Graphiti **expires or invalidates the prior fact**, noting when the relationship is no longer true.
  - Zep/Graphiti **actively looks for conflicts when ingesting new data**; on a conflict, the relationship is invalidated in the Graphiti database within FalkorDB.
  - **We don't delete the history** — the prior fact is marked **invalid**. This lets the agent reason with state changes: "used to love Adidas, but doesn't anymore because the shoes fell apart; now loves Puma — recommend Puma, not Adidas".
- The resulting graph stores the **`valid_at` / `invalid_at` temporal data on the edges within FalkorDB**, once conflicting facts have been de-conflicted. Combined with extraction-time metadata, this is Graphiti's **bi-temporal** model: *when a fact was valid* vs. *when the system learned it / when it expired*.

### Retrieval: embeddings + BM25 first, traversal second

- Graphiti does **not abandon embeddings**: it uses **semantic search and BM25 retrieval** to identify **subgraphs** that can then be traversed for a richer understanding of memory or other context.
- Crucially, retrieval does **not start with graph traversal** — so Graphiti gets **near-constant-time access to subgraphs within a much larger graph**, which makes it fast and accurate (in other GraphRAG setups, retrieval can be very slow).
- It still uses lexical techniques like BM25 [transcript garbles a follow-on phrase, "breakfast search" — unclear] alongside semantic search.
- Design decision: Graphiti deliberately does **not support Cypher heuristics** — Cypher is built dynamically at the Graphiti level (or by the client through Graphiti) so that highly optimized retrieval pipelines can be built. LLMs *can* generate Cypher, but it is **non-deterministic** and leads to many problems in production.
- Positioning — know where Graphiti is strong:
  - Graphiti solves **real-time, dynamic problems** — modeling data that changes over time. It is **not suitable** for Microsoft GraphRAG-style workloads.
  - If you have a **static corpus of documents**, use Microsoft GraphRAG for purely RAG use cases.
  - If you need something **agentic-first** that dynamically adds data to the graph at relatively low cost (**no recomputing large parts of the graph**), Graphiti is worth investigating.
- Zep published a **paper earlier this year** on how Graphiti works and its performance; slides include the link and will be distributed after the webinar.

## Zep: beyond agent memory

- Zep provides an **end-to-end context engineering platform** with **agent memory** and **dynamic GraphRAG** at its core.
- Supports ingestion not just from conversational data but also from **business data**, unified on a knowledge graph.
- Helps developers build highly relevant **context blocks** to drop into their prompts, so agents quickly and accurately solve problems.

## Live demo: La Liga knowledge graph with Graphiti + FalkorDB (Gal)

- Gal shares a **Google Colab** notebook (to be shared with attendees afterwards) building a knowledge graph from **structured and unstructured football data** — La Liga, the Spanish first division.
- The FalkorDB **graph visualization** runs on the right of the screen through the demo, showing how Graphiti represents the graph at each step, plus the **explainability** it provides.
- Goal of the demo: convert structured + unstructured data into the graph in an **automated way with Graphiti**, with real-time updates, and gain insights via Graphiti's smart retrieval.

### Setup

- Install dependencies (**Graphiti with FalkorDB**) and load the necessary libraries/imports.
- Model choice: **GPT-4.1** — but any model can be chosen.
- Set up **`group_id` = "La Liga"** for this use case. Group IDs define the graph you work with; you can build many group IDs — e.g. another for the **Premier League** (England's first division).
- Build helper functions to smooth the demo:
  - **`add_episode`** — uses the Graphiti client to add episodes to the graph, both structured and unstructured data.
  - Two fetch functions — one pulling data from **Wikipedia**, one from **ESPN**.
  - A **search-and-display** function — uses Graphiti's search method to retrieve documents and display them.
- Set up keys: the **OpenAI key** as an environment variable.
- Connect to **Falkor Cloud** with host, port, username, and password; construct the FalkorDB client. The graph starts empty, from scratch.

### Ingesting structured data: La Liga standings

- First ingest: the La Liga **standings** with **Real Madrid** and **Barcelona** from the **previous season**.
- Then ingest the **23/24** season table and the **24/25 (last) season** table — the graph **updates in place**: the two datasets connect onto the same entities.
- Graph structure visible from Graphiti + FalkorDB:
  - **Episodic entities** represent the data points inserted — each row in the table becomes an episode.
  - Clubs like Real Madrid and Barcelona are connected to their **position**, **points**, and **wins**.
  - Looking at first position: Barcelona and Real Madrid are connected to the position with relationships representing the facts of interest — e.g. **Barcelona has season position 1**, with the **time period** visible on the fact.

### Asking questions across seasons

- Question: **"What was Real Madrid's final points at the end of each season?"**
- Graphiti uses the **embeddings on the relationships** to retrieve the relevant relationships between entities; each retrieved fact comes with its time period.
- Answer: Real Madrid had **84 points last season** and **95 points the previous season**, and so on — the agent distinguishes seasons because the facts are time-scoped.

### Players table

- Gal also inserts the **top scorers of the league for the last season** to show complexity between different people and entity types.
- Players appear on the graph — **Robert Lewandowski, Raphinha, and Kylian Mbappé** [names normalized from garbled ASR] — and are used later in the demo.

### Unstructured data: ESPN article

- Gal adds an **ESPN news article** as raw, unprocessed data — fetched as-is and put straight into the Graphiti framework.
- The article connects **Marcus Rashford** (the player) to **Barcelona**, and contains many other entities — persons such as **Flick [unclear]** — that Graphiti adds to the graph.
- This demonstrates combining structured and unstructured data on one graph (with plenty of details extracted automatically).
- The demo was cut short by a technical difficulty (screen/session drop), and the session moved to Q&A, with Dan inviting Daniel to answer the questions directed at him.

## Q&A

### Data journalism: the Russian election interference analyzer

- Pre-answered question: has Zep investigated using Graphiti for **data journalism**?
- **A (Daniel):** In the run-up to last year's **US elections**, Zep built a **Russian election interference analyzer** using **US Department of Justice** and other open-source data, ingested entirely into Graphiti. It demonstrated a rich understanding of a very complex topic via a Q&A agent plus knowledge graph. The service is **no longer live**, but the Zep blog describes how it was built and how it worked.

### Creating knowledge graphs from large volumes of data

- **A (Daniel):** In Zep's implementation of Graphiti, large data sets are **chunked**. There is a link between the size of a data set and the **granularity of entities** extracted — reasonably sized chunks ingested into Graphiti yield higher granularity of entities.
- Graphiti can be expensive to operate — underneath it does a lot of work: **extraction, de-confliction, classification of entities into types**. It has a type system you can leverage to develop an ontology of sorts.
- Zep uses **high-performance but smaller language models** for many Graphiti activities; the cloud service consumes **several billion tokens per month** and is scaling rapidly.
- Be mindful of ingestion approach: ingestion is typically **serialized episode by episode**, so causal relationships are understood and the graph builds correctly. Graphiti has some **batch ingestion** capabilities, but part of the graph building happens **in series**, so very large data sets take time to ingest.

### Why doesn't Graphiti use a vector store?

- **Q (Discord):** Graphiti doesn't really use a vector store — why, and will it be an option in the future?
- **A (Daniel):** A vector store isn't needed — Graphiti uses **FalkorDB** (or whichever graph database is in use) to **store the vector embeddings** themselves.

### Schema/ontology: build it beforehand or let Graphiti do it?

- **A (Daniel):** You can use Graphiti to **automatically build an ontology**. If an ontology doesn't exist, Graphiti **deduplicates edges and node types**, and takes care that as the graph grows there is **no explosion of types**.
- You can also provide your own **node/entity types and edge types**, defining the relationships between the edges — this brings a lot of structure to the graph.
- Recommendation when starting out with Graphiti entity and edge types: **start generic**, then add more focused types as you get the hang of how Graphiti works.

### Scale of Graphiti

- **Q:** What is the known scale of Graphiti with respect to the size of the knowledge graph created?
- **A (Daniel):** Both graph construction and retrieval **operate on subgraphs**. Graphiti still uses **semantic and BM25 indexes** to find appropriate subgraphs during ingestion as well as retrieval.
- On ingestion, Graphiti does **not search the entire graph** to check for duplicate or conflicting facts, nor for a node similar to one just identified in incoming data — which allows it to work at scale with very large graphs. Internally, Zep has some extremely large graphs.
- On retrieval, there is **no significant increase in latency as the graph grows**.

### Best practice for ingesting documents and creating embeddings

- **Q:** What is the best practice to ingest documents and create embeddings? (The asker notes ingestion sometimes takes a lot of time.)
- **A (Gal):** It depends on the use case. If latency matters, divide into **chunks** and ingest via **concurrency** — but do it smartly: connections must not be broken by concurrency, so chunks should come from different documents and be ingested concurrently.

### Entity identity and deduplication ("Barca" vs. "Barcelona")

- **Q:** How do you identify a unique entity identity, and how do you dedupe colloquial terms — for example **"Barca"** for Barcelona?
- **A (Gal):** There are many ways to approach it. In Graphiti's way: extract similar entity names and **give the LLM the judgment** on whether they are the same entity, and dedupe new entities accordingly — so "Barca" gets connected to "Barcelona". The approach combines entity extraction with the LLM doing the judgment, working much like a human — and it works pretty well.

### How does LLM size affect performance? Can Graphiti use small models?

- **A (Gal):** LLM size has a lot of influence on quality of results. It also depends on how deep the agent work is: a flat agent with no deep-understanding needs can work with small models — e.g. GPT-4 mini [transcript "chip mini" — unclear] can do a great job with Graphiti. In Gal's experience, Graphiti can work very well with small models.
- **A (Daniel):** From an ingestion perspective, "small models" means **frontier-derived small models** — e.g. **GPT-4.1 Nano** for some Graphiti tasks, and **Gemini 2.5 Flash Lite** — **not** small quantized Llama models on your desktop.
  - Graphiti works best with **structured output**, so entities and other inference outputs land in the structure Graphiti expects.
  - Entity extraction and conflict management **do not perform well** without structured output or when models are too small.
  - Many people in the Graphiti repo try to get it working with highly quantized desktop models — unfortunately, it just doesn't work well.

### Many node types

- **Q:** What is the problem with handling many node types? (Reinterpreted by the room as: shortcomings when data needs large numbers of entity types or edge types.)
- **A (Roy):**
  - FalkorDB can handle a large quantity of labels/relationship types, but each adds **overhead**: internally, **each label or relationship type translates into a matrix**, and the total sum of those matrices adds up; it can also slow some database operations — usually, though, this is not the bottleneck.
  - The bigger issue: with a large number of entity and relationship types, you challenge the **LLM** to pick the right ones for an incoming question. The larger the set, the harder it is for the LLM to select just a handful of labels and relationship types.
  - Recommendation: be **concise** and narrow down the number of entity types and relationship types used to describe your data/domain.
- **A (Gal):** A strength of Graphiti is its very concise way of building the node graph: all entities are called **"entity"** with **attributes** that differentiate one entity from another — Gal and an iPhone have the same representation on the graph with different attributes. This means you can always add new entities without the explosion problem; the same stands for relationships. Graphiti closes the gap between the unstructured extraction and the ontology problem: unstructured extracted entities, however free-form, are constructed into the knowledge graph with relationships/facts between them — giving the complexity, insights between documents, **temporal reference between documents**, dynamics over time, and semantic search with the ability to scale the graph and the database.

### Massive amounts of random entities

- **Q (Jonathan, 4 upvotes):** How does it deal with massive amounts of random entities rather than football players? — reporting irrelevant things and entities that are not valid.
- **A (Daniel):** If using Zep, would love to hear more about the specific problem. Both Graphiti and Zep are constantly working to improve the quality of **entity extraction**, and would love to learn about these challenges.

## Key facts and numbers

- Series: **sixth installment** of the Graph & RAG workshops; events run **once a month at least** (usually Tuesdays/Wednesdays; occasional reruns for different time zones); next workshop in **September** — about **implementing agentic memory**; August off.
- Knowledge graphs: around **at least a decade**; popularized by **Google's** knowledge graph effort; revived by GenAI.
- Demo stack: **Graphiti + FalkorDB (Falkor Cloud)**; model **GPT-4.1**; `group_id` = **"La Liga"** (alternative example: Premier League); data from **Wikipedia** (La Liga standings, seasons **23/24** and **24/25**) and **ESPN** (Rashford → Barcelona article); top scorers **Lewandowski, Raphinha, Kylian Mbappé**.
- Query result: Real Madrid **84 points last season**, **95 points the previous season** (question: "What was Real Madrid's final points at the end of each season?").
- Graphiti temporal model: `valid_at` / `invalid_at` on edges; extracted-at time recorded; conflicting facts invalidated (**expired**), history never deleted.
- Retrieval stack: **embeddings (semantic search) + BM25** → identify subgraphs → traversal; **near-constant-time** subgraph access; retrieval latency doesn't grow significantly with graph size.
- Zep scale: **several billion tokens per month** consumed by the cloud service; internally some extremely large graphs; ingestion serialized episode by episode (some batch capability).
- Model sizing: **GPT-4.1 Nano**, **Gemini 2.5 Flash Lite** — frontier-derived small models with structured output; NOT quantized desktop Llama models.
- FalkorDB internals with many types: each **label/relationship type = a matrix**; overhead adds up, usually not the bottleneck.
- Data-journalism showcase: **Russian election interference analyzer**, built before last year's **US elections** from **US DOJ** + open-source data, ingested into Graphiti; service no longer live; write-up on the Zep blog.
- Graphiti paper: published **earlier this year** on how Graphiti works and its performance (link in the slides).
- Zep positioning: end-to-end context engineering platform — agent memory + dynamic GraphRAG; ingest conversational + business data; unify on a knowledge graph; output context blocks for prompts.
- Graphiti growth: enormous within the last **six months**; community contributors include **FalkorDB**.

## Hackathon relevance

- **Agent memory track:** adopt the bi-temporal edge model from day one — `valid_at`/`invalid_at` plus extraction time, invalidate instead of delete — so state changes (preferences, standings, facts) are handled and explainable.
- **Retrieval blueprint:** semantic + BM25 first to find subgraphs, traversal second — this keeps latency flat as the graph grows, which matters for a live hackathon demo.
- **Isolation via group IDs:** the `group_id` = "La Liga" pattern is a clean per-user/per-project scoping story on FalkorDB's multi-tenant graphs.
- **Model sizing for a hackathon build:** structured output + frontier-derived small models (GPT-4.1 Nano, Gemini 2.5 Flash Lite) keep Graphiti ingestion affordable; avoid quantized desktop models.
- **Ingestion budgeting:** Graphiti ingestion is serialized per episode — chunk data reasonably (better entity granularity) and plan build time before the demo.
- **Ontology tip:** start with generic entity/edge types when time is short; provide custom types later. Use LLM deduplication for alias entities like "Barca"/"Barcelona".

## Related notes

- [transcript-agentic-memory-queryweaver.md](transcript-agentic-memory-queryweaver.md) — the sibling workshop whose QueryWeaver agent uses Graphiti for its conversation memory.
- [transcript-text-to-sql-cypher.md](transcript-text-to-sql-cypher.md) — related session on letting LLMs query graphs/SQL.
- [../../guide/10-agent-memory.md](../../guide/10-agent-memory.md) — guide module on agent memory that this session expands on.

## Logistics

- Workshops run once a month at least; normally Tuesdays and Wednesdays; sometimes reruns for different time zones; next one in September about implementing agentic memory (August off).
- All unanswered questions are collected, answered offline, and compiled into a **blog post** sent to attendees — Dan exports the Zoom questions into a table for Daniel to answer; answers published **unedited** on FalkorDB's blog, with portions likely also on Zep's blog.
- Slides will be distributed after the webinar; follow-up questions can be handled offline.
- Attendees asked to **star the Graphiti repo** — "they're doing amazing work"; a QR code on screen pointed to the next workshop.
