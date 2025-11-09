import { describe, expect, it } from "vitest";
import { createNamespace, memoize } from ".";

describe("cache namespace", () => {
  it("stores and retrieves values in-memory when Redis is unavailable", async () => {
    const cache = createNamespace("test-suite");
    expect(cache).not.toBeNull();

    await cache?.set("key", { hello: "world" }, 60);
    const value = await cache?.get<{ hello: string }>("key");

    expect(value).toEqual({ hello: "world" });
    await cache?.delete("key");
    const missing = await cache?.get("key");
    expect(missing).toBeNull();
  });
});

describe("memoize", () => {
  it("memoizes resolver output", async () => {
    let executions = 0;

    const first = await memoize(
      "fusion",
      { key: "catalog", ttlSeconds: 30 },
      async () => {
        executions += 1;
        return { modules: 3 };
      }
    );

    const second = await memoize(
      "fusion",
      { key: "catalog", ttlSeconds: 30 },
      async () => {
        executions += 1;
        return { modules: 99 };
      }
    );

    expect(first).toEqual({ modules: 3 });
    expect(second).toEqual({ modules: 3 });
    expect(executions).toBe(1);
  });
});
