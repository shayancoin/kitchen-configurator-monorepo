"""Application entrypoint."""

from __future__ import annotations

import asyncio
from functools import lru_cache

from fastapi import FastAPI
from langchain.embeddings.base import Embeddings
from langchain_openai import ChatOpenAI, OpenAIEmbeddings
from langchain_core.language_models import BaseLanguageModel
from uvicorn import Config, Server

from .api import PipelineDependency, build_router
from .config import Settings, get_settings
from .ingest import chunk_glob
from .pipeline import EchoLLM, HashEmbedder, LanguageModel, RAGPipeline, Embedder
from .telemetry import init_telemetry
from .vectorstore import build_store

app = FastAPI(title="AI Advisor Service", version="0.1.0")
init_telemetry(app)


class LangChainEmbeddingsAdapter(Embedder):
    def __init__(self, embeddings: Embeddings):
        self._embeddings = embeddings

    def embed_query(self, text: str):
        return self._embeddings.embed_query(text)

    def embed_documents(self, texts):
        return self._embeddings.embed_documents(list(texts))


class LangChainLLMAdapter(LanguageModel):
    def __init__(self, llm: BaseLanguageModel):
        self._llm = llm

    async def agenerate(self, prompt: str) -> str:
        result = await self._llm.ainvoke(prompt)
        content = getattr(result, "content", None)
        if isinstance(content, str):
            return content
        if isinstance(content, list):
            return "\n".join(str(part) for part in content)
        return str(result)


def get_pipeline() -> RAGPipeline:
    return _build_pipeline()


@lru_cache
def _build_pipeline() -> RAGPipeline:
    """
    Constructs and returns a configured RAGPipeline based on current application settings.
    
    The pipeline is built by creating an embedder, inferring its embedding dimension, initializing a vector store with that dimension, selecting an LLM, and setting the pipeline's default result count and generator label. The generator label is "echo" when the selected LLM is an EchoLLM, otherwise "openai". Extension hooks exist after component construction (post-store, pre-pipeline) and after pipeline construction for injecting custom logic or tracing.
    
    Returns:
        RAGPipeline: A pipeline configured with the application's vector store, embedder, LLM, default_k, and generator_label.
    """
    settings = get_settings()
    embedder = _build_embedder(settings)
    dim = _infer_dim(embedder, settings.embed_dim)
    store = build_store(dsn=settings.vector_dsn, table=settings.vector_table, dim=dim)
    llm = _build_llm(settings)
    label = "echo" if isinstance(llm, EchoLLM) else "openai"
    # // EXTEND_AI_HERE: pre-reranker hook (mutate embeddings/vector-store strategy).
    pipeline = RAGPipeline(
        vector_store=store,
        embedder=embedder,
        llm=llm,
        default_k=settings.top_k,
        generator_label=label,
    )
    # // EXTEND_AI_HERE: post-reranker hook (stream rerank traces to downstream AI features).
    return pipeline


def _build_embedder(settings: Settings):
    if settings.openai_api_key:
        embeddings = OpenAIEmbeddings(openai_api_key=settings.openai_api_key)
        return LangChainEmbeddingsAdapter(embeddings)
    return HashEmbedder(dim=settings.embed_dim)


def _infer_dim(embedder: Embedder, fallback: int) -> int:
    try:
        probe = embedder.embed_query(\"__dimension_probe__\")
        return len(probe) or fallback
    except Exception:  # pragma: no cover - defensive fallback
        return fallback


def _build_llm(settings: Settings) -> LanguageModel:
    """
    Constructs and returns a language model configured from the provided settings.
    
    Parameters:
        settings (Settings): Configuration object; if `settings.openai_api_key` is set, an OpenAI-backed model is returned, otherwise a deterministic fallback is used.
    
    Returns:
        LanguageModel: An OpenAI-backed model when `settings.openai_api_key` is present, otherwise an `EchoLLM` fallback.
    """
    if settings.openai_api_key:
        llm = ChatOpenAI(temperature=0.2, api_key=settings.openai_api_key, model_name="gpt-4o-mini")
        return LangChainLLMAdapter(llm)
    # EXTEND_AI_HERE: drop in CSP/CP-SAT backed reasoning once deterministic seeds land.
    return EchoLLM()


def pipeline_dependency() -> RAGPipeline:
    return get_pipeline()


app.include_router(build_router(pipeline_dependency))


@app.on_event("startup")
async def bootstrap() -> None:
    settings = get_settings()
    if settings.source_glob:
        chunks = list(chunk_glob(settings.ingestion_paths))
        if chunks:
            await get_pipeline().ingest(chunks)


def main() -> None:  # pragma: no cover - entrypoint wrapper
    config = Config(app=app, host="0.0.0.0", port=8000, factory=False)
    server = Server(config)
    asyncio.run(server.serve())


__all__ = ["app", "get_pipeline", "main"]