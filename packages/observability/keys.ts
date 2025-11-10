import { createEnv } from "@repo/env/node";
import { z } from "zod";

const booleanish = z
  .preprocess((value) => {
    if (typeof value === "string") {
      const normalized = value.trim().toLowerCase();
      if (["1", "true", "on"].includes(normalized)) {
        return true;
      }
      if (["0", "false", "off"].includes(normalized)) {
        return false;
      }
    }
    if (typeof value === "boolean") {
      return value;
    }
    return undefined;
  }, z.boolean())
  .optional();

export const keys = () =>
  createEnv({
    server: {
      BETTERSTACK_API_KEY: z.string().optional(),
      BETTERSTACK_URL: z.string().url().optional(),

      // Added by Sentry Integration, Vercel Marketplace
      SENTRY_ORG: z.string().optional(),
      SENTRY_PROJECT: z.string().optional(),

      OTEL_EXPORTER_OTLP_ENDPOINT: z.string().url().optional(),
      OTEL_EXPORTER_OTLP_HEADERS: z.string().optional(),
      OTEL_SERVICE_NAME: z.string().optional(),
      OTEL_SERVICE_VERSION: z.string().optional(),
      OTEL_DEBUG: booleanish
    },
    client: {
      NEXT_PUBLIC_OTEL_EXPORTER_OTLP_ENDPOINT: z.string().url().optional(),
      NEXT_PUBLIC_OTEL_SERVICE_NAME: z.string().optional(),
      NEXT_PUBLIC_SENTRY_DSN: z.string().url().optional()
    },
    runtimeEnv: {
      BETTERSTACK_API_KEY: process.env.BETTERSTACK_API_KEY,
      BETTERSTACK_URL: process.env.BETTERSTACK_URL,
      SENTRY_ORG: process.env.SENTRY_ORG,
      SENTRY_PROJECT: process.env.SENTRY_PROJECT,
      OTEL_EXPORTER_OTLP_ENDPOINT: process.env.OTEL_EXPORTER_OTLP_ENDPOINT,
      OTEL_EXPORTER_OTLP_HEADERS: process.env.OTEL_EXPORTER_OTLP_HEADERS,
      OTEL_SERVICE_NAME: process.env.OTEL_SERVICE_NAME,
      OTEL_SERVICE_VERSION: process.env.OTEL_SERVICE_VERSION,
      OTEL_DEBUG: process.env.OTEL_DEBUG,
      NEXT_PUBLIC_OTEL_EXPORTER_OTLP_ENDPOINT:
        process.env.NEXT_PUBLIC_OTEL_EXPORTER_OTLP_ENDPOINT,
      NEXT_PUBLIC_OTEL_SERVICE_NAME: process.env.NEXT_PUBLIC_OTEL_SERVICE_NAME,
      NEXT_PUBLIC_SENTRY_DSN: process.env.NEXT_PUBLIC_SENTRY_DSN
    }
  });
