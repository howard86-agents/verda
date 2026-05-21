import "./test-setup";
import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { db } from "./db";
import { awardPoints, balanceFromLedger, levelFor } from "./rewards";

describe("levelFor()", () => {
  const rules = [
    { level: 1, name: "Seed", jp: "種", threshold: 0 },
    { level: 2, name: "Sprout", jp: "芽", threshold: 50 },
    { level: 3, name: "Bloom", jp: "花", threshold: 150 },
    { level: 4, name: "Fully grown", jp: "結実", threshold: 300 },
  ];

  test("returns level 1 for 0 nutrients", () => {
    expect(levelFor(0, rules)).toBe(1);
  });

  test("returns level 2 for 50 nutrients", () => {
    expect(levelFor(50, rules)).toBe(2);
  });

  test("returns level 2 for 87 nutrients", () => {
    expect(levelFor(87, rules)).toBe(2);
  });

  test("returns level 3 for 150 nutrients", () => {
    expect(levelFor(150, rules)).toBe(3);
  });

  test("returns level 4 for 300+ nutrients", () => {
    expect(levelFor(350, rules)).toBe(4);
  });

  test("returns level 1 for negative nutrients", () => {
    expect(levelFor(-5, rules)).toBe(1);
  });
});

describe("balanceFromLedger()", () => {
  test("returns 0 for empty ledger", () => {
    expect(balanceFromLedger([])).toBe(0);
  });

  test("returns balanceAfter of the latest entry", () => {
    const entries = [
      {
        memberId: "m1",
        amount: 10,
        balanceAfter: 10,
        reason: "read",
        createdAt: "2026-05-01T00:00:00Z",
      },
      {
        memberId: "m1",
        amount: 5,
        balanceAfter: 15,
        reason: "check-in",
        createdAt: "2026-05-02T00:00:00Z",
      },
    ];
    expect(balanceFromLedger(entries)).toBe(15);
  });

  test("handles out-of-order entries", () => {
    const entries = [
      {
        memberId: "m1",
        amount: 5,
        balanceAfter: 25,
        reason: "check-in",
        createdAt: "2026-05-03T00:00:00Z",
      },
      {
        memberId: "m1",
        amount: 10,
        balanceAfter: 20,
        reason: "read",
        createdAt: "2026-05-02T00:00:00Z",
      },
    ];
    expect(balanceFromLedger(entries)).toBe(25);
  });
});

describe("awardPoints() — reads rewardRules live", () => {
  beforeEach(async () => {
    await db.open();
    await db.growthRules.bulkPut([
      { level: 1, name: "Seed", jp: "種", threshold: 0 },
      { level: 2, name: "Sprout", jp: "芽", threshold: 50 },
    ]);
  });

  afterEach(async () => {
    await db.delete();
  });

  test("disabled rule awards 0 points and writes no ledger entry", async () => {
    await db.rewardRules.put({
      id: "rr_collect",
      action: "collect",
      points: 2,
      enabled: false,
      limitType: "per-article",
    });
    const result = await awardPoints("m_1", "collect", "s01");
    expect(result.points).toBe(0);
    expect(result.balance).toBe(0);
    const ledger = await db.pointLedger
      .where("memberId")
      .equals("m_1")
      .toArray();
    expect(ledger.length).toBe(0);
  });

  test("re-enabling a previously-disabled rule lets the next call award", async () => {
    await db.rewardRules.put({
      id: "rr_collect",
      action: "collect",
      points: 2,
      enabled: false,
      limitType: "per-article",
    });
    await awardPoints("m_1", "collect", "s01");

    await db.rewardRules.put({
      id: "rr_collect",
      action: "collect",
      points: 2,
      enabled: true,
      limitType: "per-article",
    });
    const result = await awardPoints("m_1", "collect", "s02");
    expect(result.points).toBe(2);
    expect(result.balance).toBe(2);
  });

  test("changing rule.points reflects on next award", async () => {
    await db.rewardRules.put({
      id: "rr_read",
      action: "read_complete",
      points: 10,
      enabled: true,
      limitType: "per-article",
    });
    const first = await awardPoints("m_1", "read_complete", "s01");
    expect(first.points).toBe(10);

    await db.rewardRules.put({
      id: "rr_read",
      action: "read_complete",
      points: 25,
      enabled: true,
      limitType: "per-article",
    });
    const second = await awardPoints("m_1", "read_complete", "s02");
    expect(second.points).toBe(25);
    expect(second.balance).toBe(35);
  });

  test("missing rule (action not configured) awards 0 points", async () => {
    const result = await awardPoints("m_1", "ghost_action");
    expect(result.points).toBe(0);
    expect(result.balance).toBe(0);
  });
});

describe("awardPoints() — per-article limit type", () => {
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

describe("awardPoints() — per-day limit type", () => {
  beforeEach(async () => {
    await db.open();
    await db.rewardRules.put({
      id: "rr_checkin",
      action: "daily_check_in",
      points: 5,
      enabled: true,
      limitType: "per-day",
    });
    await db.growthRules.bulkPut([
      { level: 1, name: "Seed", jp: "種", threshold: 0 },
    ]);
  });

  afterEach(async () => {
    await db.delete();
  });

  test("first check-in today awards points", async () => {
    const result = await awardPoints("m_1", "daily_check_in");
    expect(result.points).toBe(5);
    expect(result.balance).toBe(5);
  });

  test("second check-in today awards 0 points", async () => {
    await awardPoints("m_1", "daily_check_in");
    const result = await awardPoints("m_1", "daily_check_in");
    expect(result.points).toBe(0);
    expect(result.balance).toBe(5);
  });

  test("check-in dated yesterday does not block today", async () => {
    const yesterday = new Date(Date.now() - 86_400_000).toISOString();
    await db.behaviorLogs.add({
      memberId: "m_1",
      action: "daily_check_in",
      createdAt: yesterday,
    });
    const result = await awardPoints("m_1", "daily_check_in");
    expect(result.points).toBe(5);
    expect(result.balance).toBe(5);
  });

  test("per-day guard is scoped to action — other actions are unaffected", async () => {
    await db.rewardRules.put({
      id: "rr_other",
      action: "other_daily",
      points: 1,
      enabled: true,
      limitType: "per-day",
    });
    await awardPoints("m_1", "daily_check_in");
    const result = await awardPoints("m_1", "other_daily");
    expect(result.points).toBe(1);
    expect(result.balance).toBe(6);
  });
});

describe("awardPoints() — total limit type", () => {
  beforeEach(async () => {
    await db.open();
    await db.rewardRules.put({
      id: "rr_signup_bonus",
      action: "signup_bonus",
      points: 50,
      enabled: true,
      limitType: "total",
    });
    await db.growthRules.bulkPut([
      { level: 1, name: "Seed", jp: "種", threshold: 0 },
      { level: 2, name: "Sprout", jp: "芽", threshold: 50 },
    ]);
  });

  afterEach(async () => {
    await db.delete();
  });

  test("first call awards points", async () => {
    const result = await awardPoints("m_1", "signup_bonus");
    expect(result.points).toBe(50);
    expect(result.balance).toBe(50);
  });

  test("any subsequent call awards 0 points", async () => {
    await awardPoints("m_1", "signup_bonus");
    const result = await awardPoints("m_1", "signup_bonus");
    expect(result.points).toBe(0);
    expect(result.balance).toBe(50);
  });

  test("total guard is scoped per member", async () => {
    await awardPoints("m_1", "signup_bonus");
    const result = await awardPoints("m_2", "signup_bonus");
    expect(result.points).toBe(50);
    expect(result.balance).toBe(50);
  });
});
