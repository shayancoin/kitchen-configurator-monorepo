# Pricing Service (Go)

- **Purpose**: Deterministic pricing engine delivering O(n) computations where `n` equals selected options. Baseline matrices cover Tesla-inspired kitchen modules and expose predictable multipliers for layout/finish/bundle rules.
- **Tech**: chi router, zerolog logging, Redis (optional) cache, memory fallback for tests/local dev.

## Running locally
```bash
cd services/pricing-go
PATH=$PWD/../../.tooling/go1.22.2/bin:$PATH go run ./cmd/server
```
Environment variables:

| Variable | Default | Description |
| --- | --- | --- |
| `HTTP_PORT` | `4108` | HTTP bind port |
| `CACHE_TTL` | `5m` | TTL for cached estimates |
| `REDIS_ADDR` | _empty_ | Optional `<host>:<port>` for Redis |
| `REDIS_PASSWORD` | _empty_ | Optional password |
| `REDIS_DB` | `0` | Redis database index |
| `SHUTDOWN_TIMEOUT` | `10s` | Graceful shutdown budget |

## API
- `GET /healthz` – readiness probe.
- `POST /v1/pricing/estimate` – body:
```json
{
  "configurationId": "config-123",
  "module": "galley",
  "layout": "l-shape",
  "finish": "gloss",
  "currency": "USD",
  "options": [
    { "id": "waterfall-edge", "quantity": 1 },
    { "id": "drawer-lighting", "quantity": 2 }
  ]
}
```
Response includes subtotal, applied adjustments, total, cache hit flag, and latency in microseconds.

## Tests
Run `make test` (compiles on macOS via `.tooling/go1.22.2`). Tests exercise cache-key determinism and concurrency-safe price math.
