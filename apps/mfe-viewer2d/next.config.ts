import { config as sharedConfig } from "@repo/next-config";
import { withConditionalModuleFederation } from "@repo/config";
import type { NextConfig } from "next";

const configWithMF: NextConfig = withConditionalModuleFederation(sharedConfig, {
  federationConfig: ({ isServer }: { isServer: boolean }) => ({
    name: "mfeViewer2d",
    filename: `static/${isServer ? "ssr" : "chunks"}/remoteEntry.js`,
    exposes: {
      "./ViewerCanvas": "./src/remotes/ViewerCanvas.tsx"
    },
    extraOptions: {}
  })
});

export default configWithMF;
