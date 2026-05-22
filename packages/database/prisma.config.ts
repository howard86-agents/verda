import "dotenv/config";
import { defineConfig } from "prisma/config";

// Two-URL Supavisor shape (issue #126):
// - DATABASE_URL is the pooled connection used by the runtime client
//   (PrismaPg adapter in `src/client.ts`).
// - DIRECT_URL is the direct, non-pooled connection used by the Prisma
//   CLI (`migrate`, `db push`). Locally both URLs point at the same
//   docker-compose Postgres; in production they map onto Supabase
//   Supavisor's :6543 (pooled) and :5432 (direct) respectively.
//
// `prisma generate` only reads the schema, not a real DB, so a
// placeholder URL keeps generate runnable in CI and on fresh checkouts
// without a provisioned database. Migrate/push commands fail loudly at
// connection time if the real URL is missing.
const directUrl =
  process.env.DIRECT_URL ??
  process.env.DATABASE_URL ??
  "postgresql://placeholder@localhost:5432/placeholder";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: directUrl,
  },
});
