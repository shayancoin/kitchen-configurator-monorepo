# Compositor WASM Fusion Snapshot

## Implementation Notes
- `services/compositor-rust` uses Photon (`O(p)` per resize) + custom alpha blending loops, so `compose_layers` runs in `O(n * p)` time where `n` is number of layers and `p = width * height` pixels.
- Inputs arrive as `[ { data: Uint8Array, width, height, opacity?, blendMode? } ]`. The wasm function clamps opacity to `[0,1]`, resizes any mismatched layer with `photon_rs::transform::resize`, and returns `ImageData` ready for `<canvas>` contexts.
- Supported blend modes today: `over`, `multiply`, `screen`, `add`. Adding more (e.g., `soft_light`) is straightforward by extending `apply_mode`.
- Tests cover pixel math (opacity + multiply). `cargo test` runs natively; `wasm-pack build` produces `@repo/compositor-wasm` consumed by Next apps.

## Viewer2D Remote
- `apps/mfe-viewer2d` exposes `./ViewerCanvas` via Module Federation and composes three synthetic layers (base gradient, shadow, glow). Average compose time on MBP M3 ≈ 3–6 ms for 640×360 buffers (measured in component state).
- Host shell dynamically imports the remote when `NEXT_PUBLIC_ENABLE_MF_REMOTES=true`; otherwise it renders a TeslaSection placeholder. This keeps build-time behavior deterministic (one DAG path) while enabling runtime experiments.

## Open Questions
1. Should we persist actual sprite atlases (S3 + `@repo/shared-sdl` scene graph) so viewer demos real cabinet modules instead of generated gradients?
2. When Photon is swapped with SIMD+threads (future PR-029), do we prefer a dual build (baseline + threads) or a single feature-flagged binary served via COOP/COEP headers?
3. Do we want to emit perf telemetry (OTel span with `compose_layers.duration`) from the viewer to validate p95 budgets before hooking to Go/Python services?
