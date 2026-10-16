# CocoIndex — the incremental engine for agent context (FalkorDB + CocoIndex)

> **Source:** [`Transcript.txt`](../Transcript.txt) · **Type:** webinar transcript · **Saved:** Oct 16, 2026 · **Original URL:** https://www.youtube.com/watch?v=r1eRG8JPMJM

## Overview

- Interview-style session ("more of like a podcast today — less of a workshop") between **FalkorDB** and **CocoIndex** about **context for AI agents** and how the two open-source projects coexist toward that goal.
- **Who's on the call**: Dan (FalkorDB host), **Gal** (AI engineer at FalkorDB who built the **connector between FalkorDB and CocoIndex**), **LJ** (co-founder and CEO of CocoIndex), and CocoIndex co-founder **George** (joined mid-session and ran the live demo).
- CocoIndex's pitch: **"we are building the incremental engine for context for AI"** — continuously turn code bases, meeting notes, inbox, videos, and more into **fresh context** for agents, **with no batch jobs**.
- Mental model: like **React for data** — you **declare state transitions**; CocoIndex **renders** them into targets. Core principle: **"the target is a function of source"** — when a source or a function changes, only what's affected gets updated.
- **Gal's demo**: two CocoIndex pipelines over CocoIndex's own documentation produce **two different knowledge graphs in FalkorDB** (docs graph with **162 entities** + API call graph), updating only changed MD files; visualized in the FalkorDB Browser.
- **LJ's walkthrough**: a **three-phase meeting-notes → knowledge graph pipeline** — memoized file processing → built-in **entity resolution** → declared people/meetings/tasks relationships — in **~400 lines of code**, "ready to go production". **George runs it live**: full build, then a **~5-second incremental update** after one edit.
- Q&A covers vector DB targets, **billions of nodes** scale, provenance/lineage, **LMDB vs Postgres** state management (open-source v1 = embedded LMDB), doc vs page granularity, BM25/HNSW, access control, partial-document updates (**memoization + side-effect tracking**), and LLM vs deterministic entity resolution.

## CocoIndex's place in the stack

- FalkorDB provides the **graph database infrastructure**; CocoIndex focuses on the **knowledge-graph-building side**, with FalkorDB as its **downstream partner** — "we're very happy to build with all of our partners in the ecosystem".
- LJ's background: **9 years at Google** — built **indexing systems for academic papers, patents, and case laws** (core indexing, clustering), then **data infrastructure for healthcare intelligence** for years.
- Her co-founder: **founding member of Google's state-of-the-art indexing infrastructure that powers all of Google**, a "super coder"; they **co-led Google's data infrastructure for healthcare intelligence together** before starting CocoIndex.
- Session context: this workshop matters if your job to be done is **"keeping whatever you're building with an LLM always with fresh context"** and access to fresh content.
- Recording + all code examples: shared in the **FalkorDB/webinars GitHub repo** [transcript audio says "FaunaDB/webinars"].

## What CocoIndex is

- Each agent needs great, **fresh** context to reason well, and "everything is moving so fast these days" — your code base, your meeting notes, [unclear in transcript] — "everything is 50 times faster" with agents helping create it.
- CocoIndex **continuously builds and updates the context / knowledge context graph** around all of it, so agents connected to FalkorDB (and other systems) get fresh context — **without batch jobs**.
- Example use cases named:
  - **CocoIndex code** — continuously index from the code base and build context around it: **real-time code index**, a **RAG index**.
  - Process **Hacker News** trending topics and build context around them.
  - **Conversations / meeting notes → knowledge graph** (today's walkthrough): continuously convert them to a knowledge graph.
  - **Multiple-repo code bases** — continuously generate insights and summarizations.
  - **Podcasts** — continuously learn from them and provide insights to your agents via a knowledge graph.

### The mental model: React for data

- Analogy — **server-side rendering**: a human clicks a button and waits for the web page to refresh; "this is how an agent is interacting with data today — you do something, you wait for it to refresh; otherwise you make a **stale decision**."
- Then came **jQuery**: incrementally update a component on the UI based on interactions — but with so many states changing, everybody "ends up with this jQuery hell", big code bases, "nobody knows what's going on".
- Then **React** won: the essence is **the state drives the world** — the state drives the website rendering, and all your application logic / business logic is just **managing the state**.
- CocoIndex is "similar to React" for agent data: agents interact with data a lot faster and also **need fresh data**. You use CocoIndex to **declare your state transition** — all core business logic stays about declaring the state — and CocoIndex **renders it**, in this case **to FalkorDB**: the declared state renders to the graph database / knowledge graph **incrementally**, so every interaction across a distributed data system quickly surfaces to the end agent.

### "The target is a function of source"

- Whenever a **source changes — or the function changes** — CocoIndex has a way to figure out **what needs updating**, similar in spirit to the virtual DOM (different implementation, an internal engine), and update **only that**.
- The hard graph-specific case: graph data is **clustered with other nodes** (entities clustered with entities) — how do you update the graph database efficiently? And when you **remove something**, how do you take it out of a cluster **without recomputing everything from scratch** — while keeping state-of-the-art information fast for the agent.

### Sources, engine, targets, control plane

- **Sources**: code base, meeting notes, web, file system, database, message queues, **videos, voice**.
- **Engine**: CocoIndex is **not a data-frame** system — building knowledge graphs involves **cross-row relationships** (extract a few pieces of information, do **entity resolution across things**, cluster nodes, build relationships). It is **native Python** transformation "without a lot of DSLs", making such relationship-heavy pipelines easy to build.
- **Targets**: **vector database, graph database, relational database**, and other ecosystem partners.
- **Core**: a **persistent data pipeline** — the **control plane** — handling **caching, pipeline catalog, version tracking, continuous updates, and lineage**: everything needed to take heavy data-pipeline lifting into production.

## FalkorDB + CocoIndex connector demo (Gal)

- Gal built a demo with **CocoIndex + FalkorDB** starting from CocoIndex's own **documentation (MD files)**, using **two pipelines**:
  - **Pipeline 1**: extract **entities from the documentation** — CocoIndex entities, exceptions, and other important things — plus the **connections between them**.
  - **Pipeline 2**: extract **only APIs** and explain the **connections between APIs**: which models call which functions.
- The code **declares the structure**: he tells CocoIndex which **properties** and which **structure** he wants at the end in the knowledge graph **stored with FalkorDB** — "pretty easy" code, shared later.
- Both pipelines read the **same MD folder**. When MD files / the documentation change and the flow re-runs, CocoIndex **understands which MD file changed and only processes the changes** — the **incremental feature**.
- Built graph: the documentation, **162 entities**, relationships, and connections between the documentation and the entities.
- Because **two different pipelines do different things on the same source and the same targets**, he gets **two different graphs in FalkorDB with two applications** at the end.
- App 1 (docs graph, "Index help"): asked **"What does CocoIndex and FalkorDB integration support?"** — the app goes to the knowledge graph, extracts entities, and answers with what the integration supports (e.g., storing features about the integration). Then he **updated the docs** (added "advanced topics"), ran CocoIndex → **only the changed documents were updated**, and re-asking the same question shows **more features** — the graph changed incrementally, only with relevant nodes.
- App 2 (APIs graph): runs **Cypher queries** built earlier — **each API's calls per module** — showing a table; can also search **shared API calls between models**. After adding a new MD file and re-running, CocoIndex finds which doc updated, adds the APIs, and Cypher queries now show the **new file** [transcript: "the file could be basics" — unclear] and shared API calls.
- Visualization happens in the **FalkorDB Browser**: search the documentation and all API calls in the graph; the same can be done on the first graph to find updated documents and which entities are new. **Deletions work too** — remove an entity and the knowledge graph updates accordingly.
- The graph can be **connected to an agent** to bring knowledge to the agent.
- Gal's takeaways: he can **manage documents "in a second"** — no need to know which file or which part of a file was updated; if he changes part of his flow, everything is automatic and efficient; and **building more graphs from the same code and the same documents** is very powerful.
- LJ's reaction: a great **end-to-end demo** — "from ingestion to CocoIndex to Falkor and what does it look like to build and how does it improve the agent with the real context, then do some deletion and update and see the **live graph updated for the agent**".

## Meeting notes → knowledge graph demo (LJ + George)

### Why meeting notes, and the graph model

- Corporate context: there are **so many insights** in meeting notes; everybody takes notes, and after a while "you have no idea what's going on" — every decision is updated all the time, and in a very large corporation **it just gets lost**: what has happened, who is doing what, why a certain decision was made.
- Property-graph basics for anybody building this: you think in terms of a **node** (representing a type of node), **relationships/edges** between nodes, and **properties** — **key–value pairs associated with nodes and relationships**. Everything is about deciding **what kind of node you have and what kind of relationship you want to build**.
- The meeting-notes model used in the demo:
  - **Meetings** — a meeting, its content, the **notes from the meeting**, and the **time** of the meeting.
  - **People who attended meetings** (participants, organizers).
  - **Tasks / action items yielded from meetings** — "otherwise it's not effective to be a meeting... no action item from a meeting? What kind of meeting is that?" — with particular interest in **what task was decided from the meeting and who takes ownership**, so people don't end up fighting for the same task.
- The duplication problem: during a meeting, multiple people refer to the same thing differently — "are we talking about **KG**? Are we talking about **knowledge graph**? Are they the same thing?" — which produces **duplicated nodes** if unresolved.

### Built-in entity resolution

- Entity resolution is **native to CocoIndex**: key operators are built in so users can do entity resolution and map entities to knowledge graphs **without having to write Cypher queries**.
- There is a **CocoIndex app for entity resolution** that you can install in your system; the usage is: call a function **`resolve_entities`** — pass **what the entities are**, the **"embedded pair"**, and the **"resolved pair"** [terms as spoken in the transcript] — "and then you are good".
- Concrete example: "sometimes people know me as **LJ**, sometimes people know me as **Ling Hua** — how do I know it's the same person? It shouldn't be the same node [twice] in a knowledge graph." Likewise "**Jian Zhuo and George are the same guy**" — the resolution step unifies them.

### The three-phase pipeline

- Fan-out context: unlike traditional data-frame analytics, these indexing systems end up with **very high fan-outs** — e.g., a one-on-one doc with George tracks all their meetings; different docs per person and per group; **per meeting file** there are per-meeting notes; sometimes notes are extracted further into smaller pieces, depending on your need.
- **Phase 1 — process files / extract meetings**: a stage called **`process_file`** with a **`memo=True`** function. You may have "thousands and ten thousand, hundred thousands of meeting notes in your corp", but only one of them is updated — with this **memoization**, only what changed gets reprocessed. This stage extracts/splits meetings and pulls the core information out of each meeting.
- **Phase 2 — person entity resolution**: "super simple" — CocoIndex has built-in operators; you just **resolve persons** (LJ ↔ Ling Hua; Jian Zhuo ↔ George are the same guy), so they don't become separate nodes.
- **Phase 3 — the fun part: graph modeling / declaring state**: declare the **canonical person nodes** and the relationships between them. Concretely: declare a **person table** (one record per person); for each meeting, figure out **who attended what meeting and who was assigned what task**:
  - **Participants / organizers** — declare relations from person to meeting: "Ling Hua is organizer of this meeting", "Ling Hua is attending this meeting".
  - **Tasks and assignees** — understand which action items came out of the meeting: "we assign Ling Hua to give this talk, George to do the demo" — assigning tasks to different people from the meeting.
- The overall shape: **extract information from meeting → do entity resolution → declare relationships** — "and then it all ends in FalkorDB nicely, cleanly and in a very robust way", without writing Cypher.
- Incremental behavior: if only one of the one-on-one meetings changes (e.g., reassign a meeting from George to Dan), **only that one is reprocessed**, shows up in the knowledge graph quickly, and an agent asking "who is going to do the demo about the meeting notes?" **immediately changes the answer from George to Dan**. LJ: this is what agent systems helping humans coordinate need — **instant insights from the context graph across a big corpus**.
- App wiring: in **`app main`** — **FalkorDB is the target**; declare the **meeting table, person table, and task table** [transcript: "in file cur" — unclear, likely "in FalkorDB"], and **mount the relationship targets** (attendee, decided, assignee) on FalkorDB; then "ramp everything up" with the core utilities above.
- Size claim: "**within 400 lines of code**, you have this kind of [pipeline] — and it's **ready to go production**."

### George's live run

- Data: **two different Google Docs** with very simple meeting notes.
- In the code folder he runs the **CocoIndex command line**: **`cocoindex update main`** — it starts processing, takes the data from the Google Docs, and runs the different phases; progress is shown, files get processed, then **entity resolution** runs (he notes it might take **~10 more seconds**), done.
- The resulting graph — **three node types: meeting (purple), task (blue), person (yellow)**:
  - Example: **George attended a meeting**; the meeting node carries **extracted metadata — the source file it came from, the time, and the notes** for the meeting.
  - **George is assigned tasks** — e.g., a task like "**create a feature list for bug bash**".
- Update flow: back in Google Drive, **reassign a task** [ASR renders the name "Dinghua"/"Ding Huang" — unclear; LJ's narrated example was reassigning from George to Dan], then re-run:
  - **One file is unchanged, one file changed; entity resolution has nothing changed** → only the changed file is reprocessed → **"it only takes five seconds"**.
- Latest graph: **George has no task now** and the other person **has more tasks**.
- LJ's close: anybody with a large corpus and lots of meetings can use this; you can **extend it with more entities**; she's excited to see what people build on top of it.

## Q&A

### Which vector database is being used here? (Banu)

- LJ: as a **target**, there's no limit — CocoIndex is happy to work with everyone in the ecosystem: **ChromaDB, Postgres PGVector, Qdrant, LanceDB** — "basically a lot of the players in the ecosystem as a target".
- The **core CocoIndex implementation itself does not rely on a vector database** — it's built with a broader ecosystem mindset to provide fresh data for AI.
- Dan/Gal framing: it's part of the ethos — **open source and very permissive**, "permit you to use what is convenient for you".

### What is the largest scale of data indexed, and what retrieval accuracy do you see at that scale? ("Large-scale retrieval is always a gap for many use cases")

- Dan: it depends on the type of data and what evaluation is happening behind the scenes — but with FalkorDB you can scale to **billions of entities**, and "the retrieval is pretty strong".
- Gal: **billions of nodes and edges** — the knowledge graph scales there and "we didn't reach the limitation". It depends on the properties and whether you use embeddings [transcript: "list-like embeddings" — unclear]. **Accuracy depends on the use case**: if you build it right and **use entity resolution** to accurately index each entity and find the relevant entity for your question/use case, you can **maintain high accuracy with knowledge graphs**.

### Provenance and lineage — can you trace context back to the source?

- Dan: with **FalkorDB and CocoIndex it is captured during ingestion** — the metadata — and it is **fully traceable**: you can trace back to the **original documents** from which the data came.

### With CocoIndex v1, can you use Postgres for sync state management instead of LMDB? (Discord said "enterprise only")

- LJ: a great question — there's a lot of feedback from developer communities that **Postgres is hard to set up**.
- In the **open-source CocoIndex v1**, the plan is to do **embedded only** — that means **LMDB, in-process** [transcript: "LM is in progress in process" — LMDB in-process].
- **Postgres support is going to be enterprise, and enterprise is not open sourced.** LJ wanted to be very clear: at the moment **CocoIndex enterprise is not open source**; "we can always discuss, there may be involvement in the future", but right now that's the state.

### Is indexing updated at the document level or page level granularity?

- LJ: the beauty of CocoIndex is **it can be doc level, and it can be page level** — it's all about **how you want to define the granularity**; it can even be **meeting level**, based on **how you add the Coco functions** during your process [George: the main thing is covered]. 

### Is it right to think of CocoIndex as an enhanced indexing mechanism for different types of unstructured data sources, leveraging hybrid querying? Does it use BM25 or HNSW underneath?

- LJ: CocoIndex is **beyond an enhanced indexing mechanism** — it is an enhanced indexing mechanism, but its focus is on the **shapes of pipelines** needed for data indexing, "especially exceptionally [fine for] handling unstructured data that is ever changing". Per LJ: "we are the best in the market who is handling unstructured data" — if you already ingested **millions, tens of millions, and even bigger** amounts of data, it handles that **incrementally**. On the retrieval side, **BM25-type index mechanisms work with the ecosystem**.
- George: what CocoIndex focuses on is we call **"indexing"** — pre-process your raw data and put it into the **index**; the index is the **output** of the indexing process. For the index, **all different types of index are supported**:
  - The target can be **FalkorDB** or **different vector databases**.
  - Vector databases can come with **HNSW** — for example, **Postgres supports pgvector with HNSW**, and Postgres has **extensions to support BM25** — all of this can be a target; CocoIndex can output to that.
- LJ: so if you're using different kinds of unstructured sources and CocoIndex to convert them into FalkorDB, you can leverage **FalkorDB's own index mechanisms — HNSW vector search or full-text search** — using the target's index mechanism.

### Is there support for access control at the entity, chunk, or edge level?

- Dan: that's a FalkorDB question — **yes, access control is supported**; they need to get back on **which level** of access control, but "definitely, yes".

### How does CocoIndex handle partial updates within a single large document? (Change one paragraph in a 50-page technical spec — re-index the whole file, or only the affected nodes in FalkorDB?)

- LJ: two critical techniques:
  - **Memoization**: you define your processing logic as **functions**; functions can call other functions, and **you decide the granularity of memo-for-memoization**. Example: a **file-level function** to process a file, and another function for a smaller scope, like **process a page**. If both are memoized:
    - If the file-level metadata doesn't change (**modified time, checksum**), the **entire file is skipped**.
    - If the file changed but a **specific section didn't change** — as long as the section-processing logic is captured by a **memoized function call** — the unchanged section is **skipped**.
  - **Side-effect tracking**: during processing you **declare rows, nodes, and relationships** in your targets; CocoIndex **keeps track of which rows come from which function call**. If a function's **input doesn't change**, it stays as-is; if anything changes, CocoIndex does a **state diff** and **applies only the diff** to the target.
- This mechanism doesn't only reduce compute resources — it also **helps you manage the side effects**.

### For entity resolution and identification — LLM prompts, or a deterministic approach on top of the first classification layer from the LLM resolve layers?

- LJ: **both are supported** — you may have some database and define entity resolution there, **in addition to the LLM approach** for approximate matching.
- CocoIndex co-founder: the **default mechanism is LLM-based** — by default you just **throw a pair at the LLM**: "are they the same person?" — and it decides. **The more context you give the LLM, the more accurate** the answer. This is the **default comparator**; you can also use a **customized comparator** with your own determination logic.
- LJ adds that the **entity resolution layer takes it to another level**: when building a knowledge graph from **different sources** — unstructured, maybe structured — entity resolution gives you a **unified knowledge graph**, a single source of knowledge, so you can ask questions that relate **different parts of your data that have never been connected**.

### Offline

- A couple of remaining questions were answered offline — answers go into the **blog post** and the recording goes up on **YouTube**.

## Logistics

- Recording + everything shown on screen, including code examples, shared in the **FalkorDB/webinars GitHub repo**.
- Q&A collected live; unanswered questions answered afterwards, collated into a **blog post**; sessions held **about once a month** — subscribe on **Luma** to get the invite first.
- George came onto the call mid-session after LJ introduced him; LJ had a brief screen-share hiccup that was resolved [minor].

## Key facts and numbers

- LJ: **9 years at Google**; indexing systems for **academic papers, patents, case laws** (core indexing and clustering), then healthcare-intelligence data infrastructure; co-founder was a **founding member of Google's indexing infrastructure**.
- CocoIndex = the **incremental engine for context for AI**; principle: **"the target is a function of source"**.
- Sources: code base, meeting notes, web, file system, database, message queues, videos, voice. Targets: vector DB, graph DB, relational DB.
- Core control plane: **caching, pipeline catalog, version tracking, continuous updates, lineage**.
- Gal's connector demo: **two pipelines** over the docs; graph contains **162 entities**; two different graphs (docs + APIs) from the **same source and same targets** in FalkorDB.
- Meeting-notes pipeline: **three phases** (process file w/ memo → entity resolution → declare graph); **~400 lines of code**; "ready to go production".
- Live run: initial build processes **two Google Docs** (entity resolution may take **~10 more seconds**); after a one-line/one-task edit, the incremental re-run takes **only ~5 seconds**.
- Node types in the demo graph: **meeting (purple), task (blue), person (yellow)**.
- Scale: FalkorDB scales to **billions of entities / billions of nodes and edges**; limitation not yet reached; accuracy depends on model quality + entity resolution.
- CocoIndex v1 open source: **embedded LMDB** state storage (in-process); **Postgres = enterprise**, **not open sourced**.
- Entity resolution default: **LLM comparator** ("throw a pair at the LLM"); custom comparators possible.
- Ecosystem targets named: **ChromaDB, Postgres PGVector, Qdrant, LanceDB**; index mechanisms mentioned: **HNSW**, **BM25**; FalkorDB offers **HNSW vector search** and **full-text search**.
- Example task in demo data: "**create a feature list for bug bash**".
- Sessions: roughly **monthly**; subscribe via **Luma**.

## Code, commands and queries

- Command George ran to build/update the meeting-notes graph from the demo folder (transcript: "Coco Index update main"):
```bash
cocoindex update main
```
- Identifiers and structures described on screen [not reproduced verbatim in the transcript]:
  - Phase 1: **`process_file`** with **`memo=True`** for memoized file processing.
  - Phase 2: **`resolve_entities`** — the entity-resolution function; pass the entities, the "embedded pair", and the "resolved pair" [terms as spoken].
  - Phase 3 / app wiring: **`app main`** declares the **meeting, person, and task tables** and mounts the relationship targets **attendee, decided, assignee** toward FalkorDB.
  - Gal's docs pipelines declare the target structure (properties + graph shape) in the CocoIndex language; re-runs process only changed MD files.
  - Cypher queries against the APIs graph (find each API's calls per module; shared API calls between models) were described but not quoted.

## Hackathon relevance

- If your build has a **live-changing corpus** (docs, meeting notes, Slack, repos), CocoIndex's declare-and-render model is a shortcut: define lightweight functions in Python, point the target at FalkorDB, and get fresh graphs without batch re-ingestion — the exact "always-fresh context" requirement for agent-memory and company-brain tracks.
- The meeting-notes pipeline (**~400 lines**) is a directly reusable blueprint: `process_file` (memoized) → entity resolution → declare people/meetings/tasks with attendee/decided/assignee relations → agent queries; incremental updates land in **~5 seconds**.
- **Memoization + side-effect tracking** answer the "how do I keep my graph in sync cheaply" problem even if you don't adopt CocoIndex — granular memoized functions (file/page/meeting level) plus state diffs are worth copying into your ingestion design.
- Built-in **entity resolution** (default LLM comparator, customizable) solves the duplicated-node problem (KG vs knowledge graph; LJ vs Ling Hua) that crops up in any multi-source graph build.
- **Provenance/lineage** is captured during ingestion and fully traceable — useful for citation-style agent answers ("tracing context back to the source").
- Operationally: open-source v1 uses **embedded LMDB** state; **Postgres-based state is enterprise-only** — plan hackathon deployments accordingly.

## Related notes

- [transcript-agentic-memory-queryweaver.md](transcript-agentic-memory-queryweaver.md) — companion session on agentic memory and natural-language-to-Cypher querying.
- [transcript-vcpedia-fractal-kg.md](transcript-vcpedia-fractal-kg.md) — another builder's take on entity resolution and self-organizing knowledge graphs.
- [docs-integrations.md](docs-integrations.md) — FalkorDB integration docs covering ecosystem connectors such as CocoIndex.
- [../../guide/10-agent-memory.md](../../guide/10-agent-memory.md) — guide module on agent memory, the use case both demos serve.
