import { trace } from "@opentelemetry/api";
import {
  onFID as observeFID,
  onLCP as observeLCP,
  type Metric
} from "web-vitals";
import type { TeslaPerfMetrics } from "@repo/ui-tesla";
import { recordPerfMetric } from "./perf";

type VitalMetricName = "LCP" | "FID" | "TTI";
type VitalCallback = (value: number) => void;
type Unsubscribe = () => void;

const tracer = trace.getTracer("shell.web-vitals");

const emitSpan = (metric: VitalMetricName, value: number) => {
  const span = tracer.startSpan(`web-vitals.${metric}`, {
    attributes: {
      metric,
      value
    }
  });
  span.end();
};

const createHandler =
  (metric: VitalMetricName, handler: VitalCallback) => (payload: Metric) => {
    const value = payload.value;
    emitSpan(metric, value);
    handler(value);
  };

const noop: Unsubscribe = () => undefined;
const hasWindow = () => typeof window !== "undefined";

export const onLCP = (handler: VitalCallback): Unsubscribe => {
  if (!hasWindow()) {
    return noop;
  }

  observeLCP(createHandler("LCP", handler));
  return noop;
};

export const onFID = (handler: VitalCallback): Unsubscribe => {
  if (!hasWindow()) {
    return noop;
  }

  observeFID(createHandler("FID", handler));
  return noop;
};

const IDLE_WINDOW_MS = 5_000;

const now = () => {
  const perf =
    typeof performance !== "undefined" ? performance : undefined;

  if (typeof perf?.now === "function") {
    return perf.now();
  }

  const timeOrigin =
    typeof perf?.timeOrigin === "number"
      ? perf.timeOrigin
      : perf?.timing?.navigationStart;

  if (typeof timeOrigin === "number") {
    return Date.now() - timeOrigin;
  }

  return 0;
};

const runWhenLoaded = (fn: () => void) => {
  if (!hasWindow()) {
    return;
  }

  if (document.readyState === "complete") {
    fn();
    return;
  }

  window.addEventListener("load", fn, { once: true });
};

export const onTTI = (handler: VitalCallback): Unsubscribe => {
  if (!hasWindow()) {
    return noop;
  }

  if (
    typeof PerformanceObserver === "undefined" ||
    !PerformanceObserver.supportedEntryTypes?.includes("longtask")
  ) {
    const fallbackValue = 0; // Assume interactive if no task data available
    emitSpan("TTI", fallbackValue);
    handler(fallbackValue);
    return noop;
  }

  let resolved = false;
  let observer: PerformanceObserver | null = null;
  // Initialize lastLongTaskEnd to navigation origin (not current time) so buffered
  // long-task entries from before now() are included in TTI calculation.
  // Use performance.timeOrigin if available, fallback to performance.timing.navigationStart.
  const navigationOrigin =
    typeof performance !== "undefined"
      ? (typeof performance.timeOrigin === "number"
          ? performance.timeOrigin
          : performance.timing?.navigationStart ?? 0)
      : 0;
  let lastLongTaskEnd = navigationOrigin;
  let idleTimer: ReturnType<typeof window.setTimeout> | null = null;

  const cleanup = () => {
    resolved = true;
    if (idleTimer) {
      window.clearTimeout(idleTimer);
    }
    observer?.disconnect();
    window.removeEventListener("visibilitychange", finalizeOnHide);
  };

  const finalize = () => {
    if (resolved) {
      return;
    }

    const value = lastLongTaskEnd;
    emitSpan("TTI", value);
    handler(value);
    cleanup();
  };

  const scheduleIdleCheck = () => {
    if (idleTimer) {
      window.clearTimeout(idleTimer);
    }

    idleTimer = window.setTimeout(() => {
      if (resolved) {
        return;
      }

      if (document.visibilityState === "hidden") {
        finalize();
        return;
      }

      const idleDuration = now() - lastLongTaskEnd;
      if (idleDuration >= IDLE_WINDOW_MS && document.readyState === "complete") {
        finalize();
        return;
      }

      scheduleIdleCheck();
    }, IDLE_WINDOW_MS);
  };

  const finalizeOnHide = () => {
    if (document.visibilityState === "hidden") {
      finalize();
    }
  };

  observer = new PerformanceObserver((entryList) => {
    for (const entry of entryList.getEntries()) {
      const end = entry.startTime + entry.duration;
      if (end > lastLongTaskEnd) {
        lastLongTaskEnd = end;
      }
    }
    scheduleIdleCheck();
  });

  try {
    observer.observe({ type: "longtask", buffered: true });
  } catch {
    // Fallback: report immediately if longtask buffering is unavailable.
    const fallbackValue = 0; // Assume interactive if no task data available
    emitSpan("TTI", fallbackValue);
    handler(fallbackValue);
    return noop;
  }

  runWhenLoaded(scheduleIdleCheck);
  window.addEventListener("visibilitychange", finalizeOnHide);

  return cleanup;
};

const record =
  (metric: keyof TeslaPerfMetrics) => (value: number) => {
    recordPerfMetric(metric, value);
  };

export const bootShellWebVitals = (): Unsubscribe => {
  if (!hasWindow()) {
    return noop;
  }

  const unsubscribers: Unsubscribe[] = [
    onLCP(record("lcp")),
    onFID(record("fid")),
    onTTI(record("tti"))
  ];

  return () => {
    unsubscribers.forEach((unsubscribe) => unsubscribe());
  };
};
