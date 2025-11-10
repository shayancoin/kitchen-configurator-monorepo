import type {
  TeslaGlobalContract,
  TeslaPerfBudgetState,
  TeslaPerfMetrics
} from "@repo/ui-tesla";

type PerfUpdateDetail = TeslaPerfMetrics & {
  readonly timestamp: number;
};

const hasWindow = () => typeof window !== "undefined";
const perfEventName = "tesla:perf-update";

type PerfMetricKey = keyof TeslaPerfMetrics;
type BudgetState = TeslaPerfBudgetState;

const metrics: TeslaPerfMetrics = {};
let initialized = false;

const BUDGETS: Record<Extract<PerfMetricKey, "lcp" | "tti">, number> = {
  lcp: 2500,
  tti: 2000
};

const getBudgetState = (): BudgetState => {
  if (!hasWindow()) {
    return { failed: false, reasons: [] };
  }

  return (
    window.tesla?.perfBudget ?? { failed: false, reasons: [] }
  );
};

const assignTesla = (partial: Partial<TeslaGlobalContract>) => {
  if (!hasWindow()) {
    return;
  }

  const base =
    window.tesla ??
    ({
      version: "ds-1.1"
    } as TeslaGlobalContract);

  window.tesla = {
    ...base,
    ...partial
  };
};

const updateBudgetState = (metric: PerfMetricKey, value: number) => {
  if (!hasWindow()) {
    return;
  }

  const budget = BUDGETS[metric as "lcp" | "tti"];
  if (!budget) {
    return;
  }

  const exceeded = value > budget;
  const current = getBudgetState();
  const reasons = new Set(current.reasons);

  if (exceeded) {
    reasons.add(`${metric.toUpperCase()}=${Math.round(value)}ms`);
    assignTesla({
      perfBudget: {
        failed: true,
        reasons: Array.from(reasons)
      }
    });
    console.warn(
      `[perf] Budget exceeded for ${metric} (${Math.round(value)}ms > ${budget}ms)`
    );
    return;
  }

  if (!current.failed) {
    assignTesla({
      perfBudget: {
        failed: false,
        reasons: Array.from(reasons)
      }
    });
  }
};

const dispatchUpdate = () => {
  if (!hasWindow()) {
    return;
  }

  const mergedMetrics = {
    ...(window.tesla?.metrics ?? {}),
    ...metrics
  };

  assignTesla({
    metrics: mergedMetrics
  });

  const detail: PerfUpdateDetail = {
    ...mergedMetrics,
    timestamp: performance.now()
  };

  window.dispatchEvent(
    new CustomEvent<PerfUpdateDetail>(perfEventName, { detail })
  );
};

export const recordPerfMetric = (metric: PerfMetricKey, value: number) => {
  if (!hasWindow()) {
    return;
  }

  metrics[metric] = value;
  updateBudgetState(metric, value);
  dispatchUpdate();
};

export const initPerfBudget = () => {
  if (!hasWindow() || initialized) {
    return;
  }

  initialized = true;
  Object.assign(metrics, window.tesla?.metrics ?? {});
  dispatchUpdate();
};

export const onPerfUpdate = (
  handler: (detail: PerfUpdateDetail) => void
) => {
  if (!hasWindow()) {
    return () => undefined;
  }

  const listener = (event: Event) => {
    const customEvent = event as CustomEvent<PerfUpdateDetail>;
    handler(customEvent.detail);
  };

  window.addEventListener(perfEventName, listener);
  return () => window.removeEventListener(perfEventName, listener);
};
