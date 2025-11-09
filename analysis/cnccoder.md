# cnccoder (tirithen/cnccoder) – Structural Notes

- **Acquisition**: `git clone https://github.com/tirithen/cnccoder /tmp/cnccoder`.
- **Scope**: Rust crate that transforms declarative cutting programs into G-code + Camotics simulations for 3-axis CNC (Grbl focus).

## Repository Stats
| Metric | Value |
| --- | --- |
| Rust files | 19 |
| Key modules | `src/cuts`, `src/programs`, `src/tools`, `src/gcode`, `src/camotics` |
| Examples | 6+ (planing, dogbones, boxes) |

- API exposes strongly typed toolpaths, ensuring compile-time guarantees about feed rates, spindle direction, and safe travel heights; conversion to G-code is O(p) in number of path segments.
- Programs compose cuts via `Program::context(tool)` builder; Camotics generation adds O(p)` serialization overhead.

## Extraction Targets
1. **`Program` abstraction** – use as kernel inside `services/manufacturing-rust` to produce deterministic G-code/Camotics outputs for each kitchen module.
2. **Cut helpers** – plane, pocket, v-carve helpers accelerate BOM manufacturing tasks; adapt to cabinetry operations (mortise/tenon, panel cuts).
3. **Tool definitions** – leverage `Tool::cylindrical`/`::conical` factories to enforce tooling metadata (kerf, feed) across BOM solver.
4. **Camotics writer** – use for offline verification + visual regression of toolpaths.

## Reuse Guidance
- Add `cnccoder` as a workspace member or git dependency pinned to commit hash for reproducibility.
- Wrap the API behind a service-level trait `CncGenerator` returning {gcode, camotics, metadata}; complexity stays linear with number of toolpath segments.
- Compose with Fornjot geometry by generating 2D slices (nesting) → cnccoder instructions; bridging logic should keep memory O(n) with streaming iterators.
