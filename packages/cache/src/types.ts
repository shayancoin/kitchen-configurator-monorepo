export type CacheAdapter = {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T, ttlSeconds?: number): Promise<void>;
  delete(key: string): Promise<void>;
};

export type CacheStats = {
  hits: number;
  misses: number;
};

export type CacheNamespaceAdapter = CacheAdapter & {
  readonly namespace: string;
};

export type MemoizeOptions = {
  key: string;
  ttlSeconds?: number;
};
