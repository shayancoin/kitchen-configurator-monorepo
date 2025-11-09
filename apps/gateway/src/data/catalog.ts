import type { CatalogModuleDTO, SpriteLayerDTO } from "@repo/shared-sdl";
import { memoize } from "@repo/cache";
import { buildObjectUrl } from "@repo/storage";
import {
  database,
  hasDatabaseConnection,
  type Prisma,
  ModuleCategory
} from "@repo/database";

const spriteUrl = (key: string, bucket: string) =>
  buildObjectUrl(key, { bucket }) ?? `https://${bucket}.s3.amazonaws.com/${key}`;

const fallbackSprite = (
  moduleId: string,
  sortOrder: number,
  objectKey: string,
  bucket = "parviz-dev-assets",
  variant = "base"
): SpriteLayerDTO => ({
  id: `fallback-${moduleId}-${sortOrder}-${variant}`,
  variant,
  sortOrder,
  bucket,
  objectKey,
  width: 3840,
  height: 2160,
  url: spriteUrl(objectKey, bucket)
});

const fallbackCatalog: CatalogModuleDTO[] = [
  {
    id: "mod-galley-s",
    sku: "PVZ-GAL-S",
    name: "Galley S Performance",
    category: ModuleCategory.GALLEY,
    basePrice: 52000,
    summary:
      "Dual-run layout tuned for AI-optimized prep workflows with hot-swappable inserts.",
    heroImageUrl:
      "https://images.unsplash.com/photo-1513105737059-ff0cf0580e94?auto=format&fit=crop&w=1600&q=90",
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
    spriteLayers: [
      fallbackSprite("mod-galley-s", 10, "sprites/galley-s/base.png"),
      fallbackSprite("mod-galley-s", 20, "sprites/galley-s/highlight.png", "parviz-dev-assets", "highlight")
    ]
  },
  {
    id: "mod-island-performance",
    sku: "PVZ-ISL-P",
    name: "Island Performance",
    category: ModuleCategory.ISLAND,
    basePrice: 64800,
    summary: "Cantilevered island with integrated induction slab and hidden prep sinks.",
    heroImageUrl:
      "https://images.unsplash.com/photo-1505691938895-1758d7feb511?auto=format&fit=crop&w=1600&q=90",
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
    spriteLayers: [
      fallbackSprite("mod-island-performance", 10, "sprites/island/base.png"),
      fallbackSprite(
        "mod-island-performance",
        30,
        "sprites/island/lighting.png",
        "parviz-dev-assets",
        "lighting"
      )
    ]
  },
  {
    id: "mod-luxe-ai",
    sku: "PVZ-LUX-AI",
    name: "Luxe AI Studio",
    category: ModuleCategory.L_SHAPE,
    basePrice: 81200,
    summary:
      "Tesla-inspired control wall with AI choreography for storage, hardware, and sensing.",
    heroImageUrl:
      "https://images.unsplash.com/photo-1505691938895-1758d7feb511?auto=format&fit=crop&w=1600&q=90",
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
    spriteLayers: [
      fallbackSprite("mod-luxe-ai", 10, "sprites/luxe/base.png"),
      fallbackSprite("mod-luxe-ai", 40, "sprites/luxe/ambient.png", "parviz-dev-assets", "ambient")
    ]
  }
];

const include = {
  finishes: true,
  sprites: {
    orderBy: { sortOrder: "asc" }
  }
} satisfies Prisma.CatalogModuleInclude;

type ModuleRecord = Prisma.CatalogModuleGetPayload<{ include: typeof include }>;

const fromRecord = (record: ModuleRecord): CatalogModuleDTO => ({
  id: record.id,
  sku: record.sku,
  name: record.name,
  category: record.category,
  summary: record.summary,
  heroImageUrl: record.heroImageUrl,
  basePrice: record.basePrice,
  finishes: record.finishes.map((finish) => ({
    id: finish.id,
    label: finish.label,
    helper: finish.helper,
    costDelta: finish.costDelta,
    leadTimeWeeks: finish.leadTimeWeeks,
    swatchAssetUrl: finish.swatchAssetUrl
  })),
  spriteLayers: record.sprites.map((layer) => ({
    id: layer.id,
    variant: layer.variant,
    sortOrder: layer.sortOrder,
    bucket: layer.bucket,
    objectKey: layer.objectKey,
    width: layer.width,
    height: layer.height,
    url: spriteUrl(layer.objectKey, layer.bucket)
  }))
});

const fetchCatalog = async (): Promise<CatalogModuleDTO[]> => {
  if (!hasDatabaseConnection || !database) {
    return fallbackCatalog;
  }

  try {
    const modules = await database.catalogModule.findMany({
      include,
      orderBy: { name: "asc" }
    });

    if (!modules.length) {
      return fallbackCatalog;
    }

    return modules.map(fromRecord);
  } catch (error) {
    console.warn("[catalog] falling back to seed data", error);
    return fallbackCatalog;
  }
};

export const getCatalogModules = async (): Promise<CatalogModuleDTO[]> =>
  memoize("catalog", { key: "modules", ttlSeconds: 60 }, fetchCatalog);

export const getCatalogModuleById = async (
  id: string
): Promise<CatalogModuleDTO | null> => {
  const modules = await getCatalogModules();
  return modules.find((module) => module.id === id) ?? null;
};

export const getSpritesForModule = async (
  moduleId: string,
  variant?: string | null
): Promise<SpriteLayerDTO[]> => {
  const module = await getCatalogModuleById(moduleId);
  if (!module) {
    return [];
  }

  if (!variant) {
    return module.spriteLayers;
  }

  return module.spriteLayers.filter((layer) => layer.variant === variant);
};
