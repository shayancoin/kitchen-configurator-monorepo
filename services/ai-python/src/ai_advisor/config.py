"""Service configuration and dependency factories."""

from __future__ import annotations

from functools import lru_cache
from pathlib import Path
from typing import Any, Iterable, Optional

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_prefix="AI_", env_file=".env", extra="ignore")

    openai_api_key: Optional[str] = Field(default=None, alias="OPENAI_API_KEY")
    vector_dsn: Optional[str] = Field(default=None, alias="VECTOR_DSN")
    vector_table: str = Field(default="ai_chunks", alias="VECTOR_TABLE")
    embed_dim: int = Field(default=768, alias="EMBED_DIM")
    top_k: int = Field(default=4, alias="TOP_K")
    source_glob: Optional[str] = Field(default=None, alias="SOURCE_GLOB")

    @property
    def ingestion_paths(self) -> Iterable[Path]:
        if not self.source_glob:
            return []
        return Path.cwd().glob(self.source_glob)


@lru_cache
def get_settings() -> Settings:
    return Settings()  # type: ignore[arg-type]


__all__ = ["Settings", "get_settings"]
