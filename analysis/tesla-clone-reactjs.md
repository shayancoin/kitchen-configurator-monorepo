# Tesla Clone ReactJS – Structural Analysis

- **Acquisition**: Cloned from `https://github.com/chirag-23/Tesla-clone-reactjs` (fork pending).
- **Scanner**: `tools/analysis/js_dag_analyzer.mjs --patterns "src/**/*.{ts,tsx,js,jsx}"`.

## Graph Metrics
| Metric | Value |
| --- | --- |
| Files analyzed (`V`) | 36 |
| Nodes | 36 |
| Edges (`E`) | 62 |
| Max depth | 1 |
| Cycles | None |

- Style modules dominate and are export-dense, which makes them perfect candidates for `packages/ui-tesla` tokens + components.

## Export-Dense Modules
| Module | Density | Note |
| --- | --- | --- |
| `src/components/Section/section.style.js` | 0.8 | Responsive section layout (grid/flex) ideal for configurator sections. |
| `src/components/Header/header.style.js` | 0.75 | Tesla-like nav bar with #E82127 accent usage. |
| `src/globalstyles.js` | 0.667 | Centralized theme definition; convert to CSS variables / tokens. |
| `src/components/Account/account.style.js` | 0.75 | Panel layout that maps to Configurator Panel. |
| `src/features/userSlice.js` | 0.5 | Redux slice for authentication flows; inspiration for MobX store shape. |

## Reuse Guidance
1. Extract `globalstyles` + section/header/footer styles into `packages/ui-tesla/src/styles` with CSS variables (`--tesla-red: #E82127`).
2. Convert `Section` + `Header` components into TypeScript/Emotion/Styled-Components wrappers for MFEs (exposed via Module Federation).
3. Use `userSlice` structure as reference for MobX store actions (account state) until GraphQL wiring is ready.
