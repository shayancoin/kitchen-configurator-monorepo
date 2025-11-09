import type { SpriteLayerDTO } from "@repo/shared-sdl";
import {
  getCatalogModules,
  getCatalogModuleById,
  getSpritesForModule
} from "../data/catalog";
import { buildPricingEstimate } from "../data/pricing";

type ResolverContext = {
  readonly requestId: string;
};

export const resolvers = {
  Query: {
    catalogModules: async () => getCatalogModules(),
    catalogModule: async (
      _: unknown,
      args: { readonly id: string }
    ) => getCatalogModuleById(args.id),
    catalogSprites: async (
      _: unknown,
      args: { readonly moduleId: string; readonly variant?: string | null }
    ) => getSpritesForModule(args.moduleId, args.variant),
    pricingEstimate: async (
      _: unknown,
      args: { readonly moduleId: string; readonly finishId: string }
    ) => buildPricingEstimate(args.moduleId, args.finishId)
  },
  PricingQuote: {
    module: (quote: { moduleId: string }) => getCatalogModuleById(quote.moduleId),
    adjustments: (quote: { adjustments: unknown[] }) => quote.adjustments
  },
  CatalogModule: {
    spriteLayers: (
      module: { spriteLayers?: SpriteLayerDTO[] },
      args: { readonly variant?: string | null }
    ) => {
      if (!Array.isArray(module.spriteLayers)) {
        return [];
      }

      const variant = args?.variant ?? null;
      if (!variant) {
        return module.spriteLayers;
      }

      return module.spriteLayers.filter((layer) => layer.variant === variant);
    }
  }
};

export type { ResolverContext };
