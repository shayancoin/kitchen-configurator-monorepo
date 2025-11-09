# Fornjot (hannobraun/fornjot) – Structural Notes

- **Acquisition**: `git clone https://github.com/hannobraun/fornjot /tmp/fornjot`.
- **Scope**: Modular Rust CAD kernel focused on precise b-rep modeling, code-first workflows, and export/viewer tooling.

## Repository Stats
| Metric | Value |
| --- | --- |
| Rust files | 355 |
| Workspace crates | `fj`, `fj-core`, `fj-export`, `fj-interop`, `fj-math`, `fj-viewer`, `fj-window`, plus example `models/*` crates |
| Precision target | ≤ 1e-6 tolerance (documented in README + design discussions) |

- Workspace is acyclic: crates depend on foundational math/interop modules, enabling us to build a custom `svc-cad-rs` crate that imports only the needed layers (`fj-core` + `fj-export`). Build graph height ≈ 4 which keeps compilation O(V+E) in Cargo.
- Export pipeline already supports 3MF/OBJ; we can augment with DXF/DWG bridging (via cnccoder + ODA) without touching low-level topology routines.

## Extraction Targets
1. **Geometry primitives (`fj-math`, `fj-core`)** – provide manifold-safe curves/surfaces and boolean ops for cabinetry solids.
2. **Export traits (`fj-export`)** – extend to emit DWG/DXF while preserving Fornjot's trait-based writer pattern.
3. **Viewer** – `fj-viewer` + `fj-window` deliver OpenGL preview; we can later embed them for QA/regression comparisons.
4. **Example models** – use `models/` as regression fixtures for manufacturing tests (kitchen module paramizations).

## Reuse Guidance
- Vendors: add Fornjot crates as git `workspace.dependencies` inside `services/manufacturing-rust/Cargo.toml` with sparse protocol to minimize download size.
- Build manufacturing service as multi-crate workspace: `cad-kernel` (wraps Fornjot), `dwg-exporter` (ODA/cnccoder), `service` (gRPC/tonic) to keep compile units targeted.
- Guarantee determinism by locking `rust-toolchain.toml` to Fornjot’s pinned version; cross-check using `cargo metadata` for cycle detection.
- Hooking to GraphQL: produce BOM/CNC artifacts asynchronously; complexity: geometry build O(n log n) (due to boolean operations) + export O(f) faces; ensure pipelines stay linear in face count.
