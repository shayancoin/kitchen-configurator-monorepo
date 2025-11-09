# bRAG-langchain (bragai/bRAG-langchain) – Structural Notes

- **Acquisition**: `git clone https://github.com/bragai/bRAG-langchain /tmp/bRAG-langchain`.
- **Scope**: Notebook-centric exploration of Retrieval-Augmented Generation with LangChain, covering chunking, routing, multi-query, RAPTOR, ColBERT, Cohere rerankers, and FAISS/Pinecone integrations.

## Repository Stats
| Metric | Value |
| --- | --- |
| Python `.py` sources | 0 (logic embedded in notebooks + tests) |
| Notebooks (`.ipynb`) | 6 anchor files (`full_basic_rag.ipynb` + `[1-5]_rag_*.ipynb`) |
| Test harness | `test/` folder with LangChain pipelines exercising embeddings + retrievers |
| Dependencies | `requirements.txt` (LangChain, OpenAI, Pinecone, Cohere, FAISS, HuggingFace, llama-index, etc.) |

- Each notebook is a linear DAG of cells; when exported to scripts we can treat them as modules `rag.pipeline`, `rag.retriever`, etc., ensuring O(n) execution per inference with `n` = number of stages (embedding, retrieval, rerank, synthesis).
- Key reusable blocks: chunkers (`RecursiveCharacterTextSplitter`), vector store adapters (Pinecone, Chroma, FAISS), hybrid retrieval (RRF, RAPTOR), structured routing (semantic + logical), and guardrails (LangSmith tracing hooks).

## Extraction Targets
1. **`full_basic_rag.ipynb`** – provides end-to-end ingest → embed → store → retriever → prompt → answer pipeline; convert to Python module for `services/ai-python/app/pipeline.py`.
2. **Routing notebook `[3]`** – contains function routing + metadata filters; reuse to implement constraint-aware retrieval (kitchen modules vs. finishes) with asymptotic query time O(log m) assuming vector index w/HNSW.
3. **Advanced indexing `[4]`** – multi-representation vector storage (MultiVectorRetriever + RAPTOR). Use this as blueprint for storing design docs vs. manufacturing specs.
4. **Reranking `[5]`** – RRF + Cohere re-rankers for higher precision; can wrap as optional stage toggled via config to keep baseline inference O(log m) while rerank adds O(k log k).

## Reuse Guidance
- Materialize notebooks into scripts via `jupyter nbconvert --to script` or manual transposition; keep ingestion + retrieval functions pure for deterministic unit tests (`pytest` with fixture-supplied embeddings).
- Use `requirements.txt` as basis for a `services/ai-python/pyproject.toml`; freeze LangChain + OpenAI versions to avoid API drift.
- Provide `PGVector` + `FAISS` adapters via strategy pattern so we can prove retrieval cost: `T = O(log m)` for PGVector indexing (btree/hnsw) vs `O(kd)` for FAISS brute-force fallback.
- Bake LangSmith tracing env vars + secrets into `.env.example` for the new service to guarantee Observability step alignment.
