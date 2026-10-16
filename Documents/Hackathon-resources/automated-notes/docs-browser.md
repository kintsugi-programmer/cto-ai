# FalkorDB Browser: Visual Graph Exploration and Query Interface

> **Source:** [`FalkorDB Browser_ Visual Graph Exploration and Query Interface - FalkorDB Docs.mhtml`](../FalkorDB%20Browser_%20Visual%20Graph%20Exploration%20and%20Query%20Interface%20-%20FalkorDB%20Docs.mhtml) · **Type:** docs page · **Saved:** Oct 16, 2026 · **Original URL:** https://docs.falkordb.com/browser/

## Overview

- Official FalkorDB docs page for the Browser, the web UI for "visualizing graphs, running Cypher queries, exploring data models, managing nodes and relationships, with query history and API documentation."
- FalkorDB's Browser provides a web UI for exploring, querying, and managing FalkorDB graphs; developers use it to interact with graphs loaded to FalkorDB, explore how specific queries behave, and review the current data model.
- The Browser "integrates within the main FalkorDB Docker container and through the Cloud service."
- The screenshots in this docs section use a realistic demo graph "so the UI reads like a working product environment instead of a toy fixture."
- The page is a short hub: UI elements, the standalone Canvas component, a feature-to-documentation mapping table, and a FAQ with 5 answered questions.
- **Docs navigation (compressed):** Browser section of FalkorDB Docs (Browser, UI Elements, Canvas) under top-level Documentation, Integrations, AI Tools, Browser.

## UI elements

For detailed documentation of each major UI element (login, settings, graph canvas, panels, query editor/history, table view, etc.), see:

- UI Elements
- Upload Data dialog
- UDF Libraries page

## Canvas Component

- FalkorDB Canvas is the standalone web component that powers the graph visualization in FalkorDB Browser.
- It can also be used independently in any web application.
- (See the Canvas page in the docs.)

## Main Features

Use these focused pages for detailed coverage without duplication:

| Area | Documentation |
| --- | --- |
| Graph workspace (canvas, panels, querying, history, and results) | UI Elements |
| Graph lifecycle actions (create/delete/duplicate/export/upload) | Graphs Manager |
| Built-in REST API docs (/docs) | API Docs (Swagger) |
| Authentication and role-based permissions | Roles & Access |
| Upload workflows | Upload Data dialog |
| UDF library workflows | UDF Libraries page |

## Frequently Asked Questions

### How do I access FalkorDB Browser?

- FalkorDB Browser is a web UI accessible at port 3000 by default. It is included in the main FalkorDB Docker container and is also available through the Cloud service.

### What connection URLs does FalkorDB Browser support?

- The Browser supports `falkor://`, `falkors://`, `redis://`, and `rediss://` URL formats for connecting to a FalkorDB server.

### Can I export my graph data from the Browser?

- Yes. Navigate to graph management, select a graph, and click Export Data to download a `.dump` file via the `/api/graph/:graph/export` endpoint.

### What query language does FalkorDB Browser use?

- FalkorDB Browser uses Cypher as its query language. The built-in Monaco editor provides keyword autocompletion and syntax highlighting.

### Is there an API documentation page built into the Browser?

- Yes. A built-in Swagger UI is available at `/docs` which loads the OpenAPI spec from `/api/swagger` and supports interactive 'Try it out' requests.

## Key facts and numbers

- Default access port: `3000` (Browser web UI).
- Distribution: included in the main FalkorDB Docker container; also available through the FalkorDB Cloud service.
- Supported connection URL schemes: `falkor://`, `falkors://`, `redis://`, `rediss://`.
- Export: graph management → select graph → Export Data → downloads a `.dump` file via `/api/graph/:graph/export`.
- Query language: Cypher, edited in a built-in Monaco editor with keyword autocompletion and syntax highlighting.
- API docs: built-in Swagger UI at `/docs`; OpenAPI spec loaded from `/api/swagger`; supports interactive 'Try it out' requests.
- Feature documentation areas: UI Elements; Graphs Manager (create/delete/duplicate/export/upload); API Docs (Swagger); Roles & Access; Upload Data dialog; UDF Libraries page.
- UI element coverage includes: login, settings, graph canvas, panels, query editor/history, table view, etc.
- FalkorDB Canvas is a standalone web component usable independently in any web application.

## Hackathon relevance

- The Browser at port 3000 is the fastest way to show judges and teammates the connected-data graph your agent builds, via the visual canvas and results table.
- Its Monaco query editor lets you run hand-written Cypher next to agent-generated queries — a debugging aid for the agent-memory and coordination track.
- Export Data (`.dump` via `/api/graph/:graph/export`) lets you snapshot an agent-memory or company-brain graph for demos, backups, or handoff.
- The `falkors://` / `rediss://` schemes cover TLS-secured cloud instances, while `falkor://` / `redis://` fit local Docker development.
- Roles & Access plus the built-in Swagger UI (`/docs`) speed up wiring an agent backend to the same instance.

## Related notes

- [`docs-home.md`](docs-home.md) — docs home page that catalogs the Browser among FalkorDB's tools.
- [`docs-docker.md`](docs-docker.md) — how the Browser ships inside the main `falkordb/falkordb` container on port 3000, plus `falkordb-browser`.
- [`../../guide/03-run-falkordb.md`](../../guide/03-run-falkordb.md) — guide module covering running FalkorDB locally with the Browser included.
