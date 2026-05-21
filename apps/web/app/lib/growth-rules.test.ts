import "./test-setup";
import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import {
  db,
  GROWTH_CONFIG_DEFAULT_ID,
  GROWTH_CONFIG_DEFAULT_MAX_ITEMS,
} from "./db";
import { awardPoints, levelFor } from "./rewards";

/**
 * These are integration tests for issue #30: edits to growthRules /
 * growthConfig must drive the levelFor computation that runs inside
 * awardPoints, and the quantity-cap configuration must round-trip
 * through the storage layer (enforcement deferred to #67).
 */

describe("dynamic growth thresholds (issue #30)", () => {
  beforeEach(async () => {
    await db.open();
    await db.rewardRules.bulkPut([
      {
        id: "rr_read",
        action: "read_complete",
        points: 10,
        enabled: true,
        limitType: "per-article",
      },
    ]);
    // Default seed-like rules
    await db.growthRules.bulkPut([
      { level: 1, name: "Seed", jp: "種", threshold: 0 },
      { level: 2, name: "Sprout", jp: "芽", threshold: 50 },
      { level: 3, name: "Bloom", jp: "花", threshold: 150 },
      { level: 4, name: "Fully grown", jp: "結実", threshold: 300 },
    ]);
  });

  afterEach(async () => {
    await db.delete();
  });

  test("levelFor reflects edited thresholds", async () => {
    // Lower the level-2 threshold from 50 → 20.
    const lvl2 = await db.growthRules.get(2);
    if (!lvl2) {
      throw new Error("seed missing");
    }
    await db.growthRules.put({ ...lvl2, threshold: 20 });
    const rules = await db.growthRules.toArray();
    expect(levelFor(20, rules)).toBe(2);
    expect(levelFor(19, rules)).toBe(1);
  });

  test("levelFor reflects renamed levels via the live row", async () => {
    const lvl2 = await db.growthRules.get(2);
    if (!lvl2) {
      throw new Error("seed missing");
    }
    await db.growthRules.put({
      ...lvl2,
      name: "Seedling",
      jp: "若芽",
    });
    const updated = await db.growthRules.get(2);
    expect(updated?.name).toBe("Seedling");
    expect(updated?.jp).toBe("若芽");
  });

  test("awardPoints uses the latest growthRules thresholds", async () => {
    // First award against default thresholds: 10 points → level 1.
    const first = await awardPoints("m_1", "read_complete", "s01");
    expect(first.points).toBe(10);
    expect(first.level).toBe(1);

    // Tighten level-2 threshold so 10 nutrients now suffices.
    const lvl2 = await db.growthRules.get(2);
    if (!lvl2) {
      throw new Error("seed missing");
    }
    await db.growthRules.put({ ...lvl2, threshold: 5 });

    // Award on a different article so the per-article guard doesn't fire.
    const second = await awardPoints("m_1", "read_complete", "s02");
    expect(second.points).toBe(10);
    expect(second.balance).toBe(20);
    expect(second.level).toBe(2);
  });
});

describe("growthConfig default cap (issue #30)", () => {
  beforeEach(async () => {
    await db.open();
  });

  afterEach(async () => {
    await db.delete();
  });

  test("default identifiers are stable", () => {
    expect(GROWTH_CONFIG_DEFAULT_ID).toBe("default");
    expect(typeof GROWTH_CONFIG_DEFAULT_MAX_ITEMS).toBe("number");
    expect(GROWTH_CONFIG_DEFAULT_MAX_ITEMS).toBeGreaterThanOrEqual(1);
  });

  test("growthConfig persists a single keyed row", async () => {
    await db.growthConfig.put({
      id: GROWTH_CONFIG_DEFAULT_ID,
      maxItemsPerMember: 7,
    });
    const row = await db.growthConfig.get(GROWTH_CONFIG_DEFAULT_ID);
    expect(row?.maxItemsPerMember).toBe(7);
  });

  test("upserting the same id replaces the value", async () => {
    await db.growthConfig.put({
      id: GROWTH_CONFIG_DEFAULT_ID,
      maxItemsPerMember: 3,
    });
    await db.growthConfig.put({
      id: GROWTH_CONFIG_DEFAULT_ID,
      maxItemsPerMember: 10,
    });
    const all = await db.growthConfig.toArray();
    expect(all).toHaveLength(1);
    expect(all[0].maxItemsPerMember).toBe(10);
  });
});
