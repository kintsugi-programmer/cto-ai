# VCPedia & Fractal KG — knowledge graphs that organize themselves (Graph & RAG #5)

> **Source:** [`Transcript copy 16.txt`](../Transcript%20copy%2016.txt) · **Type:** webinar transcript · **Saved:** Oct 16, 2026 · **Original URL:** https://www.youtube.com/watch?v=QGUUgXXhWeE

## Overview

- Fifth installment of FalkorDB's **Graph & RAG** series, with hosts **Dan** and **Roy** (FalkorDB) and guest **Yoi** — a **pre-seed VC investor** and builder (creator of **BabyAGI**) demoing two of his knowledge-graph projects: **VCPedia** and **Fractal KG**.
- Format: "not too many slides, a lot of hands-on stuff" — live demos plus the rationale behind them, ending with a long Q&A.
- **VCPedia** captures **pre-seed funding rounds announced on Twitter/X**: Twitter API → funding detection → entity resolution → enrichment → relationship tables, surfaced in a UI with startups, investors, rounds, trends, and social-signal "trending".
- **Fractal KG** extracts entities and relations from Wikipedia articles into a graph and **self-organizes into a fractal structure** — clustering nodes with too many children so retrieving one node's edges never blows past the context limit. Most of its ingestion + retrieval is a single file of ~1,000 lines, being prepared for open source.
- Roy's slide deck covers **KG fundamentals** (nodes, edges, labels, attributes), an art-domain example, and a **five-step construction recipe**: define domain → collect/clean data → define ontology → ingest → validate.
- The Q&A answers are detailed: **node vs attribute** heuristics, what document detail to store, **schema enforcement via constraints** (unique/exists), graph embeddings, one graph per domain vs one big graph, ontology scaling, and attribute-extraction tips.
- Framing from the top: FalkorDB is an **open-source graph database management system** designed for connected data and complex relationships — interconnected nodes and edges give efficient storage and "super fast retrieval".

## VCPedia — funding rounds captured from Twitter

- Project from a few weeks before the session. Yoi learns a lot about AI trends on Twitter/X, so he built a tool to capture AI trends there using the **Twitter API**.
- While running that experiment he noticed it was capturing **funding rounds** — and as a **pre-seed investor**, up-to-date pre-seed round info matters because "you don't find [it] on a lot of other databases", and **a lot of pre-seed rounds are announced on Twitter**.
- The idea came on a **Friday** and he **"vibe coded" it with Replit**.
- Honest caveats: the site is **not optimized for speed**, and the trending sections **capture some noise**.

### What the UI shows

- Top-line stats: number of **startups, investors, rounds**, and the **recent funding captured this week**.
- **Trending startups based on social signals**; **funding rounds by type**; **funding trends**; **notable AI startups** (a section set up out of personal curiosity); **recently funded / added funding rounds**.
- Drill-down into a startup (demo example: **Pistachio**) shows:
  - The **most recently captured funding round**.
  - **Company info, business info, industry tags, business model**.
  - **Similar startups** — a **vector search** against other startups in the system.
  - **Funding rounds captured on Twitter** — no historical data; only rounds from when the project started.
  - **Investors**, extracted and given their own pages.
  - The **actual tweets** where the funding round was captured.
- **Trending rankings use social signals**: clicking through to the source tweet shows the announcement racked up a lot of engagement — so VCPedia identifies not just rounds, but rounds that **captured people's attention**.

### Tweet ingestion pipeline

- Yoi fed the code to **NotebookLM [unclear — transcript "NLM"]** to generate the flow description:
  - **Twitter API** with a couple of **search queries** running at a set frequency, through the Twitter client.
  - Query refinement: **no retweets**; require **verified** accounts (noise reduction).
  - **Deduplicate tweets** so the same tweet is never analyzed twice.
  - On a tweet object: **funding detection** — is there a funding round? If yes, extract **startup, funding round, founders, investors**.
  - **Entity resolution layer** — deduplicate against existing startups, founders, and investors.
  - **Data enrichment layer** — several enrichers were tried: **SERP [unclear], Exa, OpenAI**.
  - Everything is added into **relationship tables**.

## Knowledge-graph fundamentals (Roy's slides)

- Knowledge graphs are **not a new idea — around at least 10 years** — but the GenAI explosion put the spotlight back on them.
- **Graph entities**: **nodes** represent entities in your domain; **edges** connect them to capture relationships. Both can be **labeled** (e.g., a "person" label; an edge capturing an interaction between two persons).
- **Attribute sets**: key–value storage attached to a graph entity — e.g., a person with name, zip code, birth date. Data types include **numerical values, strings, arrays, vectors, and more**.
- Concrete example — the **art domain**: entities are artists (e.g., **Leonardo da Vinci**), paintings, and museums; interactions include "the artist drew a picture" and "the picture is presented at a museum".

### Why represent data as a graph

- It's **very visual** — you can look at it and reason about it relatively easily.
- Knowledge graphs are **essentially schemaless** — flexibility when representing your data.
- **No restriction on the number of entity types and relation types** — "you can actually go quite wild with it".

### How to construct a knowledge graph — the recommended path

- Constructing a KG **can be challenging** — unlike vector databases, where ingestion is straightforward but reasoning capabilities are "extremely limited".
- The step-by-step guidance:
  - **Define the domain** — keep a focused scope; make sure it's well defined.
  - **Collect and clean data** — how much cleaning you do depends on how you're ingesting.
  - **Define the semantics / ontology** — a "schema for your graph" (analogous to the relational model). Even though graphs are schemaless, a **strict schema has value later in the retrieval phase**: "a person has these attributes, edges coming in or going out of these specific types, and maybe some relationship types are also associated with some attributes". This also **helps LLMs interact with your data**.
  - **Ingest** — push the data into the graph.
  - **Validate** — make sure the captured knowledge is valuable; e.g., if an LLM queries your KG, that the **accuracy of results for the questions you ask** is satisfied.

## Applying the recipe to VCPedia (Yoi)

- **Domain**: startups and funding. **Data collection**: on Twitter. **Ontology**: very clear — the funding-round relationship with people, and people's relationships with startups.
- **Extraction**: "using **structured output with LLM is a great way to get the structured data out of your unstructured data**" — turn the ontology into the structured-output format and extract.
- **Validation** (his own weak spot, by his admission): his strategy has mostly been — every time you add a node or relationship, **look for similar nodes**; most recently he feeds the **similar nodes + the new node into an LLM and lets the LLM decide**. He says you can go further with **deterministic validation**: "if it's the exact same domain, then they're the same entity".

## Fractal KG — self-organization and dedup

### Motivation and approach history

- Yoi started exploring KGs right after building **BabyAGI**, when people reached out saying he should look into them; when he finally did, "it immediately clicked" — graphs felt like a very **intuitive and natural way for AI to traverse data**.
- Graph vs relational, concretely: with a startup, the AI can just **pull all the edges related to that startup** to get all the context at once; relational tables force you to chase relationship mappings step by step (startup-people table → search people → startup-funding-round mapping → funding rounds → investors). "Just being able to pull edges intuitively made more sense."
- Three iterations on what is now called **GraphRAG**:
  - **Mind graph** (older) — the key element was a **conditional add-multiple**, i.e. "add multiple edges and rows conditionally"; a **conditional entity addition** acted as the dedup-and-add. It was beefy code, from a while ago.
  - **Graphista** (earlier this year, before Fractal KG) — an attempt to simplify: a smart **node processor and retrieval tool**, essentially an **LLM loop with a whole bunch of graph query tools**. The hypothesis: with enough prompting, the LLM would figure out how to dedupe correctly, and add nodes properly. It "somewhat worked", but realistically the **earlier deterministic version worked better**.
  - **Fractal KG** (most recent) — adds an element of **self-organization into a fractal-based graph**.
- The problem Fractal KG attacks: if the graph gets too big, **pulling in all the edges of a node goes over the context limit**. He wanted a system that can **reflect on itself and self-organize** — if one node has too many children, it can **cluster the children and create subcategories** between them, so **no single node has too many edges**. He compares the mechanism to **how we dream** — going through each node and self-organizing.

### Fractal KG pipeline

- Demo graph: a bunch of **articles pulled in from Wikipedia**; entities and relationships are automatically extracted and mapped into the graph.
- Flow (explained with the help of "trusty Claude"):
  - **Raw document text** goes in.
  - **Identify entities**.
  - **Entity resolution step** — for each entity, look for existing entities; in some cases "there's an existing node", in others "we need a new node".
  - **Extract fact step** — in Fractal KG **every fact is a triplet: entity–relationship–entity** (example: "Einstein developed the theory of relativity").
  - **Attach the facts to the entities**, **create the graph edges based on the relationships**, then **batch deduplicate and self-organize**.

### Live demo: "Yoi loves AI, John loves tech"

- Expected behavior from earlier versions: just a "Yoi → AI" edge and a "John → tech" edge.
- Because Fractal KG tries to **self-organize and infer relationships between nodes as it creates them**, it should automatically build a relationship between **AI and technology**.
- In this live run **it did not**; an earlier run of the same test did.
- Asking "What is John's relationship with AI?" produced: **"There's no direct relationship between John and AI based on given facts. While AI is a subset of technology, the fact is not a specific state that John loves AI, only technology in general."** — i.e., it remembers John loves technology, and it does see technology's relationship with AI.
- Dan: this is especially relevant for people building **agents that hold memory and provide answers with real context**.
- Most of the ingestion and retrieval is in **a single file of about 1,000 lines of code**; they are getting it ready to **open source** so people can play with the approach — it will be shared on Discord.

## Why graphs — the innovation-ecosystem thesis (Yoi)

- He didn't study graphs, but "most of business — the way we work — is actually just a lot of relationships": emails, notes, people, relationships between people and businesses. Graphs do "an incredible job of capturing the way in which the real world works".
- What excites him: the many **graph algorithms** that help understand relationships between graphs and the network at large.
- Vision: create a strong **graph of the innovation ecosystem** — what are the industries, technologies, investors, customers — and use it to identify **pockets of underserved innovation**: areas where you should see a lot of activity but aren't seeing as much funding, and innovations in one industry that obviously should apply in another but haven't yet. He could invest on those signals; founders could spot the gaps automatically.
- So it's **beyond capturing existing relationships** — being able to **infer opportunities** within the graphs.
- The historical bottleneck: "the biggest challenge with knowledge graphs at least prior to LLMs was building and maintaining these clean knowledge graphs — it just took too much manpower". With the **reasoning and data-structuring capabilities of LLMs**, we're "finally at a place where we are able to build and maintain large knowledge graphs — and then infer insight from them". He thinks it's still early but the right time; figuring it out gives you a leg up at helping people organize data. This exploration led him to work with FalkorDB.

## Q&A

### Node vs attribute — what's the rule? (individual = node, name = attribute... what about country?)

- Roy: there is **no clear and correct answer** — for some, an attribute is right; for others, a node. His general approach: **visualize your data as a graph, and whatever comes to mind naturally is the data model to start experimenting with**. If the data point seems **trivial**, there's not much to think about.
- The **country example**, in detail:
  - As an **attribute**, watch **memory consumption**: with millions of persons, the same small set of country strings duplicates "over and over and over". FalkorDB's **latest release** tackles this with **string interning**: mark a string that occurs often so it isn't duplicated — a **unique value** is used and everything is shared.
  - Consider your **traversal/search patterns**: if you want to traverse **from a country outward**, represent the country as a **node**. If you mostly locate a person by **unique identifier / social security number** and just want to see, say, in which state that person lives, an **attribute** is enough. As a node, you'd instead traverse person → country node and retrieve the country name.
  - Summary: go with the most natural graph model, then **check that the chosen model fits the different queries/questions you intend to answer**.
- Yoi: **start from the queries** — if you constantly filter your data by country, turning it into a node is intuitive; if it's a side note shown when visiting a person's page, it may not need to be a node. With a lot of data, **cost matters** — at millions of records you might want to decide up front. At the **prototyping stage**, keep it simple, test with small pieces of data; **location-as-attribute is pretty easy to convert into a location node later**.
- Roy adds: **graphs are dynamic** — you can transition from one data model to another quite easily. Also ask: do you expect the country to **interact with other pieces of information in the near future**? If that's the case, lean toward a **node**, for the ability to capture those different interactions.

### Q (MJ): When working with documents, what detail are you saving in FalkorDB — sentences, paragraphs, or summaries? If only summaries, do you also store the entire document in a separate database?

- Roy: classic RAG question — **no right answer**; all options are viable and it depends on the type of questions and the level of accuracy you aim for. Some people analyze documents with LLMs — creating **embeddings, extracting sentences, creating summaries** — and the **relationships between paragraphs, sentences, summaries, and entire documents can be represented as nodes in a graph**. In classical RAG, you embed the question and semantic-search to a summary or the relevant paragraphs; the graph can then **get hold of the original document**, and a document hierarchy ("this is a page from a broader corpus", "this is a Wikipedia article linked to other Wikipedia pages") lets you **extend context by traversing**. The benefit of storing this in a graph: retrieving additional context that helps the LLM generate the correct answer.
- Yoi: go back to **what the query is and how you want to display it**. In many RAG cases you want to **provide the source snippet of the fact** — whether you do or don't should affect the decision to keep the document. For a massive PDF you had to chunk, it makes sense to **store the chunks**, so that when you find a fact you don't have to search the whole PDF for the snippet again — "you would almost rather store the snippet with the fact". Decide based on what information you display, the flow to get it in front of the user, and **test the graph and the UI together for cohesion**.

### Q (Brett): The system is schemaless, but an ontology is useful — are there mechanisms to enforce the ontology automatically?

- Roy: **some mechanisms, yes**. The model they follow is the **property graph model**, schemaless at its core. The feature FalkorDB offers to start enforcing schema is **constraints**, and there are currently **two**:
  - **Unique constraints** — an attribute must be **unique across an entire entity type** (e.g., a social security number unique for every person).
  - **Exists constraints** — every entity of a type (e.g., a country) **must have** a given attribute (e.g., population). It doesn't have to be unique, but it must exist.
- **Not enforced** today: introducing **new labels or new relationship types that are not part of the ontology**; and the **types of edges** coming in/going out of a certain node type (if the ontology says there should not be an edge of type "driven to", that is not enforced).
- Plan: **schema-enforcement mechanisms and features for FalkorDB are planned over time**; at the moment it is the **user's responsibility** to enforce the ontology — either via user-written code or by guiding an LLM to strictly follow the ontology whenever doing updates, deletions, or ingestion.
- Comment from **Alec**: "the ontology schema behaves like a prompt engineering technique with your LLM that you are using to classify the data you are processing either as entities or edges."
  - Yoi: the ontology is **set ahead of time** and makes retrieval easier — you can ask questions **more deterministically** without worrying about two similar edge types. You can enforce it **up front** with **structured outputs**: ask the structured output to extract nodes or edges in a specific format, and make the desired relationship types a structured-output parameter — **stick an enum** with the specific types you want.
  - Dan: ontology can be thought of as prompt engineering — the main idea is to **restrict / make sure the LLM is aware of exactly what is captured** in your knowledge graph. Example: an LLM told only "you have a graph capturing driving information", asked "find me all driving sessions that had a top speed over 60 miles", has to guess which attributes/nodes/relationships exist. If it knows up front there is a **driving session entity**, it has a **top-speed attribute**, and it's **connected to roads**, the LLM is **confined and certain** about the graph's contents — that really boosts the accuracy of the queries it composes against the graph.

### Q: What graph embedding models are supported — node, edge, or graph embeddings?

- Roy: **none**. FalkorDB does **not have GNN capabilities or graph embeddings**. The only embeddings supported at the moment are **vector embeddings** (as generated with different LLM/AI vendors), searched via FalkorDB's **semantic index**. There is interest in GNNs for **node label prediction, edge prediction, and subgraph classification** — "unfortunately, that's not supported at the moment".

### Q (Discord): Should I use a knowledge graph per domain, or a single knowledge graph containing all the domain data?

- Roy: depends on the use case, but storing all your information — even spanning multiple domains — **in a single graph is possible**. The nice thing: **multiple ontologies can describe different portions** of one graph. Example: one ontology for driving sessions (roads, intersections) while the graph also contains cities, population, universities; you can maintain a second ontology (population, employment) — both **coexist within a single graph**. The **LLM and the ontology presented to it** know how to filter/focus on the relevant pieces of information in the larger graph.
- Alternative: FalkorDB lets you maintain **multiple graphs in a single database** — similar to SQL, where you have multiple tables in one database. You can have **multiple disjoint graphs** in one database: keep them separated, join them together, use **one ontology per graph**, or have multiple ontologies capturing data from several graphs in a single one. (Dan appreciated the multi-tenancy angle of the answer.)

### Q (for Yoi): If VCPedia supported multiple languages, would you add a translation step or store tweets in their original language?

- Yoi: **store the tweets in their original language** and simply **translate the output of the site** — "that's just my gut reaction; I don't really have a strong reason for it".

### Q (Discord): How does an ontology scale when my data updates?

- Roy: distinguish **two types of updates**:
  - Updates that **don't change the ontology** — e.g., adding a new city, a new university, or a new person. The ontology stays the same.
  - Updates that **add a new type of entity** — e.g., adding a **truck** to a driving-session graph that only had cars.
- FalkorDB does **not enforce alignment between the underlying graph and the ontology** — the user must maintain it, just like there is no schema enforcement. When you introduce a new entity type, you should **extend the ontology** to capture it: for the truck, add the entity to the ontology with its **attributes** and the **relationship types** that interact with it.

### Q (Discord): Is there an automated way to build a knowledge graph?

- That is exactly the topic of the **next workshop** — a hands-on session on **how to construct a graph**: the methodology they use and the logic behind how they do what they do. (See Logistics.)

### Q: How can I improve attribute extraction per entity from a strict ontology schema — I get non-relevant or incomplete context assigned; maybe my chunking is wrong or I need more NLP steps?

- Yoi: with graphs it's hard to solve generally — "it is really case by case in terms of what data you're playing with". Techniques that worked for him:
  - **Few-shot examples** ("K-shot is always helpful").
  - When converting large documents, **feed higher-level document context into each chunk**: a simple example is a book that uses people's names early and later switches to "he/she" — a paragraph grabbed alone may not match the name. Higher-level context fed into the chunk helps when you chunk-then-extract.
  - With **structured output**, add **clear descriptions for each parameter**, **hard-coded rules on options**, and improve the structured-output **JSON definition and prompt**.
- Roy: **structured output** can really help here. At the time, **OpenAI had the "defining functions" feature**: define functions/tools for the LLM to use when instructed to extract entities and relations from documents. Example approach: five different types of entities → create a **function per entity type**, each with a set of **typed arguments/attributes** (some optional, some mandatory). The LLM is then responsible for **invoking the most relevant function** when it encounters data that translates into an entity — "I'm seeing a description of a city. Do I have a create-city function? Yes. Which arguments do I need? Name is mandatory and should be a string." The LLM is **very restricted and has rules to follow** when invoking a function / creating an entity. This really helped — another way to experiment with detecting and creating entities from unstructured data.

## Logistics

- Fifth "Graph & RAG" installment; the **next workshop (July, "a little bit over a month" out)** is the hands-on **how to actually build a knowledge graph** session — a QR code was shown, and the sign-up link was sent afterwards.
- All sessions are recorded; recordings land on **Discord and YouTube within 24 hours**.
- Questions not answered live are collected and **answered later via email/Discord**, collated **on the blog**, with standout questions featured in an **email recap**.

## Key facts and numbers

- Series position: **5th installment** of "Graph & RAG".
- Knowledge-graph idea age: **at least 10 years** old — GenAI brought it back to the spotlight.
- FalkorDB: **open source** graph DBMS; representing data as interconnected nodes and edges → efficient storage, "super fast retrieval".
- VCPedia: built on a **Friday**, "vibe coded" with **Replit**; captures **only from project start** (no historical backfill); search queries run **on a certain frequency**; excludes **retweets**; requires **verified** accounts; not optimized for speed.
- Demo example startup drilled into: **Pistachio**; art example: **Leonardo da Vinci**; fractal demo phrases: "**Yoi loves AI**", "**John loves tech**"; fact-triplet example: "**Einstein developed the theory of relativity**".
- Fractal KG: **~1,000 lines** in a single file (ingestion + retrieval); not yet open source; will be shared on Discord.
- FalkorDB **string interning** — introduced in the "latest release"; avoids duplicating frequently occurring strings.
- FalkorDB constraints: **2 types** — **unique** and **exists**.
- Embeddings: **vector embeddings only** via the **semantic index**; **no GNNs** (node label prediction, edge prediction, subgraph classification unsupported).
- Ontology update example: adding a **truck** (new entity type) to a driving-session graph; edge example: forbidden "**driven to**" edge.
- Dan's query example: driving sessions with **top speed over 60 miles**.
- Next workshop: **July**; recordings within **24 hours** (Discord + YouTube).

## Hackathon relevance

- The VCPedia pipeline (search → dedupe → funding detection → entity resolution → enrichment → relationship tables) is a blueprint for a **company-brain ingestion job**: unstructured posts/text in, structured entities and relationships out, using LLM structured outputs.
- Ontology-first modeling: turn a strict ontology into the LLM's **structured-output format** and use **enums for relationship types** — cheap dedup/consistency wins before anything hits FalkorDB.
- Node-vs-attribute heuristics (traversal patterns, memory, expected future interactions) are directly reusable guidance when modeling your hackathon graph.
- FalkorDB features to exploit: **string interning** for repeated strings (e.g., statuses, countries) and **constraints** (**unique**, **exists**) for lightweight schema enforcement — ontology enforcement beyond that is your job, in code or prompts.
- Fractal KG's **self-organization** (clustering a node's many children into subcategories) is a pattern for keeping an agent's retrieved neighborhood under the context limit — directly relevant to agent-memory and coordination tracks.
- Know the gaps: no graph embeddings or GNNs — design around **vector embeddings + semantic index** if similarity is needed.

## Related notes

- [transcript-cocoindex.md](transcript-cocoindex.md) — the series' other agent-context interview: CocoIndex's incremental engine and the FalkorDB connector.
- [transcript-text-to-sql-cypher.md](transcript-text-to-sql-cypher.md) — LLM-driven querying of graphs, complementing the LLM extraction/validation patterns demoed here.
- [../../guide/10-agent-memory.md](../../guide/10-agent-memory.md) — guide module on agent memory, the use case Fractal KG's self-organizing graphs serve.
- [../../guide/07-rag-and-graphrag.md](../../guide/07-rag-and-graphrag.md) — background on RAG vs GraphRAG approaches Yoi iterated through.
