#!/usr/bin/env bash
# Runs the full multi-language validation suite (TS → Go → Rust → Python).

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
NODE_BIN="$ROOT_DIR/.tooling/node-v20.18.0-darwin-arm64/bin"
GO_BIN="$ROOT_DIR/.tooling/go1.22.2/bin/go"
GO_DOCKER_IMAGE="${GO_DOCKER_IMAGE:-golang:1.22.2}"
PNPM_VERSION="${PNPM_VERSION:-$(node -e "const pkg = require('$ROOT_DIR/package.json'); console.log(pkg.packageManager?.split('@')[1] || '10.19.0')")}"
PNPM_BIN=(npx "pnpm@$PNPM_VERSION")
UNAME="$(uname -s)"

if [[ -d "$NODE_BIN" ]]; then
  export PATH="$NODE_BIN:$PATH"
fi

echo "[validation] pnpm install"
"${PNPM_BIN[@]}" install --frozen-lockfile

echo "[validation] @repo/database prisma generate"
"${PNPM_BIN[@]}" --filter @repo/database run build

echo "[validation] turbo test/build"
"${PNPM_BIN[@]}" turbo run test --continue
"${PNPM_BIN[@]}" turbo run build --continue

run_go_tests() {
  local svc="$1"
  echo "[validation] go test services/$svc"
  if [[ "$UNAME" == "Darwin" ]]; then
    if command -v docker >/dev/null 2>&1; then
      (
        cd "$ROOT_DIR/services/$svc"
        "$ROOT_DIR/scripts/go-test-linux.sh"
      )
    else
      echo "[validation] skipping Go tests for $svc (Docker required on macOS to avoid LC_UUID bug)" >&2
    fi
    return
  fi

  if [[ -x "$GO_BIN" ]]; then
    (cd "$ROOT_DIR/services/$svc" && "$GO_BIN" test ./...)
  else
    echo "[validation] skipping Go tests for $svc (go toolchain not found)" >&2
  fi
}

declare -a GO_SERVICES=("pricing-go" "rules-go")
for svc in "${GO_SERVICES[@]}"; do
  run_go_tests "$svc"
done

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
