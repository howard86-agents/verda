import { prisma } from "@verda/database";
import { NextResponse } from "next/server";
import { auth } from "../../../../../auth";
import { evaluateBadges } from "../../../badges/evaluate";

// Comments API (issue #131).
// GET  /api/articles/:id/comments — newest-first, hides removed.
// POST /api/articles/:id/comments — post a comment (awards `comment_post` once per article).
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(
  _request: Request,
  context: RouteContext
): Promise<Response> {
  const { id: articleId } = await context.params;

  const comments = await prisma.comment.findMany({
    where: { articleId, removedAt: null },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
  });

  return NextResponse.json({ comments });
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
  const { body } = (await request.json()) as { body?: string };
  if (!body?.trim()) {
    return NextResponse.json({ error: "body required" }, { status: 400 });
  }

  const userId = session.user.id;
  const comment = await prisma.comment.create({
    data: { userId, articleId, body: body.trim() },
  });

  // Award comment_post points (once per article)
  await awardCommentPost(userId, articleId);
  await evaluateBadges(userId);

  return NextResponse.json({ comment }, { status: 201 });
}

async function awardCommentPost(
  userId: string,
  articleId: string
): Promise<void> {
  const rule = await prisma.rewardRule.findUnique({
    where: { action: "comment_post" },
  });
  if (!rule?.enabled) {
    return;
  }

  try {
    await prisma.$transaction(async (tx) => {
      await tx.behaviorLog.create({
        data: { userId, action: "comment_post", articleId },
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
          reason: `comment_post: ${articleId}`,
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
