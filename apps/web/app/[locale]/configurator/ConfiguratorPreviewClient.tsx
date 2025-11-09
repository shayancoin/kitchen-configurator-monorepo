"use client";

import "@repo/ui-tesla/styles.css";
import {
  TeslaHeader,
  TeslaSection,
  TeslaThemeProvider,
  type TeslaSectionStat
} from "@repo/ui-tesla";
import { useMemo } from "react";
import styles from "./preview.module.css";

const stats: TeslaSectionStat[] = [
  { label: "Range", value: "310 mi", helper: "EPA est." },
  { label: "0-60 mph", value: "2.9 s", helper: "Performance" },
  { label: "Top Speed", value: "155 mph" },
  { label: "Peak Output", value: "760 hp" }
];

const ConfiguratorPreviewClient = ({
  locale
}: {
  readonly locale: string;
}) => {
  const ctas = useMemo(
    () => [
      { label: "Order Now", variant: "primary" as const },
      { label: "Test Drive", variant: "secondary" as const }
    ],
    []
  );

  return (
    <TeslaThemeProvider className={styles.previewShell}>
      <TeslaHeader
        brand="PARVIZ"
        navLinks={[
          { label: "Design", href: `/${locale}/configurator`, active: true },
          { label: "Specs", href: `/${locale}/configurator#specs` },
          { label: "AI Advisor", href: `/${locale}/configurator#advisor` },
          { label: "Manufacturing", href: `/${locale}/configurator#manufacturing` }
        ]}
        actions={[
          { label: "Account", href: "/account" },
          { label: "Cart", href: "/cart" },
          { label: "Checkout", accent: true }
        ]}
      />

      <div className={styles.previewHero}>
        <h1 className={styles.previewHeroTitle}>Kitchen Configurator Preview</h1>
        <p className={styles.previewHeroDescription}>
          Tesla-inspired layout primitives drive the Configurator Panel so pricing,
          visualization, and AI guidance stay synchronized at p95 &lt; 300ms. The
          cards below are wired for Module Federation and will be replaced by live
          MFEs in the next steps of the fusion roadmap.
        </p>
      </div>

      <TeslaSection
        eyebrow="Performance Line"
        title="Model S – Culinary Edition"
        description="Ultra-responsive interface pairs with AI-driven layouts and WASM compositing for photoreal feedback."
        linkLabel="See release notes"
        linkHref="/changelog"
        backgroundImage="https://images.unsplash.com/photo-1505692794400-39597ebc7c9d?auto=format&fit=crop&w=1400&q=80"
        ctas={ctas}
        stats={stats}
        showArrow
      />
    </TeslaThemeProvider>
  );
};

export default ConfiguratorPreviewClient;
