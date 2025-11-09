"use client";

import { memo, useMemo } from "react";
import {
  TeslaConfiguratorPanel,
  type TeslaConfiguratorSection
} from "@repo/ui-tesla";

export type LocalConfiguratorPanelProperties = {
  readonly variant?: "live" | "skeleton";
};

const baseSections: TeslaConfiguratorSection[] = [
  {
    id: "layout",
    title: "Layout Mode",
    subtitle: "MobX Store",
    description:
      "Switch between galley, island, or L-shape plans before AI optimization attaches.",
    layout: "grid",
    options: [
      {
        id: "galley",
        label: "Galley Dual",
        helper: "Best for narrow spans",
        priceDelta: "Included",
        active: true
      },
      {
        id: "island",
        label: "Island Flow",
        helper: "Adds prep island + 3 seats",
        priceDelta: "+$6,400"
      },
      {
        id: "lshape",
        label: "L-Shape Hybrid",
        helper: "Pairs with walk-in pantry",
        priceDelta: "+$3,100"
      }
    ]
  },
  {
    id: "appliances",
    title: "Appliance Pack",
    subtitle: "BOM Seed",
    description:
      "Select kit so downstream pricing + CAD exports pre-fill correct SKUs.",
    layout: "grid",
    options: [
      {
        id: "efficiency",
        label: "Efficiency Core",
        helper: "Induction + convection duo",
        priceDelta: "+$9,200",
        active: true
      },
      {
        id: "pro",
        label: "Pro Heat",
        helper: "Dual fuel + sous-vide bay",
        priceDelta: "+$13,450"
      }
    ]
  }
];

const Panel = ({
  variant = "live"
}: LocalConfiguratorPanelProperties) => {
  const sections = useMemo(() => {
    if (variant === "skeleton") {
      return baseSections.map((section) => ({
        ...section,
        options: section.options.map((option) => ({
          ...option,
          helper: "Loading…",
          priceDelta: "—",
          active: option.active && Math.random() > 0.5
        }))
      }));
    }

    return baseSections;
  }, [variant]);

  return (
    <TeslaConfiguratorPanel
      title="Local Configurator Panel"
      subtitle="Shell fallback"
      sections={sections}
      // EXTEND_AI_HERE: swap helper once the AI advisor feeds curated estimates.
      priceSummary={{
        label: "Est. BOM",
        value: "$64,900",
        helper: "Snapshot locked locally"
      }}
      footer={
        <span>
          MFEs disabled. Set{" "}
          <code>NEXT_PUBLIC_ENABLE_MF_REMOTES=true</code> to stream remotes.
        </span>
      }
    />
  );
};

export const LocalConfiguratorPanel = memo(Panel, (prev, next) => prev.variant === next.variant);
LocalConfiguratorPanel.displayName = "LocalConfiguratorPanel";

export default LocalConfiguratorPanel;
