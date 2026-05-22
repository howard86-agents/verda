import { prisma } from "@verda/database";
import { NextResponse } from "next/server";

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

  return NextResponse.json({
    ok: true,
    points: result.points + (streakResult?.points ?? 0),
    balance: streakResult?.balance ?? result.balance,
    level: streakResult?.level ?? result.level,
    streak: 0,
    streakPoints: streakResult?.points ?? 0,
    newBadges: [],
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

  return NextResponse.json({
    ok: true,
    points: result.points + (streakResult?.points ?? 0),
    balance: streakResult?.balance ?? result.balance,
    level: streakResult?.level ?? result.level,
    streak: 0,
    streakPoints: streakResult?.points ?? 0,
    newBadges: [],
  });
}

/**
 * Award points for an action in a single transaction.
 * Returns null if the action was already rewarded (idempotency).
 */
async function awardPoints(
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

async function allocateGrowth(
  tx: TxClient,
  userId: string,
  delta: number
): Promise<void> {
  if (delta <= 0) {
    return;
  }

  const config = await tx.growthConfig.findUnique({
    where: { id: "default" },
  });
  const cap = config?.maxItemsPerMember ?? 3;

  const rules = await tx.growthRule.findMany({ orderBy: { level: "asc" } });
  const lastRule = rules.at(-1);
  const maxThreshold = lastRule?.threshold ?? 300;

  // Get or create active growth item
  let activeItem = await tx.growthItem.findFirst({
    where: { userId, completedAt: null },
    orderBy: { sequence: "desc" },
  });

  if (!activeItem) {
    const itemCount = await tx.growthItem.count({ where: { userId } });
    if (itemCount >= cap) {
      return; // Cap reached, no more items
    }
    activeItem = await tx.growthItem.create({
      data: { userId, nutrients: 0, level: 1, sequence: itemCount + 1 },
    });
  }

  let remaining = delta;
  let currentItem = activeItem;

  while (remaining > 0) {
    const newNutrients = currentItem.nutrients + remaining;
    if (newNutrients >= maxThreshold) {
      // Complete this item
      const overflow = newNutrients - maxThreshold;
      await tx.growthItem.update({
        where: { id: currentItem.id },
        data: {
          nutrients: maxThreshold,
          level: lastRule?.level ?? 4,
          completedAt: new Date(),
        },
      });
      remaining = overflow;

      // Try to create next item
      const itemCount = await tx.growthItem.count({ where: { userId } });
      if (itemCount >= cap || remaining <= 0) {
        break;
      }
      currentItem = await tx.growthItem.create({
        data: {
          userId,
          nutrients: 0,
          level: 1,
          sequence: itemCount + 1,
        },
      });
    } else {
      // Update nutrients and level
      const newLevel = levelFor(newNutrients, rules);
      await tx.growthItem.update({
        where: { id: currentItem.id },
        data: { nutrients: newNutrients, level: newLevel },
      });
      remaining = 0;
    }
  }
}

function levelFor(
  nutrients: number,
  rules: Array<{ level: number; threshold: number }>
): number {
  const sorted = [...rules].sort((a, b) => b.threshold - a.threshold);
  for (const rule of sorted) {
    if (nutrients >= rule.threshold) {
      return rule.level;
    }
  }
  return 1;
}

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
