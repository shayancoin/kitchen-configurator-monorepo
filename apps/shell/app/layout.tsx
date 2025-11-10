import "@repo/ui-tesla/styles.css";
import "../styles/tds-fonts.css";
import "./global.css";
import type { Metadata } from "next";
import type { ReactNode } from "react";
import { TelemetryBootstrap } from "@/components/TelemetryBootstrap";

export const metadata: Metadata = {
  title: "Parviz Shell • Tesla-grade Configurator",
  description: "Host shell orchestrating remote config MFEs."
};

const RootLayout = ({ children }: { readonly children: ReactNode }) => (
  <html lang="en">
    <head>
      <link
        rel="preload"
        href="/fonts/Universal-Sans-Display-Regular.woff2"
        as="font"
        type="font/woff2"
        crossOrigin="anonymous"
        fetchpriority="high"
      />
      <link
        rel="preload"
        href="/fonts/Universal-Sans-Display-Medium.woff2"
        as="font"
        type="font/woff2"
        crossOrigin="anonymous"
        fetchpriority="low"
      />
      <link
        rel="preload"
        href="/fonts/Universal-Sans-Text-Regular.woff2"
        as="font"
        type="font/woff2"
        crossOrigin="anonymous"
        fetchpriority="high"
      />
      <link
        rel="preload"
        href="/fonts/Universal-Sans-Text-Medium.woff2"
        as="font"
        type="font/woff2"
        crossOrigin="anonymous"
        fetchpriority="low"
      />
    </head>
    <body>
      <TelemetryBootstrap />
      {/*
        EXTEND_AI_HERE: Runtime Extension Point
        
        Purpose: Inject runtime feature flags, configuration, or pre-render initialization.
        
        Mechanism: Server-side transform (build-time injection) OR client-side runtime boundary.
        
        Performance Budget:
        - T_injection ≤ 100–200ms (target: ≤150ms)
        - Combined T_injection + T_children_render MUST stay within 2000ms TTI budget
        - Monitor via window.tesla.metrics.tti
        
        TypeScript Contract:
        - See types/tesla-runtime.d.ts for window.tesla extension interface
        - Required fields: window.tesla.featureFlags, window.tesla.runtimeConfig
        - All extensions must be typed to enforce compile-time checks
        
        Implementation Options:
        1. Server Transform: Inject via Next.js middleware or webpack plugin (recommended for static flags)
        2. Client Boundary: Use <script> tag with inline JSON or async fetch (for dynamic config)
        
        Reference Implementation:
        - Server: See packages/config/tesla-runtime-plugin.ts (example)
        - Client: See components/RuntimeConfigLoader.tsx (example)
        
        Testing:
        - Measure injection overhead: T_injection = performance.mark('tesla-runtime-ready') - navigationStart
        - Validate TTI budget: Ensure TTI ≤ 2000ms in CI/CD perf gates
        - Contract validation: TypeScript compilation must pass with strict mode
      */}
      {children}
    </body>
  </html>
);

export default RootLayout;
