import "@repo/ui-tesla/styles.css";
import "./global.css";
import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Config Panel MFE • Parviz",
  description: "Tesla-inspired configurator panel remote."
};

const RootLayout = ({ children }: { readonly children: ReactNode }) => (
  <html lang="en">
    <body>{children}</body>
  </html>
);

export default RootLayout;
