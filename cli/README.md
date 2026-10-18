# ctoai

The persistent project brain for any coding agent — file-first, graph-powered, MCP-native.

> **Status: `0.0.1` scaffold.** The full command surface is stubbed; the node/edge schema and the `KnowledgeStore` interface are defined. Real functionality lands in Phase 1 — see the [roadmap](https://github.com/kintsugi-programmer/cto-ai/blob/main/Documents/project-notes/2026-10-18-cto-ai-implementation-roadmap.md).

## Usage

```bash
npx ctoai --help
```

## Development

```bash
npm install
npm run verify        # lint + typecheck + test + build
node dist/cli.js --help
```

## Layout

- `src/cli.ts` — command surface (commander).
- `src/core/schema.ts` — zod schemas for nodes and edges.
- `src/core/store.ts` — the `KnowledgeStore` interface (FileStore now, FalkorStore later).
- `src/stores/file/` — the file-system store (deterministic JSONL index).
- `tests/` — vitest suites.

## License

MIT
