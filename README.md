# ctoai

The persistent project brain for any coding agent — file-first, graph-powered, MCP-native.

> **Status: `0.1.0` — Phase 1 complete.** Every command is implemented against the file-system store: scan, incremental index, the tool catalogue, append-only memory, the spec workflow, guards, and an MCP server. FalkorDB is the Phase 2 adapter behind the same interface. See the [roadmap](https://github.com/kintsugi-programmer/cto-ai/blob/main/Documents/project-notes/2026-10-18-cto-ai-implementation-roadmap.md).

## Install

The npm package is **`cto-ai`**; the command it installs is **`ctoai`**.

```bash
npx cto-ai --help        # run without installing
npm install -g cto-ai    # or install the `ctoai` command
```

Both `ctoai` and `cto-ai` work as commands once installed.

## Quick start

```bash
ctoai init          # scaffold .cto-ai/ and adopt any existing context
ctoai sync          # build the index (incremental, deterministic)
ctoai resume        # what is going on here, in one call
ctoai status        # coverage and health
```

`ctoai init` is idempotent: re-running it changes nothing and never duplicates the managed block in `AGENTS.md`.

## Commands

| Command | What it does |
|---|---|
| `init [--force]` | Scan the repo, scaffold `.cto-ai/`, import existing context, add the managed block to entry files. |
| `sync [--full] [--no-git]` | Rebuild the index incrementally from content hashes. Byte-identical when nothing changed. |
| `status` | Node/edge/type counts, coverage, staleness, open items, last sync time. |
| `resume [-n <limit>]` | Next up, active spec unit, recent decisions and findings, open questions. |
| `query <tool> [args]` | Run one catalogue tool. `--path --from --to --task --about --depth --limit`. |
| `record [kind]` | `session \| finding \| decision`, with `--text --body --about`. `--close` ends the open session. |
| `export --format <f> [--out dir]` | `six-file`, `handoff`, or `json`. |
| `import <source>` | Adopt a six-file folder or a planning transcript. |
| `guards <path>` | The rules and invariants that apply to a path, plus other protected files you have modified. |
| `check [--ci]` | Drift detection: modified files that trip a guard rule. Exits non-zero under `--ci`. |
| `spec [list\|next\|close] [unit]` | Build-plan workflow. `close` runs the unit's verify commands. |
| `connect [--url] [--backfill]` | Validate a FalkorDB endpoint, store non-secret settings, optionally push the index. |
| `mcp` | Run the MCP server over stdio. |

Every command accepts `--json` for a stable machine-readable schema, and `-C <dir>` to pick a project without `cd`-ing.

## Tools

Agents call tools; they never compose queries. Each tool validates its arguments, resolves them against the graph, and returns the path it walked plus an honest outcome: `answered`, `from-memory`, `not-indexed`, or `unknown`.

| Tool | Args | Answers |
|---|---|---|
| `blast_radius` | `path`, `depth<=4` | Everything that depends on a file or directory. |
| `why_connected` | `from`, `to`, `depth` | Shortest path between two artifacts, with every edge. |
| `load_bearing` | `limit<=20` | Most depended-upon files, by dependency PageRank. |
| `context_for` | `task`, `limit` | The relevant subgraph for a task (lexical seed + bounded traversal). |
| `recall` | `about`, `limit` | Findings, sessions, and decisions about something, newest first. |
| `timeline` | `path`, `limit` | Change and decision history for one artifact. |
| `islands` | `limit` | Disconnected clusters. |
| `communities` | `limit` | Module clusters by label propagation. |
| `guards` | `path` | Rules that apply to a path. |
| `status` | – | Coverage, health, and counts. |

## MCP

```bash
ctoai mcp
```

Registers the ten tools above plus `record`, so an agent can read context and write memory. Point your client at the command:

```json
{
  "mcpServers": {
    "ctoai": { "command": "npx", "args": ["-y", "cto-ai", "mcp"] }
  }
}
```

Before starting work, call `resume`. Before changing a protected path, call `guards`. When a decision is made, call `record`.

## Storage model

Three layers, one source of truth per artifact class. There is no bidirectional sync.

- **`context/`, `specs/`, `notes/`, `skills/`** — human-authored markdown. You own these.
- **`log/`** — append-only agent memory. One JSON file per session, finding, or decision; never rewritten, so no merge conflicts and full temporal history. The agent owns this.
- **`index/`** — derived, gitignored, disposable. `nodes.jsonl`, `edges.jsonl`, `hashes.json`, `health.json`. Rebuild it with `ctoai sync`.

Graph v0: 15 node types (`Project`, `Dir`, `File`, `Note`, `Meeting`, `Decision`, `Finding`, `Session`, `Episode`, `Requirement`, `Feature`, `Skill`, `Spec`, `Task`, `Person`) and 11 edge types (`CONTAINS`, `DEPENDS_ON`, `LINKS_TO`, `MENTIONS`, `ABOUT`, `DECIDED_IN`, `LEARNED_IN`, `PART_OF`, `SUPERSEDES`, `IMPLEMENTS`, `TOUCHED`).

Decisions are superseded, never deleted. A later decision about the same target gets a `SUPERSEDES` edge to the earlier one, so `recall` can show history instead of the latest value alone.

## Graph queries and algorithms

Every tool answer comes from a traversal or a graph algorithm, not from reading files. This section lists what the product depends on, per rule 10.

### Algorithms, and the tool each powers

| Algorithm | Tool | The question it answers |
|---|---|---|
| BFS, reverse, depth-capped, over `DEPENDS_ON` | `blast_radius` | everything that depends on a file, with the path walked |
| Shortest path (`algo.SPpaths`) | `why_connected` | how two artifacts connect, hop by hop |
| PageRank over dependency edges (`algo.pageRank`) | `load_bearing` | the files the project leans on most |
| Weakly connected components (`algo.WCC`) | `islands` | code or docs that nothing links to |
| Label propagation (`algo.CDLP`) | `communities` | module clusters |
| Bounded BFS from lexical seeds | `context_for` | the relevant subgraph for a task |
| Depth-capped reverse walk over `ABOUT` / `DECIDED_IN` | `timeline` | the history of one artifact |

### Cypher the FalkorDB adapter runs

The graph is one `Cto` label; node ids are the same stable keys the file store writes (`file:src/cli.ts`), which is what keeps the two stores at parity. Edges carry their type in a `rel` property so a single relationship pattern can be parameterised.

```cypher
-- schema: index the id we look everything up by
CREATE INDEX ON :Cto(id)

-- write: batch a snapshot in
UNWIND $rows AS row
CREATE (n:Cto)
SET n.id = row.id, n.kind = row.kind, n.name = row.name,
    n.props = row.props, n.createdAt = row.createdAt, n.updatedAt = row.updatedAt

-- write: one edge, idempotent on re-sync
MATCH (a:Cto {id: $from}), (b:Cto {id: $to})
MERGE (a)-[r {rel: $rel}]->(b)
SET r.props = $props

-- read: a node, and everything touching it
MATCH (n:Cto {id: $id})
RETURN n.id, n.kind, n.name, n.props, n.createdAt, n.updatedAt

MATCH (a:Cto {id: $id})-[r]->(b:Cto)
RETURN a.id, b.id, r.rel, r.props
```

Parameters travel as a `CYPHER key='value'` prefix, so no value is ever spliced into a query string.

### Mapping to FalkorDB's native algorithms

Each tool's algorithm has a FalkorDB equivalent, so graph mode can push the work into the database instead of computing it in-process:

| Tool | Algorithm | FalkorDB procedure |
|---|---|---|
| `blast_radius` | reverse, depth-capped traversal over `DEPENDS_ON` | variable-length `MATCH`, or `algo.BFS` |
| `why_connected` | shortest path between two nodes | `algo.SPpaths` (point to point) / `algo.SSpaths` (source to all) |
| `load_bearing` | PageRank over dependency edges | `algo.pageRank` |
| `islands` | weakly connected components | `algo.WCC` |
| `communities` | label propagation | `algo.CDLP` |
| `context_for` | bounded BFS from lexical seeds | variable-length `MATCH` with a depth bound |

All procedures are invoked as `CALL algo.<name>()` and return via `YIELD`; see the FalkorDB algorithm pages for each signature.

### Where the algorithms run

- **File mode (default, offline):** algorithms execute in-process over the JSONL index (`src/index/graph.ts`), capped at 50k nodes with a clear `INDEX_TOO_LARGE` error above that. No server, no account.
- **Graph mode (FalkorDB):** the same tools read from the graph, which is the shared memory substrate for every agent and machine. Pushing the traversals and rankings to the `algo.*` procedures above (roadmap Unit 2.3) is the next step; until it lands, graph mode reads the graph and the algorithms still run in-process.

File mode is deliberately the lite mode: no shared memory across machines, no temporal-validity queries, and a hard scale ceiling. It exists so `npx cto-ai` works in any repo with zero setup — not as an equivalent to the graph.

## FalkorDB

File mode is the honest default: no account, no server, works offline. `ctoai connect` upgrades to the graph.

```bash
export FALKORDB_URL=redis://localhost:6379   # or rediss:// for FalkorDB Cloud
export FALKORDB_PASSWORD=falkordb
ctoai connect --backfill
```

Credentials stay in env vars; `config.json` stores only the URL, graph name, and user. The adapter speaks RESP directly, so there is no client-library dependency.

## Development

```bash
npm install
npm run verify        # lint + typecheck + test + build
node dist/cli.js --help
```

If the `ctoai` command goes missing or looks stale after changes, rebuild and re-link:

```bash
npm run build && npm link
```

## Layout

- `src/cli.ts` — the command surface (commander).
- `src/core/` — config, paths, errors with stable codes, the append-only event log, deterministic JSON.
- `src/scan/` — gitignore-aware walker, import scanner, markdown scanner.
- `src/index/` — the index builder and the in-memory graph algorithms.
- `src/tools/` — the fixed tool catalogue and the `ToolContext` every tool receives.
- `src/commands/` — one module per command.
- `src/spec/` — the spec-driven build-plan workflow.
- `src/project/` — opening a project: config, store selection, event log.
- `src/stores/` — `file/` (JSONL) and `falkor/` (Cypher over RESP).
- `tests/` — vitest suites: scanner, graph, tools, events, and command integration.

## License

MIT


# cto-ai guide

Working repo for the **Graph Hacks: Context for AI Agents** hackathon (powered by FalkorDB), team `cto-ai`. It also hosts **`ctoai`**, the CLI tool built out of this project — source in `cli/`.

## The ctoai package

`cli/` contains **`ctoai`**, the persistent project brain for any coding agent: file-first, graph-powered, MCP-native. See the product review and implementation roadmap in `Documents/project-notes/`.

- **Status:** `0.1.0` — Phase 1 complete. Every command is implemented against the file-system store, with a FalkorDB adapter ready for Phase 2.
- **Try it:** `cd cli && npm install && npm run build && node dist/cli.js --help`.
- **npm name:** published as **`cto-ai`** (the binary is `ctoai`). The unscoped name `ctoai` is blocked by npm's typosquatting guard — it is too close to `chai` and `btoa`. Publish with `cd cli && npm publish --access public`.

## Beginner guide

A short course for absolute beginners lives inside the resource collection at `Documents/guide/`. Each file reads in 2-3 minutes and includes a diagram. Start at `00-start-here.md`.

- **Foundations**
  - `01-graph-databases.md` - nodes, edges, and why connections matter.
  - `02-falkordb.md` - what FalkorDB is and how it works.
- **Hands-on basics**
  - `03-run-falkordb.md` - Docker, Docker Compose, Cloud, and the Browser.
  - `04-cypher-basics.md` - the query language, from CREATE to MATCH.
  - `05-python-client.md` - connect, query, and bulk-load from Python.
  - `06-writing-good-cypher.md` - PROFILE, indexes, and UDFs.
- **AI concepts**
  - `07-rag-and-graphrag.md` - embeddings, RAG, and why graphs fix retrieval.
  - `08-graphrag-sdk.md` - ingest documents and get cited answers.
- **Agent patterns**
  - `09-graph-algorithms.md` - PageRank, shortest path, and more as agent tools.
  - `10-agent-memory.md` - memory across sessions and between agents.
- **Project work**
  - `11-hackathon-playbook.md` - tracks, rules, and a build checklist.
  - `12-resources-map.md` - every saved resource and where it lives.
- **Build and ship**
  - `13-agent-tools-and-mcp.md` - a fixed tool catalogue, argument checks, and MCP.
  - `14-demo-and-submission.md` - judges, demo moves, and the submission pack.
  - `15-building-from-scratch.md` - a blueprint, division, and systems approach to any build.

## Repository layout

- `Documents/`
  - `guide/` - the 16-module beginner course (start at `guide/00-start-here.md`).
  - `Hackathon-resources/` - raw resources (docs, transcripts, links) plus `automated-notes/`, one processed note per resource.
  - `project-notes/` - working notes while building, starting with the finalized cto-ai product review.
- `cli/` - the `cto-ai` npm package (TypeScript CLI: source, tests, build).

## Hackathon resources

Everything below lives in the relative directory `Documents/Hackathon-resources/`.

Processed, linked notes for every item below live in `Documents/Hackathon-resources/automated-notes/` - start at its `README.md`.

Event pages (saved web pages)
- The hackathon landing page for this event (tracks, prizes, schedule, rules, resources, submission form). — `Graph Hacks_ Context for AI Agents _ WeMakeDevs.mhtml`
- The event Rules page - the full 18 rules, including the graph removal test, the six-item submission pack, and the AI-assistant disclosure requirement. — `Rules _ Graph Hacks_ Context for AI Agents _ WeMakeDevs.mhtml`
- The event Resources page - the organisers' curated build list (start here, setup, querying and data, examples, videos). — `Resources _ Graph Hacks_ Context for AI Agents _ WeMakeDevs.mhtml`
- The project submission form - the 8 questions, required fields, and what the demo video and repository entries expect. — `Submit a project _ Graph Hacks_ Context for AI Agents _ WeMakeDevs.mhtml`

FalkorDB official documentation (saved web pages)
- FalkorDB documentation home — what the database is and how the docs are organized. — `FalkorDB Documentation _ Graph Database for GraphRAG & GenAI - FalkorDB Docs.mhtml`
- Getting started guide: installation, data modeling, and running queries. — `Getting Started with FalkorDB_ Installation, Modeling & Queries - FalkorDB Docs.mhtml`
- How to deploy FalkorDB with Docker and Docker Compose. — `Deploy FalkorDB with Docker and Docker Compose - FalkorDB Docs.mhtml`
- FalkorDB Browser: the visual graph exploration and query interface. — `FalkorDB Browser_ Visual Graph Exploration and Query Interface - FalkorDB Docs.mhtml`
- Official client libraries for Python, JavaScript, Java, Go, and Rust. — `FalkorDB Client Libraries_ Python, JavaScript, Java, Go, Rust - FalkorDB Docs.mhtml`
- Integrations: drivers, frameworks, and data pipelines that connect to FalkorDB. — `FalkorDB Integrations_ Drivers, Frameworks, and Data Pipelines - FalkorDB Docs.mhtml`
- Cypher query language reference for FalkorDB. — `Cypher Query Language Reference for FalkorDB - FalkorDB Docs.mhtml`
- Graph algorithms in FalkorDB for high-performance network analysis. — `Graph Algorithms in FalkorDB_ High-Performance Network Analysis - FalkorDB Docs.mhtml`

FalkorDB repos, Docker, and cloud (saved web pages)
- FalkorDB's main GitHub repo page (fast GraphBLAS-based graph database for GraphRAG). — `FalkorDB_FalkorDB_ A super fast Graph Database uses GraphBLAS under the hood for its sparse adjacency matrix graph representation. Our goal is to provide the best Knowledge Graph for LLM (GraphRAG)..mhtml`
- The GraphRAG-SDK GitHub repo page (build GenAI apps with GraphRAG at scale). — `FalkorDB_GraphRAG-SDK_ Build fast and accurate GenAI apps with GraphRAG SDK at scale 🌟.mhtml`
- The FalkorDB `benchmark` GitHub repo page (a tool to benchmark/compare graph databases). — `FalkorDB_benchmark_ A benchmarking tool to evaluate and compare the performance of graph databases with customizable workloads and metrics..mhtml`
- Docker Hub page for the `falkordb/falkordb` image. — `falkordb_falkordb - Docker Image.mhtml`
- FalkorDB Cloud sign-in page. — `Sign In.mhtml`
- FalkorDB Cloud sign-up page. — `Sign up.mhtml`

Blog posts and articles (saved web pages)
- Benchmarks comparing FalkorDB vs Neo4j graph database performance. — `FalkorDB vs Neo4j_ Graph Database Performance Benchmarks.mhtml`
- Explainer on what GraphRAG is, its types, limitations, and when to use it. — `What is GraphRAG_ Types, Limitations & When to Use.mhtml`
- FalkorDB community projects built with GraphRAG and knowledge graphs. — `GraphRAG & Knowledge Graphs Community Projects _ FalkordB.mhtml`
- WeMakeDevs tutorial: how to build an agent that reasons over a graph, with a complete on-call demo app (Blast Radius), Cypher queries, tool catalogue, and judging advice. — `How to Build an Agent That Reasons Over a Graph _ WeMakeDevs.mhtml`

Link list
- A curated list of the hackathon/FalkorDB links: docs, GitHub repos, YouTube webinar recordings, and blog posts. — `Links.txt`

Webinar and video transcripts (plain text)
- Interview on "Context for AI agents" with LJ (founder of CocoIndex) covering context/graph layers for agents and the FalkorDB + CocoIndex connector. — `Transcript.txt`
- "Graph & RAG" webinar: building and architecting agentic memory with graphs, plus the open-source QueryWeaver natural-language-to-SQL project. — `Transcript copy 14.txt`
- "Graph & RAG" 5th installment: guest Yoi (VC) demos knowledge-graph projects VCPedia and Fractal KG and how he builds them. — `Transcript copy 16.txt`
- "Graph & RAG" 6th installment: guest Daniel (founder of Zep/Graphiti) on building knowledge graphs for agent memory. — `Transcript copy 15.txt`
- "Graph & RAG" workshop on cluster scale-out and multi-tenancy, delivered by FalkorDB CTO Roy Litman. — `Transcript copy 17.txt`
- Workshop on natural language to SQL/Cypher using LLMs, covering Ponder Labs, dbt, and Zep's Graphiti as agent memory. — `Transcript copy 13.txt`
- Deep dive on the GraphRAG SDK 1.0 release: why standard RAG pipelines fail and how knowledge graphs help. — `Transcript copy 11.txt`
- AMA and product news, including new graph algorithms (e.g. Minimum Spanning Tree) and how they're built with sparse linear algebra. — `Transcript copy 12.txt`
- Workshop on writing efficient Cypher queries (latency, throughput, memory). — `Transcript copy 18.txt`
- Duplicate of the efficient-Cypher-queries workshop transcript. — `Transcript copy 6.txt`
- Webinar on graph algorithms for cyber security, modeling ransomware (e.g. WannaCry) spread over a network. — `Transcript copy 2.txt`
- Duplicate of the graph-algorithms-for-cyber-security webinar transcript. — `Transcript copy 5.txt`
- Walkthrough on building a form-to-table use case with user-defined functions (UDFs) in FalkorDB. — `Transcript copy 3.txt`
- Walkthrough of setting up a FalkorDB Cloud Free instance. — `Transcript copy 10.txt`
- Walkthrough of setting up a FalkorDB Cloud Startup instance. — `Transcript copy 9.txt`
- Walkthrough of setting up a FalkorDB Cloud Pro instance. — `Transcript copy 8.txt`
- Walkthrough of setting up a FalkorDB Cloud Enterprise instance. — `Transcript copy 7.txt`
- Talk on the FalkorDB-native Snowflake app (graph analytics in Snowflake, zero-ETL, flight-path demo). — `Transcript copy.txt`
- Duplicate of the FalkorDB-native Snowflake app talk transcript. — `Transcript copy 4.txt`
- A developer's on-camera build of a full-stack app from scratch (blueprint, division, systems, problem triage) with all the real failures left in. — `Transcript copy 19.txt`
