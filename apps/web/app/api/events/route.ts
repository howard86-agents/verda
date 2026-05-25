import { prisma } from "@verda/database";
import { NextResponse } from "next/server";
import { allocateGrowth, levelFor } from "../_lib/growth-allocation";
import { evaluateBadges } from "../badges/evaluate";

// POST /api/events — gamification event handler (issue #130).
//
// Handles `read_complete`, `daily_check_in`, and `streak_bonus` actions.
// `awardPoints` runs in a single Prisma $transaction writing behaviorLog
// + pointLedger + growth allocation atomically.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface EventBody {
  action: string;
  articleId?: string;
  userId: string;
}

interface AwardResult {
  balance: number;
  level: number;
  points: number;
}

export async function POST(request: Request): Promise<Response> {
  const body = (await request.json()) as EventBody;
  const { action, userId, articleId } = body;

  if (!(userId && action)) {
    return NextResponse.json(
      { error: "userId and action required" },
      { status: 400 }
    );
  }

  if (action === "read_complete" && articleId) {
    return handleReadComplete(userId, articleId);
  }

  if (action === "daily_check_in") {
    return handleCheckIn(userId);
  }

  return NextResponse.json({ ok: true });
}

async function handleReadComplete(
  userId: string,
  articleId: string
): Promise<Response> {
  const result = await awardPoints(userId, "read_complete", articleId);
  if (!result) {
    return NextResponse.json(
      { error: "Already rewarded for this article" },
      { status: 409 }
    );
  }

  const streakResult = await awardPoints(userId, "streak_bonus");
  const newBadges = await evaluateBadges(userId);

  return NextResponse.json({
    ok: true,
    points: result.points + (streakResult?.points ?? 0),
    balance: streakResult?.balance ?? result.balance,
    level: streakResult?.level ?? result.level,
    streak: 0,
    streakPoints: streakResult?.points ?? 0,
    newBadges,
  });
}

async function handleCheckIn(userId: string): Promise<Response> {
  const result = await awardPoints(userId, "daily_check_in");
  if (!result) {
    return NextResponse.json(
      { error: "Already checked in today" },
      { status: 409 }
    );
  }

  const streakResult = await awardPoints(userId, "streak_bonus");
  const newBadges = await evaluateBadges(userId);

  return NextResponse.json({
    ok: true,
    points: result.points + (streakResult?.points ?? 0),
    balance: streakResult?.balance ?? result.balance,
    level: streakResult?.level ?? result.level,
    streak: 0,
    streakPoints: streakResult?.points ?? 0,
    newBadges,
  });
}

/**
 * Award points for an action in a single transaction.
 * Returns null if the action was already rewarded (idempotency).
 *
 * Exported so other Route Handlers (issue #133's submission approval
 * flow) can run the same award path without re-implementing the
 * reward-rule lookup, behaviour-log idempotency guard, and growth
 * allocation transaction.
 */
export async function awardPoints(
  userId: string,
  action: string,
  articleId?: string
): Promise<AwardResult | null> {
  const rule = await prisma.rewardRule.findUnique({
    where: { action },
  });
  if (!rule?.enabled) {
    return readState(userId);
  }

  // Check idempotency based on limitType
  const isDuplicate = await checkDuplicate(
    userId,
    action,
    articleId,
    rule.limitType
  );
  if (isDuplicate) {
    return null;
  }

  // Run the award in a transaction
  try {
    return await prisma.$transaction(async (tx) => {
      // Write behavior log (unique constraint enforces idempotency for per-article)
      await tx.behaviorLog.create({
        data: { userId, action, articleId: articleId ?? null },
      });

      // Get current balance
      const lastEntry = await tx.pointLedgerEntry.findFirst({
        where: { userId },
        orderBy: { id: "desc" },
      });
      const currentBalance = lastEntry?.balanceAfter ?? 0;
      const newBalance = currentBalance + rule.points;

      // Write ledger entry
      await tx.pointLedgerEntry.create({
        data: {
          userId,
          amount: rule.points,
          balanceAfter: newBalance,
          reason: `${action}: ${articleId ?? "n/a"}`,
        },
      });

      // Growth allocation
      await allocateGrowth(tx, userId, rule.points);

      // Compute level
      const level = await computeLevel(tx, newBalance);

      return { points: rule.points, balance: newBalance, level };
    });
  } catch (error: unknown) {
    // Unique constraint violation = idempotency guard fired
    if (isUniqueConstraintError(error)) {
      return null;
    }
    throw error;
  }
}

async function checkDuplicate(
  userId: string,
  action: string,
  articleId: string | undefined,
  limitType: string
): Promise<boolean> {
  if (limitType === "per-article" && articleId) {
    const existing = await prisma.behaviorLog.findUnique({
      where: { userId_action_articleId: { userId, action, articleId } },
    });
    return !!existing;
  }

  if (limitType === "per-day") {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const existing = await prisma.behaviorLog.findFirst({
      where: {
        userId,
        action,
        createdAt: { gte: today, lt: tomorrow },
      },
    });
    return !!existing;
  }

  if (limitType === "total") {
    const existing = await prisma.behaviorLog.findFirst({
      where: { userId, action },
    });
    return !!existing;
  }

  return false;
}

type TxClient = Omit<
  typeof prisma,
  "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends"
>;

async function computeLevel(tx: TxClient, balance: number): Promise<number> {
  const rules = await tx.growthRule.findMany({ orderBy: { level: "asc" } });
  return levelFor(balance, rules);
}

async function readState(userId: string): Promise<AwardResult> {
  const lastEntry = await prisma.pointLedgerEntry.findFirst({
    where: { userId },
    orderBy: { id: "desc" },
  });
  const balance = lastEntry?.balanceAfter ?? 0;
  const rules = await prisma.growthRule.findMany({ orderBy: { level: "asc" } });
  return { points: 0, balance, level: levelFor(balance, rules) };
}

function isUniqueConstraintError(error: unknown): boolean {
  if (
    error &&
    typeof error === "object" &&
    "code" in error &&
    (error as { code: string }).code === "P2002"
  ) {
    return true;
  }
  return false;
}
