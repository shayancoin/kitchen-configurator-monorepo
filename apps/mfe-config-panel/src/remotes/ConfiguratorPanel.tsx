"use client";

import { useMemo } from "react";
import {
  TeslaConfiguratorPanel,
  TeslaThemeProvider,
  type TeslaConfiguratorSection
} from "@repo/ui-tesla";

const panelSections: TeslaConfiguratorSection[] = [
  {
    id: "finish",
    title: "Finish Package",
    subtitle: "Surface Layers",
    description:
      "Curated laminates tuned for photon compositor accuracy and clean manufacturing hand-off.",
    layout: "grid",
    aside: "OTIF 6 wks",
    options: [
      {
        id: "graphite",
        label: "Graphite Matte",
        helper: "NanoShield + anti-smudge",
        priceDelta: "+$2,400",
        badge: "Popular",
        active: true
      },
      {
        id: "polar",
        label: "Polar Satin",
        helper: "High reflectance | LRV 72",
        priceDelta: "+$3,100"
      },
      {
        id: "terra",
        label: "Terra Walnut",
        helper: "Book-matched veneer",
        priceDelta: "+$4,900",
        badge: "Premium"
      }
    ]
  },
  {
    id: "worktop",
    title: "Worktop Material",
    subtitle: "Counters",
    description: "Pick a countertop optimized for CNC toolpaths and heat tolerance.",
    layout: "single",
    options: [
      {
        id: "quartz",
        label: "AeroQuartz",
        helper: "Thermal guard | 3cm profile",
        priceDelta: "+$1,250",
        active: true
      },
      {
        id: "dekton",
        label: "Dekton Blaze",
        helper: "Zero-porosity w/ 900°C tolerance",
        priceDelta: "+$1,780"
      }
    ]
  },
  {
    id: "hardware",
    title: "Hardware Set",
    subtitle: "Interaction",
    description: "Pair pull geometry + finish with haptic AI sensors.",
    layout: "grid",
    options: [
      {
        id: "blade",
        label: "Blade Edge",
        helper: "Black anodized | <150g pull-force",
        priceDelta: "Included",
        active: true
      },
      {
        id: "arc",
        label: "Arc Continuum",
        helper: "Brushed nickel w/ haptic mesh",
        priceDelta: "+$540"
      },
      {
        id: "halo",
        label: "Halo Loop",
        helper: "Integrated LEDs + ambient sensors",
        priceDelta: "+$860",
        disabled: true
      }
    ]
  }
];

const footer = (
  <>
    <p>
      {/* EXTEND_AI_HERE: RAG advisor will stream contextual recommendations. */}
      LLM guidance available in next phase.
    </p>
    <div className="tesla-config-panel__ctas">
      <button className="tesla-section__cta tesla-section__cta--primary" type="button">
        Lock Build
      </button>
      <button className="tesla-section__cta" type="button">
        Share Preview
      </button>
    </div>
  </>
);

const ConfiguratorPanelRemote = () => {
  const sections = useMemo(() => panelSections, []);

  return (
    <TeslaThemeProvider className="tesla-preview-shell">
      <TeslaConfiguratorPanel
        title="Configurator Panel"
        subtitle="Remote • Tesla DNA"
        sections={sections}
        priceSummary={{
          label: "Estimated Build",
          value: "$86,240",
          helper: "Includes AI-optimized layout + install"
        }}
        footer={footer}
      />
    </TeslaThemeProvider>
  );
};

export default ConfiguratorPanelRemote;
