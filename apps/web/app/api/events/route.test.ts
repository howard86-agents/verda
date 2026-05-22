/**
 * Server tests for the gamification events route (issue #130).
 *
 * Same skip pattern as the stories tests — skips cleanly when
 * DATABASE_URL is missing or points at the placeholder.
 */
import { describe, expect, test } from "bun:test";
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

describe.skipIf(skip)("POST /api/events (issue #130)", () => {
  // Use a test user that exists from the seed
  const TEST_USER_ID = "m_5102";
  const TEST_ARTICLE = "test-article-130";

  test("read_complete awards points and writes ledger", async () => {
    // Clean up any prior test data
    await prisma.behaviorLog.deleteMany({
      where: {
        userId: TEST_USER_ID,
        action: "read_complete",
        articleId: TEST_ARTICLE,
      },
    });

    const { POST } = await import("./route");
    const res = await POST(
      new Request("http://localhost/api/events", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          userId: TEST_USER_ID,
          action: "read_complete",
          articleId: TEST_ARTICLE,
        }),
      })
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      ok: boolean;
      points: number;
      balance: number;
    };
    expect(body.ok).toBe(true);
    expect(body.points).toBeGreaterThan(0);
    expect(body.balance).toBeGreaterThan(0);

    // Verify ledger entry was written
    const ledger = await prisma.pointLedgerEntry.findFirst({
      where: { userId: TEST_USER_ID, reason: { contains: "read_complete" } },
      orderBy: { id: "desc" },
    });
    expect(ledger).not.toBeNull();
    expect(ledger?.amount).toBe(10);
  });

  test("idempotency: duplicate read_complete returns 409", async () => {
    const { POST } = await import("./route");
    const res = await POST(
      new Request("http://localhost/api/events", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          userId: TEST_USER_ID,
          action: "read_complete",
          articleId: TEST_ARTICLE,
        }),
      })
    );
    expect(res.status).toBe(409);
  });

  test("daily_check_in awards points", async () => {
    // Clean up today's check-in if any
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    await prisma.behaviorLog.deleteMany({
      where: {
        userId: TEST_USER_ID,
        action: "daily_check_in",
        createdAt: { gte: today },
      },
    });

    const { POST } = await import("./route");
    const res = await POST(
      new Request("http://localhost/api/events", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          userId: TEST_USER_ID,
          action: "daily_check_in",
        }),
      })
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as { ok: boolean; points: number };
    expect(body.ok).toBe(true);
    expect(body.points).toBeGreaterThan(0);
  });

  test("growth allocation creates growth item", async () => {
    const items = await prisma.growthItem.findMany({
      where: { userId: TEST_USER_ID },
    });
    expect(items.length).toBeGreaterThan(0);
    expect(items[0].nutrients).toBeGreaterThan(0);
  });
});

describe.skipIf(!skip)(
  "POST /api/events — server tests (skipped, no DATABASE_URL)",
  () => {
    test("documented skip path: set DATABASE_URL to a real Postgres", () => {
      expect(skip).toBe(true);
    });
  }
);
