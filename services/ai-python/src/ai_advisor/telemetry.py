"""OpenTelemetry bootstrap helpers for the AI advisor service."""

from __future__ import annotations

import os
import threading
from typing import Optional

from fastapi import FastAPI
from opentelemetry import trace
from opentelemetry.exporter.otlp.proto.http.trace_exporter import OTLPSpanExporter
from opentelemetry.instrumentation.fastapi import FastAPIInstrumentor
from opentelemetry.instrumentation.requests import RequestsInstrumentor
from opentelemetry.sdk.resources import Resource
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import BatchSpanProcessor

_LOCK = threading.Lock()
_INITIALIZED = False


def _parse_headers(raw: Optional[str]) -> Optional[dict[str, str]]:
    if not raw:
        return None
    headers: dict[str, str] = {}
    for pair in raw.split(","):
        if "=" not in pair:
            continue
        key, value = pair.split("=", 1)
        headers[key.strip()] = value.strip()
    return headers or None


def init_telemetry(app: FastAPI) -> None:
    """Configure OTLP exporters + FastAPI instrumentation once."""

    global _INITIALIZED
    if _INITIALIZED:
        return

    with _LOCK:
        if _INITIALIZED:
            return

        endpoint = os.getenv("OTEL_EXPORTER_OTLP_ENDPOINT", "http://localhost:4318/v1/traces")
        exporter = OTLPSpanExporter(endpoint=endpoint, headers=_parse_headers(os.getenv("OTEL_EXPORTER_OTLP_HEADERS")))

        resource = Resource.create(
            {
                "service.name": os.getenv("OTEL_SERVICE_NAME", "ai-python"),
                "service.namespace": "parviz",
                "deployment.environment": os.getenv("ENVIRONMENT", "local"),
            }
        )

        provider = TracerProvider(resource=resource)
        provider.add_span_processor(BatchSpanProcessor(exporter))

        trace.set_tracer_provider(provider)
        FastAPIInstrumentor().instrument_app(app, tracer_provider=provider)
        RequestsInstrumentor().instrument()

        _INITIALIZED = True


__all__ = ["init_telemetry"]
