"""Document loaders and chunking helpers."""

from __future__ import annotations

import hashlib
from pathlib import Path
from typing import Iterable, Iterator, Sequence

from langchain_text_splitters import RecursiveCharacterTextSplitter

from .schema import DocumentChunk


def chunk_file(path: Path, *, chunk_size: int = 1000, chunk_overlap: int = 200) -> Iterator[DocumentChunk]:
    splitter = RecursiveCharacterTextSplitter(chunk_size=chunk_size, chunk_overlap=chunk_overlap)
    text = path.read_text(encoding="utf-8")
    for idx, chunk in enumerate(splitter.split_text(text)):
        chunk_id = _chunk_id(path, idx)
        yield DocumentChunk(
            chunk_id=chunk_id,
            content=chunk,
            metadata={
                "source": str(path),
                "title": path.stem,
                "type": path.suffix.lower().lstrip("."),
                "index": idx,
            },
        )


def chunk_glob(paths: Iterable[Path]) -> Iterator[DocumentChunk]:
    for path in paths:
        if path.is_file():
            yield from chunk_file(path)


def _chunk_id(path: Path, idx: int) -> str:
    digest = hashlib.sha1(f"{path}:{idx}".encode(), usedforsecurity=False).hexdigest()
    return f"chunk_{digest[:10]}"


__all__ = ["chunk_glob", "chunk_file"]
