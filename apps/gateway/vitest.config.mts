import { fileURLToPath } from "node:url";
import path from "node:path";
import { defineConfig } from "vitest/config";

const dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
    coverage: {
      enabled: false
    }
  },
  resolve: {
    alias: {
      "server-only": path.join(dirname, "./vitest.server-only.stub.ts"),
      "@repo/env/next": path.join(dirname, "./vitest.env-next.stub.ts")
    }
  }
});
