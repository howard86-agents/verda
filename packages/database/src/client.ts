import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/client";

// Re-export the generated row types so callers can import them
// directly from `@verda/database` alongside the runtime `prisma`
// client. We avoid an `index.ts` barrel because the project's
// `noBarrelFile` lint rule discourages re-export-only files.
export type {
  $Enums,
  Article,
  ArticleVersion,
  Prisma,
  Section,
  User,
} from "../generated/client";

// Pass the connection string directly to PrismaPg rather than a
// pre-constructed `pg.Pool` instance. The adapter ships its own pinned
// `pg` and uses an `instanceof Pool` check; if the host package
// resolves a different `pg` minor (which Bun's hoisting can do in a
// monorepo), the instance check misses and the adapter mistyped the
// pool object as a config bag, blowing up at connect time. The string
// form sidesteps the version-skew failure mode entirely while still
// letting the adapter own the Pool's lifecycle.
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

const connectionString = normalizeDatabaseUrl(
  process.env.DATABASE_URL ??
    "postgresql://placeholder@localhost:5432/placeholder"
);

const adapter = new PrismaPg({ connectionString });

const globalForPrisma = global as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter,
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
