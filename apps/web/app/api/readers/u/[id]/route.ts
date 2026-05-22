import { BADGE_CATALOG } from "@verda/data";
import { prisma } from "@verda/database";
import { NextResponse } from "next/server";

// Public reader profile (issue #139).
// GET /api/readers/u/:id — privacy-filtered public profile.
// Exposes: displayName, joined, initial, active growth item,
// approved submissions, earned badges.
// Never exposes: email, point ledger, behavior logs.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(
  _request: Request,
  context: RouteContext
): Promise<Response> {
  const { id: userId } = await context.params;

  const profile = await prisma.memberProfile.findUnique({
    where: { userId },
  });

  if (!profile) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Active growth item (incomplete, most recent)
  const activeGrowthItem = await prisma.growthItem.findFirst({
    where: { userId, completedAt: null },
    orderBy: { sequence: "desc" },
    select: { level: true, nutrients: true, sequence: true },
  });

  // Approved submissions
  const submissions = await prisma.article.findMany({
    where: {
      submittedBy: userId,
      status: "published",
      kind: { in: ["submission", "repost", "remix"] },
    },
    select: { slug: true, title: true, kind: true, date: true },
    orderBy: { publishedAt: "desc" },
    take: 10,
  });

  // Earned badges
  const ownedBadges = await prisma.memberBadge.findMany({
    where: { userId },
    select: { badgeId: true, createdAt: true },
  });
  const ownedIds = new Set(ownedBadges.map((b) => b.badgeId));
  const badges = BADGE_CATALOG.filter((b) => ownedIds.has(b.id)).map((b) => ({
    id: b.id,
    name: b.name,
    icon: b.icon,
  }));

  return NextResponse.json({
    displayName: profile.displayName,
    joined: profile.joined,
    initial: profile.initial,
    growthItem: activeGrowthItem,
    submissions,
    badges,
  });
}
