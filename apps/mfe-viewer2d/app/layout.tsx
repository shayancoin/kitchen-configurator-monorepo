import "@repo/ui-tesla/styles.css";
import "./global.css";
import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Viewer 2D MFE • Parviz",
  description: "Photon/wasm powered layered renderer."
};

const RootLayout = ({ children }: { readonly children: ReactNode }) => (
  <html lang="en">
    <body>{children}</body>
  </html>
);

export default RootLayout;
