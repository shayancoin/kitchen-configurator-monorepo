import { defineConfig } from "tsup";
export default defineConfig([
  { entry: { index: "src/node/index.ts" }, format: ["cjs","esm"], outDir: "dist/node", target: "node20", dts: true, sourcemap: false, clean: true },
  { entry: { index: "src/next/index.ts" }, format: ["esm"], outDir: "dist/next", target: "es2022", dts: true, sourcemap: false }
]);
