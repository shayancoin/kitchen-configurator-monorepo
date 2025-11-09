"""Typed schema shared by the API and pipeline."""

from __future__ import annotations

from typing import Any, Dict, List, Literal, Sequence

from pydantic import BaseModel, Field


class DocumentChunk(BaseModel):
    """Normalized chunk pushed into the vector store."""

    chunk_id: str
    content: str
    metadata: Dict[str, Any] = Field(default_factory=dict)


class ChunkWithScore(BaseModel):
    chunk: DocumentChunk
    score: float


class QueryRequest(BaseModel):
    question: str
    locale: str = "en-US"
    k: int | None = None
    rerank: bool = True


class AdvisorSuggestion(BaseModel):
    summary: str
    reasoning: str
    tokens_consumed: int = 0


class Citation(BaseModel):
    chunk_id: str
    label: str
    url: str | None = None


class AdvisorResponse(BaseModel):
    question: str
    locale: str
    suggestions: List[AdvisorSuggestion]
    citations: List[Citation]
    retrieved: Sequence[ChunkWithScore]
    generator: Literal["echo", "openai"]
