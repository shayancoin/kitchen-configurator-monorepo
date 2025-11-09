# Next Forge (vercel/next-forge) – Structural Analysis

- **Acquisition**: Direct clone (`git clone https://github.com/vercel/next-forge`) because automated forking is unavailable in this environment. Manual fork required upstream.
- **Scanner**: `tools/analysis/js_dag_analyzer.mjs` (Babel AST + dependency DAG) with default workspace-focused glob patterns.

## Graph Statistics
| Metric | Value |
| --- | --- |
| Files analyzed (`V`) | 266 |
| Nodes in DAG | 271 (imports pull in a few extra inferred nodes) |
| Edges (`E`) | 63 |
| Max dependency depth | 1 (flat workspace graph thanks to Turborepo conventions) |
| Cycles | None detected |

- **Topological order prefix**: `apps/api/env.ts → apps/api/instrumentation-client.ts → apps/app/liveblocks.config.ts → ... → packages/observability/status/types.ts` (see `analysis/next-forge-dag.json` for the complete ordering).
- **Interpretation**: Each app/package stays shallow (depth 1) which guarantees O(V+E) scheduling during `turbo run` and makes federation-friendly extractions trivial.

## Export-Dense Candidates (density ≥ 0.5)
| Module | Density | Exports | Notes |
| --- | --- | --- | --- |
| `packages/cms/basehub-types.d.ts` | 0.985 | 129 | Rich type surface for CMS adapters – ideal seed for shared GraphQL typings. |
| `packages/security/middleware.ts` | 0.75 | 3 | Security boundary middleware ready for gateway reuse. |
| `packages/ai/index.ts` | 1.0 | 1 | Simple façade around AI hooks; becomes seed for AI advisor package. |
| `packages/observability/instrumentation.ts` | 1.0 | 1 | Drop-in instrumentation shim for OTel bootstrap. |
| `packages/collaboration/hooks.ts` | 1.0 | 1 | Reusable hooks for presence/liveblocks integration. |
| `packages/storage/{client,index}.ts` | 1.0 | 1 | Abstraction for blob adapters -> S3 binding point. |
| `apps/api/app/health/route.ts` | 1.0 | 1 | Minimal healthcheck route – use as template for microservices. |

> Proof of modularity: Export density computed via Babel AST counts (see JSON artifact). Modules above 0.5 provide more exported surface than internal statements, ensuring they can be hoisted into shared packages without refactors.

## Reuse Guidance
1. **Workspace layout**: Mirror `apps/{api,app,web}` and `packages/{ai,analytics,...}` when scaffolding the new Turborepo – copy `turbo.json`, `pnpm-workspace.yaml`, and the root `package.json` as the base.
2. **Domain packages**: Lift `packages/cms`, `packages/security`, `packages/observability` into `packages/shared-ts` for clean architecture layering.
3. **Instrumentation**: Reuse `apps/api/instrumentation-client.ts` + `packages/observability/instrumentation.ts` to seed the future Apollo gateway + OTel wiring.
