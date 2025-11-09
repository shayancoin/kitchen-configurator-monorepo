import type { CacheAdapter, CacheStats } from "./types";

type Entry = {
  value: unknown;
  expiresAt?: number;
};

class MemoryCache implements CacheAdapter {
  private store = new Map<string, Entry>();

  private stats: CacheStats = { hits: 0, misses: 0 };

  async get<T>(key: string): Promise<T | null> {
    const now = Date.now();
    const entry = this.store.get(key);
    if (!entry) {
      this.stats.misses += 1;
      return null;
    }

    if (entry.expiresAt && entry.expiresAt <= now) {
      this.store.delete(key);
      this.stats.misses += 1;
      return null;
    }

    this.stats.hits += 1;
    return entry.value as T;
  }

  async set<T>(key: string, value: T, ttlSeconds?: number): Promise<void> {
    const expiresAt = ttlSeconds ? Date.now() + ttlSeconds * 1000 : undefined;
    this.store.set(key, { value, expiresAt });
  }

  async delete(key: string): Promise<void> {
    this.store.delete(key);
  }

  snapshot(): CacheStats {
    return { ...this.stats };
  }
}

export const createMemoryAdapter = (): CacheAdapter => new MemoryCache();
