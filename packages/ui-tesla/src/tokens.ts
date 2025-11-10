export type TeslaColorTokens = {
  readonly textPrimary: string;
  readonly textMuted: string;
  readonly primary: string;
  readonly accent: string;
  readonly surface: string;
  readonly surfaceContrast: string;
  readonly border: string;
};

export type TeslaMotionTokens = {
  readonly transition: string;
  readonly entrance: string;
};

export type TeslaTypographyTokens = {
  readonly display: string;
  readonly text: string;
  readonly monospace: string;
  readonly letterSpacingWide: string;
};

export type TeslaSpacingTokens = {
  readonly base: string;
  readonly double: string;
  readonly gridGap: string;
  readonly sectionPadding: string;
};

export type TeslaShadowTokens = {
  readonly card: string;
  readonly panel: string;
};

export type TeslaTokens = {
  readonly colors: TeslaColorTokens;
  readonly motion: TeslaMotionTokens;
  readonly typography: TeslaTypographyTokens;
  readonly spacing: TeslaSpacingTokens;
  readonly shadows: TeslaShadowTokens;
};

const universalSansDisplay =
  '"Universal Sans Display", "Helvetica Neue", "Rubik", "Segoe UI", sans-serif';
const universalSansText =
  '"Universal Sans Text", "Helvetica Neue", "Rubik", "Segoe UI", sans-serif';
const universalSansMono =
  '"Fira Code", "SFMono-Regular", "Segoe UI Mono", monospace';

export const defaultTeslaTokens: TeslaTokens = {
  colors: {
    textPrimary: "#171A20",
    textMuted: "#5C5E62",
    primary: "#000000",
    accent: "#E82127",
    surface: "rgba(255, 255, 255, 0.94)",
    surfaceContrast: "#050608",
    border: "rgba(23, 26, 32, 0.08)"
  },
  motion: {
    transition: "cubic-bezier(0.5, 0, 0, 0.75)",
    entrance: "cubic-bezier(0.215, 0.61, 0.355, 1)"
  },
  typography: {
    display: universalSansDisplay,
    text: universalSansText,
    monospace: universalSansMono,
    letterSpacingWide: "0.4rem"
  },
  spacing: {
    base: "0.5rem",
    double: "1rem",
    gridGap: "1.5rem",
    sectionPadding: "clamp(3rem, 6vw, 7rem)"
  },
  shadows: {
    card: "0 8px 16px rgba(0, 0, 0, 0.16)",
    panel: "0 25px 65px rgba(0, 0, 0, 0.35)"
  }
};

export type TeslaTokenOverrides = Partial<{
  readonly colors: Partial<TeslaColorTokens>;
  readonly motion: Partial<TeslaMotionTokens>;
  readonly typography: Partial<TeslaTypographyTokens>;
  readonly spacing: Partial<TeslaSpacingTokens>;
  readonly shadows: Partial<TeslaShadowTokens>;
}>;

export const mergeTeslaTokens = (
  overrides?: TeslaTokenOverrides
): TeslaTokens => ({
  colors: { ...defaultTeslaTokens.colors, ...overrides?.colors },
  motion: { ...defaultTeslaTokens.motion, ...overrides?.motion },
  typography: { ...defaultTeslaTokens.typography, ...overrides?.typography },
  spacing: { ...defaultTeslaTokens.spacing, ...overrides?.spacing },
  shadows: { ...defaultTeslaTokens.shadows, ...overrides?.shadows }
});

export const tokensToCSSVariables = (tokens: TeslaTokens) => ({
  "--tesla-color-text": tokens.colors.textPrimary,
  "--tesla-color-muted": tokens.colors.textMuted,
  "--tesla-color-primary": tokens.colors.primary,
  "--tesla-color-accent": tokens.colors.accent,
  "--tesla-color-surface": tokens.colors.surface,
  "--tesla-color-surface-contrast": tokens.colors.surfaceContrast,
  "--tesla-color-border": tokens.colors.border,
  "--tesla-transition-standard": tokens.motion.transition,
  "--tesla-transition-entrance": tokens.motion.entrance,
  "--tesla-font-family-display": tokens.typography.display,
  "--tesla-font-family-text": tokens.typography.text,
  "--tesla-font-family-mono": tokens.typography.monospace,
  "--tesla-letter-spacing-wide": tokens.typography.letterSpacingWide,
  "--tesla-spacing-base": tokens.spacing.base,
  "--tesla-spacing-double": tokens.spacing.double,
  "--tesla-grid-gap": tokens.spacing.gridGap,
  "--tesla-section-padding": tokens.spacing.sectionPadding,
  "--tesla-shadow-card": tokens.shadows.card,
  "--tesla-shadow-panel": tokens.shadows.panel
});
