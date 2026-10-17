# cto-ai — Final Product Review

> **Finalized:** October 18, 2026 · **Team:** cto-ai (code `25F934`) · **Event context:** Graph Hacks: Context for AI Agents (WeMakeDevs, powered by FalkorDB) · **Status:** idea frozen. This file supersedes the former `Documents/ideas/` folder (removed on finalization) and is the single record of the concept.

## One-liner

**cto-ai is the persistent project brain for any coding agent** — a context-recognition, folder-based network for any codebase. File-first, graph-powered, MCP-native. It gives every agent (opencode, Claude Code, Cursor, anything that speaks MCP) a memory that outlives sessions and machines, and answers the connected questions that reading files cannot.

The problem it kills: **context rot / AI amnesia.**

- Agents see pieces, not the whole picture.
- They lose earlier sessions, miss how things relate, and cannot explain choices.
- Context does not travel between machines.

Secondary problems it kills: no shared project memory across a team, no traceable decisions, no queryable progress, and no way to ask "what breaks if I change this?" without reading half the repo.

## Verdict

Strong instinct, right pain, and a direct fit for the event brief ("Agents are only as good as the context they work with"). The idea is sound but was originally three products in one trench coat; the finalization below locks the cuts that make it buildable.

**What is genuinely strong**

- The pain is real and named. The event brief says "agents see pieces, not the whole picture"; the GraphRAG SDK 1.0 session concludes "the harness matters more than the model." cto-ai is the harness.
- File-first, graph-upgrade is the right adoption ladder: `npx cto-ai` works in any repo with zero signup; FalkorDB is the power mode. This kills the "another account to create" friction that kills most dev tools.
- Multi-machine synergy is a real differentiator files cannot fake: one shared graph as the memory substrate beats git-merging memory files, and it is a genuine Track 02 story.
- It is demoable through graph work: "what breaks if I change this file?" is the Blast Radius pattern from the event tutorial, applied to a codebase.
- The npm name `cto-ai` is free (verified Oct 18: `cto-ai` and `ctoai` return 404; `cto-ai-cli` is taken). The package name doubles as the team identity.

**The four traps, and their resolutions**

| Trap | Resolution |
|---|---|
| "Replace coding agents, session management, everything." | Do not fight the agents. Be the layer they all plug into: **the persistent project brain for any coding agent**, MCP-native. Agents change; the brain persists. |
| True bidirectional file ↔ graph sync. | Split the source of truth by artifact class (below). Explicit `export` / `import` commands instead of silent two-way merges. |
| Removal test (event rule 3): "if the product still works with FalkorDB removed, the graph is decoration." | Define a capability split where **graph-only features are the heart of the product** and file mode is explicitly the degraded solo mode. |
| Scope: sessions + skills + PRD + progress + code map + notes + meetings + two backends + onboarding + conversion + multi-machine. | MVP ladder (L0–L3 below). v1 cuts ~80% of that; the full list is the L3 roadmap, not the build. |

## Locked positioning decisions

- **Be a layer, not a replacement.** cto-ai does not generate code, host a chat UI, or compete with coding agents. It stores and serves project context to any agent. *Rules out:* building an agent/model, per-agent bespoke integrations as core strategy.
- **MCP is the integration seam.** Every capability is exposed as a tool over MCP (plus a CLI for humans). *Rules out:* vendor-locked integrations to a single agent.
- **File-first, graph-upgrade.** Without FalkorDB, same command surface in file mode with degraded capabilities; `cto-ai connect` upgrades to the graph. *Rules out:* requiring an account to try the tool.
- **SSOT split, no bidirectional sync in v1** (table below). *Rules out:* silent two-way merges, last-write-wins conflicts.
- **Graph-only capabilities are the product's heart.** Semantic + graph hybrid retrieval, multi-hop traversal at scale, algorithms, temporal validity, cross-machine shared memory — all graph-only. *Rules out:* calling the file backend "equivalent"; it is explicitly labeled lite/degraded.
- **Stack:** TypeScript CLI published as `cto-ai` (binary `cto-ai`), `falkordb-ts` client, MCP TypeScript SDK. Node ≥ 20. *Rules out:* a Python-first core (Python only appears as an optional integration, e.g., GraphRAG-SDK sidecar ingestion).

## What cto-ai stores ("everything")

| Artifact (original ask) | Node types | Lifecycle |
|---|---|---|
| Session history | `Session`, `Episode` | Agent-generated, graph-first; exported on demand |
| Skills | `Skill` | Versioned procedural memory; usage tracked |
| PRD | `Requirement`, `Feature` | Human-authored in files; extracted into graph |
| Progress | `Task`, status events | Mixed; agent findings graph-first, statuses mirrored |
| Codebase details | `Dir`, `File`, `Module`, `Symbol` | Derived from repo (rules-first) |
| User notes | `Note` | Human-authored files, extracted into graph |
| Meeting notes | `Meeting`, `Decision`, `Person` | Human-authored files → extracted |
| Decisions | `Decision` | Supersede, never delete (temporal) |
| Findings | `Finding` | Agent-generated, graph-first |

## Core flows

1. **`cto-ai init`** — scan the repo; if notes/context exist that are not cto-ai format, map them into the cto-ai model and create the `.cto-ai/` folder with the relevant subfolders. If cto-ai already exists, refresh/verify instead. *"Map the codebase out in its own way."*
2. **`cto-ai sync`** — incremental, hashed file → graph indexing (tree, markdown links, imports, git log; LLM only for prose artifacts). Seconds, not rebuilds.
3. **`cto-ai query` / MCP tools** — the fixed tool catalogue (below). Agents call tools; they never freehand Cypher.
4. **`cto-ai record`** — write findings, sessions, decisions back (memory is more nodes).
5. **`cto-ai export` / `import`** — portable, reviewable, offline-capable. This *is* the "convert between file and graph" feature, made explicit.
6. **`cto-ai connect`** — FalkorDB onboarding: deep-link to signup/signin, take endpoint + credentials, validate with a ping, create/select the project graph, backfill. Signup itself cannot be automated; it is guided.

### Proposed `.cto-ai/` layout

```text
.cto-ai/
├── config.json          # backend: files | falkordb; endpoint and settings (no secrets)
├── context/             # generated human-readable context
│   ├── prd.md
│   ├── progress.md
│   └── skills/
├── sessions/            # session snapshots when exported
├── notes/               # user + meeting notes (source of truth)
├── index/               # local adjacency index for file mode
└── export/              # graph → file exports
```

Secrets live in environment variables (`FALKORDB_URL`, `FALKORDB_USER`, `FALKORDB_PASSWORD`) or a gitignored `config.local.json`; never committed.

### Source-of-truth split (no bidirectional sync)

| Artifact class | Source of truth | Other side's role |
|---|---|---|
| Code, docs, user/meeting notes (hand-edited, git) | Files | Derived, incremental index in the graph |
| Sessions, findings, decisions, progress (agent-generated) | FalkorDB graph | `cto-ai export` writes `.cto-ai/` snapshots on demand |

Principles borrowed from the resource collection (CocoIndex): *"the target is a function of source"*; memoization and state diffs; update only what changed (~seconds).

### File mode: lite, and honest about it

- Same commands work offline: a local adjacency index (`.cto-ai/index/`) powers approximate BFS / shortest-path / PageRank-lite on small graphs, clearly labeled.
- Missing in file mode: semantic/vector and full-text indexes, temporal validity, cross-machine shared memory, large-graph performance, graph-only algorithms (PageRank at scale, communities, MaxFlow, A\*, MSF).
- This split is deliberate so the graph genuinely does the work (event rule 3): the graph is the engine; files are the portable, degraded fallback and export format.

## Architecture

```text
Collector            Extractor                 Store adapters        Query layer            Agent integrations
─────────            ─────────                 ──────────────        ───────────            ──────────────────
file tree            rules-first:              FileStore             fixed tool catalogue   MCP server (stdio/http)
markdown links       imports, links, git log   (.cto-ai/)            (human-written         CLI for humans
git history          LLM only for prose:       FalkorStore           Cypher, typed args,    session hooks
notes / meetings     structured outputs        (Cypher via           validated against      (agent plugins)
PRD / progress       + enums                   falkordb-ts)          the graph)
```

- One **logical schema**, two store adapters; `export`/`import` move between them.
- Incremental sync: content hashes + memoized extraction; per-file change detection; batch limits respected (GraphRAG SDK lesson: `finalize` is O(graph size), embed/backfill is O(change size)).
- Per-project isolation via FalkorDB multi-tenancy: one graph per project (`select_graph`), thousands of graphs per instance.

### Graph schema

- **Nodes:** `Project`, `Dir`, `File`, `Module`, `Symbol`, `Feature`, `Requirement`, `Decision`, `Task`, `Session`, `Episode`, `Finding`, `Note`, `Meeting`, `Person`, `Skill`.
- **Edges:** `CONTAINS`, `DEPENDS_ON` / `IMPORTS`, `IMPLEMENTS`, `DECIDED_IN`, `DECIDED_BY`, `MENTIONS`, `TOUCHED`, `PART_OF`, `SUPERSEDES` (invalidate, never delete), `ABOUT`, `LEARNED_IN`.
- **Provenance:** every extracted claim links back to its source file/chunk (`MENTIONED_IN`-style), so answers can cite their trail.
- **Temporal:** `valid_at` / `invalid_at` (world time) + `created_at` / `expired_at` (system time), the Graphiti bi-temporal model — facts change; history is kept.

## Tool catalogue (MCP + CLI)

Fixed catalogue, typed arguments, every argument resolved against the graph before anything runs (Blast Radius pattern). The model chooses tools; it never composes queries; every answer returns the path it walked.

| Tool | Args | Semantics |
|---|---|---|
| `blast_radius` | `path`, `depth<=4` | Everything that depends on a file/module (variable-length `DEPENDS_ON`), hops + path returned |
| `why_connected` | `from`, `to` | Shortest path between two artifacts (`algo.SPpaths`), path returned |
| `load_bearing` | `limit<=20` | Most depended-upon files/modules (PageRank over dependency edges) |
| `communities` | – | Module/feature clusters (WCC / CDLP) |
| `context_for` | `task` | The relevant subgraph for a task: vector + full-text search seed, then bounded traversal |
| `recall` | `feature` | Findings/sessions/decisions about something, newest first, with dates |
| `timeline` | `module` | Change/decision history for an artifact |
| `record` | `kind`, `text`, `about` | Write finding/session/decision back to memory |

## Algorithm → feature mapping

| Algorithm | Feature it powers |
|---|---|
| PageRank | `load_bearing` — the files that carry the project |
| SPpaths / BFS / SSpaths | `why_connected`, blast radius with paths and depth caps |
| WCC / CDLP | `communities` — module clusters, "islands" detection |
| MSF | Connected-components view for change planning |
| Betweenness / Harmonic | (later) bottleneck and connector analysis |
| MaxFlow | (later) capacity/budget-style questions over weighted graphs |

Every call goes through `CALL algo.<name>()` with `nodeLabels`/`relationshipTypes` scoping, results via `YIELD`.

## Reusable patterns already in this repo's resources

- **Blast Radius tutorial** — fixed tool catalogue, validated arguments, path-on-answer, four honest answer outcomes ("answered with path", "from memory", "not in the graph", "unknown"), write-back memory nodes.
- **GraphRAG SDK** — document ingestion to cited answers, default ontology (11 concepts), incremental updates (`apply_changes`, O(change) embed backfill), abstention when evidence is insufficient.
- **Graphiti** — bi-temporal edges, invalidate-don't-delete, episodes; FalkorDB is the default graph provider for Graphiti's MCP server (fast integration path).
- **CocoIndex** — incremental freshness architecture: declare, memoize, side-effect tracking; only changed data reprocessed (~5 seconds in their demo).
- **QueryWeaver** — schema-as-graph traversal: find entry points for the question, extract only the relevant connected subgraph (directly reusable for `context_for`).
- **Efficient Cypher workshop** — `count(a)` not `count(1)`, barrier clauses (`WITH`), index what you filter, return only needed fields, parameters as reusable templates, expand from the small side of a pattern.

## MVP ladder

**L0 — hackathon slice (buildable in remaining hours, if submitting)**

1. `cto-ai init` on a repo; rules-only index (file tree + markdown links + git log) — no code parsing needed for the first demo.
2. FalkorDB Cloud free instance; push graph; credentials via env; `cto-ai connect` guidance.
3. Five MCP tools: `blast_radius`, `why_connected`, `load_bearing`, `recall`, `record`.
4. Wire into one agent (e.g. opencode) and demo on **this repo** (60+ interlinked markdown files — a perfect corpus; dogfood it).
5. Demo moves: same question at depth 1 vs depth 4 with paths on screen; one honest "not in the graph" answer.
6. Submission pack: public repo, README (setup + graph model + queries), YouTube demo, live deployment (cloud instance), tracks named, AI disclosure.

**L1 — weeks after:** incremental sync polish, auto session capture, `export`/`import`, connect wizard, skill registry.

**L2 — months:** temporal invalidation in the UI, multi-machine presence, dashboards, more algorithms (MSF, MaxFlow), Graphiti integration for session memory.

**L3 — the full vision:** all artifact types, cross-agent handoffs, company-scale multi-tenant deployment — the "everything" version.

## Hackathon compliance (if submitted)

- **Tracks:** enter **Track 02 (Agent Memory and Coordination)** and **Track 03 (Company Brain)**. Track 01 (Connected Data) only if the code-graph algorithms become the demo centerpiece — do not dilute.
- **Removal test (rule 3):** graph-only capabilities are the core (multi-hop at scale, algorithms, semantic + graph hybrid, temporal memory, cross-machine). File mode is the degraded solo mode, not a full-fidelity alternative.
- **Submission pack (rule 10):** public repo, README with setup + graph model, the Cypher queries/algorithms the product depends on, YouTube demo video, live deployment (FalkorDB Cloud) or complete local setup, every entered track named.
- **AI disclosure (rule 11):** disclose assistant use; be ready to explain the graph model, queries, and architecture (rules 12–13).
- **New work (rule 8):** this repo's notes/diagrams are compliant prep; the cto-ai implementation itself must be new work completed during the event.

## Competitive landscape

- AGENTS.md / CLAUDE.md memory files — flat, no traversal, no cross-machine.
- mem0 / Letta / Cipher — agent memory SaaS, not codebase-first.
- Zep / Graphiti — temporal memory library (integration partner, not competitor).
- Cursor memories / vendor memory — locked to one agent.

Nobody visibly owns **"the project's brain as a queryable, portable graph across machines and agents."** That is the wedge.

## Risks register

| Risk | Mitigation |
|---|---|
| Scope explosion | MVP ladder; L0 is one vertical slice |
| Extraction quality from prose | Structured outputs + enums; default ontology; rules-first where possible |
| LLM cost/latency on ingestion | Small frontier-derived models; hashing/memoization; batch `finalize` |
| Two-way sync complexity | Eliminated in v1 by SSOT split |
| Credential handling | Env vars / gitignored local config; documented setup |
| Removal-test optics | Capability split; demo leads with graph-only features |
| Adoption friction | File-first mode; one-line `npx cto-ai` |

## Open items

1. **Timeline:** is the L0 slice being submitted for Graph Hacks (deadline Oct 18, 11:59 PM IST) or is this a post-event build? (Ops 1–6 above assume "yes, submit".)
2. **Team:** currently 1 of 4 seats filled — solo run or fill seats before submitting? (Team is locked after submission.)
3. **Stack confirmation:** TypeScript CLI + `falkordb-ts` + MCP TS SDK as assumed?
4. **npm:** claim `cto-ai` on npm (and consider the GitHub org) before someone else does.

## Next steps

- If submitting: cut L0 to the bones, build `init` + 5 tools against this repo, record the depth-1-vs-depth-4 demo, file the submission pack, disclose AI use.
- Either way: reserve the npm name, scaffold the CLI, and write the schema into `sync` as the first real code.
