"use client";

import dynamic from "next/dynamic";
import styles from "./preview.module.css";

const TeslaPreviewShell = dynamic(
  () => import("./TeslaPreviewShell"),
  {
    ssr: false,
    loading: () => (
      <div className={styles.previewHero}>
        <h1 className={styles.previewHeroTitle}>Loading Tesla theme…</h1>
        <p className={styles.previewHeroDescription}>
          Token sync &amp; MF contract warming ensure TTI stays under 2s.
        </p>
      </div>
    )
  }
);

const ConfiguratorPreviewClient = ({
  locale
}: {
  readonly locale: string;
}) => <TeslaPreviewShell locale={locale} />;

export default ConfiguratorPreviewClient;
