import { cacheEnv } from "./env";
import { createMemoryAdapter } from "./memory";
import { createRedisAdapter } from "./redis";
import type {
  CacheAdapter,
  CacheNamespaceAdapter,
  MemoizeOptions
} from "./types";

const globalCacheKey = Symbol.for("@repo/cache-instance");

type GlobalCache = {
  [globalCacheKey]?: CacheAdapter | null;
};

const globalTarget = globalThis as GlobalCache;

const normalize = (segment: string) => segment.replace(/[:\s]+/g, "-");

export const buildCacheKey = (...segments: string[]): string =>
  segments.filter(Boolean).map(normalize).join(":");

export const getCacheAdapter = (): CacheAdapter | null => {
  if (globalTarget[globalCacheKey] !== undefined) {
    return globalTarget[globalCacheKey] ?? null;
  }

  const env = cacheEnv();
  if (env.CACHE_DISABLE) {
    globalTarget[globalCacheKey] = null;
    return null;
  }

  if (env.REDIS_URL) {
    try {
      const adapter = createRedisAdapter({
        url: env.REDIS_URL,
        password: env.REDIS_PASSWORD,
        db: env.REDIS_DB,
        tls: env.REDIS_TLS
      });
      globalTarget[globalCacheKey] = adapter;
      return adapter;
    } catch (error) {
      console.warn("[cache] redis adapter unavailable, falling back to memory", error);
    }
  }

  const fallback = createMemoryAdapter();
  globalTarget[globalCacheKey] = fallback;
  return fallback;
};

export const createNamespace = (
  namespace: string
): CacheNamespaceAdapter | null => {
  const adapter = getCacheAdapter();
  if (!adapter) {
    return null;
  }

  return {
    namespace,
    async get<T>(key: string) {
      return adapter.get<T>(buildCacheKey(namespace, key));
    },
    async set<T>(key: string, value: T, ttlSeconds?: number) {
      await adapter.set(buildCacheKey(namespace, key), value, ttlSeconds);
    },
    async delete(key: string) {
      await adapter.delete(buildCacheKey(namespace, key));
    }
  } satisfies CacheNamespaceAdapter;
};

export const memoize = async <T>(
  namespace: string,
  options: MemoizeOptions,
  compute: () => Promise<T>
): Promise<T> => {
  const cache = createNamespace(namespace);
  if (!cache) {
    return compute();
  }

  const cached = await cache.get<T>(options.key);
  if (cached !== null) {
    return cached;
  }

  const value = await compute();
  await cache.set(options.key, value, options.ttlSeconds);
  return value;
};

export type { CacheAdapter, CacheNamespaceAdapter, MemoizeOptions } from "./types";
export { cacheEnv } from "./env";
export { createMemoryAdapter } from "./memory";
export { createRedisAdapter, type RedisAdapterOptions } from "./redis";
