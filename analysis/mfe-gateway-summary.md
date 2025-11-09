# MFE & Gateway Fusion Snapshot (2025-11-09)

## Module Federation Wiring
- Host `apps/shell` + remote `apps/mfe-config-panel` mirror the DAG found in Vercel’s federation sample. The new helper `@repo/config/withConditionalModuleFederation` adds the webpack plugin in O(V + E) time (single pass over remotes) and injects shim aliases when `ENABLE_MF_PLUGIN=false`, so builds remain deterministic.
- `scripts/ensure-mf-shim.cjs` materializes stub modules for every remote specifier, guaranteeing webpack resolves `mfe-config-panel/ConfiguratorPanel` even when the remote bundle is absent. Complexity: O(k) file writes where k = remote specifiers.
- Runtime guardrail: `NEXT_PUBLIC_ENABLE_MF_REMOTES` toggles remote hydration. When false, the host falls back to the local Tesla panel, keeping UX smooth while remotes compile elsewhere.

## Tesla UI Layer
- `@repo/ui-tesla` now includes `TeslaConfiguratorPanel`, giving MFEs an O(1) responsive grid layout for option buttons (pure CSS grid/flex). The same component powers both the remote and host fallback, minimizing duplicated logic.
- Host shell + remote share the same tokens (Helvetica, #E82127, Tesla transitions). This ensures we hit the Tesla visual target while letting each MFE ship independently.

## GraphQL Federation Seed
- `@repo/shared-sdl` provides Catalog + Pricing SDL with federation-ready `@key` directives. The resolver graph is shallow (depth ≤ 2), so request cost stays linear in the number of modules/options (O(n)).
- `apps/gateway` builds an Apollo subgraph from that SDL and deterministic datasets. Current response path: `catalogModules` (O(n)) and `pricingEstimate` (O(1) for lookup + constant-time adjustments). Deterministic UUIDs + synthetic price math give us repeatable pact inputs until real services (#6–#11) arrive.
- This gateway is ready to slot behind Apollo Router once additional subgraphs exist (just add `supergraph.yaml` + composition step).

## Open Questions / Follow-ups
1. Design tokens: do we want to sample Tesla’s exact HEX ramp from screenshots (per earlier TODO) or keep the curated palette already defined?
2. GraphQL contracts: should we promote codegen (TS/Go/Python) immediately so MFEs/services consume strongly typed operations before subgraphs proliferate?
3. Remote coverage: viewer2d + AI remotes remain placeholders—should we parallelize their scaffolding next or prioritize services #6–#11 first for balanced velocity?
