import { Prisma } from "./generated/client";
import { database, hasDatabaseConnection } from "./index";

type UpsertEmbeddingInput = {
  configurationId: string;
  embedding: number[];
  similarityThreshold?: number;
};

type NearestEmbedding = {
  configurationId: string;
  distance: number;
};

const toVectorLiteral = (embedding: number[]) =>
  Prisma.sql`[${Prisma.join(embedding.map((value) => Prisma.sql`${value}`))}]`;

export const upsertDesignEmbedding = async ({
  configurationId,
  embedding,
  similarityThreshold = 0.85
}: UpsertEmbeddingInput): Promise<void> => {
  if (!hasDatabaseConnection || !database) {
    throw new Error("DATABASE_URL is not configured; cannot upsert embeddings");
  }

  const vector = toVectorLiteral(embedding);

  await database.$executeRaw(
    Prisma.sql`
      INSERT INTO "DesignEmbedding" ("configurationId", "embedding", "dimensions", "similarityThreshold")
      VALUES (${configurationId}, ${vector}::vector, ${embedding.length}, ${similarityThreshold})
      ON CONFLICT ("configurationId") DO UPDATE
      SET "embedding" = EXCLUDED."embedding",
          "dimensions" = EXCLUDED."dimensions",
          "similarityThreshold" = EXCLUDED."similarityThreshold"
    `
  );
};

export const findNearestEmbeddings = async (
  embedding: number[],
  limit = 5
): Promise<NearestEmbedding[]> => {
  if (!hasDatabaseConnection || !database) {
    return [];
  }

  const vector = toVectorLiteral(embedding);

  const rows = await database.$queryRaw<NearestEmbedding[]>(
    Prisma.sql`
      SELECT "configurationId",
             (embedding <=> ${vector}::vector) AS distance
      FROM "DesignEmbedding"
      ORDER BY embedding <=> ${vector}::vector
      LIMIT ${limit}
    `
  );

  return rows;
};
