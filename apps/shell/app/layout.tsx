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
      />
      <link
        rel="preload"
        href="/fonts/Universal-Sans-Display-Medium.woff2"
        as="font"
        type="font/woff2"
        crossOrigin="anonymous"
      />
      <link
        rel="preload"
        href="/fonts/Universal-Sans-Text-Regular.woff2"
        as="font"
        type="font/woff2"
        crossOrigin="anonymous"
      />
      <link
        rel="preload"
        href="/fonts/Universal-Sans-Text-Medium.woff2"
        as="font"
        type="font/woff2"
        crossOrigin="anonymous"
      />
    </head>
    <body>
      <TelemetryBootstrap />
      {/* // EXTEND_AI_HERE: inject runtime feature flags before shell children render. */}
      {children}
    </body>
  </html>
);

export default RootLayout;
