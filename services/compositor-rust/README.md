# compositor-wasm

Photon-powered WASM compositor that blends layered RGBA sprites inside the viewer2d MFE.

## Development

```bash
# run Rust unit tests (CPU target)
pnpm --filter @repo/compositor-rust test

# build wasm bundle (outputs ./pkg with @repo/compositor-wasm npm artefact)
pnpm --filter @repo/compositor-rust build
```

The generated `pkg/` directory is consumed via `@repo/compositor-wasm` and exposes the
`compose_layers` helper that the viewer loads through dynamic `import()`. The API expects
`[{ data: Uint8Array, width, height, opacity?, blendMode? }]` and returns a browser-ready
`ImageData` object in O(n * pixels) time.
