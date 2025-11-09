import { createEnv } from "@t3-oss/env-nextjs";
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

const integer = z
  .preprocess((value) => {
    if (typeof value === "string" && value.trim().length > 0) {
      const parsed = Number(value);
      if (!Number.isNaN(parsed)) {
        return parsed;
      }
    }
    if (typeof value === "number") {
      return value;
    }
    return undefined;
  }, z.number().int().min(0).max(15))
  .optional();

export const cacheEnv = () =>
  createEnv({
    server: {
      REDIS_URL: z.string().url().optional(),
      REDIS_PASSWORD: z.string().optional(),
      REDIS_DB: integer,
      REDIS_TLS: booleanish,
      CACHE_DISABLE: booleanish
    },
    client: {},
    runtimeEnv: {
      REDIS_URL: process.env.REDIS_URL,
      REDIS_PASSWORD: process.env.REDIS_PASSWORD,
      REDIS_DB: process.env.REDIS_DB,
      REDIS_TLS: process.env.REDIS_TLS,
      CACHE_DISABLE: process.env.CACHE_DISABLE
    }
  });
