# IaC Capacity Proofs

## Router + Go Services Queueing Model
We model the router and Go microservices as M/M/c queues with Poisson arrivals (`λ`) and exponential service rate (`μ`). Utilisation is `ρ = λ / (c μ)` and must remain `< 0.6` to keep the workers under 60% busy.

For a target load, pick the smallest worker pool satisfying:
```
c = ceil(λ / (0.6 μ))
```

The Erlang-C waiting probability governs the queue delay. We approximate mean waiting time as:
```
W_q ≈ P(wait) * 1 / (c μ - λ)
```
Enforcing `W_q < 100 ms` keeps the composition `T_total = T_net + T_compose + T_layout` under the 300 ms p95 envelope defined in `docs/perf-proof.md` (120 ms network, 80 ms compose, 100 ms layout).

## Aurora Shard Strategy
For `k = var.aurora_shard_count` logical shards we map tenants via:
```
shard = fnv1a64(tenant_id) mod k
```
The hash provides O(1) routing, while the collision probability follows the birthday bound `≈ 1 - exp(-n(n-1)/(2k))`. Keeping `k` high enough (e.g., 4-8) makes collisions negligible for the expected tenant counts. Each shard writes to one writer endpoint, exposed via `output "writer_endpoints"`, enabling the application tier to fan out traffic evenly.
