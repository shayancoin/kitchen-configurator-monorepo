import { database, hasDatabaseConnection, ModuleCategory, Prisma } from "..";

const spriteBucket = process.env.SEED_SPRITE_BUCKET ?? "parviz-dev-assets";
const heroBase =
  process.env.SEED_HERO_BASE ?? "https://images.unsplash.com/photo-1513105737059-ff0cf0580e94";

const sprite = (
  moduleId: string,
  sortOrder: number,
  objectKey: string,
  width = 3840,
  height = 2160,
  variant = "base"
): Prisma.ModuleSpriteCreateWithoutModuleInput => ({
  id: `sprite-${moduleId}-${sortOrder}-${variant}`,
  sortOrder,
  bucket: spriteBucket,
  objectKey,
  width,
  height,
  variant
});

type SeedModule = {
  id: string;
  sku: string;
  name: string;
  summary: string;
  heroImageUrl: string;
  basePrice: number;
  category: ModuleCategory;
  finishes: Prisma.CatalogFinishCreateWithoutModuleInput[];
  sprites: Prisma.ModuleSpriteCreateWithoutModuleInput[];
};

const hero = (suffix: string) => `${heroBase}&w=1600&q=90&sig=${suffix}`;

const modules: SeedModule[] = [
  {
    id: "mod-galley-s",
    sku: "PVZ-GAL-S",
    name: "Galley S Performance",
    summary:
      "Dual-run layout tuned for AI-optimized prep workflows with hot-swappable inserts.",
    heroImageUrl: hero(1),
    basePrice: 52000,
    category: ModuleCategory.GALLEY,
    finishes: [
      {
        id: "finish-graphite",
        label: "Graphite Matte",
        helper: "NanoShield + anti-smudge",
        costDelta: 2400,
        leadTimeWeeks: 8,
        swatchAssetUrl: "swatches/graphite.png"
      },
      {
        id: "finish-polar",
        label: "Polar Satin",
        helper: "High reflectance | LRV 72",
        costDelta: 3100,
        leadTimeWeeks: 9,
        swatchAssetUrl: "swatches/polar.png"
      }
    ],
    sprites: [
      sprite("mod-galley-s", 10, "sprites/galley-s/base.png"),
      sprite("mod-galley-s", 20, "sprites/galley-s/highlight.png", 3840, 2160, "highlight")
    ]
  },
  {
    id: "mod-island-performance",
    sku: "PVZ-ISL-P",
    name: "Island Performance",
    summary: "Cantilevered island with integrated induction slab and hidden prep sinks.",
    heroImageUrl: hero(2),
    basePrice: 64800,
    category: ModuleCategory.ISLAND,
    finishes: [
      {
        id: "finish-terra",
        label: "Terra Walnut",
        helper: "Book-matched veneer",
        costDelta: 4900,
        leadTimeWeeks: 12,
        swatchAssetUrl: "swatches/terra.png"
      },
      {
        id: "finish-haze",
        label: "Haze Ceramic",
        helper: "Thermal shock resistant",
        costDelta: 2800,
        leadTimeWeeks: 10,
        swatchAssetUrl: "swatches/haze.png"
      }
    ],
    sprites: [
      sprite("mod-island-performance", 10, "sprites/island/base.png"),
      sprite(
        "mod-island-performance",
        30,
        "sprites/island/lighting.png",
        3840,
        2160,
        "lighting"
      )
    ]
  },
  {
    id: "mod-luxe-ai",
    sku: "PVZ-LUX-AI",
    name: "Luxe AI Studio",
    summary:
      "Tesla-inspired control wall with AI choreography for storage, hardware, and sensing.",
    heroImageUrl: hero(3),
    basePrice: 81200,
    category: ModuleCategory.L_SHAPE,
    finishes: [
      {
        id: "finish-carbon",
        label: "Carbon Fiber Hybrid",
        helper: "Directional weave",
        costDelta: 6200,
        leadTimeWeeks: 13,
        swatchAssetUrl: "swatches/carbon.png"
      },
      {
        id: "finish-stone",
        label: "Stone Mist",
        helper: "Calcium-silicate composite",
        costDelta: 3500,
        leadTimeWeeks: 9,
        swatchAssetUrl: "swatches/stone.png"
      }
    ],
    sprites: [
      sprite("mod-luxe-ai", 10, "sprites/luxe/base.png"),
      sprite("mod-luxe-ai", 40, "sprites/luxe/ambient.png", 3840, 2160, "ambient")
    ]
  }
];

const seed = async () => {
  if (!hasDatabaseConnection || !database) {
    console.warn("[database] skipping seed: DATABASE_URL is not configured");
    return;
  }

  for (const entry of modules) {
    await database.catalogModule.upsert({
      where: { id: entry.id },
      update: {
        name: entry.name,
        summary: entry.summary,
        heroImageUrl: entry.heroImageUrl,
        basePrice: entry.basePrice,
        category: entry.category,
        finishes: {
          deleteMany: {},
          create: entry.finishes
        },
        sprites: {
          deleteMany: {},
          create: entry.sprites
        }
      },
      create: {
        ...entry,
        finishes: { create: entry.finishes },
        sprites: { create: entry.sprites }
      }
    });
  }

  console.info(`[database] upserted ${modules.length} catalog modules`);
};

seed()
  .catch((error) => {
    console.error("[database] seed failed", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await database?.$disconnect();
  });
