export type TeslaComponentPropContract = {
  readonly required: string[];
  readonly optional: string[];
  readonly events?: string[];
  readonly slots?: string[];
};

export type TeslaComponentContracts = {
  readonly header: TeslaComponentPropContract;
  readonly section: TeslaComponentPropContract;
  readonly configuratorPanel: TeslaComponentPropContract;
};

/**
 * Defines the default property, event, and slot contracts for Tesla UI components.
 *
 * This object specifies, for each component, the required and optional props,
 * supported events, and available slots. It is used for runtime validation
 * and as a source of truth for TypeScript type checking, ensuring that
 * components are used consistently and correctly throughout the application.
 *
 * @see TeslaComponentContracts
 */
export const defaultComponentContracts = Object.freeze({
  header: {
    required: ["brand"],
    optional: ["navLinks", "actions", "className", "menuLabel"],
    events: ["onMenuToggle"],
    slots: ["brand", "navLinks", "actions"]
  },
  section: {
    required: ["title"],
    optional: [
      "eyebrow",
      "description",
      "linkLabel",
      "linkHref",
      "backgroundImage",
      "ctas",
      "stats",
      "showArrow",
      "className"
    ],
    slots: ["stats", "ctas"]
  },
  configuratorPanel: {
    required: ["sections"],
    optional: [
      "title",
      "subtitle",
      "priceSummary",
      "footer",
      "className",
      "onSelectOption"
    ],
    events: ["onSelectOption(sectionId, optionId)"],
    slots: ["footer"]
  }
}) satisfies TeslaComponentContracts;
