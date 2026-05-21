import type { GrowthRule, PointLedger } from "./db";
import {
  db,
  GROWTH_CONFIG_DEFAULT_ID,
  GROWTH_CONFIG_DEFAULT_MAX_ITEMS,
  type GrowthConfig,
} from "./db";
import {
  type AllocationPlan,
  planAllocationWithDefaults,
} from "./growth-allocation";

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
 * Read the configured growth-item cap (`maxGrowthItems`). Falls back to
 * the compiled-in default when the row is missing — typecheck and fresh
 * checkouts run before the seed initialises growthConfig.
 */
async function readGrowthCap(): Promise<number> {
  const config: GrowthConfig | undefined = await db.growthConfig.get(
    GROWTH_CONFIG_DEFAULT_ID
  );
  return config?.maxItemsPerMember ?? GROWTH_CONFIG_DEFAULT_MAX_ITEMS;
}

/**
 * Persist a multi-collectible growth allocation plan. Caller is
 * responsible for first computing `delta` (typically the points just
 * awarded) and producing the plan via `planAllocationWithDefaults`. We
 * apply update-then-create to keep `sequence` order stable when both
 * land in the same award.
 */
export async function applyGrowthAllocationPlan(
  memberId: string,
  plan: AllocationPlan
): Promise<void> {
  for (const step of plan.steps) {
    if (step.type === "update") {
      const patch: Record<string, unknown> = {
        nutrients: step.nutrients,
        level: step.level,
      };
      if (step.completedAt) {
        patch.completedAt = step.completedAt;
      }
      await db.growthItems.update(step.id, patch);
    } else {
      await db.growthItems.add({
        memberId,
        nutrients: step.nutrients,
        level: step.level,
        sequence: step.sequence,
        createdAt: step.createdAt,
        ...(step.completedAt ? { completedAt: step.completedAt } : {}),
      });
    }
  }
}

/**
 * Plan + apply a growth-item allocation for `memberId`. The growth-item
 * collection drives its own per-item levels and the configured cap; the
 * member's overall balance/level (returned to callers) still comes from
 * the ledger.
 */
export async function allocateGrowthForMember(
  memberId: string,
  delta: number
): Promise<AllocationPlan> {
  if (!Number.isFinite(delta) || delta <= 0) {
    return { allocated: 0, leftover: Math.max(0, delta || 0), steps: [] };
  }
  const items = await db.growthItems
    .where("memberId")
    .equals(memberId)
    .toArray();
  const growthRules = await db.growthRules.toArray();
  const cap = await readGrowthCap();
  const plan = planAllocationWithDefaults(items, delta, cap, growthRules);
  await applyGrowthAllocationPlan(memberId, plan);
  return plan;
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

  // Allocate the awarded delta into the multi-collectible growth model
  // (issue #67). The active item receives nutrients first; overflow
  // seeds new items up to `growthConfig.maxItemsPerMember`.
  await allocateGrowthForMember(memberId, rule.points);

  // The returned `level` summarises the member's overall progress for
  // legacy callers (Header/teaser): it's still derived from the ledger
  // balance rather than any single growth item's level.
  const growthRules = await db.growthRules.toArray();
  const newLevel = levelFor(newBalance, growthRules);

  return { points: rule.points, balance: newBalance, level: newLevel };
}
