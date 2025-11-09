import { describe, expect, it } from "vitest";
import { getCatalogModules, getSpritesForModule } from "./catalog";

describe("catalog data fallback", () => {
  it("exposes Tesla-style modules even without DATABASE_URL", async () => {
    const modules = await getCatalogModules();
    expect(modules.length).toBeGreaterThan(0);

    const module = modules[0];
    expect(module.finishes.length).toBeGreaterThan(0);

    const sprites = await getSpritesForModule(module.id);
    expect(sprites.length).toBeGreaterThan(0);
  });
});
