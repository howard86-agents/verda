import "./test-setup";
import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import type { BehaviorLog } from "./db";
import { db } from "./db";
import { awardPoints } from "./rewards";
import { computeStreak, isMaintainingStreak } from "./streak";

function log(action: string, dayKey: string): BehaviorLog {
  return {
    memberId: "m_4421",
    action,
    createdAt: `${dayKey}T08:00:00.000Z`,
  };
}

describe("computeStreak() — issue #92", () => {
  test("returns 0 with no logs", () => {
    expect(computeStreak([], "2026-05-22")).toBe(0);
  });

  test("returns 0 when no logs match a streak action", () => {
    const logs = [
      log("collect", "2026-05-22"),
      log("login_91app", "2026-05-21"),
    ];
    expect(computeStreak(logs, "2026-05-22")).toBe(0);
  });

  test("counts a single qualifying day on today as 1", () => {
    const logs = [log("check_in", "2026-05-22")];
    expect(computeStreak(logs, "2026-05-22")).toBe(1);
  });

  test("counts consecutive days back from today", () => {
    const logs = [
      log("check_in", "2026-05-22"),
      log("read_complete", "2026-05-21"),
      log("check_in", "2026-05-20"),
    ];
    expect(computeStreak(logs, "2026-05-22")).toBe(3);
  });

  test("dedupes multiple qualifying actions on the same day", () => {
    const logs = [
      log("check_in", "2026-05-22"),
      log("read_complete", "2026-05-22"),
    ];
    expect(computeStreak(logs, "2026-05-22")).toBe(1);
  });

  test("falls back to yesterday if today has no activity", () => {
    const logs = [
      log("check_in", "2026-05-21"),
      log("read_complete", "2026-05-20"),
    ];
    expect(computeStreak(logs, "2026-05-22")).toBe(2);
  });

  test("resets after a missed day", () => {
    const logs = [
      log("check_in", "2026-05-22"),
      log("check_in", "2026-05-21"),
      // gap on 2026-05-20
      log("check_in", "2026-05-19"),
    ];
    expect(computeStreak(logs, "2026-05-22")).toBe(2);
  });

  test("returns 0 when last activity was two or more days ago", () => {
    const logs = [log("check_in", "2026-05-19"), log("check_in", "2026-05-18")];
    expect(computeStreak(logs, "2026-05-22")).toBe(0);
  });
});

describe("isMaintainingStreak()", () => {
  test("false on day 0 and 1, true from day 2", () => {
    expect(isMaintainingStreak(0)).toBe(false);
    expect(isMaintainingStreak(1)).toBe(false);
    expect(isMaintainingStreak(2)).toBe(true);
    expect(isMaintainingStreak(7)).toBe(true);
  });
});

describe("streak_bonus reward rule (issue #92)", () => {
  beforeEach(async () => {
    await db.open();
    await db.rewardRules.bulkPut([
      {
        id: "rr_streak_bonus",
        action: "streak_bonus",
        points: 5,
        enabled: true,
        limitType: "per-day",
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

  test("awards 5 points on first invocation of the day", async () => {
    const result = await awardPoints("m_4421", "streak_bonus");
    expect(result.points).toBe(5);
    expect(result.balance).toBe(5);
  });

  test("subsequent same-day invocations award 0 (per-day guard)", async () => {
    await awardPoints("m_4421", "streak_bonus");
    const result = await awardPoints("m_4421", "streak_bonus");
    expect(result.points).toBe(0);
    expect(result.balance).toBe(5);
  });

  test("a disabled rule awards nothing", async () => {
    await db.rewardRules.update("rr_streak_bonus", { enabled: false });
    const result = await awardPoints("m_4421", "streak_bonus");
    expect(result.points).toBe(0);
    expect(result.balance).toBe(0);
  });
});
