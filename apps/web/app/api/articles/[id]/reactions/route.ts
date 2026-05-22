import { prisma } from "@verda/database";
import { NextResponse } from "next/server";
import { auth } from "../../../../../auth";

// Reactions API (issue #131).
// GET  /api/articles/:id/reactions — aggregated counts + user's reactions.
// POST /api/articles/:id/reactions — toggle a reaction (awards `reaction_react` once per article).
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const VALID_KINDS = ["grew", "learned", "loved"] as const;

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(
  _request: Request,
  context: RouteContext
): Promise<Response> {
  const { id: articleId } = await context.params;
  const session = await auth();
  const userId = session?.user?.id;

  const reactions = await prisma.reaction.findMany({
    where: { articleId },
  });

  const counts: Record<string, number> = {};
  for (const kind of VALID_KINDS) {
    counts[kind] = reactions.filter((r) => r.kind === kind).length;
  }

  const userReactions = userId
    ? reactions.filter((r) => r.userId === userId).map((r) => r.kind)
    : [];

  return NextResponse.json({ counts, userReactions });
}

export async function POST(
  request: Request,
  context: RouteContext
): Promise<Response> {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: articleId } = await context.params;
  const { kind } = (await request.json()) as { kind?: string };
  if (!(kind && VALID_KINDS.includes(kind as (typeof VALID_KINDS)[number]))) {
    return NextResponse.json(
      { error: "kind must be grew, learned, or loved" },
      { status: 400 }
    );
  }

  const userId = session.user.id;

  // Toggle: if exists, remove; if not, create.
  const existing = await prisma.reaction.findUnique({
    where: { userId_articleId_kind: { userId, articleId, kind } },
  });

  if (existing) {
    await prisma.reaction.delete({ where: { id: existing.id } });
    return NextResponse.json({ toggled: false });
  }

  await prisma.reaction.create({ data: { userId, articleId, kind } });

  // Award reaction_react points (once per article, regardless of kind)
  await awardReaction(userId, articleId);

  return NextResponse.json({ toggled: true }, { status: 201 });
}

async function awardReaction(userId: string, articleId: string): Promise<void> {
  const rule = await prisma.rewardRule.findUnique({
    where: { action: "reaction_react" },
  });
  if (!rule?.enabled) {
    return;
  }

  try {
    await prisma.$transaction(async (tx) => {
      await tx.behaviorLog.create({
        data: { userId, action: "reaction_react", articleId },
      });
      const last = await tx.pointLedgerEntry.findFirst({
        where: { userId },
        orderBy: { id: "desc" },
      });
      const balance = (last?.balanceAfter ?? 0) + rule.points;
      await tx.pointLedgerEntry.create({
        data: {
          userId,
          amount: rule.points,
          balanceAfter: balance,
          reason: `reaction_react: ${articleId}`,
        },
      });
    });
  } catch (error: unknown) {
    if (
      !(
        error &&
        typeof error === "object" &&
        "code" in error &&
        (error as { code: string }).code === "P2002"
      )
    ) {
      throw error;
    }
  }
}
