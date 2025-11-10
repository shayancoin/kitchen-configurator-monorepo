import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";
export const env = createEnv({
  server: { OTLP_ENDPOINT: z.string().url().optional() },
  client: { NEXT_PUBLIC_APP_ENV: z.enum(["dev","staging","prod"]).default("dev") },
  runtimeEnv: {
    OTLP_ENDPOINT: process.env.OTLP_ENDPOINT,
    NEXT_PUBLIC_APP_ENV: process.env.NEXT_PUBLIC_APP_ENV
  }
});
