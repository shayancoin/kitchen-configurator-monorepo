import fs from "fs";
import path from "path";
import type { DocumentNode } from "graphql";
import { gql } from "graphql-tag";

const schemaPath = path.join(__dirname, "schema.graphql");

export const rawSDL = fs.readFileSync(schemaPath, "utf8");
export const typeDefs: DocumentNode = gql(rawSDL);

export type FinishOptionDTO = {
  readonly id: string;
  readonly label: string;
  readonly costDelta: number;
  readonly leadTimeWeeks: number;
  readonly helper?: string | null;
  readonly swatchAssetUrl?: string | null;
};

export type SpriteLayerDTO = {
  readonly id: string;
  readonly variant: string;
  readonly sortOrder: number;
  readonly bucket: string;
  readonly objectKey: string;
  readonly width: number;
  readonly height: number;
  readonly url?: string | null;
};

export type CatalogModuleDTO = {
  readonly id: string;
  readonly sku: string;
  readonly name: string;
  readonly category: string;
  readonly basePrice: number;
  readonly summary?: string | null;
  readonly heroImageUrl?: string | null;
  readonly finishes: FinishOptionDTO[];
  readonly spriteLayers: SpriteLayerDTO[];
};

export type PricingLineDTO = {
  readonly label: string;
  readonly amount: number;
};

export type PricingQuoteDTO = {
  readonly id: string;
  readonly moduleId: string;
  readonly finishId: string;
  readonly subtotal: number;
  readonly adjustments: PricingLineDTO[];
  readonly total: number;
  readonly currency: string;
  readonly leadTimeWeeks: number;
};
