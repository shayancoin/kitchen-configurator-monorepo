#!/usr/bin/env bash
# Runs the full multi-language validation suite (TS → Go → Rust → Python).

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
NODE_BIN="$ROOT_DIR/.tooling/node-v20.18.0-darwin-arm64/bin"
GO_BIN="$ROOT_DIR/.tooling/go1.22.2/bin/go"

if [[ -d "$NODE_BIN" ]]; then
  export PATH="$NODE_BIN:$PATH"
fi

echo "[validation] pnpm install"
pnpm install --frozen-lockfile

echo "[validation] turbo test/build"
pnpm turbo run test --continue
pnpm turbo run build --continue

declare -a GO_SERVICES=("pricing-go" "rules-go")
if [[ -x "$GO_BIN" ]]; then
  for svc in "${GO_SERVICES[@]}"; do
    echo "[validation] go test services/$svc"
    (cd "$ROOT_DIR/services/$svc" && "$GO_BIN" test ./...)
  done
else
  echo "[validation] skipping Go tests (go toolchain not found)" >&2
fi

declare -a RUST_SERVICES=("compositor-rust" "manufacturing-rust")
if command -v cargo >/dev/null 2>&1; then
  for svc in "${RUST_SERVICES[@]}"; do
    echo "[validation] cargo test services/$svc"
    (cd "$ROOT_DIR/services/$svc" && cargo test --locked)
  done
else
  echo "[validation] skipping Rust tests (cargo not found)" >&2
fi

if command -v python3 >/dev/null 2>&1; then
  echo "[validation] pytest services/ai-python"
  (cd "$ROOT_DIR/services/ai-python" && python3 -m pip install -q -e .[dev] && pytest)
else
  echo "[validation] skipping Python tests (python3 not found)" >&2
fi
