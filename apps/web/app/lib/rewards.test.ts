import { describe, expect, test } from "bun:test";
import { balanceFromLedger, levelFor } from "./rewards";

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
