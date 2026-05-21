import type { GrowthRule, PointLedger } from "./db";
import { db } from "./db";

export function levelFor(nutrients: number, rules: GrowthRule[]): number {
  const sorted = [...rules].sort((a, b) => b.threshold - a.threshold);
  for (const rule of sorted) {
    if (nutrients >= rule.threshold) {
      return rule.level;
    }
  }
  return 1;
}

export function balanceFromLedger(entries: PointLedger[]): number {
  if (entries.length === 0) {
    return 0;
  }
  const sorted = [...entries].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
  return sorted[0].balanceAfter;
}

async function readState(memberId: string) {
  const ledger = await db.pointLedger
    .where("memberId")
    .equals(memberId)
    .toArray();
  const balance = balanceFromLedger(ledger);
  const growthRules = await db.growthRules.toArray();
  return { balance, level: levelFor(balance, growthRules) };
}

/**
 * Award points for an action, consulting `rewardRules` live and enforcing
 * the configured `limitType`:
 *
 * - `per-article`: at most one award per (member, action, articleId)
 * - `per-day`:     at most one award per (member, action) per local-UTC day
 * - `total`:       at most one award per (member, action) ever
 * - `campaign`:    recognised but no built-in guard yet (caller-enforced)
 *
 * Disabled rules award 0 points without writing any ledger entry.
 * Returns `{ points, balance, level }`.
 */
export async function awardPoints(
  memberId: string,
  action: string,
  articleId?: string
): Promise<{ balance: number; level: number; points: number }> {
  const rule = await db.rewardRules.where("action").equals(action).first();
  if (!rule?.enabled) {
    const state = await readState(memberId);
    return { points: 0, ...state };
  }

  // Once-per-article guard
  if (rule.limitType === "per-article" && articleId) {
    const existing = await db.behaviorLogs
      .where("[memberId+action+articleId]")
      .equals([memberId, action, articleId])
      .first();
    if (existing) {
      const state = await readState(memberId);
      return { points: 0, ...state };
    }
  }

  // Once-per-day guard
  if (rule.limitType === "per-day") {
    const today = new Date().toISOString().slice(0, 10);
    const logs = await db.behaviorLogs
      .where("memberId")
      .equals(memberId)
      .toArray();
    const alreadyToday = logs.some(
      (l) => l.action === action && l.createdAt.slice(0, 10) === today
    );
    if (alreadyToday) {
      const state = await readState(memberId);
      return { points: 0, ...state };
    }
  }

  // Once-ever guard
  if (rule.limitType === "total") {
    const existing = await db.behaviorLogs
      .where("memberId")
      .equals(memberId)
      .filter((l) => l.action === action)
      .first();
    if (existing) {
      const state = await readState(memberId);
      return { points: 0, ...state };
    }
  }

  // Get current balance
  const ledger = await db.pointLedger
    .where("memberId")
    .equals(memberId)
    .toArray();
  const currentBalance = balanceFromLedger(ledger);
  const newBalance = currentBalance + rule.points;

  // Write behaviorLog
  await db.behaviorLogs.add({
    memberId,
    action,
    articleId,
    createdAt: new Date().toISOString(),
  });

  // Write pointLedger
  await db.pointLedger.add({
    memberId,
    amount: rule.points,
    balanceAfter: newBalance,
    reason: `${action}: ${articleId ?? "n/a"}`,
    createdAt: new Date().toISOString(),
  });

  // Recompute growth level
  const growthRules = await db.growthRules.toArray();
  const newLevel = levelFor(newBalance, growthRules);

  const growthItem = await db.growthItems
    .where("memberId")
    .equals(memberId)
    .first();

  if (growthItem?.id) {
    await db.growthItems.update(growthItem.id, {
      nutrients: newBalance,
      level: newLevel,
    });
  } else {
    await db.growthItems.add({
      memberId,
      nutrients: newBalance,
      level: newLevel,
    });
  }

  return { points: rule.points, balance: newBalance, level: newLevel };
}
