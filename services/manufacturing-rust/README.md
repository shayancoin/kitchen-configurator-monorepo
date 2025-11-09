# Manufacturing Service (Rust)

Workspace bundling the CAD + CNC pipeline:

- `kernel-adapter`: wraps Fornjot's core API to build solids for kitchen modules with deterministic tolerances.
- `cnc-bridge`: translates module panels into cnccoder programs, yielding deterministic G-code strings (O(n) segments).
- `service`: Axum HTTP server exposing `/api/v1/generate` so other services can request DWG/G-code artifacts.

## Toolchain

- Rust `1.89` (aligned with Fornjot upstream). `rust-toolchain.toml` ensures `cargo +stable` picks the right version.
- Git dependencies pinned to:
  - Fornjot `608f7b3` (error <1e-6 tolerance).
  - cnccoder `e0ae4b5` (linear program builder, Camotics optional).

## Quickstart

```bash
cd services/manufacturing-rust
cargo fmt && cargo check
cargo run -p manufacturing-service -- --port 5055
curl -X POST localhost:5055/api/v1/generate -H 'content-type: application/json' \
  -d '{"module":{"width_mm":900,"height_mm":760,"depth_mm":600,"thickness_mm":19}}'
```

The response returns approximate geometry metrics and the generated G-code preview. Hook this endpoint behind the GraphQL manufacturing subgraph once contract tests are ready.
