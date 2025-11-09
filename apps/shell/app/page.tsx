import dynamic from "next/dynamic";
import { Suspense } from "react";
import {
  TeslaHeader,
  TeslaSection,
  TeslaThemeProvider,
  type TeslaSectionStat
} from "@repo/ui-tesla";
import LocalConfiguratorPanel from "@/components/LocalConfiguratorPanel";
import ViewerPlaceholder from "@/components/ViewerPlaceholder";

const isRemoteEnabled =
  process.env.NEXT_PUBLIC_ENABLE_MF_REMOTES === "true";

const RemoteConfiguratorPanel = dynamic(
  async () => {
    if (!isRemoteEnabled) {
      return LocalConfiguratorPanel;
    }

    try {
      const remote = await import("mfe-config-panel/ConfiguratorPanel");
      return remote.default ?? remote;
    } catch (error) {
      console.warn("Falling back to local Config Panel", error);
      return LocalConfiguratorPanel;
    }
  },
  {
    ssr: false,
    loading: () => <LocalConfiguratorPanel variant="skeleton" />
  }
);

const RemoteViewerCanvas = dynamic(
  async () => {
    if (!isRemoteEnabled) {
      return ViewerPlaceholder;
    }

    try {
      const remote = await import("mfe-viewer2d/ViewerCanvas");
      return remote.default ?? remote;
    } catch (error) {
      console.warn("Falling back to viewer placeholder", error);
      return ViewerPlaceholder;
    }
  },
  {
    ssr: false,
    loading: () => <ViewerPlaceholder />
  }
);

const stats: TeslaSectionStat[] = [
  { label: "Sprite Layers", value: "48", helper: "Photon-ready" },
  { label: "AI Suggestions", value: "6", helper: "per config" },
  { label: "WASM Init", value: "<50 ms" }
];

const ShellPage = () => (
  <TeslaThemeProvider className="shell">
    <TeslaHeader
      brand="PARVIZ"
      navLinks={[
        { label: "Configurator", href: "/", active: true },
        { label: "AI Advisor", href: "/ai" },
        { label: "Manufacturing", href: "/manufacturing" }
      ]}
      actions={[
        { label: "Status", href: "/status" },
        { label: "Checkout", accent: true }
      ]}
    />

    <div className="shell__grid">
      <section className="shell__panel">
        <Suspense fallback={<LocalConfiguratorPanel variant="skeleton" />}>
          <RemoteConfiguratorPanel />
        </Suspense>
      </section>
      <section className="shell__panel">
        <Suspense fallback={<ViewerPlaceholder />}>
          <RemoteViewerCanvas />
        </Suspense>
      </section>
    </div>

    <TeslaSection
      eyebrow="Vehicle DNA"
      title="Viewer2D target preview"
      description="Host shares Tesla UI tokens with all MFEs so the viewport, pricing, and AI rails align without hydration drift."
      linkLabel="See roadmap"
      linkHref="/docs/roadmap"
      backgroundImage="https://images.unsplash.com/photo-1513105737059-ff0cf0580e94?auto=format&fit=crop&w=1400&q=80"
      stats={stats}
      showArrow
      ctas={[
        { label: "Open Viewer", variant: "primary", href: "/viewer" },
        { label: "Manufacturing Mode", variant: "secondary", href: "/manufacturing" }
      ]}
    />
  </TeslaThemeProvider>
);

export default ShellPage;
