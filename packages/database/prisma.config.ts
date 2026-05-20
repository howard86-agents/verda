import "dotenv/config";
import { defineConfig } from "prisma/config";

// DATABASE_URL is required for migrate/push/studio at runtime, but not for
// `prisma generate` (which only reads the schema). A placeholder keeps
// generate runnable in CI and on fresh checkouts so typecheck can succeed
// without a provisioned database; commands that actually hit the DB will
// fail loudly at connection time if the real URL is missing.
const databaseUrl =
  process.env.DATABASE_URL ??
  "postgresql://placeholder@localhost:5432/placeholder";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: databaseUrl,
  },
});
