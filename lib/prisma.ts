import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "./generated/prisma/client";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is not set.");
}

function createPrismaClient() {
  return new PrismaClient({
    adapter: new PrismaPg({
      connectionString,
      // Supabase's transaction pooler already multiplexes connections, so keep
      // the per-instance pool small. Prepared statements stay uncached (the
      // adapter default), which is what transaction-mode pooling requires.
      max: 3,
    }),
  });
}

/**
 * Reuse one client across hot reloads in development, otherwise every edit
 * opens a new pool and Supabase starts refusing connections.
 */
const globalForPrisma = globalThis as unknown as {
  prisma?: ReturnType<typeof createPrismaClient>;
};

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
