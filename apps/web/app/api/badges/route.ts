import { BADGE_CATALOG } from "@verda/data";
import { prisma } from "@verda/database";
import { NextResponse } from "next/server";
import { auth } from "../../../auth";

// Badges API (issue #138).
// GET /api/badges — returns earned + locked badges for the current user.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(): Promise<Response> {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const owned = await prisma.memberBadge.findMany({
    where: { userId: session.user.id },
  });
  const ownedIds = new Set(owned.map((b) => b.badgeId));

  const earned = BADGE_CATALOG.filter((b) => ownedIds.has(b.id));
  const locked = BADGE_CATALOG.filter((b) => !ownedIds.has(b.id)).map(
    (b) => b.id
  );

  return NextResponse.json({ earned, locked });
}
