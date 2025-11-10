# Tesla Design Tokens Integration Guide

## Overview
This document outlines the plan for extracting and integrating Tesla Design System tokens from official Tesla packages and local reference implementations.

## Source Locations

### 1. Official Tesla Packages (when available in node_modules)
- `node_modules/@tesla/design-system-tokens/dist/css/root.css` - Core CSS variables (Colors, Typography, Spacing)
- `node_modules/@tesla/coin-common-components/src/styles/*.css` - Component-level spacing and interaction behaviors
- `node_modules/@tesla/payment-react/dist/components/*.css` - Payment-specific component styles

### 2. Local Reference Implementation
- `/Users/shayanbozorgmanesh/Developer/tesla/Documents` - Tesla Design System documentation
- `/Users/shayanbozorgmanesh/Developer/tesla/` - Reference CSS implementations

## Integration Tasks

### Phase 1: Extract Core Tokens
1. **Parse `root.css`** from `@tesla/design-system-tokens`:
   ```bash
   # Extract CSS custom properties
   grep -E '^\s*--' node_modules/@tesla/design-system-tokens/dist/css/root.css > extracted-tokens.css
   ```

2. **Categorize tokens**:
   - Colors: `--tesla-color-*`
   - Typography: `--tesla-font-*`, `--tesla-text-*`
   - Spacing: `--tesla-space-*`, `--tesla-spacing-*`
   - Elevation/Shadows: `--tesla-shadow-*`, `--tesla-elevation-*`

3. **Convert to TypeScript**:
   ```typescript
   // packages/ui-tesla/src/tokens/extracted.ts
   export const TeslaExtractedTokens = {
     colors: {
       // Parsed from CSS variables
       primary: 'rgb(0, 0, 0)',
       accent: 'rgb(232, 33, 39)',
       // ... etc
     },
     typography: {
       // Font families, sizes, weights
     },
     spacing: {
       // Spacing scale
     }
   };
   ```

### Phase 2: Component Behavior Analysis
1. **Analyze spacing patterns** in `@tesla/coin-common-components`:
   - Button padding conventions
   - Card spacing
   - Grid gaps
   - Layout margins

2. **Extract interaction behaviors**:
   - Transition durations
   - Easing functions (e.g., `cubic-bezier(0.4, 0, 0.2, 1)`)
   - Hover states
   - Focus indicators

3. **Document patterns**:
   ```typescript
   export const TeslaInteractionTokens = {
     transitions: {
       fast: '150ms cubic-bezier(0.4, 0, 0.2, 1)',
       normal: '250ms cubic-bezier(0.4, 0, 0.2, 1)',
       slow: '350ms cubic-bezier(0.4, 0, 0.2, 1)',
     },
     // ... etc
   };
   ```

### Phase 3: Integrate into Tailwind (Future)
When Tailwind is added to the project:
```javascript
// frontend/tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        'tesla-primary': 'rgb(0, 0, 0)',
        'tesla-accent': 'rgb(232, 33, 39)',
        // ... direct values for immediate utility generation
      },
      spacing: {
        // Tesla spacing scale
      },
      fontFamily: {
        'tesla': ['Universal Sans', 'sans-serif'],
      }
    }
  }
};
```

## Implementation Plan

### Step 1: Install Required Packages (if not already installed)
```bash
pnpm add @tesla/design-system-tokens @tesla/coin-common-components @tesla/payment-react
```

### Step 2: Create Extraction Script
```bash
# scripts/extract-tesla-tokens.js
# Parse CSS, generate TypeScript token maps
```

### Step 3: Create @repo/tesla-tokens Package
```
packages/tesla-tokens/
├── package.json
├── src/
│   ├── index.ts           # Re-exports
│   ├── colors.ts          # Color tokens
│   ├── typography.ts      # Font tokens
│   ├── spacing.ts         # Spacing tokens
│   ├── elevation.ts       # Shadow/elevation tokens
│   ├── interactions.ts    # Transition/animation tokens
│   └── css-variables.ts   # CSS custom property definitions
└── README.md
```

### Step 4: Update ui-tesla to Use Extracted Tokens
1. Import tokens from `@repo/tesla-tokens`
2. Merge with existing tokens in `packages/ui-tesla/src/tokens.ts`
3. Ensure backward compatibility with current token structure

## Token Categories

### Colors
- **Primary**: Black (#000000)
- **Accent**: Tesla Red (#E82127)
- **Surfaces**: Grays (light/dark mode)
- **Semantic**: Success, error, warning, info

### Typography
- **Font Family**: Universal Sans (Display, Text variants)
- **Weights**: Regular (400), Medium (500), Bold (700)
- **Sizes**: Scale from 12px to 96px
- **Line Heights**: Optimized for readability

### Spacing
- **Scale**: 4px base unit (0.25rem)
- **Range**: 0.25rem to 6rem
- **Usage**: Consistent padding/margin across components

### Elevation
- **Shadows**: Multiple levels for depth
- **Z-index**: Layering system for overlays

## Validation

### Token Parity Checklist
- [ ] Colors match Tesla.com reference
- [ ] Typography weights and sizes correct
- [ ] Spacing scale consistent with Tesla components
- [ ] Transitions match reference implementations
- [ ] Dark mode variants included
- [ ] Accessibility contrast ratios met (WCAG AA minimum)

### Testing
1. **Visual regression tests**: Compare rendered components against Tesla.com screenshots
2. **Token usage audit**: Ensure all components use centralized tokens
3. **Documentation**: Generate token documentation with examples

## Notes

- Token extraction should be deterministic (same input → same output)
- Maintain semantic naming (avoid magic numbers)
- Document token usage patterns for contributors
- Consider token versioning aligned with TESLA_DS_VERSION

## References

- Tesla Design System: `/Users/shayanbozorgmanesh/Developer/tesla/Documents`
- Tesla.com CSS: `/Users/shayanbozorgmanesh/Developer/tesla/CSS/main.*.css`
- Current tokens implementation: `packages/ui-tesla/src/tokens.ts`
- Design system version: `packages/ui-tesla/src/version.ts` (currently ds-1.1)

## Status

**Current**: Tokens manually defined in `packages/ui-tesla/src/tokens.ts`  
**Target**: Extract and merge official Tesla tokens from packages when available  
**Blocker**: Tesla packages not yet installed in node_modules
