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
    settings = get_settings()
    embedder = _build_embedder(settings)
    dim = _infer_dim(embedder, settings.embed_dim)
    store = build_store(dsn=settings.vector_dsn, table=settings.vector_table, dim=dim)
    llm = _build_llm(settings)
    label = "echo" if isinstance(llm, EchoLLM) else "openai"
    pipeline = RAGPipeline(
        vector_store=store,
        embedder=embedder,
        llm=llm,
        default_k=settings.top_k,
        generator_label=label,
    )
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
    if settings.openai_api_key:
        llm = ChatOpenAI(temperature=0.2, api_key=settings.openai_api_key, model_name="gpt-4o-mini")
        return LangChainLLMAdapter(llm)
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
