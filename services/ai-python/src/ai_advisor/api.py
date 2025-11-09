"""FastAPI router factory."""

from __future__ import annotations

from typing import Callable

from fastapi import APIRouter, Depends

from .pipeline import RAGPipeline
from .schema import AdvisorResponse, DocumentChunk, QueryRequest

PipelineDependency = Callable[[], RAGPipeline]


def build_router(dep: PipelineDependency) -> APIRouter:
    router = APIRouter()

    @router.get("/healthz")
    async def health() -> dict[str, str]:
        return {"status": "ok"}

    @router.post("/ingest")
    async def ingest(chunks: list[DocumentChunk], pipeline: RAGPipeline = Depends(dep)) -> dict[str, int]:
        count = await pipeline.ingest(chunks)
        return {"ingested": count}

    @router.post("/query", response_model=AdvisorResponse)
    async def query(payload: QueryRequest, pipeline: RAGPipeline = Depends(dep)) -> AdvisorResponse:
        return await pipeline.query(payload)

    return router


__all__ = ["build_router", "PipelineDependency"]
