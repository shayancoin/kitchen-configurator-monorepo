import clsx from "clsx";
import { useEffect, useMemo, type CSSProperties, type ReactNode } from "react";
import {
  mergeTeslaTokens,
  tokensToCSSVariables,
  type TeslaTokenOverrides,
  type TeslaTokens
} from "./tokens";

export type TeslaThemeProviderProperties = {
  readonly children: ReactNode;
  readonly className?: string;
  readonly style?: CSSProperties;
  readonly overrides?: TeslaTokenOverrides;
};

declare global {
  interface Window {
    tesla?: {
      version: string;
      tokens: TeslaTokens;
    };
  }
}

export const TeslaThemeProvider = ({
  children,
  className,
  style,
  overrides
}: TeslaThemeProviderProperties) => {
  const mergedTokens = useMemo(
    () => mergeTeslaTokens(overrides),
    [overrides]
  );
  const variables = tokensToCSSVariables(mergedTokens);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    window.tesla = {
      version: "ds-1",
      tokens: mergedTokens
    };
  }, [mergedTokens]);

  return (
    <div
      className={clsx("tesla-theme", className)}
      style={{ ...variables, ...style }}
    >
      {children}
    </div>
  );
};

export default TeslaThemeProvider;
