# Helm Baseline

This directory contains a reusable `lib-service` library chart and a concrete `gateway` chart that consumes it. Any microservice can piggyback on the shared macros to get a Deployment, Service, ConfigMap, and optional HPA out-of-the-box.

## Usage

```bash
helm dependency update infra/helm/gateway
helm upgrade --install gateway infra/helm/gateway \
  --namespace platform \
  -f infra/helm/values.example.yaml
```

Key values:

| Key | Purpose |
| --- | --- |
| `image.repository/tag` | Container reference pushed by CI |
| `env` | Inline environment variables merged with OTEL defaults |
| `config` | Turned into a ConfigMap mounted at `/app/config` |
| `autoscaling.*` | Enables autoscaling via the rendered HPA |
| `otel.*` | Aligns trace exporters with the collector (`ops/otel/collector.yaml`) |

## Resource Modeling Question

> **Queue theory for pod scaling?**  The chart defaults assume an M/M/c queue (Poisson arrivals, exponential service time) with utilization target ρ≃0.6. With c replicas and mean service rate μ, the expected wait ≈ ρ / (c μ (1 − ρ)). Do we want autoscaling to continue optimizing for ρ<0.6, or should we move to percentile-aware scaling once phase-1 telemetry is stable?
