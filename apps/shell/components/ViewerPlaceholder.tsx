"use client";

import { TeslaSection } from "@repo/ui-tesla";

const ViewerPlaceholder = () => (
  <TeslaSection
    eyebrow="Viewer2D"
    title="WASM compositor warming up"
    description="Enable module federation to stream the Photon-based canvas remote. Until then this placeholder keeps layout parity and describes the expected perf budget."
    stats={[
      { label: "Target", value: "<50 ms", helper: "per frame" },
      { label: "Resolution", value: "640×360" }
    ]}
    showArrow
  />
);

export default ViewerPlaceholder;
