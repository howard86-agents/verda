import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/client";

// Re-export the generated row types so callers can import them
// directly from `@verda/database` alongside the runtime `prisma`
// client. We avoid an `index.ts` barrel because the project's
// `noBarrelFile` lint rule discourages re-export-only files.
export type {
  $Enums,
  Article,
  AuditLog,
  MemberProfile,
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
const connectionString =
  process.env.DATABASE_URL ??
  "postgresql://placeholder@localhost:5432/placeholder";

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
