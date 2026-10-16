# GraphRAG SDK — The Simplest, Most Accurate GraphRAG Framework (FalkorDB/GraphRAG-SDK)

> **Source:** [`FalkorDB_GraphRAG-SDK_ Build fast and accurate GenAI apps with GraphRAG SDK at scale 🌟.mhtml`](../FalkorDB_GraphRAG-SDK_%20Build%20fast%20and%20accurate%20GenAI%20apps%20with%20GraphRAG%20SDK%20at%20scale%20%F0%9F%8C%9F.mhtml) · **Type:** GitHub repo · **Saved:** Oct 16, 2026 · **Original URL:** https://github.com/FalkorDB/GraphRAG-SDK

## Overview
- Official repository of the GraphRAG SDK: "the simplest, most accurate GraphRAG framework built on FalkorDB" — benchmark-leading accuracy, reduced LLM hallucinations, FalkorDB-fast, multi-tenant, graph traversal, 5-minute setup.
- The SDK was built from real deployments around one idea: the retrieval harness matters more than the model; it takes you from raw documents to cited answers in under 5 minutes.
- It is designed to reduce hallucinations: answers can be grounded in context retrieved from the knowledge graph, applications can inspect that context, validate generated claims, and gate generation when evidence is insufficient; `MENTIONED_IN` provenance edges trace entity mentions to their source chunks.
- README covers benchmarks (71.48 overall vs 55.39 for vector RAG), quick start with code, optional schemas, incremental updates (v1.1.0), the ingestion and retrieval pipeline, 11 examples plus an abstention example, documentation links, and development milestones.
- Repository stats at save time: 1.0k stars, 143 forks, 9 watchers, 31 releases (v1.4.0 latest, Aug 10, 2026), 14 contributors, 613 commits; Apache-2.0 license.

## Why GraphRAG for factual reliability?
Hallucinations in RAG are usually a retrieval failure, not a model failure: the model is asked to answer from context that never contained the answer. A knowledge graph attacks that at the retrieval layer, and keeps the evidence attached to the answer.
- Relationship traversal retrieves the connected evidence vector similarity misses — multi-hop facts rarely live in one chunk that happens to be similar to the question.
- Retrieved context is traceable to source chunks; `MENTIONED_IN` edges trace entity mentions, and `return_context=True` returns the retrieval trail for application-level validation.
- The ontology constrains what can be extracted, so the graph stores typed, checkable facts instead of free-form model output.
- Your application can abstain when evidence is insufficient — gate generation on retrieval and return an explicit "evidence-insufficient" response (example).
- Benchmark accuracy is the measurable outcome of all of the above — see the table below.

→ Full guide: Reducing LLM hallucinations · API reference: Reliability and Grounding

## Benchmarks

| Rank | System | Novel (Multi-Doc) | Medical (Single-Doc) | Overall |
|---|---|---|---|---|
| 1 | FalkorDB GraphRAG SDK ◄ | 66.09 | 76.87 | 71.48 |
| 2 | G-reasoner | 58.94 | 73.30 | 66.12 |
| 3 | AutoPrunedRetriever | 63.72 | 67.00 | 65.36 |
| 4 | HippoRAG2 | 56.48 | 64.85 | 60.67 |
| 5 | Fast-GraphRAG | 52.02 | 64.12 | 58.07 |
| 6 | RAG (w rerank) (Vector RAG) | 48.35 | 62.43 | 55.39 |
| 7 | LightRAG | 45.09 | 62.59 | 53.84 |
| 8 | HippoRAG | 44.75 | 59.08 | 51.92 |
| 9 | MS-GraphRAG (local) | 50.93 | 45.16 | 48.05 |

How these are computed. Per dataset, ACC is the unweighted mean of the four task-category scores, matching the GraphRAG-Bench leaderboard convention:

```text
Dataset ACC = (Fact Retrieval + Complex Reasoning + Contextual Summarize + Creative Generation) / 4
Overall = (Novel ACC + Medical ACC) / 2
```

- Overall is our own summary across the two datasets; the leaderboard ranks each dataset separately.
- Novel has 20 documents and 2,010 questions; Medical has 1 corpus and 2,062 questions.
- FalkorDB scored August 2026 with gpt-4o-mini (Azure OpenAI) at temperature 0.7 for both graph construction and generation, text-embedding-3-large at 1024 dimensions, text-to-Cypher retrieval enabled, and the benchmark's own `generation_eval.py` unmodified as the judge.
- Competitor numbers are from the published leaderboard, unchanged.
- See the GraphRAG accuracy benchmark page for the full FalkorDB vs vector RAG comparison, configuration, reproduction instructions and limitations, and the benchmark methodology page for per-category results and the full 15-system comparison.

Vectors match similar chunks. The graph traverses relationships. Every answer cites its source.

## Quick start

### 1. Install and start FalkorDB

```bash
pip install graphrag-sdk[litellm]
docker run -d -p 6379:6379 -p 3000:3000 --name falkordb falkordb/falkordb:latest
export OPENAI_API_KEY="sk-..."
```

For PDF ingestion, install the pdf extra instead: `pip install graphrag-sdk[litellm,pdf]`. Ingestion sanitizes unsupported control characters in IDs and string properties before graph upserts, which helps avoid FalkorDB Cypher parse errors on noisy PDFs.

### 2. Ingest a document

```python
import asyncio
from graphrag_sdk import GraphRAG, ConnectionConfig, LiteLLM, LiteLLMEmbedder

async def main():
    async with GraphRAG(
        connection=ConnectionConfig(host="localhost", graph_name="my_graph"),  # graph_name = per-tenant isolation
        llm=LiteLLM(model="openai/gpt-5.5"),
        embedder=LiteLLMEmbedder(model="openai/text-embedding-3-large", dimensions=256),
    ) as rag:
        # Ingest raw text (pass a file path with the `pdf` extra installed for PDFs)
        result = await rag.ingest(
            text="Alice Johnson is a software engineer at Acme Corp in London.",
            document_id="my_doc",
        )
        print(f"Nodes: {result.nodes_created}, Edges: {result.relationships_created}")

        # Finalize: deduplicate entities, backfill embeddings, create indexes
        await rag.finalize()

        # Full RAG: retrieve + generate
        answer = await rag.completion("Where does Alice work?")
        print(answer.answer)

asyncio.run(main())
```

### 3. Define a schema (optional)

```python
from graphrag_sdk import GraphSchema, EntityType, RelationType

schema = GraphSchema(
    entities=[
        EntityType(label="Person", description="A human being"),
        EntityType(label="Organization", description="A company or institution"),
        EntityType(label="Location", description="A geographic location"),
    ],
    relations=[
        RelationType(label="WORKS_AT", description="Is employed by", patterns=[("Person", "Organization")]),
        RelationType(label="LOCATED_IN", description="Is situated in", patterns=[("Organization", "Location")]),
    ],
)

async with GraphRAG(
    connection=ConnectionConfig(host="localhost", graph_name="my_graph"),
    llm=LiteLLM(model="openai/gpt-5.5"),
    embedder=LiteLLMEmbedder(model="openai/text-embedding-3-large", dimensions=256),
    schema=schema,
) as rag:
    ...  # ingest / completion as above
```

→ Full walkthrough: Getting Started
→ Compose your own pipeline: Custom Strategies

## Incremental updates (v1.1.0)
Re-sync individual documents without rebuilding the graph. The canonical CI use case is updating the graph on PR merge — added, modified, and deleted files in one batch:

```python
async with GraphRAG(connection=ConnectionConfig(...), llm=..., embedder=...) as graph:
    result = await graph.apply_changes(
        added=["docs/new_feature.md"],
        modified=["docs/api.md"],
        deleted=["docs/removed_page.md"],
    )
    await graph.finalize()  # once per batch — finalize is O(graph size)

    # Per-file outcomes are wrapped in BatchEntry — the batch never raises.
    for entry in result.added + result.modified + result.deleted:
        if not entry.is_success:
            print(f"failed: {entry.error_type}: {entry.error}")
```

The three primitives behind the wrapper:

| Method | When to use |
|---|---|
| `update(source, document_id=...)` | Document content changed. SHA-256 hash short-circuits no-op updates (touch-only PRs cost ~1 Cypher query). Pass `if_missing="ingest"` for upsert semantics. |
| `delete_document(document_id)` | Document removed. Cleans up entities orphaned by the deletion; preserves entities still referenced by other documents. |
| `apply_changes(added=..., modified=..., deleted=...)` | Heterogeneous batch. Per-file errors are collected, not raised. Does not call `finalize()` — caller drives that cadence. |

- In file mode, `document_id` defaults to `os.path.normpath(source)` so `update("docs/x.md")` matches the original `ingest("docs/x.md")` with no extra plumbing. See `examples/07_incremental_updates.py`.
- **Cost model.** `finalize()` runs cross-document deduplication, which scans the full entity table — its cost is O(graph size), not O(change size). Embedding backfill within `finalize()` is O(change size) (only nodes/edges missing embeddings get touched). For CI use cases, batch all PR changes through `apply_changes` and call `finalize` once at the end of the run, not per file — per-file finalize multiplies the dedup constant by the number of files touched.
- **Crash safety.** `update()` uses an idempotent rollforward cutover: the new content is written to a `__pending__` Document, then a single atomic Cypher statement marks `ready_to_commit=true`, then the live document is replaced. A crash before the marker discards the pending on retry; a crash after the marker rolls forward to completion. Either way, retrying the same `update()` call is safe and converges on the correct final state.
- **Concurrency.** `apply_changes` exposes two knobs: `max_concurrency` (adds, default 3) and `update_concurrency` (modifies, default 1). Updates default to 1 because orphan-cleanup correctness under concurrent updates depends on a pipeline-ordering invariant; raising that default is safe only if you've verified your concurrent updates can never share an entity. The integration test `test_concurrent_updates_preserve_shared_entity` is the tripwire that guards the default.

## Ingestion & retrieval pipeline

| Area | Step | Cost |
|---|---|---|
| Ingestion | Extract entities & relations | LLM |
| Ingestion | Resolve & deduplicate entities | LLM |
| Ingestion | Embed & index | LLM |
| Retrieval | Vector search | DB |
| Retrieval | Full-text search | DB |
| Retrieval | Text-to-Cypher (experimental) | LLM |
| Retrieval | Cypher queries | DB |
| Retrieval | Relationship expansion | DB |
| Retrieval | Cosine reranking | Local |

💡 Retrieved context can be traced to source chunks; `MENTIONED_IN` edges connect entity mentions to chunks. Pass `return_context=True` to `completion()` so your application can inspect the retrieval trail and validate generated claims.

## Examples
Working starters — clone, plug in your source, ship.

| # | Example | What you'll build |
|---|---|---|
| 1 | Quick Start | Your first ingest-and-query loop in under 30 lines |
| 2 | PDF with Schema | A PDF Q&A bot with your own entity and relation types |
| 3 | Custom Strategies | Composing ingestion strategies explicitly |
| 4 | Custom Provider | Plug in any LLM or embedder behind a clean interface |
| 5 | Notebook Demo | An interactive walkthrough that shows the provenance trail |
| 6 | Markdown, Document-Aware | Structure-preserving Markdown ingestion with queryable heading breadcrumbs |
| 7 | Incremental Updates | `update`, `delete_document`, and `apply_changes` for CI-driven graph syncs |
| 8 | Ontology Lifecycle | Declare an ontology, ingest with it, and round-trip it as JSON config |
| 9 | Ontology Evolution | Mutating schema evolution — rename types and atomically add attributes with LLM backfill |
| 10 | Ontology Discovery | Discover an ontology from raw sources and propose extensions as new docs arrive |
| 11 | Structured Ingestion | Declared mappings end to end, with a re-ingest that corrects a row, adds one and drops one |
| ★ | Grounded Answers with Abstention | Cite the retrieved context behind an answer, and abstain when the graph has no supporting evidence |

## Documentation
Full documentation: https://docs.falkordb.com/graphrag

| Guide | Description |
|---|---|
| Getting Started | Step-by-step tutorial from install to first query |
| Architecture | Pipeline design, graph schema, retrieval strategy |
| Reducing LLM Hallucinations | Grounded retrieval, source provenance, and abstention |
| Configuration | Connection, providers, and tuning reference |
| Strategies | All ABCs and built-in implementations |
| Providers | LLM and embedder configuration guide |
| Reliability and Grounding | Grounding, provenance and abstention mapped to the APIs that implement them |
| Benchmark | Methodology, results, and reproduction instructions |
| Accuracy Benchmark: FalkorDB vs Vector RAG | 71.48 vs 55.39 comparison, evaluation definition, limitations, how to cite |
| API Reference | Full API documentation |

## Development milestones
- 2024-06: First public release.
- 2024-Q4: PDF ingestion and multi-provider LLMs.
- 2025-Q1–Q2: Pluggable providers and pipeline tuning.
- 2025-Q3: Sharper retrieval, deeper test coverage.
- 🎉 2026-04: Version 1.0 is released with a new set of benchmarks based on a year's worth of research and customer PoCs.
- 📦 Still on the v0.x API? Pin the legacy release: `pip install graphrag-sdk==0.8.2`.
- 2026-Q2: Production observability; tabular ingestion — load a CSV by declaring what its columns mean, so a row and a paragraph about the same thing become one node (docs).
- 2026-Q3: Introduce Agentic GraphRAG; complete PDF ingestion.
- 2026-Q4: Smarter retrieval — dynamic traversal, temporal graph.

## Contributing and community
We welcome contributions! See `CONTRIBUTING.md` for development setup, testing, and code style guidelines. Please read our Code of Conduct before participating.
- **Discord** — Ask questions, share what you build.
- **GitHub Discussions** — Feature ideas, Q&A.
- **Issues** — Bug reports and feature requests.

## Citation
If you use GraphRAG SDK in your research, please cite:

```text
@software{graphrag_sdk,
  title  = {GraphRAG SDK: A Modular Graph RAG Framework},
  author = {FalkorDB},
  year   = {2026},
  url    = {https://github.com/FalkorDB/GraphRAG-SDK},
}
```

## License
Apache License 2.0.

## About this repository
- **Description:** Build fast and accurate GenAI apps with GraphRAG SDK at scale 🌟
- **Homepage:** www.falkordb.com/
- **Topics:** falkordb, genai, graph-database, graphrag, knowledge-graph, llm, open-source, rag, sdk.
- **Repository resources:** Readme, Apache-2.0 license, Code of conduct, Contributing, Security policy.
- **Stars:** 1.0k stars · **Watchers:** 9 watching · **Forks:** 143 forks.
- **Issues / PRs:** 30 issues, 18 pull requests.
- **Branches / tags:** 56 branches, 32 tags (default branch: main).
- **Commits:** 613 commits. Latest commit `35e67a0` by galshubeli: "Merge pull request #343 from FalkorDB/chore/falkordb-hiredis", dated Oct 14, 2026 (one day before save).
- **Releases:** 31 releases; latest **v1.4.0** (Aug 10, 2026) — "+ 30 releases".
- **Deployments:** 28 — `release` (Aug 10, 2026), `github-pages` (Jun 3, 2026), `staging - docs` (Aug 16, 2026).
- **Packages:** No packages published.
- **Contributors:** 14.
- **Languages:** Python 99.7%, Other 0.3%.

## Repository structure
Top-level layout (per-file commit messages and dates dropped except where meaningful):
- `.github` — CI/workflow automation (recent dependabot bumps).
- `assets` — images and static assets for the README/docs.
- `docs` — documentation content; migrated to Mintlify and dependency updates landed Aug 16, 2026 (recent fix: "docs(dedup): fix two sentences about removed description vectors", Sep 28, 2026).
- `graphrag_sdk` — the Python package itself; most recent change: "perf: depend on falkordb[hiredis] for faster reply parsing" (Oct 14, 2026).
- `scripts` — utility scripts (docs tooling).
- Root files: `.env.example` (environment variable template), `.gitignore`, `.pre-commit-config.yaml`, `CHANGELOG.md`, `CONTRIBUTING.md`, `LICENSE`, `README.md`, `SECURITY.md`, `docker-compose.yml` (binds the FalkorDB browser to localhost).

## Key facts and numbers
- Headline benchmark results: FalkorDB GraphRAG SDK 71.48 overall (Novel 66.09, Medical 76.87), #1 of the 9 systems shown; vector RAG with rerank 55.39 overall (Novel 48.35, Medical 62.43); the docs page references a full 15-system comparison.
- Scoring setup: August 2026; gpt-4o-mini (Azure OpenAI), temperature 0.7 for graph construction and generation; text-embedding-3-large at 1024 dimensions; text-to-Cypher retrieval enabled; benchmark's own `generation_eval.py` as judge.
- Datasets: Novel — 20 documents, 2,010 questions; Medical — 1 corpus, 2,062 questions.
- ACC formula: (Fact Retrieval + Complex Reasoning + Contextual Summarize + Creative Generation) / 4; Overall = (Novel ACC + Medical ACC) / 2.
- Quick start: `pip install graphrag-sdk[litellm]`; Docker image `falkordb/falkordb:latest` exposing 6379 and 3000; `OPENAI_API_KEY` env var; PDF extra `graphrag-sdk[litellm,pdf]`.
- Example model config: `openai/gpt-5.5` via LiteLLM; embedder `openai/text-embedding-3-large` with `dimensions=256`.
- Per-tenant isolation via `graph_name` in `ConnectionConfig`.
- Incremental updates (v1.1.0): `update()` SHA-256 hash short-circuit (~1 Cypher query for touch-only updates), `if_missing="ingest"` upsert semantics, O(graph size) `finalize()` dedup vs O(change size) embedding backfill.
- Concurrency defaults: `max_concurrency=3` (adds), `update_concurrency=1` (modifies); guarded by `test_concurrent_updates_preserve_shared_entity`.
- Realistic default quote on the README: "gets you from raw documents to cited answers in under 5 minutes."
- Legacy release pin: `graphrag-sdk==0.8.2`.
- Repo stats: 1.0k stars · 9 watchers · 143 forks · 30 issues · 18 pull requests · 56 branches · 32 tags · 613 commits · 31 releases (v1.4.0, Aug 10, 2026) · 28 deployments · no packages · 14 contributors.
- Languages: Python 99.7%, Other 0.3%. License: Apache-2.0.

## Code, commands and queries
All snippets appear verbatim in the sections above; quick command reference:

```bash
pip install graphrag-sdk[litellm]
docker run -d -p 6379:6379 -p 3000:3000 --name falkordb falkordb/falkordb:latest
export OPENAI_API_KEY="sk-..."
```

PDF ingestion install variant:

```bash
pip install graphrag-sdk[litellm,pdf]
```

Core API calls used across the examples: `GraphRAG(connection=ConnectionConfig(...), llm=LiteLLM(...), embedder=LiteLLMEmbedder(...), schema=...)`, `rag.ingest(text=..., document_id=...)`, `rag.finalize()`, `rag.completion("...")`, `graph.update(...)`, `graph.delete_document(...)`, `graph.apply_changes(added=..., modified=..., deleted=...)`, `return_context=True`.

## Hackathon relevance
- The SDK is the on-ramp for the `company brain` track: raw documents to cited answers with a knowledge graph under the hood, in a 5-minute quick start.
- Grounded answers plus `return_context=True` and abstention let agents cite evidence and say "insufficient evidence" — essential for trust-building demos (`agent memory and coordination` needs provenance too).
- `graph_name` gives per-tenant/per-agent graph isolation with one connection config knob; `MENTIONED_IN` edges make memory inspectable.
- Incremental updates (`update`/`delete_document`/`apply_changes`) fit hackathon workflows where docs change mid-build; batch + single `finalize()` is the prescribed CI pattern.
- Schema/ontology features (GraphSchema, EntityType, RelationType) support the `connected data` track when the team wants typed, checkable facts rather than free-form extraction.
- Configuration is minimal (LiteLLM providers + embedder dimensions), so teams can swap models without touching retrieval logic.

## Related notes
- [docs-integrations.md](docs-integrations.md) — where the SDK sits among FalkorDB drivers, frameworks and pipelines.
- [blog-what-is-graphrag.md](blog-what-is-graphrag.md) — conceptual background on GraphRAG types and limitations that the SDK addresses.
- [transcript-graphrag-sdk-1-0.md](transcript-graphrag-sdk-1-0.md) — webinar covering the 1.0 release and benchmark story.
- [../../guide/08-graphrag-sdk.md](../../guide/08-graphrag-sdk.md) — hackathon course module on the GraphRAG SDK.
