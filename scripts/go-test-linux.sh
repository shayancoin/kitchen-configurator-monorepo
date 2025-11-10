#!/usr/bin/env bash
set -euo pipefail

# Runs Go tests inside a Linux container to avoid macOS LC_UUID issues.
# 
# PERFORMANCE NOTE:
# This script runs apt-get update/install on every invocation, adding ~5-10s overhead.
# 
# Trade-off Analysis:
# - Simplicity: Works immediately in any CI/local environment without pre-built images
# - Cost: One-time apt install per run (amortized across all Go tests in the session)
# - Alternative: Pre-build a custom Go image with build-essential+git and update CI
#                configs to pull that image, removing the apt-get lines entirely
# 
# Recommendation: Keep current approach for simplicity unless local iteration speed
# becomes a bottleneck (e.g., >10 runs/day). For CI, consider caching the Docker
# layer or switching to a pre-built image if this job becomes a pipeline bottleneck.

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
