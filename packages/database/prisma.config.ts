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
const DATABASE_URL_SCHEME_RE = /^([a-z][a-z0-9+.-]*:\/\/)/i;

function normalizeDatabaseUrl(rawUrl: string): string {
  try {
    new URL(rawUrl);
    return rawUrl;
  } catch {
    const schemeMatch = rawUrl.match(DATABASE_URL_SCHEME_RE);
    const at = rawUrl.lastIndexOf("@");
    if (!schemeMatch || at < schemeMatch[1].length) {
      return rawUrl;
    }

    const scheme = schemeMatch[1];
    const credentials = rawUrl.slice(scheme.length, at);
    const hostAndPath = rawUrl.slice(at + 1);
    const separator = credentials.indexOf(":");
    const username =
      separator >= 0 ? credentials.slice(0, separator) : credentials;
    const password = separator >= 0 ? credentials.slice(separator + 1) : "";

    return `${scheme}${encodeURIComponent(username)}${
      separator >= 0 ? `:${encodeURIComponent(password)}` : ""
    }@${hostAndPath}`;
  }
}

const directUrl = normalizeDatabaseUrl(
  process.env.DIRECT_URL ??
    process.env.DATABASE_URL ??
    "postgresql://placeholder@localhost:5432/placeholder"
);

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: directUrl,
  },
});
