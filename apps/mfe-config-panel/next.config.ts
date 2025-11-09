import { config as sharedConfig } from "@repo/next-config";
import { withConditionalModuleFederation } from "@repo/config";
import type { NextConfig } from "next";

const configWithMF: NextConfig = withConditionalModuleFederation(sharedConfig, {
  federationConfig: ({ isServer }: { isServer: boolean }) => ({
    name: "mfeConfigPanel",
    filename: `static/${isServer ? "ssr" : "chunks"}/remoteEntry.js`,
    exposes: {
      "./ConfiguratorPanel": "./src/remotes/ConfiguratorPanel.tsx"
    },
    extraOptions: {}
  })
});

export default configWithMF;
