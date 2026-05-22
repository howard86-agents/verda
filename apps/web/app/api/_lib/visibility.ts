import type { Prisma } from "@verda/database";

/**
 * Shared public-visibility predicate (issue #129).
 *
 * An article is publicly visible when:
 * - status = 'published', OR
 * - status = 'scheduled' AND scheduledAt <= now()
 *
 * Encodes the query-time promotion so scheduled articles become
 * visible the moment their time passes — no cron required.
 */
export function publicVisibilityWhere(): Prisma.ArticleWhereInput {
  return {
    OR: [
      { status: "published" },
      { status: "scheduled", scheduledAt: { lte: new Date() } },
    ],
  };
}
