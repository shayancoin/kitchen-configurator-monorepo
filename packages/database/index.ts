import "server-only";

import { neonConfig } from "@neondatabase/serverless";
import { PrismaNeon } from "@prisma/adapter-neon";
import ws from "ws";
import { PrismaClient } from "./generated/client";
import { keys } from "./keys";

type GlobalPrisma = typeof globalThis & {
  __PRISMA__?: PrismaClient | null;
};

const globalTarget = globalThis as GlobalPrisma;

const env = keys();

const shouldUseNeon = env.DATABASE_URL?.includes("neon.tech");

if (shouldUseNeon) {
  neonConfig.webSocketConstructor = ws;
}

const instantiate = (): PrismaClient | null => {
  if (!env.DATABASE_URL) {
    return null;
  }

  if (shouldUseNeon) {
    const adapter = new PrismaNeon({
      connectionString: env.DATABASE_URL
    });
    return new PrismaClient({ adapter });
  }

  return new PrismaClient();
};

if (globalTarget.__PRISMA__ === undefined) {
  globalTarget.__PRISMA__ = instantiate();
}

export const database = globalTarget.__PRISMA__ ?? null;
export const hasDatabaseConnection = Boolean(database);

if (database && process.env.NODE_ENV !== "production") {
  globalTarget.__PRISMA__ = database;
}

export * from "./generated/client";
export * from "./vector";
