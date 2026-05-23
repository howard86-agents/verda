/**
 * Server tests for growth-item redemptions (issue #132).
 *
 * Uses the same skip pattern as the rest of the server suite — skips
 * cleanly when DATABASE_URL is missing or points at the placeholder
 * so `bun test` stays green in CI without a provisioned database.
 */
import { afterAll, describe, expect, test } from "bun:test";
import { prisma } from "@verda/database";

const dbUrl = process.env.DATABASE_URL ?? "";
const dbAvailable = dbUrl.length > 0 && !dbUrl.includes("placeholder");

async function probeDatabase(): Promise<boolean> {
  if (!dbAvailable) {
    return false;
  }
  try {
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch {
    return false;
  }
}

const ready = await probeDatabase();
const skip = !ready;

async function resetTestUser(userId: string) {
  await prisma.redemption.deleteMany({ where: { userId } });
  await prisma.growthItem.deleteMany({ where: { userId } });
  await prisma.user.upsert({
    where: { id: userId },
    update: { email: `${userId}@example.test`, name: "Redemption Test" },
    create: {
      id: userId,
      email: `${userId}@example.test`,
      name: "Redemption Test",
    },
  });
}

describe.skipIf(skip)("POST /api/redemptions (issue #132)", () => {
  const TEST_USER_ID = "m_redemptions_132";

  if (!skip) {
    afterAll(async () => {
      await prisma.redemption.deleteMany({ where: { userId: TEST_USER_ID } });
      await prisma.growthItem.deleteMany({ where: { userId: TEST_USER_ID } });
      await prisma.user.deleteMany({ where: { id: TEST_USER_ID } });
    });
  }

  test("redeems a completed growth item and stores the redemption", async () => {
    await resetTestUser(TEST_USER_ID);
    const item = await prisma.growthItem.create({
      data: {
        userId: TEST_USER_ID,
        nutrients: 300,
        level: 4,
        sequence: 1,
        completedAt: new Date("2026-05-22T00:00:00.000Z"),
      },
    });

    const { POST } = await import("./route");
    const res = await POST(
      new Request("http://localhost/api/redemptions", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ memberId: TEST_USER_ID, growthItemId: item.id }),
      })
    );

    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      ok: true;
      redemption: { growthItemId: number; rewardCode: string };
    };
    expect(body.ok).toBe(true);
    expect(body.redemption.growthItemId).toBe(item.id);
    expect(body.redemption.rewardCode).toBe("VERDA-PLANT-01");

    const stored = await prisma.redemption.findUnique({
      where: { growthItemId: item.id },
    });
    expect(stored?.userId).toBe(TEST_USER_ID);

    const updatedItem = await prisma.growthItem.findUnique({
      where: { id: item.id },
    });
    expect(updatedItem?.redeemedAt).toBeTruthy();
    expect(updatedItem?.redemptionId).toBe(stored?.id);
  });

  test("rejects a double-redeem for the same growth item", async () => {
    await resetTestUser(TEST_USER_ID);
    const item = await prisma.growthItem.create({
      data: {
        userId: TEST_USER_ID,
        nutrients: 300,
        level: 4,
        sequence: 2,
        completedAt: new Date("2026-05-22T00:00:00.000Z"),
      },
    });

    const { POST } = await import("./route");
    const first = await POST(
      new Request("http://localhost/api/redemptions", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ memberId: TEST_USER_ID, growthItemId: item.id }),
      })
    );
    expect(first.status).toBe(200);

    const second = await POST(
      new Request("http://localhost/api/redemptions", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ memberId: TEST_USER_ID, growthItemId: item.id }),
      })
    );
    expect(second.status).toBe(409);
    const body = (await second.json()) as { reason: string };
    expect(body.reason).toBe("already_redeemed");

    const count = await prisma.redemption.count({
      where: { growthItemId: item.id },
    });
    expect(count).toBe(1);
  });
});

describe.skipIf(!skip)(
  "POST /api/redemptions — server tests (skipped, no DATABASE_URL)",
  () => {
    test("documented skip path: set DATABASE_URL to a real Postgres", () => {
      expect(skip).toBe(true);
    });
  }
);
