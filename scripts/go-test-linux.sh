#!/usr/bin/env bash
set -euo pipefail

# Runs Go tests inside a Linux container to avoid macOS LC_UUID issues.
ROOT_DIR="$(pwd)"
CPUS="$(getconf _NPROCESSORS_ONLN 2>/dev/null || sysctl -n hw.ncpu 2>/dev/null || echo 4)"

docker run --rm -t \
  -v "${ROOT_DIR}":/work \
  -w /work \
  -e GOMAXPROCS="${CPUS}" \
  golang:1.23.0 \
  bash -lc '
set -euo pipefail
apt-get update >/dev/null
apt-get install -y build-essential git >/dev/null
if [[ -f go.work ]]; then
  go work sync || true
fi
go test ./... -race -count=1 -coverprofile=coverage.out
'
