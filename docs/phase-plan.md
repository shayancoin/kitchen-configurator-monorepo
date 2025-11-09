# Phase Prep (Step 14)

| Phase | Git Branch | Scope Highlights | Upstream Dependencies | Parallel Subgraphs |
| --- | --- | --- | --- | --- |
| Phase 1 – MVP shell | `feature/phase-1-mvp` | Next.js host, Tesla shell, MFEs w/ fallbacks | `pr-000-monorepo-baseline` | Shell, Config Panel |
| Phase 2 – Pricing & Rules | `feature/phase-2-pricing` | Go pricing/rules subgraphs, Redis caching, Kafka events | Phase 1 | Pricing Go, Rules Go |
| Phase 3 – Manufacturing | `feature/phase-3-manufacturing` | Manufacturing Rust services, BOM adapters | Phase 2 | Manufacturing Rust, CAD prep |
| Phase 4 – Dynamic Visualization | `feature/phase-4-visual` | Viewer2D WASM + scene graph spec | Phase 1 | Viewer2D, Asset subgraph |
| Phase 5 – CAD & CNC | `feature/phase-5-cad` | DXF/DWG writers, cnccoder integration | Phase 3 | CAD Rust |
| Phase 6 – Automation | `feature/phase-6-automation` | BOM service, traceability, nesting core | Phases 2–5 | BOM Go, CAD Rust |
| Phase 7 – AI Guidance | `feature/phase-7-ai` | RAG advisor, CSP/CP-SAT optimizer, UI entry points | Phase 1 + data services | AI Python, Layout optimizer |

**Branch automation**  
Run `scripts/phase-prep.sh [base] [--dry-run]` to (re)spawn the feature branches above. The base defaults to the current branch (`pr-000-monorepo-baseline` when invoked today), ensuring every phase head points at the latest fused baseline before diverging.

**Parallel assignment guidance**
- GraphQL subgraphs can push in parallel so long as their SDL updates land in `feature/phase-2-pricing` with Pact + composition checks (`packages/shared-sdl` as the shared choke point).
- Visualization (Phase 4) can prototype WebGPU + WASM upgrades independently provided interfaces remain backwards compatible with `@repo/compositor-client`.
- AI (Phase 7) shares ingestion + embeddings with Phase 2 data work; use `// EXTEND_AI_HERE` hooks to avoid cross-branch merge pain.

**Coordination tips**
- Treat the phase branches as a DAG: `feature/phase-1-mvp` → `feature/phase-4-visual` (UI), `feature/phase-2-pricing` → `feature/phase-6-automation`, etc.
- Use `scripts/new-pr.sh` for numbered PRs and `scripts/phase-prep.sh` for phase epics so build pipelines can auto-target the affected apps/services.
