// Multi-collectible growth allocation (issue #67).
//
// Pure helpers that decide how an incoming nutrient delta lands in a
// member's growth-item collection. Kept side-effect free so the rules
// can be unit-tested in isolation; persistence lives in callers
// (rewards.ts, audit.ts, MSW handlers).
//
// Product rules (verified 2026-05-21):
//   - One active item receives nutrients (newest non-completed, by sequence).
//   - Maxing the active item completes it; overflow seeds the next item,
//     up to `maxGrowthItems`.
//   - At cap (every slot taken AND newest is completed) further nutrients
//     are NOT applied to growth items; the ledger continues to accrue.
//   - Each growth item's level is computed against `growthRules` from its
//     own nutrients (not the member's total balance).

import type { GrowthItem, GrowthRule } from "./db";

/**
 * Pick the rule level whose threshold the given nutrient count meets,
 * defaulting to 1. Duplicated from `rewards.ts` so the allocation
 * module stays free of imports that would create an `awardPoints` ↔
 * allocation cycle.
 */
function ruleLevelFor(nutrients: number, rules: readonly GrowthRule[]): number {
  let bestLevel = 1;
  let bestThreshold = Number.NEGATIVE_INFINITY;
  for (const rule of rules) {
    if (nutrients >= rule.threshold && rule.threshold >= bestThreshold) {
      bestLevel = rule.level;
      bestThreshold = rule.threshold;
    }
  }
  return bestLevel;
}

/**
 * The completion threshold for a single growth item — the highest threshold
 * configured in `growthRules`. Returns 0 if no rules are configured (which
 * effectively keeps every item permanently completable on the first award;
 * callers should make sure the seed runs first).
 */
export function maxThresholdFor(rules: GrowthRule[]): number {
  let max = 0;
  for (const rule of rules) {
    if (rule.threshold > max) {
      max = rule.threshold;
    }
  }
  return max;
}

/**
 * Picks the active growth item — newest by sequence whose `completedAt`
 * is unset. Returns `undefined` if every existing item is already
 * completed (or the member has none yet).
 */
export function activeItemOf(
  items: readonly GrowthItem[]
): GrowthItem | undefined {
  let active: GrowthItem | undefined;
  for (const item of items) {
    if (item.completedAt) {
      continue;
    }
    if (
      !active ||
      (item.sequence ?? 0) > (active.sequence ?? 0) ||
      (item.id != null &&
        active.id != null &&
        (item.sequence ?? 0) === (active.sequence ?? 0) &&
        item.id > active.id)
    ) {
      active = item;
    }
  }
  return active;
}

/**
 * The next sequence number a new item should claim, equal to the largest
 * existing `sequence` plus one (or 1 if the member has no items yet).
 */
export function nextSequence(items: readonly GrowthItem[]): number {
  let max = 0;
  for (const item of items) {
    if ((item.sequence ?? 0) > max) {
      max = item.sequence ?? 0;
    }
  }
  return max + 1;
}

/**
 * The full count of items occupying slots, including completed ones —
 * used to enforce the per-member cap.
 */
export function itemSlotsUsed(items: readonly GrowthItem[]): number {
  return items.length;
}

export interface PlanCreate {
  completedAt?: string;
  createdAt: string;
  level: number;
  nutrients: number;
  sequence: number;
  type: "create";
}

export interface PlanUpdate {
  completedAt?: string;
  id: number;
  level: number;
  nutrients: number;
  type: "update";
}

export type AllocationStep = PlanCreate | PlanUpdate;

export interface AllocationPlan {
  /** Nutrients that were actually allocated into growth items. */
  allocated: number;
  /** Nutrients that did not land in any growth item (cap reached). */
  leftover: number;
  /** Ordered side-effects to apply against the growthItems table. */
  steps: AllocationStep[];
}

interface AllocationContext {
  cap: number;
  growthRules: readonly GrowthRule[];
  maxThreshold: number;
  now: string;
}

interface AllocationState {
  active?:
    | { item: GrowthItem; existing: true }
    | { item: GrowthItem; existing: false };
  allocated: number;
  nextSeq: number;
  remaining: number;
  slotsUsed: number;
  steps: AllocationStep[];
}

function levelFromNutrients(
  nutrients: number,
  rules: readonly GrowthRule[]
): number {
  return ruleLevelFor(nutrients, rules);
}

function spawnNextItem(
  state: AllocationState,
  items: readonly GrowthItem[],
  ctx: AllocationContext
): boolean {
  if (state.slotsUsed >= ctx.cap) {
    return false;
  }
  const created: GrowthItem = {
    memberId: items[0]?.memberId ?? "",
    nutrients: 0,
    level: levelFromNutrients(0, ctx.growthRules),
    sequence: state.nextSeq,
    createdAt: ctx.now,
  };
  state.active = { item: created, existing: false };
  state.slotsUsed += 1;
  state.nextSeq += 1;
  return true;
}

function fillActive(
  state: AllocationState & { active: NonNullable<AllocationState["active"]> },
  ctx: AllocationContext
): boolean {
  const headroom =
    ctx.maxThreshold > 0
      ? Math.max(0, ctx.maxThreshold - state.active.item.nutrients)
      : Number.POSITIVE_INFINITY;
  const takeRaw = Math.min(state.remaining, headroom);
  // If headroom is infinite (no thresholds configured) absorb everything
  // into the active item to avoid a non-terminating loop.
  const take = Number.isFinite(takeRaw) ? takeRaw : state.remaining;
  state.active.item.nutrients += take;
  state.remaining -= take;
  state.allocated += take;

  const completed =
    ctx.maxThreshold > 0 && state.active.item.nutrients >= ctx.maxThreshold;
  state.active.item.level = levelFromNutrients(
    state.active.item.nutrients,
    ctx.growthRules
  );
  if (completed && !state.active.item.completedAt) {
    state.active.item.completedAt = ctx.now;
  }
  return completed;
}

function recordUpdate(steps: AllocationStep[], item: GrowthItem): void {
  const id = item.id;
  if (id == null) {
    return;
  }
  const update: PlanUpdate = {
    type: "update",
    id,
    nutrients: item.nutrients,
    level: item.level,
    ...(item.completedAt ? { completedAt: item.completedAt } : {}),
  };
  const idx = steps.findIndex((s) => s.type === "update" && s.id === id);
  if (idx >= 0) {
    steps[idx] = update;
  } else {
    steps.push(update);
  }
}

function recordCreate(
  steps: AllocationStep[],
  item: GrowthItem,
  fallbackSequence: number,
  ctx: AllocationContext
): void {
  const create: PlanCreate = {
    type: "create",
    sequence: item.sequence ?? fallbackSequence,
    nutrients: item.nutrients,
    level: item.level,
    createdAt: item.createdAt ?? ctx.now,
    ...(item.completedAt ? { completedAt: item.completedAt } : {}),
  };
  const idx = steps.findIndex(
    (s) => s.type === "create" && s.sequence === create.sequence
  );
  if (idx >= 0) {
    steps[idx] = create;
  } else {
    steps.push(create);
  }
}

/**
 * Plan how to apply a positive nutrient delta to a member's growth items.
 *
 * The function is pure and idempotent: it returns the steps a caller must
 * persist (creates and updates), the total nutrients actually allocated,
 * and any leftover that hit the cap. Negative or zero deltas yield an
 * empty plan — growth items never shrink (issue #67 product decision).
 */
export function planAllocation(
  items: readonly GrowthItem[],
  delta: number,
  ctx: AllocationContext
): AllocationPlan {
  if (!Number.isFinite(delta) || delta <= 0) {
    return { allocated: 0, leftover: Math.max(0, delta || 0), steps: [] };
  }

  const state: AllocationState = {
    steps: [],
    slotsUsed: itemSlotsUsed(items),
    nextSeq: nextSequence(items),
    remaining: delta,
    allocated: 0,
  };

  const initialActive = activeItemOf(items);
  if (initialActive) {
    state.active = { item: { ...initialActive }, existing: true };
  }

  while (state.remaining > 0) {
    if (!(state.active || spawnNextItem(state, items, ctx))) {
      break;
    }
    const active = state.active;
    if (!active) {
      break;
    }
    const completed = fillActive(
      state as AllocationState & { active: typeof active },
      ctx
    );
    if (active.existing) {
      recordUpdate(state.steps, active.item);
    } else {
      recordCreate(state.steps, active.item, state.nextSeq - 1, ctx);
    }
    if (completed) {
      state.active = undefined;
    }
  }

  return {
    allocated: state.allocated,
    leftover: state.remaining,
    steps: state.steps,
  };
}

/**
 * Convenience wrapper: build allocation context from a configured cap and
 * the current `growthRules`, then plan against the supplied items. Time
 * defaults to "now" so callers don't need to thread `Date.now()` through
 * tests when they don't care about timestamps.
 */
export function planAllocationWithDefaults(
  items: readonly GrowthItem[],
  delta: number,
  cap: number,
  growthRules: readonly GrowthRule[],
  now: string = new Date().toISOString()
): AllocationPlan {
  return planAllocation(items, delta, {
    cap: Math.max(0, Math.floor(cap)),
    growthRules,
    maxThreshold: maxThresholdFor(growthRules as GrowthRule[]),
    now,
  });
}
