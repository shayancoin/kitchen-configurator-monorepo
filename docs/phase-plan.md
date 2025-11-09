# Phase Prep (Step 14)

| Phase | Git Branch | Scope Highlights | Upstream Dependencies | DAG Owner | Parallel Subgraphs |
| --- | --- | --- | --- | --- | --- |
| Phase 1 – MVP shell | `feature/phase-1-mvp` | Next.js host, Tesla shell, MFEs w/ fallbacks | `pr-000-monorepo-baseline` | Shell Platform (Ayla) | Shell frame, Config Panel, Viewer placeholder |
| Phase 2 – Pricing & Rules | `feature/phase-2-pricing` | Go pricing/rules subgraphs, Redis caching, Kafka events | Phase 1 | Pricing Platform (Noor) | Pricing Go, Rules Go, Cached GraphQL SDL |
| Phase 3 – Manufacturing | `feature/phase-3-manufacturing` | Manufacturing Rust services, BOM adapters | Phase 2 | Manufacturing Systems (Diego) | Manufacturing Rust, CAD prep ingest, Assembly BOM sync |
| Phase 4 – Dynamic Visualization | `feature/phase-4-visual` | Viewer2D WASM + scene graph spec | Phase 1 | Visualization (Mira) | Viewer2D canvas, Asset streaming, Sprite atlas |
| Phase 5 – CAD & CNC | `feature/phase-5-cad` | DXF/DWG writers, cnccoder integration | Phase 3 | CAD Toolchain (Sasha) | CAD Rust, CNC exporters, QA harness |
| Phase 6 – Automation | `feature/phase-6-automation` | BOM service, traceability, nesting core | Phases 2–5 | Automation (Imani) | BOM Go, CAD Rust, Ops workflows |
| Phase 7 – AI Guidance | `feature/phase-7-ai` | RAG advisor, CSP/CP-SAT optimizer, UI entry points | Phase 1 + data services | AI Systems (Luca) | AI Python, Layout optimizer, Advisor UX |

**Owner cues**
- Owners coordinate merge order for their DAG nodes; when two subgraphs share SDL (e.g., Pricing Go and Rules Go), Noor signs off GraphQL changes before shell adoption.
- Visualization + CAD teams (Mira, Sasha) agree on sprite/mesh contracts so Phase 4 assets can stream ahead of CAD exporters without blocking Automation.
- Luca tracks the `// EXTEND_AI_HERE` hooks (Step 15) to preserve additive AI features without drifting from Shell Platform's source of truth.

**Branch automation**  
Run `scripts/phase-prep.sh [base] [--dry-run]` to (re)spawn the feature branches above. The base defaults to the current branch (`pr-000-monorepo-baseline` when invoked today), ensuring every phase head points at the latest fused baseline before diverging.

**Parallel assignment guidance**
- GraphQL subgraphs can push in parallel so long as their SDL updates land in `feature/phase-2-pricing` with Pact + composition checks (`packages/shared-sdl` as the shared choke point).
- Visualization (Phase 4) can prototype WebGPU + WASM upgrades independently provided interfaces remain backwards compatible with `@repo/compositor-client`.
- AI (Phase 7) shares ingestion + embeddings with Phase 2 data work; use `// EXTEND_AI_HERE` hooks to avoid cross-branch merge pain.

**Coordination tips**
- Treat the phase branches as a DAG: `feature/phase-1-mvp` → `feature/phase-4-visual` (UI), `feature/phase-2-pricing` → `feature/phase-6-automation`, etc.
- Use `scripts/new-pr.sh` for numbered PRs and `scripts/phase-prep.sh` for phase epics so build pipelines can auto-target the affected apps/services.
