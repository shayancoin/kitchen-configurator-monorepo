# AI Advisor Service (Python)

LangChain-driven Retrieval-Augmented Generation (RAG) microservice responsible for:

- ingesting kitchen/product/manufacturing documents into PGVector or FAISS
- executing routed retrieval (metadata + hybrid search) with optional reranking
- synthesizing guidance via LLM prompt templates exposed through FastAPI
- emitting structured answers for the GraphQL federation (advisor subgraph)

## Layout

```
services/ai-python/
├── pyproject.toml      # hatch + dependency graph
├── README.md           # this file
├── src/ai_advisor
│   ├── api.py          # FastAPI router & DTOs
│   ├── config.py       # Pydantic settings + env parsing
│   ├── ingest.py       # chunking + embedding ingestion workflows
│   ├── pipeline.py     # LangChain-backed RAG orchestration
│   ├── schema.py       # Pydantic models shared between API and pipeline
│   ├── server.py       # uvicorn entrypoint + wiring
│   └── vectorstore.py  # PGVector / FAISS / in-memory adapters
├── tests
│   └── test_pipeline.py
└── .env.example        # sample secrets (OpenAI, PGVector DSN, etc.)
```

## Quickstart

```bash
cd services/ai-python
python -m venv .venv && source .venv/bin/activate
pip install -e .[dev]
cp .env.example .env && edit secrets
ai-advisor-api  # runs uvicorn entrypoint
```

### Environment Variables

| Variable | Purpose |
| --- | --- |
| `AI_OPENAI_API_KEY` | Passed to LangChain `ChatOpenAI` when present, otherwise the service falls back to the deterministic `EchoLLM`. |
| `AI_VECTOR_DSN` | Postgres/PGVector DSN (`postgresql+psycopg://user:pass@host/db`). Leave empty to use the in-memory FAISS store. |
| `AI_VECTOR_TABLE` | PGVector table housing embeddings + metadata (default `ai_chunks`). |
| `AI_EMBED_DIM` | Embedding dimensionality (default 768). Used for PGVector schema assertions. |
| `AI_TOP_K` | Default number of chunks retrieved per query. |
| `AI_SOURCE_GLOB` | Optional glob of docs to ingest on boot (Markdown/HTML/PDF). |

## Complexity Guarantees

- Retrieval is O(log m) on PGVector (HNSW/IVFFlat) or O(k·d) on FAISS fallback (k = neighbors, d = embedding dimension).
- Reranking leverages Borda / reciprocal rank fusion with cost O(k log k).
- Prompt synthesis is O(n) in chunk count, keeping latency bounded (<150 ms excluding upstream LLM).

## Tests

```
pytest
```

Tests assert ingestion/query loops using a deterministic fake embedder so CI remains hermetic even without OpenAI/PGVector credentials.
