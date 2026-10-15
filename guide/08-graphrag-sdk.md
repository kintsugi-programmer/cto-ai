# The GraphRAG SDK

The **GraphRAG SDK** is FalkorDB's official framework for building GraphRAG apps. It takes you from raw documents to cited answers in under 5 minutes, and it is designed to reduce LLM hallucinations.

## Install and start

```bash
pip install graphrag-sdk[litellm]
docker run -d -p 6379:6379 -p 3000:3000 --name falkordb falkordb/falkordb:latest
export OPENAI_API_KEY="sk-..."
```

- For PDF ingestion, install the pdf extra instead: `pip install graphrag-sdk[litellm,pdf]`.
- Many models work through **LiteLLM** - OpenAI, Anthropic, Gemini, Cohere, or local open-source models on your own hardware, all behind one interface.

## Ingest, then ask

```python
import asyncio
from graphrag_sdk import GraphRAG, ConnectionConfig, LiteLLM, LiteLLMEmbedder

async def main():
    async with GraphRAG(
        connection=ConnectionConfig(host="localhost", graph_name="my_graph"),
        llm=LiteLLM(model="openai/gpt-5.5"),
        embedder=LiteLLMEmbedder(model="openai/text-embedding-3-large", dimensions=256),
    ) as rag:
        result = await rag.ingest(
            text="Alice Johnson is a software engineer at Acme Corp in London.",
            document_id="my_doc",
        )
        print(f"Nodes: {result.nodes_created}, Edges: {result.relationships_created}")
        await rag.finalize()  # deduplicate entities, backfill embeddings, create indexes

        answer = await rag.completion("Where does Alice work?")
        print(answer.answer)

asyncio.run(main())
```

- **graph_name** gives each tenant or agent its own isolated graph.
- **finalize()** runs cross-document deduplication. Call it once per batch, not per file.

## Define your own schema (optional)

```python
from graphrag_sdk import GraphSchema, EntityType, RelationType

schema = GraphSchema(
    entities=[
        EntityType(label="Person", description="A human being"),
        EntityType(label="Organization", description="A company or institution"),
        EntityType(label="Location", description="A geographic location"),
    ],
    relations=[
        RelationType(label="WORKS_AT", description="Is employed by",
                     patterns=[("Person", "Organization")]),
        RelationType(label="LOCATED_IN", description="Is situated in",
                     patterns=[("Organization", "Location")]),
    ],
)
```

- An **ontology** is a blueprint for how the graph views reality: which entities and relations exist.
- SDK 1.0 ships a **default ontology with 11 common business concepts** (people, organizations, products, events, roles, and more), so you do not lose days to modeling.
- The ontology **constrains what can be extracted**, so the graph stores typed, checkable facts instead of free-form model output.

## Why answers stay trustworthy

- **Relationship traversal** retrieves connected evidence that vector similarity misses; multi-hop facts rarely sit in one chunk.
- **MENTIONED_IN edges** trace every entity mention back to its source chunk.
- **return_context=True** returns the retrieval trail, so your app can inspect and validate generated claims.
- **Abstention**: when evidence is insufficient, the app can refuse to answer instead of guessing.

## Incremental updates (v1.1.0)

- Update the graph on change instead of rebuilding it after every edit.

```python
result = await graph.apply_changes(
    added=["docs/new_feature.md"],
    modified=["docs/api.md"],
    deleted=["docs/removed_page.md"],
)
await graph.finalize()
```

- `update(source, document_id=...)` - content changed. A SHA-256 hash short-circuits no-op updates.
- `delete_document(document_id)` - removes a document and cleans up entities no longer referenced.
- `apply_changes(...)` - one batch of adds, modifies, and deletes; per-file errors are collected, not raised.

## Benchmark proof

- On the GraphRAG-Bench leaderboard (August 2026 run, `gpt-4o-mini` with text-to-Cypher retrieval enabled), the SDK ranked **1st with an overall score of 71.48**.
  - Novel (multi-document): **66.09**. Medical (single-document): **76.87**.
  - For comparison: vector RAG with rerank scored **55.39**, LightRAG **53.84**, MS-GraphRAG (local) **48.05**.

If you use the SDK in your project, you still make the design decisions: what to ingest, which schema fits the domain, and when the agent must say "not enough evidence".
