// Growth-item redemption planner (issue #35).
//
// Pure helpers that decide whether a member may redeem a growth item and
// produce the mocked reward payload that the API persists. Side-effect
// free so the eligibility rules and the dedup behaviour can be unit
// tested in isolation.

import type { GrowthItem, Redemption, RedemptionProvider } from "./db";

export interface MockRewardPayload {
  /** "Plant NN reward" — user-facing reward title. */
  displayName: string;
  /** Optional ISO timestamp when the reward expires. */
  expiresAt?: string;
  /** Null for the mock; real provider integrations populate this. */
  fulfillmentRef: null;
  /** Optional provider-specific JSON-safe details. */
  metadata?: Record<string, unknown>;
  provider: RedemptionProvider;
  /** "VERDA-PLANT-NN" — code shown to the member. */
  rewardCode: string;
}

export type RedemptionRejectReason =
  | "not_completed"
  | "already_redeemed"
  | "duplicate_redemption_record"
  | "missing_id";

export type EligibilityResult =
  | { ok: true }
  | { ok: false; reason: RedemptionRejectReason };

/**
 * Decide whether a single growth item is eligible for redemption.
 *
 * - Items that haven't been completed (no `completedAt`) are not eligible.
 * - Items already marked redeemed (`redeemedAt` set) are not eligible.
 * - An existing `redemptions` row for the same `growthItemId` blocks
 *   redemption even if the item itself wasn't marked yet (defensive).
 */
export function checkEligibility(
  item: GrowthItem,
  existingRedemptions: readonly Redemption[]
): EligibilityResult {
  if (item.id == null) {
    return { ok: false, reason: "missing_id" };
  }
  if (!item.completedAt) {
    return { ok: false, reason: "not_completed" };
  }
  if (item.redeemedAt) {
    return { ok: false, reason: "already_redeemed" };
  }
  if (existingRedemptions.some((r) => r.growthItemId === item.id)) {
    return { ok: false, reason: "duplicate_redemption_record" };
  }
  return { ok: true };
}

/**
 * Build the mocked reward payload for a redemption. The `displayName` and
 * `rewardCode` are derived from the growth item's per-member sequence so
 * "Plant 01" maps to "VERDA-PLANT-01"; this keeps both stable for tests
 * and obvious in the UI before a real provider is wired in.
 */
export function mockRewardFor(
  item: GrowthItem,
  now: string = new Date().toISOString()
): MockRewardPayload {
  const sequence = item.sequence ?? 1;
  const padded = String(sequence).padStart(2, "0");
  // Mock rewards expire 30 days from now so the payload exercises the
  // `expiresAt` field; consumers free to override.
  const expires = new Date(now);
  expires.setUTCDate(expires.getUTCDate() + 30);
  return {
    provider: "mock",
    rewardCode: `VERDA-PLANT-${padded}`,
    displayName: `Plant ${padded} reward`,
    expiresAt: expires.toISOString(),
    fulfillmentRef: null,
  };
}

/**
 * Build a complete redemption row from an eligible item + payload, ready
 * to be `put`-ed into the `redemptions` table.
 */
export function buildRedemption(args: {
  id: string;
  item: GrowthItem;
  now?: string;
  payload: MockRewardPayload;
}): Redemption {
  const { id, item, payload } = args;
  const now = args.now ?? new Date().toISOString();
  if (item.id == null) {
    throw new Error("buildRedemption: growth item must have a numeric id");
  }
  return {
    id,
    memberId: item.memberId,
    growthItemId: item.id,
    growthItemSequence: item.sequence ?? 1,
    createdAt: now,
    provider: payload.provider,
    rewardCode: payload.rewardCode,
    displayName: payload.displayName,
    expiresAt: payload.expiresAt,
    fulfillmentRef: payload.fulfillmentRef,
    metadata: payload.metadata,
  };
}
