import bundleAnalyzer from "@next/bundle-analyzer";
import { config as sharedConfig } from "@repo/next-config";
import { withConditionalModuleFederation } from "@repo/config";
import type { NextConfig } from "next";

const CONFIG_PANEL_ORIGIN =
  process.env.CONFIG_PANEL_ORIGIN ?? "http://localhost:4021";

const configWithMF: NextConfig = withConditionalModuleFederation(sharedConfig, {
  federationConfig: ({ isServer }: { isServer: boolean }) => ({
    name: "shell",
    filename: "static/chunks/remoteEntry.js",
    remotes: {
      "mfe-config-panel": `mfeConfigPanel@${CONFIG_PANEL_ORIGIN}/_next/static/${
        isServer ? "ssr" : "chunks"
      }/remoteEntry.js`
    },
    extraOptions: {}
  }),
  shim: {
    modules: ["mfe-config-panel/ConfiguratorPanel"]
  }
});

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === "true"
});

export default withBundleAnalyzer(configWithMF);
