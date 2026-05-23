/**
 * GET /api/growth — grow page state aggregator (issue #132).
 *
 * Reads everything the `/grow` page needs in a single round trip:
 *   - growth items (with redemption metadata)
 *   - growth rules + the configured cap
 *   - the most recent five point-ledger entries
 *   - consecutive-day streak derived from the behavior log
 *
 * The Dexie store the in-browser app uses surfaces these via five
 * separate React Query hooks. Folding the read into one Postgres
 * round trip keeps the public API minimal and avoids fan-out from
 * the page; the response shape is what the (refactored) `/grow`
 * page consumes directly.
 */
import { prisma } from "@verda/database";
import { NextResponse } from "next/server";
import { computeStreak } from "@/lib/streak";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function iso(date: Date | null | undefined): string | undefined {
  return date ? date.toISOString() : undefined;
}

export async function GET(request: Request): Promise<Response> {
  const url = new URL(request.url);
  // Accept either `memberId` (the legacy reader UI vocabulary) or
  // `userId` (the schema vocabulary) so we don't need to thread a
  // rename through every component at once.
  const userId =
    url.searchParams.get("memberId") ?? url.searchParams.get("userId");

  if (!userId) {
    return NextResponse.json({ error: "memberId required" }, { status: 400 });
  }

  const [items, rules, config, ledger, behaviorLogs] = await Promise.all([
    prisma.growthItem.findMany({
      where: { userId },
      include: { redemption: true },
      orderBy: { sequence: "asc" },
    }),
    prisma.growthRule.findMany({ orderBy: { level: "asc" } }),
    prisma.growthConfig.findUnique({ where: { id: "default" } }),
    prisma.pointLedgerEntry.findMany({
      where: { userId },
      orderBy: { id: "desc" },
      take: 5,
    }),
    prisma.behaviorLog.findMany({
      where: { userId },
      orderBy: { createdAt: "asc" },
    }),
  ]);

  return NextResponse.json({
    ok: true,
    items: items.map((item) => ({
      id: item.id,
      memberId: item.userId,
      nutrients: item.nutrients,
      level: item.level,
      sequence: item.sequence,
      completedAt: iso(item.completedAt),
      redeemedAt: iso(item.redeemedAt ?? item.redemption?.createdAt ?? null),
      redemptionId: item.redemptionId ?? item.redemption?.id ?? undefined,
      createdAt: item.createdAt.toISOString(),
    })),
    rules: rules.map((rule) => ({
      level: rule.level,
      name: rule.name,
      jp: rule.jp,
      threshold: rule.threshold,
    })),
    cap: config?.maxItemsPerMember ?? 3,
    ledger: ledger.map((entry) => ({
      id: entry.id,
      memberId: entry.userId,
      amount: entry.amount,
      balanceAfter: entry.balanceAfter,
      reason: entry.reason,
      createdAt: entry.createdAt.toISOString(),
    })),
    streak: computeStreak(
      behaviorLogs.map((log) => ({
        id: log.id,
        memberId: log.userId,
        action: log.action,
        articleId: log.articleId ?? undefined,
        createdAt: log.createdAt.toISOString(),
      }))
    ),
  });
}
