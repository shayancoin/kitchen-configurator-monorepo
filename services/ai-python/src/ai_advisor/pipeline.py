"""LangChain-backed RAG orchestration."""

from __future__ import annotations

import math
from dataclasses import dataclass
from typing import Iterable, List, Protocol, Sequence

import numpy as np
from numpy.typing import NDArray

from .schema import AdvisorResponse, AdvisorSuggestion, ChunkWithScore, Citation, DocumentChunk, QueryRequest
from .vectorstore import VectorStore


class Embedder(Protocol):
    def embed_query(self, text: str) -> List[float]: ...

    def embed_documents(self, texts: Sequence[str]) -> List[List[float]]: ...


class LanguageModel(Protocol):
    async def agenerate(self, prompt: str) -> str: ...


@dataclass
class HashEmbedder(Embedder):
    """Deterministic fallback avoiding external APIs."""

    dim: int = 768
    seed: int = 13

    def embed_query(self, text: str) -> List[float]:
        vec = np.zeros(self.dim, dtype=np.float32)
        for token in text.lower().split():
            bucket = (hash((token, self.seed)) % self.dim)
            vec[bucket] += 1.0
        norm = np.linalg.norm(vec) or 1.0
        return (vec / norm).tolist()

    def embed_documents(self, texts: Sequence[str]) -> List[List[float]]:
        return [self.embed_query(text) for text in texts]


class EchoLLM(LanguageModel):
    async def agenerate(self, prompt: str) -> str:  # pragma: no cover - trivial
        return f"Echoed guidance based on prompt:\n{prompt[:512]}"


DEFAULT_PROMPT = (
    "You are a deterministic kitchen design advisor.\n"
    "Use the CONTEXT to answer the QUESTION.\n"
    "Return 2 concise suggestions referencing chunk ids in brackets.\n"
)


class RAGPipeline:
    def __init__(
        self,
        *,
        vector_store: VectorStore,
        embedder: Embedder,
        llm: LanguageModel,
        default_k: int = 4,
        prompt_template: str = DEFAULT_PROMPT,
        generator_label: str = "openai",
    ) -> None:
        self.store = vector_store
        self.embedder = embedder
        self.llm = llm
        self.default_k = default_k
        self.prompt_template = prompt_template
        self.generator_label = generator_label

    async def ingest(self, chunks: Iterable[DocumentChunk]) -> int:
        items = list(chunks)
        if not items:
            return 0
        embeddings = self.embedder.embed_documents([item.content for item in items])
        payload = [
            (item, np.asarray(vector, dtype=np.float32))
            for item, vector in zip(items, embeddings, strict=True)
        ]
        self.store.add_many(payload)
        return len(items)

    async def query(self, request: QueryRequest) -> AdvisorResponse:
        limit = request.k or self.default_k
        query_vec = np.asarray(self.embedder.embed_query(request.question), dtype=np.float32)
        retrieved = self.store.search(query_vec, limit * 2)
        reranked = self._rerank(retrieved, limit) if request.rerank else retrieved[:limit]
        context = self._build_context(reranked)
        prompt = f"CONTEXT:\n{context}\nQUESTION: {request.question}\nLocale: {request.locale}"
        answer = await self.llm.agenerate(prompt)
        suggestions = [
            AdvisorSuggestion(summary=line.strip() or "See reasoning", reasoning=answer, tokens_consumed=len(answer.split()))
            for line in answer.split("\n")
            if line.strip()
        ] or [
            AdvisorSuggestion(summary=answer[:120], reasoning=answer, tokens_consumed=len(answer.split()))
        ]
        citations = [
            Citation(chunk_id=item.chunk.chunk_id, label=item.chunk.metadata.get("title", item.chunk.chunk_id))
            for item in reranked
        ]
        return AdvisorResponse(
            question=request.question,
            locale=request.locale,
            suggestions=suggestions[:2],
            citations=citations[:limit],
            retrieved=reranked,
            generator=self.generator_label,
        )

    def _build_context(self, retrieved: Sequence[ChunkWithScore]) -> str:
        return "\n\n".join(
            f"[{item.chunk.chunk_id}] score={item.score:.2f}\n{item.chunk.content}" for item in retrieved
        )

    def _rerank(self, retrieved: Sequence[ChunkWithScore], limit: int) -> List[ChunkWithScore]:
        if not retrieved:
            return []
        scores: dict[str, float] = {}
        for rank, item in enumerate(retrieved, start=1):
            scores[item.chunk.chunk_id] = scores.get(item.chunk.chunk_id, 0.0) + 1.0 / (rank + 60.0)
        ranked_ids = sorted(scores, key=scores.get, reverse=True)[:limit]
        by_id = {item.chunk.chunk_id: item for item in retrieved}
        return [by_id[i] for i in ranked_ids if i in by_id]


__all__ = ["RAGPipeline", "HashEmbedder", "EchoLLM", "DEFAULT_PROMPT", "Embedder", "LanguageModel"]
