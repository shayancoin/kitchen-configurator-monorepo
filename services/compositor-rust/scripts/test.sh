#!/usr/bin/env bash
set -euo pipefail
ARGS=()
for arg in "$@"; do
  if [[ "$arg" == "--coverage" ]]; then
    continue
  fi
  ARGS+=("$arg")
done

if [[ ${#ARGS[@]} -eq 0 ]]; then
  cargo test
else
  cargo test "${ARGS[@]}"
fi
