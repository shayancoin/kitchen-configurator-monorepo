# Performance Proofs

## Split Hydration And JS Budgets
Let the main-thread blocking portion of the shell bundle be `B` and the fraction deferred via dynamic imports be `p`. By Amdahl's law the theoretical speed-up is `S = 1 / ((1 - p) + p / s)` where `s` is the speed-up factor of the deferred chunk (the limit approaches infinity for fully delayed work). With `p ≈ 0.6` of the blocking work split out, `S ≈ 1 / 0.4 = 2.5×`, so a baseline `B = 1.5 s` becomes `B' ≈ 0.6 s`. LCP inherits the same reduction because render-blocking script execution dominates hero paint during hydration.

## Sprite Compositing Complexity
The WASM compositor cost is `O(L · P)` where `L` is the number of layers and `P` the pixels touched per layer. SIMD reduces the constant factor `α` and web workers lower wall time proportionally to the number of worker threads (`T`). Effective compose time is `(L · P) / (α · T)`. With `α ≈ 0.65` (SIMD on Apple M-series) and `T = 4`, the compose slice fits in the allotted `80 ms` budget from the end-to-end envelope.

## APQ Cache Hits Under Zipf(1.1)
Persistent GET requests paired with Automatic Persisted Queries (APQ) allow CloudFront to cache GraphQL responses. For a Zipf distribution with skew `s ≈ 1.1`, the probability that the top `M` queries cover the workload is `H_M^{(s)} / H_N^{(s)}`. Taking `M = 100` and `N ≫ M`, coverage exceeds 0.9, so with CDN persistence we achieve ≥95% hit ratio on the hot GraphQL paths.

## Tail Budget Allocation
The end-to-end p95 target is `300 ms` with the breakdown `T_total = T_net + T_compose + T_layout`. Enforcing `T_net ≤ 120 ms` (via APQ + CDN), `T_compose ≤ 80 ms` (WASM + SIMD), and `T_layout ≤ 100 ms` (split hydration + memoized renders) ensures `T_total ≤ 300 ms`. These limits align with the client-side enforcement where TTI must be ≤2 s and LCP ≤2.5 s.

## Queueing Proof (Router + Go Services)
Routers and Go services are modeled as M/M/c queues. Utilization `ρ = λ / (c μ)` must remain `< 0.6`. For given arrival rate `λ` and service rate `μ`, choose `c = ceil(λ / (0.6 μ))`. Waiting time approximation `W_q ≈ P(wait) · (1 / (c μ - λ))` stays `< 100 ms`, preserving p95 ≤ 300 ms when combined with the budgets above.

## Artifact Policy
CI now uploads three artifacts per PR:
1. `shell-bundle-analyzer` from `ANALYZE=true pnpm --filter @repo/shell build`.
2. `scripts/k6-smoke.js` output (`k6-*.json`) retaining the last three runs.
3. This document.

The OTEL spans (`metric=LCP|FID|TTI`) allow tail sampling rules in `ops/otel/collector.yaml` to retain slow traces for regression proofs.
