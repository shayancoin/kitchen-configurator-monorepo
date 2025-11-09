# Clean Boilerplate 26 – Structural Analysis

- **Acquisition**: Direct clone (`git clone https://github.com/elieteyssedou/clean-boilerplate-26`) with manual fork pending.
- **Scanner**: `tools/analysis/js_dag_analyzer.mjs` scoped to `front/**` and `back/**` workspaces.

## Graph Statistics
| Metric | Value |
| --- | --- |
| Files analyzed (`V`) | 144 |
| Nodes | 145 |
| Edges (`E`) | 33 |
| Max dependency depth | 1 |
| Cycles | None |

- **Topological prefix**: `front/codegen.ts → front/environment.d.ts → front/global.d.ts → back/prisma/migrations/index.ts → ...` (full ordering captured in `analysis/clean-boilerplate-26-dag.json`).
- **Observation**: Domain entities/services stay leaf-like which aligns with clean architecture boundaries (application layer depends on domain, not vice versa).

## Export-Dense Candidates
| Module | Density | Exports | Rationale |
| --- | --- | --- | --- |
| `back/test/mocks/constants/MockAIConstants.ts` | 1.0 | 14 | Rich mock constants usable for AI advisor fixtures. |
| `back/test/types/graphql-types.ts` | 1.0 | 8 | Generated GraphQL types – perfect seeds for codegen contract. |
| `back/src/domain/services/AIService.ts` | 1.0 | 5 | Encapsulates AI orchestration logic ready for RAG service integration. |
| `back/src/domain/entities/{Team,User}.ts` | 1.0 | 3 each | Domain entities with value objects & guards – transplant into shared domain package. |
| `back/src/domain/services/IdGeneratorService.ts` | 1.0 | 2 | Deterministic ID generation service for multi-service alignment. |
| `front/src/app/_utils/generateInitials.ts` | 1.0 | 3 | UI helper for avatars / Tesla-like panel overlays. |
| `front/src/__generated__/index.ts` | 1.0 | 2 | Client GraphQL types bridging front/back. |

## Reuse Guidance
1. **Domain Layer**: Copy `back/src/domain` into `packages/domain-core` in the new monorepo to enforce clean architecture boundaries.
2. **Service Templates**: Use `back/src/app/modules/*` as blueprints for Nest-like modules (Go/Python services can mirror the layering even across languages).
3. **GraphQL Contracts**: Persist `front/src/__generated__` + `back/test/types/graphql-types.ts` as Pact/codegen seeds to guarantee schema parity.
