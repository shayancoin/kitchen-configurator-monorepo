import clsx from "clsx";
import { useEffect, useMemo, type CSSProperties, type ReactNode } from "react";
import {
  mergeTeslaTokens,
  tokensToCSSVariables,
  type TeslaTokenOverrides,
  type TeslaTokens
} from "./tokens";
import {
  defaultComponentContracts,
  type TeslaComponentContracts
} from "./contracts";

export type TeslaThemeProviderProperties = {
  readonly children: ReactNode;
  readonly className?: string;
  readonly style?: CSSProperties;
  readonly overrides?: TeslaTokenOverrides;
  readonly contracts?: Partial<TeslaComponentContracts>;
};

export type TeslaPerfMetrics = {
  readonly tti?: number;
  readonly lcp?: number;
  readonly fid?: number;
};

export type TeslaPerfBudgetState = {
  readonly failed: boolean;
  readonly reasons: readonly string[];
};

export type TeslaGlobalContract = {
  readonly version: string;
  readonly tokens: TeslaTokens;
  readonly components: TeslaComponentContracts;
  readonly metrics?: TeslaPerfMetrics;
  readonly perfBudget?: TeslaPerfBudgetState;
};

export const TeslaThemeProvider = ({
  children,
  className,
  style,
  overrides,
  contracts
}: TeslaThemeProviderProperties) => {
  const mergedTokens = useMemo(
    () => mergeTeslaTokens(overrides),
    [overrides]
  );
  const variables = tokensToCSSVariables(mergedTokens);
  const mergedContracts = useMemo<TeslaComponentContracts>(
    () => ({
      header: contracts?.header ?? defaultComponentContracts.header,
      section: contracts?.section ?? defaultComponentContracts.section,
      configuratorPanel:
        contracts?.configuratorPanel ??
        defaultComponentContracts.configuratorPanel
    }),
    [contracts]
  );

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    window.tesla = {
      metrics: window.tesla?.metrics,
      perfBudget: window.tesla?.perfBudget,
      // Version updated from 'ds-1' to 'ds-1.1'.
      // [CHANGELOG] Minor update: Please document changes between ds-1 and ds-1.1 here or in the project changelog.
      version: "ds-1.1",
      tokens: mergedTokens,
      components: mergedContracts
    };
  }, [mergedTokens, mergedContracts]);

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
