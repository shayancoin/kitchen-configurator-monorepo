"""Vector store adapters (PGVector and FAISS/in-memory fallback)."""

from __future__ import annotations

from dataclasses import dataclass
from typing import Iterable, List, Optional, Protocol

import numpy as np
from numpy.typing import NDArray
from pgvector.sqlalchemy import Vector
from sqlalchemy import JSON, Column, MetaData, String, Table, Text, create_engine, select, text
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.engine import Engine
from sqlalchemy.exc import OperationalError
from sqlalchemy.dialects.postgresql import insert

from .schema import ChunkWithScore, DocumentChunk


class VectorStore(Protocol):
    def add(self, chunk: DocumentChunk, embedding: NDArray[np.float32]) -> None: ...

    def add_many(self, rows: Iterable[tuple[DocumentChunk, NDArray[np.float32]]]) -> None: ...

    def search(self, embedding: NDArray[np.float32], limit: int) -> List[ChunkWithScore]: ...


@dataclass
class InMemoryVectorStore(VectorStore):
    dim: int

    def __post_init__(self) -> None:
        self._rows: list[tuple[DocumentChunk, NDArray[np.float32]]] = []

    def add(self, chunk: DocumentChunk, embedding: NDArray[np.float32]) -> None:
        self._rows.append((chunk, self._normalize(embedding)))

    def add_many(self, rows: Iterable[tuple[DocumentChunk, NDArray[np.float32]]]) -> None:
        for chunk, embedding in rows:
            self.add(chunk, embedding)

    def search(self, embedding: NDArray[np.float32], limit: int) -> List[ChunkWithScore]:
        query = self._normalize(embedding)
        scored = [
            ChunkWithScore(chunk=chunk, score=float(query @ stored))
            for chunk, stored in self._rows
        ]
        return sorted(scored, key=lambda item: item.score, reverse=True)[:limit]

    def _normalize(self, embedding: NDArray[np.float32]) -> NDArray[np.float32]:
        vec = np.asarray(embedding, dtype=np.float32)
        if vec.shape[-1] != self.dim:
            raise ValueError(f"embedding dim {vec.shape[-1]} != expected {self.dim}")
        norm = np.linalg.norm(vec) or 1.0
        return vec / norm


class PgVectorStore(VectorStore):
    def __init__(self, *, dsn: str, table_name: str, dim: int) -> None:
        self.dim = dim
        self.engine = self._create_engine(dsn)
        self.table = self._build_table(table_name)
        self._ensure_schema()

    def _create_engine(self, dsn: str) -> Engine:
        return create_engine(dsn, future=True)

    def _build_table(self, name: str) -> Table:
        metadata = MetaData()
        return Table(
            name,
            metadata,
            Column("id", String(length=128), primary_key=True),
            Column("content", Text, nullable=False),
            Column("metadata", JSON().with_variant(JSONB, "postgresql"), nullable=False, server_default=text("'{}'::jsonb")),
            Column("embedding", Vector(self.dim), nullable=False),
        )

    def _ensure_schema(self) -> None:
        with self.engine.begin() as conn:
            conn.execute(text("CREATE EXTENSION IF NOT EXISTS vector"))
            self.table.create(conn, checkfirst=True)

    def add(self, chunk: DocumentChunk, embedding: NDArray[np.float32]) -> None:
        self.add_many([(chunk, embedding)])

    def add_many(self, rows: Iterable[tuple[DocumentChunk, NDArray[np.float32]]]) -> None:
        payload = [
            {
                "id": chunk.chunk_id,
                "content": chunk.content,
                "metadata": chunk.metadata,
                "embedding": self._to_python_vector(embedding),
            }
            for chunk, embedding in rows
        ]
        if not payload:
            return
        upsert = insert(self.table).on_conflict_do_update(
            index_elements=[self.table.c.id],
            set_={
                "content": insert.excluded.content,
                "metadata": insert.excluded.metadata,
                "embedding": insert.excluded.embedding,
            },
        )
        with self.engine.begin() as conn:
            conn.execute(upsert, payload)

    def search(self, embedding: NDArray[np.float32], limit: int) -> List[ChunkWithScore]:
        query_vec = self._to_python_vector(embedding)
        stmt = (
            select(
                self.table.c.id,
                self.table.c.content,
                self.table.c.metadata,
                (self.table.c.embedding.cosine_distance(query_vec)).label("distance"),
            )
            .order_by(self.table.c.embedding.cosine_distance(query_vec))
            .limit(limit)
        )
        with self.engine.begin() as conn:
            rows = conn.execute(stmt).fetchall()
        return [
            ChunkWithScore(
                chunk=DocumentChunk(
                    chunk_id=row._mapping["id"],
                    content=row._mapping["content"],
                    metadata=row._mapping.get("metadata") or {},
                ),
                score=1.0 - float(row._mapping["distance"]),
            )
            for row in rows
        ]

    def _to_python_vector(self, embedding: NDArray[np.float32]) -> List[float]:
        vec = np.asarray(embedding, dtype=np.float32)
        if vec.shape[-1] != self.dim:
            raise ValueError(f"embedding dim {vec.shape[-1]} != expected {self.dim}")
        return vec.astype(float).tolist()


def build_store(*, dsn: Optional[str], table: str, dim: int) -> VectorStore:
    if dsn:
        try:
            return PgVectorStore(dsn=dsn, table_name=table, dim=dim)
        except OperationalError:
            pass  # fall back to in-memory if datastore unreachable
    return InMemoryVectorStore(dim=dim)


__all__ = ["VectorStore", "InMemoryVectorStore", "PgVectorStore", "build_store"]
