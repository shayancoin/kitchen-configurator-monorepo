import { z, type ZodTypeAny } from "zod";

type ZodShape = Record<string, ZodTypeAny>;
type InferShape<TSchema extends ZodShape> = {
  [K in keyof TSchema]: z.infer<TSchema[K]>;
};

type ClientShape<TClient extends ZodShape | undefined> = TClient extends ZodShape ? TClient : never;
type ClientInfer<TClient extends ZodShape | undefined> = TClient extends ZodShape
  ? InferShape<TClient>
  : Record<string, never>;

type CreateEnvOptions<TServer extends ZodShape, TClient extends ZodShape | undefined = undefined> = {
  server: TServer;
  client?: TClient;
  runtimeEnv: { [K in keyof (TServer & (TClient extends ZodShape ? TClient : {}))]: string | undefined } & Record<
    string,
    string | undefined
  >;
  emptyStringAsUndefined?: boolean;
};

const sanitize = (value: unknown): unknown =>
  typeof value === "string" && value.trim() === "" ? undefined : value;

export function createEnv<TServer extends ZodShape, TClient extends ZodShape | undefined = undefined>({
  server,
  client,
  runtimeEnv,
  emptyStringAsUndefined = true
}: CreateEnvOptions<TServer, TClient>): InferShape<TServer> & ClientInfer<TClient> {
  const serverSchema = z.object(server) as z.ZodObject<{ [K in keyof TServer]: TServer[K] }>;
  const sanitizedEnv = emptyStringAsUndefined
    ? Object.fromEntries(Object.entries(runtimeEnv).map(([key, value]) => [key, sanitize(value)]))
    : runtimeEnv;
  const serverEnv = serverSchema.parse(sanitizedEnv) as InferShape<TServer>;

  if (!client) {
    return serverEnv as InferShape<TServer> & ClientInfer<TClient>;
  }

  const clientSchema = z.object(client as ClientShape<TClient>) as z.ZodObject<{
    [K in keyof ClientShape<TClient>]: ClientShape<TClient>[K];
  }>;
  const clientEnv = clientSchema.parse(sanitizedEnv) as ClientInfer<TClient>;
  return { ...serverEnv, ...clientEnv } as InferShape<TServer> & ClientInfer<TClient>;
}

const serverShape = {
  NODE_ENV: z.enum(["development", "test", "staging", "production"]).default("development"),
  REDIS_URL: z.string().url().optional(),
  OTLP_ENDPOINT: z.string().url().optional()
} as const;

export const schema = z.object(serverShape);

export const env = createEnv({
  server: serverShape,
  runtimeEnv: process.env
});
