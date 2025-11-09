export type TeslaColorTokens = {
  readonly text: string;
  readonly primary: string;
  readonly accent: string;
  readonly surface: string;
  readonly muted: string;
};

export type TeslaMotionTokens = {
  readonly transition: string;
};

export type TeslaTypographyTokens = {
  readonly fontFamily: string;
};

export type TeslaTokens = {
  readonly colors: TeslaColorTokens;
  readonly motion: TeslaMotionTokens;
  readonly typography: TeslaTypographyTokens;
};

export const defaultTeslaTokens: TeslaTokens = {
  colors: {
    text: "#393C41",
    primary: "#000000",
    accent: "#E82127",
    surface: "rgba(255, 255, 255, 0.92)",
    muted: "rgba(57, 60, 65, 0.72)"
  },
  motion: {
    transition: "cubic-bezier(0.4, 0, 0.2, 1)"
  },
  typography: {
    fontFamily: '"Helvetica Neue", "Rubik", "Segoe UI", sans-serif'
  }
};

export type TeslaTokenOverrides = Partial<{
  readonly colors: Partial<TeslaColorTokens>;
  readonly motion: Partial<TeslaMotionTokens>;
  readonly typography: Partial<TeslaTypographyTokens>;
}>;

export const mergeTeslaTokens = (
  overrides?: TeslaTokenOverrides
): TeslaTokens => ({
  colors: { ...defaultTeslaTokens.colors, ...overrides?.colors },
  motion: { ...defaultTeslaTokens.motion, ...overrides?.motion },
  typography: { ...defaultTeslaTokens.typography, ...overrides?.typography }
});

export const tokensToCSSVariables = (tokens: TeslaTokens) => ({
  "--tesla-color-text": tokens.colors.text,
  "--tesla-color-primary": tokens.colors.primary,
  "--tesla-color-accent": tokens.colors.accent,
  "--tesla-color-surface": tokens.colors.surface,
  "--tesla-color-muted": tokens.colors.muted,
  "--tesla-transition-standard": tokens.motion.transition,
  "--tesla-font-family": tokens.typography.fontFamily
});
