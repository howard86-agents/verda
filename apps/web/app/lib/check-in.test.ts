import { describe, expect, test } from "bun:test";

/**
 * Tests the once-per-day guard logic used by the check_in handler.
 * The actual guard runs in the MSW handler; here we test the date comparison.
 */
function isCheckedInToday(
  logs: { action: string; createdAt: string }[]
): boolean {
  const today = new Date().toISOString().slice(0, 10);
  return logs.some(
    (l) => l.action === "check_in" && l.createdAt.slice(0, 10) === today
  );
}

describe("once-per-day check-in guard", () => {
  test("returns false for empty logs", () => {
    expect(isCheckedInToday([])).toBe(false);
  });

  test("returns false when no check_in today", () => {
    const logs = [
      { action: "check_in", createdAt: "2025-01-01T09:00:00Z" },
      { action: "read_complete", createdAt: new Date().toISOString() },
    ];
    expect(isCheckedInToday(logs)).toBe(false);
  });

  test("returns true when check_in exists today", () => {
    const logs = [{ action: "check_in", createdAt: new Date().toISOString() }];
    expect(isCheckedInToday(logs)).toBe(true);
  });

  test("returns false for check_in yesterday", () => {
    const yesterday = new Date(Date.now() - 86_400_000).toISOString();
    const logs = [{ action: "check_in", createdAt: yesterday }];
    expect(isCheckedInToday(logs)).toBe(false);
  });
});
