# cto-ai — File-System-First Implementation Roadmap

> **Date:** October 18, 2026 · **Companion:** `2026-10-18-cto-ai-product-review.md` (positioning, locked decisions, schema, tool catalogue) · **Thesis of this phase:** build the entire cto-ai engine against a pure file system first. FalkorDB is a store adapter added in Phase 2, not a prerequisite. Same commands, same tool catalogue, same schema in both eras — only the store changes.

## 1. What we can do (file-system era capabilities)

Everything below runs with zero external services, offline, committed to git. The graph era swaps implementations behind the same interface; it does not change the product surface.

| Capability | File-system era (now) | Graph era (later) |
|---|---|---|
| `init` — scan a repo, map existing context into cto-ai | Yes | Same |
| Context file generation (six-file compatible) | Yes | Same |
| Entry-file sync (`AGENTS.md` / `CLAUDE.md` / `.cursorrules`) | Yes | Same |
| Incremental index (hash-based, only changed files) | Yes | Same |
| `blast_radius`, `why_connected`, `load_bearing`, islands/communities, `recall`, `timeline`, `guards`, `resume` | Yes — in-process algorithms, lite, small/medium graphs | At scale via `CALL algo.*` |
| Semantic search | Optional brute-force cosine (small repos, clearly labeled lite) | Real vector index |
| Full-text search | Simple lexical scoring | RediSearch |
| Temporal memory (supersede, don't delete) | Timestamps in event logs | `valid_at` / `invalid_at` queries |
| Spec workflow + verification recording | Yes | Same |
| Drift detection + guardrails | Yes (glob rules, coverage, boundary checks) | Same + cross-project |
| Multi-machine synergy | Via git (each machine rebuilds the index) | One shared graph, real-time |
| Scale ceiling | ~50–100k nodes comfortable in Node.js memory | Millions |

**Explicit non-goals for now:** symbol-level parsing/LSP, real-time collaboration, a server/daemon (MCP stdio only), embeddings by default, a web UI, huge monorepos.

## 2. Locked technical decisions for this phase

- **Repo split:** the implementation gets its own public repo named `cto-ai`. THIS docs repo stays docs-only (AGENTS.md forbids code here) and remains the planning/submission record.
- **Package:** single npm package `cto-ai` (binary `cto-ai`), TypeScript strict, ESM, Node ≥ 20. MIT license.
- **Tooling:** build with `tsup`, tests with `vitest`, lint/format with **Biome** (fast, one tool) — or ESLint + Prettier if preferred; pick one and lock it. CLI framework: **commander** (boring and battle-tested). Interview UX: **@clack/prompts**.
- **Parsing libraries:** `gray-matter` (frontmatter), `fast-glob`, `ignore` (gitignore semantics), `yaml`. Import scanning starts as a deterministic per-language line scanner (`import … from`, `require(…)`, `from x import y`); a real parser per language is a later upgrade behind the same interface.
- **Identifiers:** stable, human-readable keys — `file:src/index.ts`, `dir:src`, `note:context-architecture`, `spec:03`, `session:2026-10-18T20-10-a1b2`, `finding:<hash8>`.
- **Storage model (three layers, one SSOT rule):**
  - **Human-authored sources = SSOT:** `.cto-ai/context/`, `specs/`, `notes/`, `skills/` (markdown, git-diffable).
  - **Agent events = SSOT, append-only:** `.cto-ai/log/` — one JSON file per event (never rewritten, no git merge conflicts, full temporal history for free).
  - **Index = derived, disposable, gitignored:** `.cto-ai/index/` (`nodes.jsonl`, `edges.jsonl`, `hashes.json`, `health.json`) — deterministically rebuildable, sorted, hash-incremental.
- **Adapter from day one:** a `KnowledgeStore` interface; `FileStore` implements it now, `FalkorStore` implements it in Phase 2. Every tool talks to the interface, never to the filesystem directly.
- **Machine-first output:** every command supports `--json` with stable schemas; pretty output for humans.

### `.cto-ai/` layout (v0, refines the sketch in the product review)

```text
.cto-ai/
├── context/            # human-authored project context (six-file compatible)
│   ├── project-overview.md
│   ├── architecture.md
│   ├── code-standards.md
│   ├── ai-workflow-rules.md
│   ├── ui-context.md
│   └── progress-tracker.md
├── specs/              # spec-driven build plan + unit specs
│   ├── 00-build-plan.md
│   └── 01-....md
├── notes/              # user + meeting notes
├── skills/             # procedural memory (agent skills, conventions)
├── log/                # append-only agent memory; one JSON file per event
│   ├── sessions/<timestamp>-<machineid>.json
│   ├── findings/<timestamp>-<machineid>.json
│   └── decisions/<timestamp>-<machineid>.json
├── index/              # derived, gitignored
│   ├── nodes.jsonl
│   ├── edges.jsonl
│   ├── hashes.json
│   └── health.json
├── config.json         # settings (no secrets)
└── README.md           # how this folder works
```

Plus a marker-delimited managed block in root `AGENTS.md` / `CLAUDE.md`:

```markdown
<!-- cto-ai:begin -->
This project uses cto-ai for project context. Run `npx cto-ai resume`
or call the `resume` tool over MCP before starting work.
<!-- cto-ai:end -->
```

### Node/edge schema (v0 — a subset of the full review schema)

- **Nodes emitted now:** `Project`, `Dir`, `File`, `Note`, `Meeting`, `Decision`, `Finding`, `Session`, `Episode`, `Requirement`, `Feature`, `Skill`, `Spec`, `Task` (spec checkboxes), `Person`.
- **Edges emitted now:** `CONTAINS`, `DEPENDS_ON`, `LINKS_TO`, `MENTIONS`, `ABOUT`, `DECIDED_IN`, `LEARNED_IN`, `PART_OF`, `SUPERSEDES`, `IMPLEMENTS`, `TOUCHED`.
- `Symbol` nodes and deeper code relations are deferred.

## 3. The roadmap — phases, units, acceptance criteria

A "session" below = one focused 2–4 hour block. Estimates are for a solo developer. Every unit follows the working rules in Section 5.

### Phase 0 — Foundation (1–2 sessions)

**Unit 0.1 — Repo + CLI skeleton**
- Create the public `cto-ai` repo; `npm init`; TS strict, ESM, tsup, vitest, Biome; `bin: { "cto-ai": "dist/cli.js" }`.
- Stub every command: `init`, `sync`, `status`, `resume`, `query`, `record`, `export`, `import`, `guards`, `spec`, `mcp`, `connect`.
- GitHub Actions: lint + test + build on every push.
- ✅ **Done when:** `node dist/cli.js --help` lists all commands; CI green; `npm pack` produces an installable tarball; version `0.0.1`.

**Unit 0.2 — Core types + store interface**
- `src/core/schema.ts`: zod schemas for every node/edge; `src/core/store.ts`: `KnowledgeStore` interface.
- `src/stores/file/` skeleton: read/write `nodes.jsonl` + `edges.jsonl`, sorted and deterministic.
- ✅ **Done when:** a roundtrip test (write → read → identical) passes; adding a second store later requires no tool changes (interface test).

### Phase 1 — The file engine (8–11 sessions)

**Unit 1.1 — `cto-ai init` (scan + scaffold)**
- Scan with gitignore semantics; detect existing context (six-file `context/`, `CLAUDE.md`/`AGENTS.md`, `specs/`) and show an import plan.
- Create `.cto-ai/` skeleton; write `config.json` + `README.md`; add the managed block to `AGENTS.md` (idempotent).
- Imported six-file docs are copied into `.cto-ai/context/` with a provenance note; originals stay untouched.
- Optional `--interview` mode (defer to Unit 1.8 if needed).
- ✅ **Done when:** on three fixture repos (empty, plain code, six-file context) `init` produces a deterministic tree + summary; re-running changes nothing.

**Unit 1.2 — Scanner + incremental indexer (rules-first)**
- File tree → `Dir`/`File` + `CONTAINS`; import scan → `DEPENDS_ON`; markdown link scan → `LINKS_TO`; `context/`, `specs/`, `notes/` parsing (frontmatter + headings) → `Requirement`/`Feature`/`Decision`/`Note`/`Spec`.
- `hashes.json` drives incremental rebuilds; output fully sorted and deterministic.
- ✅ **Done when:** on this docs repo (60+ markdown files) a full index builds in <2s; touching one file makes `sync` reprocess only that file; two consecutive builds are byte-identical.

**Unit 1.3 — Local algorithm engine (lite)**
- Build an in-memory adjacency from `edges.jsonl`; implement BFS/DFS, shortest path (unweighted + weighted), reverse BFS with depth cap (blast radius), PageRank (power iteration), weakly connected components, label propagation communities (optional).
- Hard caps (`--max-nodes`, default 50k) with a clear error instead of a hang.
- ✅ **Done when:** unit tests on fixture graphs; `blast_radius --depth 1` vs `--depth 4` returns different service sets with paths; PageRank ranks a known hub file first; islands find a disconnected doc set.

**Unit 1.4 — Tool catalogue v0**
- Pure functions over the store: `resume`, `context_for`, `blast_radius`, `why_connected`, `load_bearing`, `islands` (communities later), `recall`, `timeline`, `guards`, `status`, `record`.
- CLI surface: `cto-ai query <tool> [args] --json`, plus first-class aliases (`cto-ai resume`, `cto-ai status`, `cto-ai guards <path>`).
- ✅ **Done when:** every tool has unit tests + snapshot outputs on fixtures; JSON schemas documented in the README.

**Unit 1.5 — MCP server**
- `cto-ai mcp` over stdio; zod schemas → JSON schemas; documented snippets for opencode and Claude Code.
- ✅ **Done when:** an MCP client can call `resume`, `blast_radius`, `recall`, `record` end-to-end against a fixture; tool list loads in an agent without errors.

**Unit 1.6 — Events, sessions, resume**
- `cto-ai record finding|decision|session --about <ref>` writes one JSON event file; `close session` composes an episode.
- `resume` assembles: current phase, active unit, next up, open questions, recent decisions, last session's notes, blockers.
- `timeline` = git log (if in a git repo) merged with episodes.
- ✅ **Done when:** two recorded sessions appear in `resume`; deleting `index/` and re-running `sync` reproduces everything except nothing (events are SSOT); no event file is ever overwritten.

**Unit 1.7 — Spec-driven workflow**
- Parse `specs/*.md` frontmatter (`unit`, `status`, `depends_on`, `verify` commands) + GFM checklists.
- `cto-ai spec next` → topologically next buildable unit (cycle detection); `cto-ai spec close NN` → runs verify commands, records results as an episode, marks done.
- ✅ **Done when:** a 3-unit fixture plan resolves in dependency order; a dependency cycle is flagged; verify results land in the log; `status` shows unit progress.

**Unit 1.8 — Entry files, interview, export/import**
- Entry-file sync utility (used by `init`): idempotent managed blocks for `AGENTS.md`, `CLAUDE.md`, `.cursorrules` (content per agent convention).
- `--interview` mode: guided product/technical/design/process questions → draft `context/` files + first graph nodes (write our own prompts; do not copy the Six-File methodology's text).
- `export --format six-file|handoff|json [--out dir]`; `import` for six-file folders and pasted planning transcripts.
- ✅ **Done when:** roundtrip test (export → wipe `.cto-ai` → import → identical index); `handoff.md` is human-readable and git-friendly.

**Unit 1.9 — Optional: local semantic search (lite)**
- User-provided embedding provider (key + model); vectors stored in `index/embeddings.jsonl`; brute-force cosine with cap; `context_for` blends lexical + semantic.
- ✅ **Done when:** semantic recall beats lexical on a fixture with synonyms; output labeled "lite — graph era upgrades this".

**Phase 1 milestone (dogfood gate):** run every cto-ai command on the cto-ai repo itself. From this point, cto-ai manages its own context; friction found here becomes issues.

### Phase 2 — Graph era (4–6 sessions)

**Unit 2.1 — `cto-ai connect`**
- Guided FalkorDB onboarding: deep-link signup/signin, endpoint + credentials intake, connection ping, create/select the project graph, backfill prompt. Credentials go to env vars (preferred) or gitignored local config.

**Unit 2.2 — `FalkorStore` adapter**
- Push `nodes.jsonl`/`edges.jsonl` via parameterized `UNWIND` + `MERGE` batches; `--since` incremental; pull for export; schema-parity tests: the same fixture queries return equivalent results via both stores.

**Unit 2.3 — Graph-native tools**
- Swap lite algorithms for `CALL algo.*` (PageRank, SPpaths, WCC/CDLP, MSF); create vector + full-text indexes; `context_for` becomes a hybrid (vector + full-text + traversal) retrieval.

**Unit 2.4 — Temporal memory**
- Decisions/findings get `valid_at`/`invalid_at`; superseding a decision invalidates the old one (never deletes); `recall` prefers valid facts and can show history.

**Unit 2.5 — Multi-machine + doctor**
- `cto-ai doctor`: connection, version, index freshness, guard violations. Document the two sync modes (git for files, shared graph for memory) and the per-machine event file convention.

### Phase 3 — Guardrails & drift (3–4 sessions)

- **Unit 3.1 — Guards:** parse protected globs + invariants from `architecture.md`/`ai-workflow-rules.md`; link them to code areas; `guards <path>` returns what applies; `check` command for CLI/CI.
- **Unit 3.2 — Drift checks:** protected path edited, superseded decision referenced, folder acting outside its documented boundary, orphaned/stale notes (no inbound links or superseded).
- **Unit 3.3 — Health score + history:** coverage %, stale %, unresolved questions, guard violations; written to `health.json` per sync; `status` shows the trend. `cto-ai check --ci` exits nonzero on violations (opt-in).

### Phase 4 — Ship & polish (2–3 sessions)

- **Unit 4.1 — Docs + examples:** README (setup, graph model, every query), `docs/`, three example repos (plain code, six-file adopter, docs corpus).
- **Unit 4.2 — Publish:** `cto-ai@0.1.0` on npm, changelog, LICENSE (MIT), contribution guide. (Claim the npm name now, before Phase 0 even.)
- **Unit 4.3 — Hardening:** perf pass on a medium repo, error messages, `--verbose`, `--offline`, Node version check, telemetry off by default.

### Optional weekend slice (if a demo is needed before Phase 1 completes)

Units 0.1 → 1.1 → 1.2 → 1.3 (lite) → 1.4 (five tools) → 1.5, with `resume` from 1.6. Demo corpus: this docs repo. Demo moves: depth-1 vs depth-4 on a real question, one honest "not indexed" answer, and `resume` restoring context in one call.

## 4. Immediate next actions (this week)

1. Create the public `cto-ai` implementation repo (separate from this docs repo).
2. Claim the npm name: `npm publish` a 0.0.0 placeholder or reserve via npm support.
3. Execute Unit 0.1 (skeleton + CI), then Unit 0.2 (schema + store interface).
4. Freeze the v0 schema doc inside the new repo before writing any scanner code.
5. Build Units 1.1–1.2 against this docs repo as the first fixture.

## 5. Working rules (how we build it)

- **Spec-driven, self-hosted where possible:** every unit gets its own spec file before implementation (Goal / Design / Implementation / Dependencies / Verify). Once Unit 1.7 lands, cto-ai manages its own build plan — dogfooding is the primary QA.
- **One unit per branch/PR** (`feat/NN-name`); the spec's verification checklist gates the merge.
- **Bootstrap tracker:** until `.cto-ai/log` exists, keep a hand-written progress file in the new repo (current phase, done, next, open questions); migrate it into cto-ai at the Phase 1 milestone.
- **Definition of done per unit:** tests pass, `--json` schema stable, docs updated, no orphan TODOs (file issues instead).
- **Determinism rule:** index outputs are sorted and byte-identical across runs; anything nondeterministic is a bug.

## 6. Risks specific to the file era

| Risk | Mitigation |
|---|---|
| Import-scan accuracy | Line scanner first with fixture coverage; upgrade to real parsers behind the same interface |
| Index performance on big repos | Hash-incremental, caps with clear errors; worker threads only if needed later |
| Git merge conflicts in logs | One JSON file per event, append-only; never rewrite or batch-edit event files |
| Nondeterminism | Sort every collection; stable IDs; determinism as a test |
| Scope creep | This roadmap; phases gate; lite algorithms stay lite until Phase 2 |
| Docs drift from code | The tool lints its own repo (dogfood gate); health score tracks coverage |
