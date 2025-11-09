# microfrontends-nextjs-pages-federation – Structural Analysis

- **Acquisition**: Cloned from `https://github.com/vercel-labs/microfrontends-nextjs-pages-federation` (manual fork pending for upstream contributions).
- **Scanner**: `tools/analysis/js_dag_analyzer.mjs` with default workspace globbing.

## Graph Metrics
| Metric | Value |
| --- | --- |
| Files analyzed (`V`) | 26 |
| Nodes | 26 |
| Edges (`E`) | 1 |
| Max depth | 1 |
| Cycles | None |

- Topological prefix shows a clean separation between the root host (`apps/root`) and the remotes (`apps/navigation`, `apps/content`). Acyclic layout keeps module-federation wiring at O(V+E) scheduling cost.

## Export-Dense Modules (≥0.5)
| Module | Density | Context |
| --- | --- | --- |
| `apps/root/global.d.ts` | 1.0 | Shared type definitions for remote modules. |
| `apps/content/pages/_content/index.tsx` | 1.0 | Content micro-frontend entry exposing remote. |
| `apps/navigation/pages/_navigation/{header,footer}/index.tsx` | ≥0.667 | Navigation remote surfaces. |
| `apps/navigation/components/mobile-menu.tsx` | 1.0 | Highly reusable nav control ready for Tesla-style shell. |

## Reuse Notes
1. Mirror the `apps/{root,content,navigation}` structure for our `apps/{shell,viewer2d,config-panel,ai-advisor}`; reuse `next.config.js` + webpack MF plugin patterns.
2. Adopt shared ESLint config and `global.d.ts` approach to make remote types visible to the host without circular deps.
3. Responsive nav/header components can be reskinned with Tesla tokens and shipped via `packages/ui-tesla` for immediate drop-in.
