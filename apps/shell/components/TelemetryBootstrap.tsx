"use client";

import { useEffect } from "react";

export const TelemetryBootstrap = () => {
  useEffect(() => {
    const bootstrap = async () => {
      const { initializeBrowserTelemetry } = await import("@repo/observability/otel-browser");
      await initializeBrowserTelemetry();
    };
    bootstrap().catch((error) => {
      console.warn("[telemetry] failed to init web telemetry", error);
    });
  }, []);

  return null;
};
