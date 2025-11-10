#!/usr/bin/env bash
# Creates feature branches per roadmap phase (Phase 1 → Phase 7).
# Usage: scripts/phase-prep.sh [base-branch] [--dry-run]

set -euo pipefail

BASE="${1:-$(git rev-parse --abbrev-ref HEAD)}"
if [[ "$BASE" == "HEAD" ]]; then
  echo "[phase-prep] ERROR: Detached HEAD state. Specify a branch explicitly."
  exit 1
fi
if ! git rev-parse --verify "$BASE" >/dev/null 2>&1; then
  echo "[phase-prep] ERROR: Base branch/commit '$BASE' does not exist."
  exit 1
fi
DRY_RUN="false"

 DRY_RUN="false"
 
 for arg in "$@"; do
   if [[ "$arg" == "--dry-run" ]]; then
     DRY_RUN="true"
   fi
 done

PHASES=(
  "feature/phase-1-mvp"
  "feature/phase-2-pricing"
  "feature/phase-3-manufacturing"
  "feature/phase-4-visual"
  "feature/phase-5-cad"
  "feature/phase-6-automation"
  "feature/phase-7-ai"
)

echo "==> Preparing phase branches from $BASE (dry-run=$DRY_RUN)"
for phase_branch in "${PHASES[@]}"; do
  if git rev-parse --verify "$phase_branch" >/dev/null 2>&1; then
    echo "[phase-prep] $phase_branch already exists"
    continue
  fi

  if [[ "$DRY_RUN" == "true" ]]; then
    echo "[phase-prep] would create $phase_branch from $BASE"
    continue
  fi

  git branch "$phase_branch" "$BASE"
  echo "[phase-prep] created $phase_branch ← $BASE"
done

echo "==> Phase prep complete"
