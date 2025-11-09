import clsx from "clsx";
import type { ReactNode } from "react";
import type {
  TeslaConfiguratorSection,
  TeslaConfiguratorSelectionHandler
} from "./types";

export type TeslaConfiguratorPanelProperties = {
  readonly sections: TeslaConfiguratorSection[];
  readonly title?: string;
  readonly subtitle?: ReactNode;
  readonly priceSummary?: {
    readonly label: string;
    readonly value: string;
    readonly helper?: string;
  };
  readonly footer?: ReactNode;
  readonly className?: string;
  readonly onSelectOption?: TeslaConfiguratorSelectionHandler;
};

const renderSection = (
  section: TeslaConfiguratorSection,
  onSelect?: TeslaConfiguratorSelectionHandler
) => {
  if (!section.options.length) {
    return null;
  }

  return (
    <section key={section.id} className="tesla-config-panel__section">
      <header className="tesla-config-panel__section-header">
        <div>
          <p className="tesla-config-panel__section-eyebrow">{section.subtitle}</p>
          <h3 className="tesla-config-panel__section-title">{section.title}</h3>
        </div>
        {section.aside && (
          <div className="tesla-config-panel__section-aside">{section.aside}</div>
        )}
      </header>
      <p className="tesla-config-panel__section-description">
        {section.description}
      </p>

      <div
        className={clsx("tesla-config-panel__option-grid", {
          "tesla-config-panel__option-grid--columns-3": section.layout === "grid",
          "tesla-config-panel__option-grid--one": section.layout === "single"
        })}
      >
        {section.options.map((option) => (
          <button
            key={`${section.id}-${option.id}`}
            type="button"
            className={clsx("tesla-config-panel__option", {
              "tesla-config-panel__option--active": option.active,
              "tesla-config-panel__option--disabled": option.disabled
            })}
            disabled={option.disabled}
            onClick={() => onSelect?.(section.id, option.id)}
          >
            <div>
              <p className="tesla-config-panel__option-label">{option.label}</p>
              {option.helper && (
                <span className="tesla-config-panel__option-helper">
                  {option.helper}
                </span>
              )}
            </div>
            <div className="tesla-config-panel__option-meta">
              {option.priceDelta && (
                <span className="tesla-config-panel__option-price">
                  {option.priceDelta}
                </span>
              )}
              {option.badge && (
                <span className="tesla-config-panel__option-badge">
                  {option.badge}
                </span>
              )}
            </div>
          </button>
        ))}
      </div>
    </section>
  );
};

export const TeslaConfiguratorPanel = ({
  sections,
  title = "Configuration",
  subtitle = "Tesla-inspired controls",
  priceSummary,
  footer,
  className,
  onSelectOption
}: TeslaConfiguratorPanelProperties) => (
  <aside className={clsx("tesla-config-panel", className)}>
    <header className="tesla-config-panel__header">
      <div>
        <p className="tesla-config-panel__eyebrow">{subtitle}</p>
        <h2 className="tesla-config-panel__title">{title}</h2>
      </div>
      {priceSummary && (
        <div className="tesla-config-panel__price-summary">
          <p className="tesla-config-panel__price-label">{priceSummary.label}</p>
          <p className="tesla-config-panel__price-value">{priceSummary.value}</p>
          {priceSummary.helper && (
            <p className="tesla-config-panel__price-helper">
              {priceSummary.helper}
            </p>
          )}
        </div>
      )}
    </header>

    <div className="tesla-config-panel__sections">
      {sections.map((section) => renderSection(section, onSelectOption))}
    </div>

    {footer && <div className="tesla-config-panel__footer">{footer}</div>}
  </aside>
);

export default TeslaConfiguratorPanel;
