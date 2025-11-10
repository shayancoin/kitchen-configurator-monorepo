export const env = new Proxy({}, {
  get() {
    throw new Error("@repo/env/next is not available in the Gateway Vitest environment.");
  }
});
