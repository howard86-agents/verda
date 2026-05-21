import "./test-setup";
import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { adjustPoints, currentBalance, softDeleteMember } from "./audit";
import { db } from "./db";

const MEMBER_ID = "m_test";
const ADMIN_ID = "admin_admin_01";

const REASON_REQUIRED = /Reason is required/;
const NON_ZERO = /non-zero/;
const NOT_FOUND = /not found/;

async function seedMember() {
  await db.members.put({
    id: MEMBER_ID,
    name: "Test Member",
    email: "test@example.com",
    joined: "Joined Jan 2026",
  });
  await db.growthRules.bulkPut([
    { level: 1, name: "Seed", jp: "種", threshold: 0 },
    { level: 2, name: "Sprout", jp: "芽", threshold: 50 },
    { level: 3, name: "Bloom", jp: "花", threshold: 150 },
  ]);
}

describe("currentBalance()", () => {
  beforeEach(async () => {
    await db.open();
    await seedMember();
  });

  afterEach(async () => {
    await db.delete();
  });

  test("returns 0 for a fresh member", async () => {
    expect(await currentBalance(MEMBER_ID)).toBe(0);
  });

  test("returns the latest balanceAfter from the ledger", async () => {
    await db.pointLedger.add({
      memberId: MEMBER_ID,
      amount: 10,
      balanceAfter: 10,
      reason: "read",
      createdAt: "2026-05-01T00:00:00Z",
    });
    await db.pointLedger.add({
      memberId: MEMBER_ID,
      amount: 5,
      balanceAfter: 15,
      reason: "check_in",
      createdAt: "2026-05-02T00:00:00Z",
    });
    expect(await currentBalance(MEMBER_ID)).toBe(15);
  });
});

describe("adjustPoints()", () => {
  beforeEach(async () => {
    await db.open();
    await seedMember();
  });

  afterEach(async () => {
    await db.delete();
  });

  test("adds points and writes paired ledger + audit rows", async () => {
    const result = await adjustPoints({
      memberId: MEMBER_ID,
      adminId: ADMIN_ID,
      amount: 25,
      reason: "CS goodwill",
    });

    expect(result.balanceBefore).toBe(0);
    expect(result.balanceAfter).toBe(25);
    expect(result.level).toBe(1);

    const ledger = await db.pointLedger.toArray();
    expect(ledger).toHaveLength(1);
    expect(ledger[0]).toMatchObject({
      memberId: MEMBER_ID,
      amount: 25,
      balanceAfter: 25,
      reason: "CS goodwill",
    });

    const audit = await db.auditLog.toArray();
    expect(audit).toHaveLength(1);
    expect(audit[0]).toMatchObject({
      action: "point_adjust",
      memberId: MEMBER_ID,
      adminId: ADMIN_ID,
      amount: 25,
      balanceBefore: 0,
      balanceAfter: 25,
      reason: "CS goodwill",
    });
  });

  test("supports negative amounts (deduction) without shrinking growth", async () => {
    await adjustPoints({
      memberId: MEMBER_ID,
      adminId: ADMIN_ID,
      amount: 60,
      reason: "Initial credit",
    });

    const result = await adjustPoints({
      memberId: MEMBER_ID,
      adminId: ADMIN_ID,
      amount: -20,
      reason: "Reversal",
    });

    expect(result.balanceBefore).toBe(60);
    expect(result.balanceAfter).toBe(40);
    expect(result.level).toBe(1);

    const audit = await db.auditLog.toArray();
    expect(audit).toHaveLength(2);
    expect(audit[1]).toMatchObject({
      amount: -20,
      balanceBefore: 60,
      balanceAfter: 40,
      reason: "Reversal",
    });

    // Per the issue #67 product decision, negative admin adjustments are
    // ledger/audit only and never shrink the growth-item collection.
    const growth = await db.growthItems
      .where("memberId")
      .equals(MEMBER_ID)
      .first();
    expect(growth?.nutrients).toBe(60);
    expect(growth?.level).toBe(2);
  });

  test("crossing a threshold updates the active growth item level", async () => {
    const result = await adjustPoints({
      memberId: MEMBER_ID,
      adminId: ADMIN_ID,
      amount: 75,
      reason: "Goodwill bonus",
    });
    expect(result.level).toBe(2);
    const growth = await db.growthItems
      .where("memberId")
      .equals(MEMBER_ID)
      .first();
    expect(growth?.level).toBe(2);
    expect(growth?.nutrients).toBe(75);
    expect(growth?.sequence).toBe(1);
  });

  test("zero-amount adjustments are rejected (growth untouched)", async () => {
    await expect(
      adjustPoints({
        memberId: MEMBER_ID,
        adminId: ADMIN_ID,
        amount: 0,
        reason: "noop",
      })
    ).rejects.toThrow(NON_ZERO);
    expect(await db.growthItems.count()).toBe(0);
  });

  test("rejects empty reason", async () => {
    await expect(
      adjustPoints({
        memberId: MEMBER_ID,
        adminId: ADMIN_ID,
        amount: 10,
        reason: "   ",
      })
    ).rejects.toThrow(REASON_REQUIRED);

    expect(await db.pointLedger.count()).toBe(0);
    expect(await db.auditLog.count()).toBe(0);
  });

  test("rejects zero or non-finite amount", async () => {
    await expect(
      adjustPoints({
        memberId: MEMBER_ID,
        adminId: ADMIN_ID,
        amount: 0,
        reason: "noop",
      })
    ).rejects.toThrow(NON_ZERO);

    await expect(
      adjustPoints({
        memberId: MEMBER_ID,
        adminId: ADMIN_ID,
        amount: Number.NaN,
        reason: "bad",
      })
    ).rejects.toThrow(NON_ZERO);
  });
});

describe("softDeleteMember()", () => {
  beforeEach(async () => {
    await db.open();
    await seedMember();
  });

  afterEach(async () => {
    await db.delete();
  });

  test("stamps deletedAt and writes an audit entry", async () => {
    const before = await db.members.get(MEMBER_ID);
    expect(before?.deletedAt).toBeUndefined();

    const { deletedAt } = await softDeleteMember({
      memberId: MEMBER_ID,
      adminId: ADMIN_ID,
      reason: "GDPR request #145",
    });

    expect(typeof deletedAt).toBe("string");
    const after = await db.members.get(MEMBER_ID);
    expect(after?.deletedAt).toBe(deletedAt);

    const audit = await db.auditLog
      .where("memberId")
      .equals(MEMBER_ID)
      .toArray();
    expect(audit).toHaveLength(1);
    expect(audit[0]).toMatchObject({
      action: "member_delete",
      adminId: ADMIN_ID,
      reason: "GDPR request #145",
    });
    expect(audit[0]?.amount).toBeUndefined();
  });

  test("rejects empty reason", async () => {
    await expect(
      softDeleteMember({
        memberId: MEMBER_ID,
        adminId: ADMIN_ID,
        reason: "",
      })
    ).rejects.toThrow(REASON_REQUIRED);
  });

  test("rejects unknown member", async () => {
    await expect(
      softDeleteMember({
        memberId: "m_does_not_exist",
        adminId: ADMIN_ID,
        reason: "ghost",
      })
    ).rejects.toThrow(NOT_FOUND);
  });
});
