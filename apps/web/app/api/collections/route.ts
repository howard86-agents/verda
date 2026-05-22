import { prisma } from "@verda/database";
import { NextResponse } from "next/server";
import { auth } from "../../../auth";
import { evaluateBadges } from "../badges/evaluate";

// Collections API (issue #131).
// GET  /api/collections — list saved articles for the current user.
// POST /api/collections — save an article (awards `collect` once).
// DELETE /api/collections — unsave an article.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(): Promise<Response> {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const items = await prisma.collection.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ items });
}

export async function POST(request: Request): Promise<Response> {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { articleId } = (await request.json()) as { articleId?: string };
  if (!articleId) {
    return NextResponse.json({ error: "articleId required" }, { status: 400 });
  }

  const userId = session.user.id;

  try {
    const item = await prisma.collection.create({
      data: { userId, articleId },
    });

    // Award collect points (idempotent via behavior_logs unique constraint)
    await awardCollect(userId, articleId);
    await evaluateBadges(userId);

    return NextResponse.json({ item }, { status: 201 });
  } catch (error: unknown) {
    if (isUniqueConstraintError(error)) {
      return NextResponse.json({ error: "Already collected" }, { status: 409 });
    }
    throw error;
  }
}

export async function DELETE(request: Request): Promise<Response> {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { articleId } = (await request.json()) as { articleId?: string };
  if (!articleId) {
    return NextResponse.json({ error: "articleId required" }, { status: 400 });
  }

  await prisma.collection.deleteMany({
    where: { userId: session.user.id, articleId },
  });

  return NextResponse.json({ ok: true });
}

async function awardCollect(userId: string, articleId: string): Promise<void> {
  const rule = await prisma.rewardRule.findUnique({
    where: { action: "collect" },
  });
  if (!rule?.enabled) {
    return;
  }

  try {
    await prisma.$transaction(async (tx) => {
      await tx.behaviorLog.create({
        data: { userId, action: "collect", articleId },
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
          reason: `collect: ${articleId}`,
        },
      });
    });
  } catch (error: unknown) {
    // Duplicate behavior log — points already awarded, ignore.
    if (!isUniqueConstraintError(error)) {
      throw error;
    }
  }
}

function isUniqueConstraintError(error: unknown): boolean {
  return (
    !!error &&
    typeof error === "object" &&
    "code" in error &&
    (error as { code: string }).code === "P2002"
  );
}
