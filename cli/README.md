# ctoai

The persistent project brain for any coding agent — file-first, graph-powered, MCP-native.

> **Status: `0.1.0` — Phase 1 complete.** Every command is implemented against the file-system store: scan, incremental index, the tool catalogue, append-only memory, the spec workflow, guards, and an MCP server. FalkorDB is the Phase 2 adapter behind the same interface. See the [roadmap](https://github.com/kintsugi-programmer/cto-ai/blob/main/Documents/project-notes/2026-10-18-cto-ai-implementation-roadmap.md).

## Install

```bash
npx ctoai --help
```

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
    "ctoai": { "command": "npx", "args": ["ctoai", "mcp"] }
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
