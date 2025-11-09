import clsx from "clsx";
import type { CSSProperties, ReactNode } from "react";
import type { TeslaCallToAction, TeslaSectionStat } from "./types";

export type TeslaSectionProperties = {
  readonly title: string;
  readonly eyebrow?: string;
  readonly description?: ReactNode;
  readonly linkHref?: string;
  readonly linkLabel?: string;
  readonly backgroundImage?: string;
  readonly ctas?: TeslaCallToAction[];
  readonly stats?: TeslaSectionStat[];
  readonly showArrow?: boolean;
  readonly className?: string;
  readonly children?: ReactNode;
};

const renderCTA = (cta: TeslaCallToAction, index: number) => {
  const className = clsx("tesla-section__cta", {
    "tesla-section__cta--primary": cta.variant !== "secondary"
  });

  if (cta.href) {
    return (
      <a
        key={`${cta.label}-${index}`}
        className={className}
        href={cta.href}
      >
        {cta.label}
      </a>
    );
  }

  return (
    <button
      key={`${cta.label}-${index}`}
      type="button"
      className={className}
      onClick={cta.onClick}
    >
      {cta.label}
    </button>
  );
};

const renderDescription = (
  description?: ReactNode,
  linkLabel?: string,
  linkHref?: string
) => {
  if (!description && !linkLabel) {
    return null;
  }

  return (
    <p className="tesla-section__description">
      {description}
      {linkLabel && (
        <a href={linkHref ?? "#"}>
          {" "}
          {linkLabel}
        </a>
      )}
    </p>
  );
};

const renderStats = (stats?: TeslaSectionStat[]) => {
  if (!stats?.length) {
    return null;
  }

  return (
    <div className="tesla-section__stats">
      {stats.map((stat) => (
        <div key={stat.label}>
          <div className="tesla-section__stat-value">{stat.value}</div>
          <div className="tesla-section__stat-label">{stat.label}</div>
          {stat.helper && (
            <div className="tesla-section__stat-helper">{stat.helper}</div>
          )}
        </div>
      ))}
    </div>
  );
};

type CSSVariableStyle = CSSProperties & Record<string, string>;

export const TeslaSection = ({
  title,
  eyebrow,
  description,
  linkHref,
  linkLabel,
  backgroundImage,
  ctas,
  stats,
  showArrow = false,
  className,
  children
}: TeslaSectionProperties) => {
  const backgroundStyle: CSSVariableStyle | undefined = backgroundImage
    ? {
        "--tesla-section-bg-image": `url(${backgroundImage})`
      }
    : undefined;

  return (
    <section className={clsx("tesla-section", className)} style={backgroundStyle}>
      <div className="tesla-section__top">
        {eyebrow && <p className="tesla-section__eyebrow">{eyebrow}</p>}
        <h2 className="tesla-section__title">{title}</h2>
        {renderDescription(description, linkLabel, linkHref)}
      </div>

      <div>
        {ctas?.length ? (
          <div className="tesla-section__ctas">
            {ctas.map((cta, index) => renderCTA(cta, index))}
          </div>
        ) : null}
        {renderStats(stats)}
        {children}
        {showArrow && <div className="tesla-section__arrow" />}
      </div>
    </section>
  );
};

export default TeslaSection;
