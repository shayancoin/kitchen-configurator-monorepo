import Redis from "ioredis";
import type { CacheAdapter } from "./types";

export type RedisAdapterOptions = {
  url: string;
  password?: string;
  db?: number;
  tls?: boolean;
};

const serialize = (value: unknown): string => JSON.stringify(value);

const deserialize = <T>(payload: string | null): T | null => {
  if (!payload) {
    return null;
  }

  try {
    return JSON.parse(payload) as T;
  } catch (error) {
    console.warn("[cache] failed to parse cached payload", error);
    return null;
  }
};

export const createRedisAdapter = (options: RedisAdapterOptions): CacheAdapter => {
  const client = new Redis(options.url, {
    lazyConnect: true,
    password: options.password,
    db: options.db,
    tls: options.tls ? {} : undefined
  });

  return {
    async get<T>(key: string): Promise<T | null> {
      const payload = await client.get(key);
      return deserialize<T>(payload);
    },
    async set<T>(key: string, value: T, ttlSeconds?: number): Promise<void> {
      const payload = serialize(value);
      if (ttlSeconds && ttlSeconds > 0) {
        await client.set(key, payload, "EX", ttlSeconds);
        return;
      }
      await client.set(key, payload);
    },
    async delete(key: string): Promise<void> {
      await client.del(key);
    }
  } satisfies CacheAdapter;
};
