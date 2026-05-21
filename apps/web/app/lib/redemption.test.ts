import { describe, expect, test } from "bun:test";
import type { GrowthItem, Redemption } from "./db";
import { buildRedemption, checkEligibility, mockRewardFor } from "./redemption";

const COMPLETED_NOW = "2026-05-22T00:00:00.000Z";

function makeItem(overrides: Partial<GrowthItem> = {}): GrowthItem {
  return {
    id: 1,
    memberId: "m_test",
    nutrients: 300,
    level: 4,
    sequence: 1,
    createdAt: "2026-04-01T00:00:00.000Z",
    completedAt: COMPLETED_NOW,
    ...overrides,
  };
}

describe("checkEligibility()", () => {
  test("a completed, unredeemed item is eligible", () => {
    expect(checkEligibility(makeItem(), [])).toEqual({ ok: true });
  });

  test("an item without completedAt is rejected as not_completed", () => {
    const item = makeItem({ completedAt: undefined });
    expect(checkEligibility(item, [])).toEqual({
      ok: false,
      reason: "not_completed",
    });
  });

  test("an item already marked redeemedAt is rejected as already_redeemed", () => {
    const item = makeItem({ redeemedAt: COMPLETED_NOW });
    expect(checkEligibility(item, [])).toEqual({
      ok: false,
      reason: "already_redeemed",
    });
  });

  test("an existing redemption row for the same growthItemId blocks redemption", () => {
    const item = makeItem();
    const prior: Redemption = {
      id: "red_existing",
      memberId: "m_test",
      growthItemId: 1,
      growthItemSequence: 1,
      createdAt: COMPLETED_NOW,
      provider: "mock",
      rewardCode: "VERDA-PLANT-01",
    };
    expect(checkEligibility(item, [prior])).toEqual({
      ok: false,
      reason: "duplicate_redemption_record",
    });
  });

  test("an item missing an id is rejected", () => {
    const item = makeItem({ id: undefined });
    expect(checkEligibility(item, [])).toEqual({
      ok: false,
      reason: "missing_id",
    });
  });
});

describe("mockRewardFor()", () => {
  test("derives a stable reward code from the item sequence", () => {
    const reward = mockRewardFor(makeItem({ sequence: 2 }), COMPLETED_NOW);
    expect(reward.provider).toBe("mock");
    expect(reward.rewardCode).toBe("VERDA-PLANT-02");
    expect(reward.displayName).toBe("Plant 02 reward");
    expect(reward.fulfillmentRef).toBeNull();
  });

  test("populates expiresAt 30 days after `now`", () => {
    const reward = mockRewardFor(makeItem(), COMPLETED_NOW);
    expect(reward.expiresAt).toBe("2026-06-21T00:00:00.000Z");
  });

  test("falls back to sequence 01 when item.sequence is missing", () => {
    const reward = mockRewardFor(
      makeItem({ sequence: undefined }),
      COMPLETED_NOW
    );
    expect(reward.rewardCode).toBe("VERDA-PLANT-01");
  });
});

describe("buildRedemption()", () => {
  test("captures the item id + sequence and the payload fields", () => {
    const item = makeItem({ id: 7, sequence: 3 });
    const payload = mockRewardFor(item, COMPLETED_NOW);
    const row = buildRedemption({
      id: "red_xyz",
      item,
      payload,
      now: COMPLETED_NOW,
    });
    expect(row).toEqual({
      id: "red_xyz",
      memberId: "m_test",
      growthItemId: 7,
      growthItemSequence: 3,
      createdAt: COMPLETED_NOW,
      provider: "mock",
      rewardCode: "VERDA-PLANT-03",
      displayName: "Plant 03 reward",
      expiresAt: payload.expiresAt,
      fulfillmentRef: null,
      metadata: undefined,
    });
  });

  test("throws when the source item has no id", () => {
    const item = makeItem({ id: undefined });
    const payload = mockRewardFor(item, COMPLETED_NOW);
    expect(() =>
      buildRedemption({ id: "red_x", item, payload, now: COMPLETED_NOW })
    ).toThrow();
  });
});
