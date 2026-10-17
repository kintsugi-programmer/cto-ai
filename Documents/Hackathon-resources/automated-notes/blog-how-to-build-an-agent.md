# How to Build an Agent That Reasons Over a Graph (WeMakeDevs tutorial)

> **Source:** [`How to Build an Agent That Reasons Over a Graph _ WeMakeDevs.mhtml`](../How%20to%20Build%20an%20Agent%20That%20Reasons%20Over%20a%20Graph%20_%20WeMakeDevs.mhtml) · **Type:** blog post · **Saved:** Oct 17, 2026 · **Original URL:** https://www.wemakedevs.org/blogs/how-to-build-an-agent-that-reasons-over-a-graph

## Overview

- WeMakeDevs blog tutorial (15 min read, tags: hackathon, falkordb, wemakedevs) by **Aayush Sharma, COO of WeMakeDevs**, published **October 15, 2026** — the opening day of the hackathon.
- A complete build guide for "an agent that reasons over a graph": why retrieval alone fails, which track fits, how to run FalkorDB, and one end-to-end demo application with all its code.
- The demo, **Blast Radius**, is an on-call agent over a service dependency graph: tell it a service is down and it reports what else breaks, who is on call, and what changed recently — every answer returned with the hops it walked.
- Key design decision it recommends copying: **the agent never writes a query** — it picks from a fixed tool catalogue with human-written Cypher, and arguments are validated against the graph before anything runs.
- "Everything in this article runs against that local container" — code moves to FalkorDB Cloud by changing a host and a port.

## Why a retrieval step is not enough

- The usual way to give an agent context: embed the question, pull back the closest records or chunks, hand them to the model as text. Works only while the answer lives inside one of those records.
- The questions people actually want an agent to handle (all listed in the post):
  - Which accounts are linked to this flagged transaction.
  - What breaks if this service goes down.
  - Who has worked on this system before, and was the thing this customer asked for last month ever resolved.
- None of those answers sit in a record — they sit in how several records relate; a retrieval step hands over the records and leaves the model to (in practice) guess the relationships.
- Three familiar complaints follow: the agent fills in joins nobody gave it; it cannot carry what it worked out into the next session (a pile of retrieved text is not somewhere to put a conclusion); and it cannot show a route behind an answer — only the chunks that scored well.
- A graph database stores relationships as things in their own right: the question becomes a traversal, the agent follows recorded (not inferred) connections, and the path it walked is the explanation it owes you.
- Event context given in the article: Graph Hacks runs four days, starts the day of publication, closes **11:59 PM IST on 18 October**, online from anywhere, solo or up to 4 people, **$20,000 in prizes across three tracks**; the brief: an agent whose context lives in a graph, with the graph shaping what the agent does.
- FalkorDB is described as "an open source graph database built for AI agents," one line to start:

```bash
docker pull falkordb/falkordb:latest
```

## Three tracks, and what each one is asking for

- "You enter one track, and one submission is judged in it. Picking the right one is mostly a question of where the hard part of your idea sits."
- **Track 1: Agents That Act on Connected Data** — an agent that uses the graph to decide and act (fraud investigation, security triage, working through a codebase). Focus: multi-hop reasoning, graph algorithms as tools, tool selection through MCP, explainable results.
- **Track 2: Agent Memory and Coordination** — agents that remember across sessions and share state with each other, with episodic and semantic memory, persistent history, handoffs between agents, and separate memory per user or tenant.
- **Track 3: Company Brain** — an agent that understands how a company works, connecting people, teams, projects, documents and decisions in one graph, tracing decisions back to their source and keeping knowledge current.

## Getting started with FalkorDB

- One container gives you the database and a browser UI together — no schema step and no create-database step; a graph exists the first time you write to it:

```bash
docker run --rm -p 6379:6379 -p 3000:3000 falkordb/falkordb:latest
pip install falkordb
```

```python
from falkordb import FalkorDB

db = FalkorDB(host="localhost", port=6379)
g = db.select_graph("ops")

g.query("""
    CREATE (:Service {name: 'checkout-web'})
           -[:DEPENDS_ON {weight: 1}]->
           (:Service {name: 'payments-api'})
""")

rows = g.ro_query("""
    MATCH (a:Service)-[:DEPENDS_ON]->(b:Service)
    RETURN a.name AS upstream, b.name AS downstream
""").result_set

print(rows)
# [['checkout-web', 'payments-api']]
```

- `select_graph` names a graph rather than connecting to one; a single FalkorDB instance holds thousands of them — the way to give every user or tenant an isolated graph without more infrastructure.
- `ro_query` is the read-only path — the one an agent should use for anything that is not deliberately a write.
- Open `http://localhost:3000` for **FalkorDB Browser**, included in the same container, already drawing the graph; run traversals there before putting them in code — "seeing the shape of your data is the fastest way to find out your model is wrong."
- Query language is **Cypher** (FalkorDB docs cover the language and its algorithms); official clients exist for **Python, Node.js, Java, Rust, Go, PHP and C#** — use whichever language you were going to use anyway.
- For the live deployment the submission rules prefer, **FalkorDB Cloud** is the managed version of the same database; the weekend's code moves across by changing a host and a port.

## What the demo application is about

- When payments starts failing, the needed answer is not what payments does — it is what sits upstream of it, who owns those things, and which of them changed this afternoon. That is the shape of a traversal, not a lookup.
- Relational schema: recursive query and a join per hop. Document store: pull records and stitch them in application code on every step. Graph: one pattern.
- **Blast Radius** holds a small operations graph:

```cypher
(:Service {name, tier})-[:DEPENDS_ON {kind, weight}]->(:Service)
(:Team)-[:OWNS]->(:Service)
(:Person)-[:MEMBER_OF]->(:Team)
(:Person)-[:ONCALL_FOR {from, to}]->(:Team)
(:Person)-[:WORKED_ON {commits}]->(:Service)
(:Change {sha, at, author})-[:TOUCHED]->(:Service)
(:Incident {id, at, summary})-[:AFFECTED]->(:Service)
(:Finding {text, at, session})-[:ABOUT]->(:Service)
```

- Against that graph it answers four questions: **what breaks if this goes down, who to wake, what changed in the blast radius recently, and why one service is connected to another at all.**
- Every answer returns one of **four shapes** — "getting this list right before writing any code is most of the project":
  - **Answered with a path** — the graph held the relationships, and the hops are shown alongside the answer.
  - **Answered from memory** — a previous session already established this, returned with the date it was learned.
  - **Not in the graph** — the service exists, but nothing connects it the way the question assumed.
  - **Unknown service** — the name is not in the graph, so no query runs at all.
- "Not in the graph" is deliberately not "nothing breaks": an empty traversal means the graph does not know about a dependency — during an incident a different and more worrying statement than safety. The agent says which of the two it is.
- What it deliberately does **not** do: it does not guess a service name, does not write its own Cypher, does not summarise an incident report it has not been given, and does not rank teams against each other — each a line worth drawing on day one.

## Architecture & prerequisites

- "One database, six tools, and a model that never touches the query language."

| Requirement | Why |
|-------------|-----|
| Docker | Runs FalkorDB locally, which is the whole of the infrastructure |
| Python 3.12 | The tools, the agent loop and the tests |
| The falkordb client | `pip install falkordb`, the official Python client |
| An LLM endpoint | Any provider. The model picks tools and writes one sentence |

```bash
docker run --rm -p 6379:6379 -p 3000:3000 falkordb/falkordb:latest
pip install falkordb
python seed.py
uvicorn app:api --reload
```

- The build order in the article is worth following as written, because it keeps you able to check your own work at every step.

## Problem 1: the answer is not in any one record

- Blast radius = everything that depends on the failing service, and everything that depends on those, to whatever depth the architecture reaches. In a relational schema that is an hour-long recursive query; here it is the whole tool:

```cypher
MATCH path = (upstream:Service)-[:DEPENDS_ON*1..$depth]->(s:Service {name: $name})
RETURN DISTINCT upstream.name AS service,
       length(path)          AS hops,
       [n IN nodes(path) | n.name] AS via
ORDER BY hops, service
```

- Three things in the query are doing real work: the variable-length pattern `*1..$depth` is the recursion and depth is a **parameter** so the tool can cap it; direction matters and is easy to get backwards (this walks into the failing service, finding everything that points at it); and `nodes(path)` returns the route itself — what turns a list of names into an answer somebody can argue with.
- **Parallel-edge modelling detail**: when a relationship in a pattern is not referenced anywhere else in the query, the match verifies that *at least one* matching relationship exists rather than operating on every one — matters the moment two services are connected twice. The fix is to bind the relationship and reference it:

```cypher
MATCH (a)-[e]->(b) WHERE ID(e) >= 0 RETURN COUNT(b)
```

- A service dependency graph grows parallel edges as soon as synchronous and asynchronous calls are modelled separately — "the known limitations page is ten minutes well spent on the first evening."
- Depth 1 returns three services, all obvious, every one reachable with a join; depth 4 grows the answer to seven — `status-page` arrives three hops out through a refunds job, and the path on the row explains how it got there.
- "Use this when the question you are answering contains the words 'and then'. That is almost always a traversal wearing a sentence."

## Problem 2: the agent should not write the Cypher

- The obvious design — hand the model the schema and let it generate queries — demos well on the first question and fails in three separate ways: subtly wrong queries nobody notices; queries expensive enough to hurt; and nothing to show when asked why an answer came out that way.
- Blast Radius gives the agent a **catalogue**: six tools, each with a human-written query and a typed signature, exposed over **MCP** so the model picks a tool and fills in arguments:

```python
TOOLS = {
    "blast_radius":   {"args": {"service": "service_name", "depth": "int<=4"}},
    "who_to_wake":    {"args": {"service": "service_name", "depth": "int<=4"}},
    "recent_changes": {"args": {"service": "service_name", "hours": "int<=168"}},
    "path_between":   {"args": {"from": "service_name", "to": "service_name"}},
    "load_bearing":   {"args": {"limit": "int<=20"}},
    "recall":         {"args": {"service": "service_name"}},
}
```

- The argument types are not documentation — they are checked, and a `service_name` is checked against the graph rather than a regular expression:

```python
def resolve_service(graph, name: str) -> str | None:
    rows = graph.ro_query(
        "MATCH (s:Service {name: $name}) RETURN s.name AS name",
        {"name": name},
    ).result_set
    return rows[0][0] if rows else None
```

- A name that does not resolve produces the "Unknown service" outcome and nothing else runs. That function removes a whole category of demo failure (the model reasoning about `payment-service` when the graph calls it `payments-api`) and closes the injection question completely, because no model-produced string is ever concatenated into a query.
- The application prints the trace — each row is the tool, the arguments, how long it took and how many rows came back — turning the claim into something a judge can check. Asking about a service that does not exist leaves the trace empty with the reason on screen.
- "Use this when a model sits in front of any query language. Fix the queries, parameterise them, and let the model choose between them rather than compose them."

## Problem 3: traversals are tools, not queries

- Some of what an on-call engineer wants is an algorithm, not a pattern match. FalkorDB ships these as procedures called with `CALL algo.<name>()` — the agent gets them as tools without implementation work.
- **Shortest path** earns its place fastest — "why is this connected to that" is the question people ask when they do not believe your blast radius:

```cypher
MATCH (a:Service {name: $from}), (b:Service {name: $to})
CALL algo.SPpaths({
  sourceNode:   a,
  targetNode:   b,
  relTypes:     ['DEPENDS_ON'],
  relDirection: 'outgoing',
  weightProp:   'weight',
  pathCount:    1
})
YIELD path, pathWeight
RETURN [n IN nodes(path) | n.name] AS hops, pathWeight
```

- Seed a weight on every `DEPENDS_ON` edge even if every value is 1 — so the call has a property to work with, and so a synchronous call can later cost more than an asynchronous one without touching the tool.
- **PageRank** answers a question nobody asks directly but everybody wants — where the most load-bearing service in the estate actually is:

```cypher
CALL algo.pageRank('Service', 'DEPENDS_ON')
YIELD node, score
RETURN node.name AS service, score
ORDER BY score DESC
LIMIT $limit
```

- That is two arguments and a sort, and it gives the demo a *finding* rather than a lookup. FalkorDB also provides **BFS, A\*, single-source paths, betweenness and harmonic centrality, weakly connected components, label propagation for communities, minimum spanning forest and max flow**; connected components is the one for architectural islands, and max flow is "unexpectedly good for capacity questions."
- "Use this when your project has a question that sounds like a ranking, a route or a cluster. Those are solved problems and calling one is three lines."

## Problem 4: memory the agent can find next session

- The second track is entirely about memory; even in the first track, an agent that forgets is a demo rather than a tool. A graph makes memory easy: **no separate store — memory is simply more nodes.**
- When the agent establishes something worth keeping, it writes it back:

```cypher
MATCH (s:Service {name: $name})
CREATE (f:Finding {text: $text, at: $at, session: $session})
CREATE (f)-[:ABOUT]->(s)
```

- And the first thing the next session does, before any traversal, is look:

```cypher
MATCH (f:Finding)-[:ABOUT]->(s:Service {name: $name})
RETURN f.text AS finding, f.at AS at
ORDER BY f.at DESC
LIMIT 5
```

- That is the "Answered from memory" outcome — return the date alongside the text rather than folding it into prose: "A finding from three weeks ago and a finding from this morning deserve different weight, and the person reading is better placed than the agent to decide which."
- The other half of memory is **isolation**. FalkorDB's multigraph topology holds thousands of isolated graphs in a single instance, so a tenant is a graph rather than a filter anyone can forget — no deployment per customer:

```python
graph = db.select_graph(f"ops:{tenant_id}")
```

- A query against one tenant's graph cannot reach another's "because it is not a WHERE clause anyone can forget." If entering the memory track, this is the line to build the demo around.
- "Use this when anything your agent learns should outlive the request. Write it as a node, connect it to what it is about, and read it before you reason."

## Problem 5: every answer carries its path

- The brief asks for an agent that can show how it got to each answer. The cheapest way to do that badly: ask a model to explain itself afterwards — "What comes back reads like reasoning and is reconstruction."
- The honest version: return the path with the result (the query already did), assemble the answer object from rows, and give the model one job:

```python
answer = {
    "outcome": "answered_with_path",
    "services": [r["service"] for r in rows],
    "paths":    [r["via"] for r in rows],
    "oncall":   oncall_rows,
    "changes":  change_rows,
}
```

- Then the sentence is checked before anyone reads it — everything that looks like a service name in the model's reply has to be a name that came back from the graph:

```python
NAME = re.compile(r"\b[a-z][a-z0-9]*(?:-[a-z0-9]+)+\b")

def accepts(sentence: str, answer: dict) -> tuple[bool, str]:
    known = set(answer["services"]) | {h for p in answer["paths"] for h in p}
    invented = set(NAME.findall(sentence)) - known
    if invented:
        return False, f"named services not in the result: {sorted(invented)}"
    if not answer["services"] and "no " not in sentence.lower():
        return False, "claimed impact when the traversal was empty"
    return True, "ok"
```

- The first check transfers everywhere: a model that has seen a thousand architecture diagrams will happily produce `auth-gateway` because that is what usually sits there — in an incident, a plausible service name is worse than no answer. When the check fails, a sentence assembled from the rows goes out instead: the agent **degrades to a flatter answer rather than a wrong one**.
- Put the hops on screen next to the result: a list of three service names is a claim; the same list with `checkout-web → cart-service → payments-api` under it is something an engineer can agree or disagree with in two seconds.

## What each piece is doing

| Piece | Its job here | Why this one |
|-------|--------------|--------------|
| FalkorDB | Holds services, teams, people, changes and findings in one graph | Traversals fast enough to run on every step of an agent loop; one instance holds a graph per tenant |
| Cypher | Every tool's query, parameterised | A variable-length pattern is the recursion, written once by a person |
| FalkorDB algorithms | Shortest path and PageRank as agent tools | `CALL algo.SPpaths` and `CALL algo.pageRank` are three lines each |
| MCP | How the agent sees the six tools | The model selects and fills arguments, rather than composing queries |
| FalkorDB Browser | Inspecting the model while you build | On port 3000 from the same container, and the fastest way to see your graph is wrong |

- FalkorDB also plugs into **GraphRAG-SDK, QueryWeaver, Graphiti, Cognee, LangChain and LlamaIndex** — any of them shortens a project that leans on documents or retrieval. This build stays on the raw client on purpose, because with six tools and one database there is nothing between you and the thing you are debugging; if the idea starts from a corpus rather than a schema, start at GraphRAG-SDK instead.

## Five techniques you can reuse on any project

- **Model the question, not the data**: write the four questions your agent must answer before creating a single node — the labels and relationships fall out of them, and a graph modelled from questions can be traversed in a single hop where it matters.
- **A fixed tool catalogue beats generated queries**: humans write the queries, the model picks between them and fills parameters, and every parameter is validated before anything runs.
- **Resolve names against the database**: the highest-value check in a graph agent is confirming that a thing the model named actually exists, before reasoning about it.
- **Memory is more nodes**: write findings back, connect them to what they are about, read them before you traverse, and return when they were learned.
- **Return the path with the answer**: not a second query, not an explanation after the fact — just `nodes(path)` on the query that produced the result.

## What judges are looking for

- In all three tracks, judging comes back to whether **the graph is doing work the agent could not do without it**. A project where the graph is a store the agent occasionally reads from "is a project that any database would have served, and that reads immediately."
- The strongest demo move: run the same question twice — once with depth 1 (services directly upstream, looks like something a join could have done), then with depth 4, where the answer picks up a dependency three hops away that nobody on the team knew about, and the path explains exactly why it is there. "That contrast takes fifteen seconds and it makes the argument for the entire category."
- The second: ask the agent something that is **not in the graph** and let it say so. "An agent that returns 'nothing in the graph connects to this service, which may mean the dependency is not modelled' is more convincing than one that always has an answer, because everybody watching has been burned by the second kind."

## Key facts and numbers

- **Author**: Aayush Sharma, COO of WeMakeDevs — "COO - @WeMakeDevs | Running GTM events at scale for developer-first companies" (X, GitHub, LinkedIn, Website links).
- **Published**: October 15, 2026; **15 min** read; tags **hackathon / falkordb / wemakedevs**.
- **Event**: 4 days; closes **11:59 PM IST, 18 October**; online; solo or up to 4; **$20,000** across 3 tracks; all three track descriptions as listed above.
- **Demo**: Blast Radius on-call agent; 8 relationship patterns in the graph model; 4 questions; 4 answer outcomes; 6 tools; `depth` capped at **≤4**, `hours` at **≤168** (a week), `limit` at **≤20**.
- **Examples**: depth 1 → 3 services; depth 4 → 7 services, with `status-page` arriving 3 hops out through a refunds job; the recommended demo contrast takes ~15 seconds.
- **Stack**: Docker container (ports 6379/3000), Python 3.12, `falkordb` client, any LLM endpoint; `seed.py` + `uvicorn app:api --reload` to run.
- **Algorithms listed**: BFS, A\*, single-source paths, shortest path (SPpaths), PageRank, betweenness centrality, harmonic centrality, weakly connected components, label propagation (communities), minimum spanning forest, max flow.
- **Integrations named**: GraphRAG-SDK, QueryWeaver, Graphiti, Cognee, LangChain, LlamaIndex.
- **The five reusable techniques** and **the two judge-pleasing demo moves** (depth contrast; honest "not in the graph").

## Hackathon relevance

- This is the event organiser's own blueprint for every track: the Blast Radius design (fixed tool catalogue + validated arguments + memory nodes + path-carrying answers) satisfies Track 1 judging directly, and its patterns transfer to Tracks 2 and 3.
- Copy the four-outcome answer design ("answered with path", "from memory", "not in the graph", "unknown service") — refusal and honesty are explicitly praised by judges over always-having-an-answer.
- Use `nodes(path)` in every tool so the demo can show the path behind each answer — the exact thing the brief asks for.
- Model output validation (`accepts()` name check) is a cheap way to make an LLM agent demo trustworthy; the same trick protects any tool-calling agent.
- Tenant isolation via `db.select_graph(f"ops:{tenant_id}")` is the one-line pattern for the memory track's "separate memory per user or tenant" requirement.
- The recommended demo contrast (depth 1 vs depth 4 on the same question) is a ready-made script for the judging video.

## Related notes

- [event-graph-hacks.md](event-graph-hacks.md) — the event page: tracks, prizes, and the challenge this article is teaching.
- [event-rules.md](event-rules.md) — the rules this build is designed to comply with (graph must do real work, submission pack).
- [transcript-cyber-security.md](transcript-cyber-security.md) — the FalkorDB algorithms-in-action session (PageRank/max flow on security graphs) behind Problem 3.
- [docs-graph-algorithms.md](docs-graph-algorithms.md) — reference for `CALL algo.*`, SPpaths, PageRank and friends.
- [../../guide/11-hackathon-playbook.md](../../guide/11-hackathon-playbook.md) — the guide's compliance and winning checklist for this event.
