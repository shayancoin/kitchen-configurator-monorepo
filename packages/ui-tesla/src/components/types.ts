import type { MouseEventHandler, ReactNode } from "react";

export type TeslaNavLink = {
  readonly label: string;
  readonly href?: string;
  readonly active?: boolean;
};

export type TeslaHeaderAction = {
  readonly label: string;
  readonly href?: string;
  readonly onClick?: MouseEventHandler<HTMLButtonElement | HTMLAnchorElement>;
  readonly accent?: boolean;
};

export type TeslaCallToAction = {
  readonly label: string;
  readonly href?: string;
  readonly variant?: "primary" | "secondary";
  readonly onClick?: MouseEventHandler<HTMLButtonElement | HTMLAnchorElement>;
};

export type TeslaSectionStat = {
  readonly label: string;
  readonly value: string;
  readonly helper?: string;
};

export type TeslaConfiguratorSectionOption = {
  readonly id: string;
  readonly label: string;
  readonly helper?: string;
  readonly priceDelta?: string;
  readonly badge?: string;
  readonly active?: boolean;
  readonly disabled?: boolean;
};

export type TeslaConfiguratorSection = {
  readonly id: string;
  readonly title: string;
  readonly subtitle?: string;
  readonly description?: ReactNode;
  readonly options: TeslaConfiguratorSectionOption[];
  readonly layout?: "grid" | "single";
  readonly aside?: ReactNode;
};

export type TeslaConfiguratorSelectionHandler = (
  sectionId: string,
  optionId: string
) => void;

export type ReactChild = ReactNode;
