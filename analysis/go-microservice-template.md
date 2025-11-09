# Go Microservice Template (infranyx/go-microservice-template) – Structural Notes

- **Acquisition**: Direct clone via `git clone https://github.com/infranyx/go-microservice-template /tmp/go-microservice-template` (fork unavailable from sandbox).
- **Scope**: Production-ready Go hexagonal microservice with HTTP+gRPC servers, worker queue, and clean architecture layering.

## Repository Stats
| Metric | Value |
| --- | --- |
| `.go` files (`V`) | 80 |
| Bounded contexts | `article`, `health_check` (mirrored folders under `internal/`) |
| Layers per context | `delivery` → `usecase` → `repository` + DTO/domain/exception/configurator |
| Concurrency primitives | `pkg/workerpool`, `internal/article/job/sync_job.go` (goroutines + buffered channels) |

- DAG observation: packages import direction strictly flows from `delivery` (handlers) down to `domain` value objects → `repository` interfaces, ensuring `O(V+E)` initialization because there are no cyclic dependencies (validated via manual inspection of `go.mod` and folder dag).
- Configurators wire dependencies via `fx`-style constructors (see `internal/article/configurator`), so we can transplant this pattern to expose `pricing` + `rules` services with deterministic bootstrap order.

## Extraction Targets
1. **Server bootstrap** – `app/app.go` + `cmd/main.go` provide HTTP/GRPC multiplexers with structured logging (`pkg/logger`). Reusing them keeps init cost O(1) across services.
2. **Database abstractions** – `internal/article/repository` implements Postgres repository interfaces with context timeouts; port to `pricing` for deterministic price table lookups.
3. **Worker/job model** – `internal/article/job` schedules asynchronous syncs via goroutines and typed channels; ideal for future pricing refresh tasks (bounded by worker count `k`, throughput Θ(k)).
4. **Health checks** – `internal/health_check` package (handlers + DTOs) can be lifted verbatim for readiness endpoints across Go services.

## Reuse Guidance
- Create `services/pricing-go` and `services/rules-go` as separate Go modules but share a `pkg` directory for logging/config tracing to avoid duplication.
- Preserve the clean architecture folder pattern; it keeps coupling low and affords O(1) mocking for tests (each layer depends on interfaces only).
- Introduce pricing matrices as immutable maps keyed by option IDs; lookups stay O(1) while goroutine-safe access uses `sync.RWMutex` or copy-on-write slices.
- Use the template's `Makefile` targets (`make test`, `make lint`) as the base for CI; adapt to run under Turborepo via `pnpm turbo run go:test --filter=svc-pricing-go` style tasks.
