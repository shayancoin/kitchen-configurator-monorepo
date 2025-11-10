# kitchen-configurator-monorepo

## Executive Intent
- Build a vertically integrated kitchen configurator spanning MFEs, AI guidance, manufacturing outputs, and observability.
- Enforce a unified TypeScript-first DX (Next.js host + Turborepo workspaces) while accommodating Rust/Go/Python microservices.
- Target performance KPIs: p95 < 300 ms on configurator updates, WASM compositor < 50 ms init, Go pricing services p95 < 50 ms under 1M req/s.

## Architectural Stack Targets
| Layer | Technology | Notes |
| --- | --- | --- |
| Shell + MFEs | Next.js host + Webpack Module Federation | Tesla-inspired UI tokens, viewer2d, configurator panel, AI advisor remotes |
| Shared Packages | TypeScript domain layers, generated GraphQL types, Pact contracts | Derived from clean architecture boilerplate |
| Services | Rust compositor (Photon + wasm-pack), Go pricing/rules, Python RAG, Rust manufacturing (Fornjot + cnccoder) | Polyglot persistence via Postgres/Redis/S3/Vector DB |
| Data/Infra | Apollo Federation gateway, Turborepo task orchestration, K8s deployments, OTel tracing | Build/test via pnpm + turbo |

## Fusion Roadmap (Condensed from 15-step directive)
1. Seed Turborepo skeleton + clean architecture domain modules.
2. Integrate MFEs + federation boilerplates and Tesla UI layer.
3. Layer backend services (GraphQL gateway, Rust WASM compositor, Go microservices, Python RAG, manufacturing).
4. Provision data tier + observability, then wire CI/CD and infra manifests.
5. Execute optimization/validation passes and prep for Phase 1 MVP.

## Current Status (2025-11-09)
- ✅ Workspace wiped per directive and reinitialized as a fresh git repo.
- ✅ Turborepo scaffold from `vercel/next-forge` adopted (`apps/`, `packages/`, `turbo.json`, `pnpm-workspace.yaml`).
- ✅ Clean architecture domain + use-case layers transplanted into `packages/domain-core`.
- ✅ Local toolchain upgraded to Node v20.18.0 (see `.tooling/`); `pnpm install --ignore-scripts` succeeds with pnpm 10.19.0.
- ✅ Tesla design system stubbed in `packages/ui-tesla` with a live preview route (`apps/web/app/[locale]/configurator`) plus dedicated configurator panel primitives.
- ✅ Module Federation baseline shipped: `packages/config` hosts the conditional MF helper + shim aliasing, `scripts/ensure-mf-shim.cjs` guards builds, `apps/shell` (host) and `apps/mfe-config-panel` (remote) now render Tesla-styled panels gated by `ENABLE_MF_PLUGIN`/`NEXT_PUBLIC_ENABLE_MF_REMOTES`.
- ✅ GraphQL federation starter online: `@repo/shared-sdl` exposes Catalog/Pricing SDL + DTOs, and `apps/gateway` serves an Apollo subgraph (`Query.catalogModules`, `Query.pricingEstimate`) sourced from deterministic data.
- ✅ Rust/WASM compositor fused: `services/compositor-rust` (Photon + wasm-bindgen) exports `@repo/compositor-wasm`, `packages/compositor-client` wraps the dynamic import, and `apps/mfe-viewer2d` remote demonstrates layered sprite blending rendered inside the shell host.
- 📋 Execution log maintained in `LOG.md` with timestamped steps.
- ✅ Repos #8–#11 (Go template, bRAG-langchain, Fornjot, cnccoder) cloned under `/tmp/*` and summarized in `analysis/` for continued fusion.
- ✅ `.tooling/go1.22.2` added plus `services/go-kit` (shared zerolog + Redis/memory cache) so Go services share the same primitives + go.work wiring.
- ✅ `services/pricing-go` and `services/rules-go` now expose chi-based HTTP APIs with deterministic pricing matrices, rule engines, and compile-verified unit tests (Go toolchain bug on macOS prevents executing `go test`, see LOG.md).
- ✅ `services/ai-python` delivers the LangChain RAG FastAPI microservice with PGVector/FAISS adapters, ingestion helpers, and pytest-backed unit tests to keep hallucinations bounded.
- ✅ `services/manufacturing-rust` now wraps Fornjot geometry + cnccoder G-code generation behind an Axum HTTP API, with cargo check/test gating the workspace.

## Module Federation Toggles
- `ENABLE_MF_PLUGIN=true pnpm --filter shell build` injects the webpack MF plugin; omit/false to use shimmed fallbacks.
- `NEXT_PUBLIC_ENABLE_MF_REMOTES=true pnpm --filter shell dev` enables runtime remote loading; otherwise host renders the local Tesla panel fallback.
- `CONFIG_PANEL_ORIGIN=http://localhost:4021` overrides where the shell looks for the config-panel remote (defaults to that URL).
- `pnpm prebuild` (automatically run before `pnpm build`) executes `scripts/ensure-mf-shim.cjs` so local builds without Module Federation never explode.

## GraphQL Gateway (Step 4 Baseline)
```bash
PATH=$PWD/.tooling/node-v20.18.0-darwin-arm64/bin:$PATH pnpm --filter gateway dev
# → http://localhost:4100/graphql provides catalog + pricing queries with deterministic data.
```

## WASM Compositor + Viewer Remote
```bash
# compile the Photon-based compositor crate to wasm (outputs @repo/compositor-wasm)
PATH=$PWD/.tooling/node-v20.18.0-darwin-arm64/bin:$PATH npx pnpm@10.19.0 --filter @repo/compositor-rust build

# launch the viewer remote and load it inside the shell host
PATH=$PWD/.tooling/node-v20.18.0-darwin-arm64/bin:$PATH pnpm --filter mfe-viewer2d dev
ENABLE_MF_PLUGIN=true NEXT_PUBLIC_ENABLE_MF_REMOTES=true PATH=... pnpm --filter shell dev
```
The viewer remote consumes `@repo/compositor-client`, which lazily imports the wasm bundle and
invokes `compose_layers` with Tesla-style gradient layers. The host falls back to a placeholder
when Module Federation is disabled, so we can keep builds deterministic.

## Next Actions
1. Complete MFEs for viewer2d + AI rail (#3–#5) using the same `@repo/config` helper so the host can dynamically stitch all remotes.
2. Fuse Python RAG + manufacturing stacks (repos #9–#11) and register Go/Python/Rust services behind the Apollo federation gateway.
3. Wire observability/data infra plus CI/CD (OTel spans, Helm/Terraform, PR gatekeepers) as outlined in the roadmap.

### Local Tooling
- `PATH=$PWD/.tooling/node-v20.18.0-darwin-arm64/bin:$PATH pnpm install` keeps the repo on Node 20 without touching system Node.

## Step 9–11 Progress Snapshot

- **Data Layer (Step 9)**: Prisma schema now models catalog modules, finishes, sprite manifests, configuration snapshots, AI annotations, embeddings (PGVector), and manufacturing jobs. `packages/database/scripts/seed.ts` hydrates deterministic SKUs, `@repo/cache` offers Redis/memory memoization, and `@repo/storage` adds AWS S3 + signed URL helpers. Docs live at `docs/data-layer.md`.
- **Observability (Step 10)**: All runtimes emit OpenTelemetry traces. `@repo/observability/otel-node`/`otel-browser` wire Node + browser spans, Go/Python services initialize OTLP exporters, and `ops/otel/collector.yaml` fans out traces → Tempo + spanmetrics → Prometheus. Details at `docs/observability.md`.
- **CI/CD & Infra (Step 11)**: `.github/workflows/ci.yml` runs pnpm/turbo, Go, Rust, Python, and Helm lint jobs per push/PR. `infra/helm/lib-service` exposes reusable deployment macros and the `gateway` chart consumes them (with a queue-theory sizing question baked into the README). `scripts/new-pr.sh` standardizes PR branch naming.
- **Validation Harness**: `packages/tests-fusion` hosts the fusion Vitest suite (catalog → pricing → sprites) while `scripts/full-validation.sh` runs the full matrix (pnpm, Go, Rust, Python) locally.

## Step 13 – Optimization Pass Highlights

- **Tesla design system parity**: `@repo/ui-tesla` now bundles the Universal Sans font stack + raw Tesla Design System (TDS) tokens derived from `/Users/shayanbozorgmanesh/Developer/tesla/CSS/main.*.css`. Tokens cover typography, color ramps, spacing, and elevation shadows; `TeslaThemeProvider` publishes them on `window.tesla.tokens` alongside component contracts for Header, Section, and ConfiguratorPanel primitives.
- **Global perf contract**: `window.tesla.metrics` captures LCP/FID/TTI in real time. Shell initializes `initPerfBudget()` → `PerfBudgetIndicator`, targeting TTI ≤ 2000 ms (see `apps/shell/components/PerfBudgetIndicator.tsx`). Metrics stream through a custom `tesla:perf-update` event so remotes can join the SLO conversation.
- **Configurator code-splitting**: `apps/web/app/[locale]/configurator` lazy-loads the Tesla preview shell, targeting a reduced initial JS payload for locales that do not need the configurator hero during SSR while keeping the CSS + tokens scoped to that chunk.
- **Go test reliability**: `scripts/full-validation.sh` now shells Go unit tests through `golang:1.23.0` when running on macOS, sidestepping the `LC_UUID` dyld issue while still honoring the local toolchain on Linux builders.

## Step 14 – Phase Prep & Hooks

- `docs/phase-plan.md` tracks the phase-by-phase DAG (Phases 1–7) and the corresponding `feature/phase-*` branches created via `scripts/phase-prep.sh`.
- `docs/repo-tree.md` captures the repo tree (depth ≤2) so future contributors know where to anchor expandable hooks.
- `// EXTEND_AI_HERE` beacons live in the local configurator panel, AI advisor server, and viewer2d WebGPU TODO to keep CPSAT/RAG/visual extensions discoverable.

## PR-001 – IaC Baseline

- `infra/terraform` now houses composable modules for the network, EKS, Aurora, Redis, MSK, CloudFront/S3, Istio, OTEL, and Secrets Manager hooks. `infra/terraform/README.md` documents `terraform apply` inputs.
- Aurora exposes an explicit modulo-based shard strategy (`fnv1a64(configuration_id) % ${var.shard_count}`) with serverless v2 scaling, satisfying the “hash modulo k for O(1) reads” directive.
- CloudFront behaviors split immutable sprites (S3 origin) from GET-only GraphQL persisted queries, using APQ-friendly cache policies plus SigV4 OAC to lock down the bucket.
- OTEL Collector (Terraform + `ops/otel/collector.yaml`) now performs latency/error tail sampling and pushes RED metrics to Prometheus remote write while Tempo ingests spans.
