#!/usr/bin/env bash
# Usage: scripts/new-pr.sh <number> <scope> [base]
# Creates a pr-XYZ-scope branch (zero padded) off the target base (default main).

set -euo pipefail

if [[ $# -lt 2 ]]; then
  echo "Usage: $0 <number> <scope> [base-branch]" >&2
  exit 1
fi

number="$1"
scope="$2"
base="${3:-main}"

if [[ ! $number =~ ^[0-9]+$ ]]; then
  echo "PR number must be numeric" >&2
  exit 1
fi

printf -v padded "%03d" "$number"
branch="pr-${padded}-${scope}"

echo "==> Fetching $base"
git fetch origin "$base":"refs/remotes/origin/$base"

echo "==> Creating branch $branch from $base"
git checkout -B "$branch" "origin/$base"

echo "==> Branch ready: $branch"
echo "Run the following after your first commit to publish:"
echo "  git push -u origin $branch"
echo "  gh pr create --fill --base $base --head $branch # optional"
