import "./test-setup";
import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { db } from "./db";
import { awardPoints } from "./rewards";

describe("awardPoints() — collect once-per-article guard", () => {
  beforeEach(async () => {
    await db.open();
    await db.rewardRules.bulkPut([
      {
        id: "rr_collect",
        action: "collect",
        points: 2,
        enabled: true,
        limitType: "per-article",
      },
    ]);
    await db.growthRules.bulkPut([
      { level: 1, name: "Seed", jp: "種", threshold: 0 },
      { level: 2, name: "Sprout", jp: "芽", threshold: 50 },
    ]);
  });

  afterEach(async () => {
    await db.delete();
  });

  test("first collect awards points", async () => {
    const result = await awardPoints("m_1", "collect", "s01");
    expect(result.points).toBe(2);
    expect(result.balance).toBe(2);
  });

  test("second collect for same article awards 0 points", async () => {
    await awardPoints("m_1", "collect", "s01");
    const result = await awardPoints("m_1", "collect", "s01");
    expect(result.points).toBe(0);
    expect(result.balance).toBe(2);
  });

  test("collect on different article awards points again", async () => {
    await awardPoints("m_1", "collect", "s01");
    const result = await awardPoints("m_1", "collect", "s02");
    expect(result.points).toBe(2);
    expect(result.balance).toBe(4);
  });
});
