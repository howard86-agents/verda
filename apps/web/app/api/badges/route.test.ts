/**
 * Server tests for achievement badges (issue #138).
 *
 * Same skip pattern as other server tests.
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

describe.skipIf(skip)("Achievement badges (issue #138)", () => {
  const TEST_USER = "m_7188";

  test("evaluateBadges grants first_read after a read_complete log", async () => {
    // Clean slate
    await prisma.memberBadge.deleteMany({ where: { userId: TEST_USER } });
    await prisma.behaviorLog.deleteMany({ where: { userId: TEST_USER } });

    // Simulate a read_complete
    await prisma.behaviorLog.create({
      data: { userId: TEST_USER, action: "read_complete", articleId: "art-1" },
    });

    const { evaluateBadges } = await import("./evaluate");
    const awarded = await evaluateBadges(TEST_USER);
    expect(awarded).toContain("first_read");

    // Verify persisted
    const badge = await prisma.memberBadge.findUnique({
      where: { userId_badgeId: { userId: TEST_USER, badgeId: "first_read" } },
    });
    expect(badge).not.toBeNull();
  });

  test("evaluateBadges is idempotent — no duplicate grants", async () => {
    const { evaluateBadges } = await import("./evaluate");
    const second = await evaluateBadges(TEST_USER);
    // first_read already granted above, should not appear again
    expect(second).not.toContain("first_read");
  });

  test("unique constraint prevents duplicate badge rows", async () => {
    let duplicateError = false;
    try {
      await prisma.memberBadge.create({
        data: { userId: TEST_USER, badgeId: "first_read" },
      });
    } catch (error: unknown) {
      if (
        error &&
        typeof error === "object" &&
        "code" in error &&
        (error as { code: string }).code === "P2002"
      ) {
        duplicateError = true;
      }
    }
    expect(duplicateError).toBe(true);
  });

  test("commenter badge granted after posting a comment", async () => {
    await prisma.memberBadge.deleteMany({
      where: { userId: TEST_USER, badgeId: "commenter" },
    });
    await prisma.comment.deleteMany({ where: { userId: TEST_USER } });

    await prisma.comment.create({
      data: { userId: TEST_USER, articleId: "art-1", body: "Nice!" },
    });

    const { evaluateBadges } = await import("./evaluate");
    const awarded = await evaluateBadges(TEST_USER);
    expect(awarded).toContain("commenter");
  });

  test("reader_10 requires 10 distinct reads", async () => {
    await prisma.memberBadge.deleteMany({
      where: { userId: TEST_USER, badgeId: "reader_10" },
    });
    await prisma.behaviorLog.deleteMany({
      where: { userId: TEST_USER, action: "read_complete" },
    });

    // Create 9 reads — should not earn reader_10
    for (let i = 1; i <= 9; i++) {
      await prisma.behaviorLog.create({
        data: {
          userId: TEST_USER,
          action: "read_complete",
          articleId: `art-${i}`,
        },
      });
    }

    const { evaluateBadges } = await import("./evaluate");
    let awarded = await evaluateBadges(TEST_USER);
    expect(awarded).not.toContain("reader_10");

    // 10th read triggers it
    await prisma.behaviorLog.create({
      data: {
        userId: TEST_USER,
        action: "read_complete",
        articleId: "art-10",
      },
    });

    awarded = await evaluateBadges(TEST_USER);
    expect(awarded).toContain("reader_10");
  });

  test("first_bloom requires growth item at level 3", async () => {
    await prisma.memberBadge.deleteMany({
      where: { userId: TEST_USER, badgeId: "first_bloom" },
    });
    await prisma.growthItem.deleteMany({ where: { userId: TEST_USER } });

    // Level 2 — not enough
    await prisma.growthItem.create({
      data: { userId: TEST_USER, nutrients: 50, level: 2, sequence: 1 },
    });

    const { evaluateBadges } = await import("./evaluate");
    let awarded = await evaluateBadges(TEST_USER);
    expect(awarded).not.toContain("first_bloom");

    // Level 3 — triggers
    await prisma.growthItem.updateMany({
      where: { userId: TEST_USER },
      data: { level: 3, nutrients: 150 },
    });

    awarded = await evaluateBadges(TEST_USER);
    expect(awarded).toContain("first_bloom");
  });
});

describe.skipIf(!skip)(
  "Achievement badges — server tests (skipped, no DATABASE_URL)",
  () => {
    test("documented skip path: set DATABASE_URL to a real Postgres", () => {
      expect(skip).toBe(true);
    });
  }
);
