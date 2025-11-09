# Fusion Perf Harness

This harness measures the kitchen configurator's user-centric budgets and stores reproducible artifacts for regression analysis.

## Inputs
- Target host (default: `http://localhost:3000`).
- Locale (default: `en`).
- GraphQL payloads for hot queries (pricing + layout suggestions).

## Workflow
1. Build the shell with analyzer traces so we capture JS bundle composition:
   ```bash
   ANALYZE=true pnpm --filter @repo/shell build
   ```
   Upload `apps/shell/.next/analyze` as `shell-bundle-analyzer` in CI. The job already runs in `.github/workflows/ci.yml`.
2. Run the k6 smoke to prime MFEs and GraphQL:
   ```bash
   mkdir -p artifacts/perf
   ts=$(date -u +%Y%m%dT%H%M%SZ)
   k6 run scripts/k6-smoke.js \
     -e KITCHEN_BASE_URL="${BASE_URL:-http://localhost:3000}" \
     -e KITCHEN_LOCALE="${LOCALE:-en}" \
     --out json=artifacts/perf/k6-${ts}.json
   ```
   Keep only the last three JSON runs per artifacts rotation (older files may be pruned by CI before upload).
3. Parse the emitted `window.tesla.metrics` payload from the browser console (or via the `tesla:perf-update` event) and store summaries under `artifacts/perf/tti-budget.json` whenever TTI or LCP exceeds their budgets. These events now include a perf-budget flag for downstream automation.

## Desktop profile
- Emulate 6× CPU slowdown and 150 ms RTT in DevTools.
- The on-device heuristics flag a failure if LCP > 2.5 s or TTI > 2.0 s.
- Target steady-state TTI < 2 s and p95 end-to-end < 300 ms (120 ms network, 80 ms compose, 100 ms layout/paint) per `docs/perf-proof.md`.

## Reporting
- Attach the latest bundle analyzer folder, k6 JSON, and `docs/perf-proof.md` to PRs covering Steps 13–15.
- CI enforces analyzer generation and uploads artifacts automatically; local runs can be verified via `scripts/full-validation.sh` after installing `k6`.
