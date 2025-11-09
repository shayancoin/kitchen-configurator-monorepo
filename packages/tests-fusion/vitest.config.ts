import { defineConfig } from "vitest/config";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.spec.ts"],
    setupFiles: ["./vitest.setup.ts"],
    coverage: {
      enabled: false
    }
  },
  resolve: {
    alias: {
      "@gateway": path.resolve(__dirname, "../../apps/gateway/src"),
      "server-only": path.resolve(__dirname, "./stubs/server-only.ts"),
      "@repo/database": path.resolve(__dirname, "./stubs/database.ts")
    }
  }
});
