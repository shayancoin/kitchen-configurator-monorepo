"use client";

import { useEffect, useMemo, useState } from "react";
import type { TeslaPerfMetrics } from "@repo/ui-tesla";
import { onPerfUpdate } from "@/lib/perf";

const getInitialMetrics = (): TeslaPerfMetrics => {
  if (typeof window === "undefined") {
    return {};
  }

  return window.tesla?.metrics ?? {};
};

const formatMillis = (value?: number) =>
  value ? `${Math.round(value)}ms` : "—";

export const PerfBudgetIndicator = () => {
  const [metrics, setMetrics] = useState<TeslaPerfMetrics>(getInitialMetrics);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    setMetrics(window.tesla?.metrics ?? {});
    return onPerfUpdate((detail) => {
      setMetrics({
        tti: detail.tti,
        lcp: detail.lcp,
        fid: detail.fid
      });
    });
  }, []);

  const className = useMemo(() => {
    const base = "perf-indicator";
    if (!metrics.tti) {
      return base;
    }

    return `${base} ${
      metrics.tti <= 2000 ? "perf-indicator--ok" : "perf-indicator--warn"
    }`;
  }, [metrics.tti]);

  if (!metrics.tti) {
    return null;
  }

  return (
    <aside
      className={className}
      role="status"
      aria-live="polite"
    >
      <div>
        <p className="perf-indicator__label">TTI</p>
        <p className="perf-indicator__value">{formatMillis(metrics.tti)}</p>
      </div>
      <div>
        <p className="perf-indicator__label">LCP</p>
        <p className="perf-indicator__value">{formatMillis(metrics.lcp)}</p>
      </div>
      <div>
        <p className="perf-indicator__label">FID</p>
        <p className="perf-indicator__value">{formatMillis(metrics.fid)}</p>
      </div>
    </aside>
  );
};

export default PerfBudgetIndicator;
