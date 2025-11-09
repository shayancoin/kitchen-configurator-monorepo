import type { TeslaPerfMetrics } from "@repo/ui-tesla";

type PerfUpdateDetail = TeslaPerfMetrics & {
  readonly timestamp: number;
};

const hasWindow = () => typeof window !== "undefined";
const perfEventName = "tesla:perf-update";

let initialized = false;

export const initPerfBudget = () => {
  if (!hasWindow() || initialized) {
    return;
  }

  initialized = true;
  const metrics: TeslaPerfMetrics = {};
  const pending: TeslaPerfMetrics = {};

  const dispatchUpdate = () => {
    if (!hasWindow()) {
      return;
    }

    Object.assign(pending, metrics);

    if (window.tesla) {
      window.tesla = {
        ...window.tesla,
        metrics: {
          ...(window.tesla.metrics ?? {}),
          ...pending
        }
      };
    }

    const detail: PerfUpdateDetail = {
      ...(window.tesla?.metrics ?? pending),
      timestamp: performance.now()
    };

    window.dispatchEvent(
      new CustomEvent<PerfUpdateDetail>(perfEventName, { detail })
    );
  };

  const lcpObserver = new PerformanceObserver((entryList) => {
    const lastEntry = entryList.getEntries().at(-1);
    if (!lastEntry) {
      return;
    }

    metrics.lcp = lastEntry.renderTime || lastEntry.loadTime || lastEntry.startTime;
    dispatchUpdate();
  });

  lcpObserver.observe({ type: "largest-contentful-paint", buffered: true });

  const fidObserver = new PerformanceObserver((entryList) => {
    const entry = entryList.getEntries()[0];
    if (!entry) {
      return;
    }

    metrics.fid = entry.processingStart - entry.startTime;
    dispatchUpdate();
    fidObserver.disconnect();
  });

  fidObserver.observe({ type: "first-input", buffered: true });

  const scheduleIdle = (callback: IdleRequestCallback) => {
    if (!hasWindow()) {
      return;
    }

    if ("requestIdleCallback" in window) {
      window.requestIdleCallback(callback);
      return;
    }

    window.setTimeout(() => callback(Date.now() as number), 0);
  };

  scheduleIdle(() => {
    metrics.tti = Math.max(
      metrics.lcp ?? 0,
      metrics.fid ?? 0,
      performance.now()
    );
    dispatchUpdate();

    if ((metrics.tti ?? Number.MAX_SAFE_INTEGER) <= 2000) {
      console.info(
        `[perf] Shell TTI ${Math.round(metrics.tti!)}ms (budget 2000ms)`
      );
    } else {
      console.warn(
        `[perf] Shell TTI ${Math.round(metrics.tti!)}ms exceeds 2000ms budget`
      );
    }
  });
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
