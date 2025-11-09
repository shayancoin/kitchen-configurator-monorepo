# Services Workspace Skeleton

This directory hosts the polyglot services mandated by the fusion plan.

| Service | Language | Purpose |
| --- | --- | --- |
| compositor-rust | Rust + Photon/wasm-pack | Layer compositing + sprite baking delivered to the viewer2d MFE. |
| pricing-go | Go | High-throughput pricing matrix and quote engine. |
| rules-go | Go | Configuration rules/constraints engine with CSP hooks. |
| ai-python | Python | LangChain-based RAG + optimization loops. |
| manufacturing-rust | Rust | Fornjot + cnccoder pipeline for CAD/CAM export. |

Each service will be wired into Turborepo via custom `turbo.json` tasks; placeholders exist so infra/CI can be scaffolded incrementally.
