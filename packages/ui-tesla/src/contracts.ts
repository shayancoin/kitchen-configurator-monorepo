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
