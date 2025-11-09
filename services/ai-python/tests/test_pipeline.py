import pytest

from ai_advisor.pipeline import EchoLLM, HashEmbedder, RAGPipeline
from ai_advisor.schema import DocumentChunk, QueryRequest
from ai_advisor.vectorstore import InMemoryVectorStore


@pytest.mark.asyncio
async def test_pipeline_roundtrip() -> None:
    store = InMemoryVectorStore(dim=32)
    pipeline = RAGPipeline(
        vector_store=store,
        embedder=HashEmbedder(dim=32),
        llm=EchoLLM(),
        default_k=2,
        generator_label="echo",
    )
    chunks = [
        DocumentChunk(chunk_id="c1", content="Matte white fronts pair with walnut lowers.", metadata={"title": "finishes"}),
        DocumentChunk(chunk_id="c2", content="Stainless pulls complement matte textures.", metadata={"title": "hardware"}),
    ]
    ingested = await pipeline.ingest(chunks)
    assert ingested == 2

    response = await pipeline.query(QueryRequest(question="What finish pairs well?"))
    assert response.suggestions
    assert response.citations
    assert response.generator == "echo"
    assert {c.chunk_id for c in response.citations} <= {"c1", "c2"}
