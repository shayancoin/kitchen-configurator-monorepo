# Observability & Telemetry (Step 10)

## Instrumentation Surface

- **Node/TS**: `@repo/observability/otel-node` bootstraps the OpenTelemetry Node SDK with auto-instrumentations. `apps/gateway` and every Next.js app that imports `initializeSentry` now calls `startNodeTelemetry()` on boot.
- **Browser**: `@repo/observability/otel-browser` lazily loads the web tracer provider, registers Fetch/Document instrumentation, and is wired into the shell layout via a `TelemetryBootstrap` client component.
- **Go microservices**: `services/go-kit/pkg/telemetry` standardizes OTLP exporters + propagators. Pricing/Rules services initialize the tracer provider during startup and expose otelhttp middleware for each chi router.
- **Python AI service**: `ai_advisor.telemetry.init_telemetry` configures OTLP exporters, FastAPI instrumentation, and Requests instrumentation so downstream LLM calls are traced.
- **Collector**: `ops/otel/collector.yaml` exposes OTLP gRPC/HTTP receivers, spanmetrics -> Prometheus pipeline, and sends traces to Tempo/Grafana Cloud-style endpoints.

## Export Targets & Env Contract

| Var | Description |
| --- | --- |
| `OTEL_EXPORTER_OTLP_ENDPOINT` | Shared endpoint for Node/Go/Python emitters (defaults to `http://localhost:4318`). |
| `OTEL_EXPORTER_OTLP_HEADERS` | Optional `key=value` pairs for auth tokens. |
| `OTEL_SERVICE_NAME` | Used everywhere to label spans (defaults: `parviz-gateway`, `pricing-go`, `ai-python`, etc.). |
| `NEXT_PUBLIC_OTEL_EXPORTER_OTLP_ENDPOINT` | Browser override for OTLP collector edge endpoint. |

## Latency Histogram Strategy

- Collector spanmetrics connector emits explicit buckets `[25ms, 50ms, 100ms, 200ms, 500ms, 1s]`, tuned to the p95<300 ms target.
- For most request paths we observe a log-normal distribution; fitting histograms to log-normal models lets us derive expected tail latency analytically (μ, σ estimated via method of moments on bucket counts).
- Open question for data science: should we maintain both log-normal fits and empirical percentile tracking? Current proposal is a hybrid—use log-normal for predictive scaling while still alerting on actual bucket breaches.

## Open Question

> **Latency histograms — fit to distribution (log-normal?)**  
> The collector currently exports fixed buckets; we assume log-normal latency to project burn rates. Should we formalize this assumption (fitting μ/σ per route) or keep purely empirical histograms? Guidance needed before wiring autoscaling heuristics to the analytical model.
