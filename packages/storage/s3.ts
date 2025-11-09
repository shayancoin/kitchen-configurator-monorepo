import { GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { keys } from "./keys";

type PutObjectParams = {
  key: string;
  body: string | Uint8Array | Buffer;
  contentType?: string;
  bucket?: string;
  cacheControl?: string;
};

type SignedUrlParams = {
  key: string;
  bucket?: string;
  expiresIn?: number;
};

const globalKey = Symbol.for("@repo/storage/s3");

const globalTarget = globalThis as {
  [globalKey]?: S3Client | null;
};

const sharedEnv = () => keys();

const ensureClient = (): S3Client | null => {
  if (globalTarget[globalKey] !== undefined) {
    return globalTarget[globalKey] ?? null;
  }

  const env = sharedEnv();
  if (
    !env.AWS_ACCESS_KEY_ID ||
    !env.AWS_SECRET_ACCESS_KEY ||
    !env.AWS_S3_REGION ||
    !env.AWS_S3_BUCKET
  ) {
    globalTarget[globalKey] = null;
    return null;
  }

  const client = new S3Client({
    region: env.AWS_S3_REGION,
    endpoint: env.AWS_S3_ENDPOINT,
    forcePathStyle: env.AWS_S3_FORCE_PATH_STYLE ?? false,
    credentials: {
      accessKeyId: env.AWS_ACCESS_KEY_ID,
      secretAccessKey: env.AWS_SECRET_ACCESS_KEY
    }
  });

  globalTarget[globalKey] = client;
  return client;
};

export const getS3Client = (): S3Client | null => ensureClient();

export const putObject = async ({
  key,
  body,
  bucket,
  contentType,
  cacheControl
}: PutObjectParams): Promise<void> => {
  const env = sharedEnv();
  const client = ensureClient();
  if (!client || !(bucket ?? env.AWS_S3_BUCKET)) {
    throw new Error("S3 client unavailable; ensure AWS_* env vars are configured");
  }

  await client.send(
    new PutObjectCommand({
      Key: key,
      Bucket: bucket ?? env.AWS_S3_BUCKET,
      Body: body,
      ContentType: contentType,
      CacheControl: cacheControl
    })
  );
};

const buildRegionalUrl = (bucket: string, key: string, region?: string) => {
  if (!bucket) {
    return null;
  }
  const safeKey = key.replace(/^\/+/, "");
  if (!region) {
    return `https://${bucket}.s3.amazonaws.com/${safeKey}`;
  }
  return `https://${bucket}.s3.${region}.amazonaws.com/${safeKey}`;
};

export const buildObjectUrl = (
  key: string,
  overrides?: { bucket?: string }
): string | null => {
  const env = sharedEnv();
  if (env.ASSET_CDN_BASE_URL) {
    return `${env.ASSET_CDN_BASE_URL.replace(/\/$/, "")}/${key.replace(/^\/+/, "")}`;
  }

  const bucket = overrides?.bucket ?? env.AWS_S3_BUCKET;
  return buildRegionalUrl(bucket ?? "", key, env.AWS_S3_REGION ?? undefined);
};

export const getSignedObjectUrl = async ({
  key,
  bucket,
  expiresIn = 300
}: SignedUrlParams): Promise<string | null> => {
  const env = sharedEnv();
  const client = ensureClient();
  if (!client || !(bucket ?? env.AWS_S3_BUCKET)) {
    return null;
  }

  return getSignedUrl(
    client,
    new GetObjectCommand({
      Key: key,
      Bucket: bucket ?? env.AWS_S3_BUCKET
    }),
    { expiresIn }
  );
};
