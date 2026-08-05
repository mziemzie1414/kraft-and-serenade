import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    // The CLI needs DDL and advisory locks, which Supabase's transaction
    // pooler (port 6543) does not support. Point it at the session pooler.
    url: process.env["MIGRATE_DATABASE_URL"] ?? process.env["DATABASE_URL"],
  },
});
