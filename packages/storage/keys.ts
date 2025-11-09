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

export const keys = () =>
  createEnv({
    server: {
      BLOB_READ_WRITE_TOKEN: z.string().optional(),
      AWS_ACCESS_KEY_ID: z.string().optional(),
      AWS_SECRET_ACCESS_KEY: z.string().optional(),
      AWS_S3_BUCKET: z.string().optional(),
      AWS_S3_REGION: z.string().optional(),
      AWS_S3_ENDPOINT: z.string().url().optional(),
      AWS_S3_FORCE_PATH_STYLE: booleanish,
      ASSET_CDN_BASE_URL: z.string().url().optional()
    },
    runtimeEnv: {
      BLOB_READ_WRITE_TOKEN: process.env.BLOB_READ_WRITE_TOKEN,
      AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID,
      AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY,
      AWS_S3_BUCKET: process.env.AWS_S3_BUCKET,
      AWS_S3_REGION: process.env.AWS_S3_REGION,
      AWS_S3_ENDPOINT: process.env.AWS_S3_ENDPOINT,
      AWS_S3_FORCE_PATH_STYLE: process.env.AWS_S3_FORCE_PATH_STYLE,
      ASSET_CDN_BASE_URL: process.env.ASSET_CDN_BASE_URL
    }
  });
