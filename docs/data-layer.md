# Data Layer (Step 9)

## Polyglot Storage Surfaces

| Concern | Backing Store | Notes |
| --- | --- | --- |
| Catalog + configuration history | PostgreSQL (Prisma) | Schema now models modules, finishes, sprite manifests, configuration snapshots, pricing adjustments, AI annotations, and manufacturing jobs. Inserts/updates operate in \(O(\log n)\) due to B-Tree indexes while lookups remain \(O(1)\) amortized via deterministic PKs. |
| Cache | Redis via `@repo/cache` | LRU-ish memory fallback ensures \(O(1)\) key lookups. Namespaces let MFEs + gateway isolate eviction domains. |
| Binary assets | S3-compatible buckets | `@repo/storage` now wraps AWS SDK, signed URL helpers, and deterministic public URL builders to hydrate viewer sprites. |
| Vector search | PGVector extension inside Postgres | `DesignEmbedding` rows carry `vector` columns for RAG/LLM guidance. Raw SQL helpers (next task) use `<=>` distance for ANN semantics. |

## Prisma Schema Highlights

- `CatalogModule` + `CatalogFinish` mirror GraphQL DTOs and Tesla-inspired catalog data.
- `ModuleSprite` stores layered image metadata so the WASM compositor can stream signed URLs in deterministic z-order.
- `ConfigurationSnapshot`, `PricingAdjustment`, `AiSuggestion`, `ManufacturingJob`, and `DesignEmbedding` capture AI + manufacturing lineage for downstream services.
- PG extensions (`pgvector`, `citext`) are declared directly in `schema.prisma`, enabling similarity search + case-insensitive SKUs without ad-hoc migrations.

## Redis Helper (`@repo/cache`)

- Auto-detects Redis via `REDIS_URL`, falls back to an in-memory Map if unset.
- Provides `createNamespace` and `memoize` helpers so any service can wrap deterministic fetches and keep hit/miss stats local.
- Tests cover memoization semantics to guarantee \(O(1)\) fetches for repeated catalog queries.

## Asset Helper (`@repo/storage`)

- Adds AWS SDK wiring, signed URL helpers, and deterministic CDN URL builder with `ASSET_CDN_BASE_URL` override.
- Works with path-style or virtual-hosted S3 endpoints and propagates env validation via `@t3-oss/env-nextjs`.

## Seeding Strategy

- `pnpm --filter @repo/database run seed` hydrates catalog modules + layered sprite manifests so GraphQL can read from Postgres immediately.
- Seeds use deterministic IDs (`mod-galley-s`, `finish-graphite`, etc.) to keep compatibility with Tesla-styled UI defaults.

## Complexity + Sharding Discussion

- Redis lookups remain \(O(1)\) thanks to namespaced keys; TTLs keep memory bounded. Cache keys follow `namespace:subKey` structure to avoid collisions.
- Database writes hit \(O(\log n)\) due to indexes on module IDs, finishes, and manufacturing jobs.
- Future sharding: partition `CatalogModule` + `ConfigurationSnapshot` by `hash(configurationId) mod k` where `k` is the shard count stored in `DATABASE_SHARD_COUNT`. This keeps routing deterministic (
  `targetShard = fnv1a(configurationId) % k`) and lets AI/manufacturing services co-locate workloads.

## Open Question

> **Shard strategy for scale — model as partition function?**
>
> Proposed approach: use a consistent hash (FNV-1a 64-bit) on `configurationId`, feed it through `mod k`, and colocate shards per workload pair (catalog + AI) to minimize cross-region queries. Need confirmation whether manufacturing workloads should share the same modulus or use dedicated shards due to large payload sizes.
