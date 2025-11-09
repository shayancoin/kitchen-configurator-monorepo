import { describe, expect, it } from "vitest";
import {
  getCatalogModules,
  getSpritesForModule
} from "@gateway/data/catalog";
import { buildPricingEstimate } from "@gateway/data/pricing";

describe("full fusion smoke", () => {
  it("walks catalog → pricing → sprites", async () => {
    const modules = await getCatalogModules();
    expect(modules.length).toBeGreaterThan(0);

    const module = modules[0];
    const finish = module.finishes[0];
    expect(finish).toBeDefined();

    const quote = await buildPricingEstimate(module.id, finish.id);
    expect(quote.total).toBeGreaterThan(quote.subtotal);

    const sprites = await getSpritesForModule(module.id, "base");
    expect(sprites.length).toBeGreaterThan(0);
  });
});
