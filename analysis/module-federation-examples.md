# module-federation-examples – Structural Analysis

- **Acquisition**: Cloned from `https://github.com/module-federation/module-federation-examples` (over 5k files; manual fork pending). Analyzer limited to the first 400 JS/TS sources to keep evaluation O(V+E) manageable while still covering representative Next.js + Node scenarios.
- **Scanner**: `tools/analysis/js_dag_analyzer.mjs --patterns "**/*.{ts,tsx,js,jsx}" --max-files 400`.

## Graph Metrics (sampled)
| Metric | Value |
| --- | --- |
| Files analyzed (`V`) | 400 |
| Nodes | 424 |
| Edges (`E`) | 128 |
| Max depth | 1 |
| Cycles | None |

- Massive repo still exhibits shallow dependency depth because each example is siloed (helpful for cherry-picking webpack/Next recipes without shared-state coupling).

## Export-Dense Highlights
| Module | Density | Note |
| --- | --- | --- |
| `nextjs-csr/shared/index.d.ts` | 1.0 | Canonical remote type declarations for host-client sharing. |
| `bi-directional/app1/single-runtime-plugin.js` | 1.0 | Runtime plugin showcasing host/remote duality. |
| `cypress-e2e/helpers/file-actions-helper.ts` | 1.0 | File helper for automated MF testing (adapts to our Cypress plan). |
| `apollo-client/app1/index.d.ts` | 1.0 | GraphQL client exposure pattern for MFEs. |
| `modernjs-classic-tractor-example/products.js` | 1.0 | Minimal shared catalog data stub for wiring pricing/rules quickly. |

## Reuse Guidance
1. Reuse `nextjs-csr` + `nextjs-host-react-remote` webpack configs to bootstrap our Next.js shell + remotes (aligns with PR-019 gating via env flags).
2. Adopt Cypress helpers for verifying MFEs inside our future E2E harness (Cypress step in Tesla UI plan).
3. The `bi-directional` plugin demonstrates runtime module registration; adapt to allow dynamic AI widget injection without redeploying host.
