import clsx from "clsx";
import type { ReactNode } from "react";
import type { TeslaHeaderAction, TeslaNavLink } from "./types";

export type TeslaHeaderProperties = {
  readonly brand?: ReactNode;
  readonly navLinks?: TeslaNavLink[];
  readonly actions?: TeslaHeaderAction[];
  readonly className?: string;
  readonly menuLabel?: string;
  readonly onMenuToggle?: () => void;
};

const renderAction = (action: TeslaHeaderAction, index: number) => {
  const props = {
    key: `${action.label}-${index}`,
    className: clsx("tesla-header__action", {
      "tesla-header__action--accent": action.accent
    })
  };

  if (action.href) {
    return (
      <a {...props} href={action.href}>
        {action.label}
      </a>
    );
  }

  return (
    <button
      {...props}
      type="button"
      onClick={action.onClick}
      aria-label={action.label}
    >
      {action.label}
    </button>
  );
};

export const TeslaHeader = ({
  brand = "PARVIZ",
  navLinks = [],
  actions = [],
  className,
  menuLabel = "Menu",
  onMenuToggle
}: TeslaHeaderProperties) => (
  <header className={clsx("tesla-header", className)}>
    <div className="tesla-header__brand">{brand}</div>
    <nav className="tesla-header__nav" aria-label="Primary">
      {navLinks.map((link) => (
        <a
          key={link.label}
          className={clsx("tesla-header__nav-link", {
            "tesla-header__nav-link--active": link.active
          })}
          href={link.href ?? "#"}
        >
          {link.label}
        </a>
      ))}
    </nav>
    <div className="tesla-header__actions">
      {actions.map((action, index) => renderAction(action, index))}
    </div>
    <button
      className="tesla-header__menu"
      type="button"
      onClick={onMenuToggle}
    >
      {menuLabel}
      <span aria-hidden>≡</span>
    </button>
  </header>
);

export default TeslaHeader;
