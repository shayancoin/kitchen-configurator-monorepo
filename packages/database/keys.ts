import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

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
  }, z.number().int().positive())
  .optional();

export const keys = () =>
  createEnv({
    server: {
      DATABASE_URL: z.string().url().optional(),
      DATABASE_DIRECT_URL: z.string().url().optional(),
      DATABASE_SHARD_COUNT: integer
    },
    client: {},
    runtimeEnv: {
      DATABASE_URL: process.env.DATABASE_URL,
      DATABASE_DIRECT_URL: process.env.DATABASE_DIRECT_URL,
      DATABASE_SHARD_COUNT: process.env.DATABASE_SHARD_COUNT
    }
  });
