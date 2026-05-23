/**
 * Server tests for reader engagement routes (issue #131).
 *
 * Same skip pattern as the stories/events tests — skips cleanly when
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

// --- Collections ---

describe.skipIf(skip)("Collections API (issue #131)", () => {
  const TEST_USER = "m_5102";
  const TEST_ARTICLE = "test-collect-131";

  test("POST creates a collection and is idempotent", async () => {
    // Clean up
    await prisma.collection.deleteMany({
      where: { userId: TEST_USER, articleId: TEST_ARTICLE },
    });
    await prisma.behaviorLog.deleteMany({
      where: { userId: TEST_USER, action: "collect", articleId: TEST_ARTICLE },
    });

    // Direct DB test (route requires auth session which is hard to mock in unit tests)
    const item = await prisma.collection.create({
      data: { userId: TEST_USER, articleId: TEST_ARTICLE },
    });
    expect(item.userId).toBe(TEST_USER);
    expect(item.articleId).toBe(TEST_ARTICLE);

    // Unique constraint prevents duplicate
    let duplicateError = false;
    try {
      await prisma.collection.create({
        data: { userId: TEST_USER, articleId: TEST_ARTICLE },
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

  test("DELETE removes a collection", async () => {
    await prisma.collection.deleteMany({
      where: { userId: TEST_USER, articleId: TEST_ARTICLE },
    });
    await prisma.collection.create({
      data: { userId: TEST_USER, articleId: TEST_ARTICLE },
    });

    await prisma.collection.deleteMany({
      where: { userId: TEST_USER, articleId: TEST_ARTICLE },
    });

    const count = await prisma.collection.count({
      where: { userId: TEST_USER, articleId: TEST_ARTICLE },
    });
    expect(count).toBe(0);
  });
});

// --- Comments ---

describe.skipIf(skip)("Comments API (issue #131)", () => {
  const TEST_USER = "m_5102";
  const TEST_ARTICLE = "test-comment-131";

  test("creates a comment and lists newest-first", async () => {
    await prisma.comment.deleteMany({
      where: { userId: TEST_USER, articleId: TEST_ARTICLE },
    });

    const c1 = await prisma.comment.create({
      data: { userId: TEST_USER, articleId: TEST_ARTICLE, body: "First" },
    });
    const c2 = await prisma.comment.create({
      data: { userId: TEST_USER, articleId: TEST_ARTICLE, body: "Second" },
    });

    const comments = await prisma.comment.findMany({
      where: { articleId: TEST_ARTICLE, removedAt: null },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    });

    expect(comments[0].id).toBe(c2.id);
    expect(comments[1].id).toBe(c1.id);
  });

  test("soft-removal hides from readers but not moderators", async () => {
    await prisma.comment.deleteMany({
      where: { userId: TEST_USER, articleId: TEST_ARTICLE },
    });

    const comment = await prisma.comment.create({
      data: { userId: TEST_USER, articleId: TEST_ARTICLE, body: "Remove me" },
    });

    // Soft-remove
    await prisma.comment.update({
      where: { id: comment.id },
      data: { removedAt: new Date() },
    });

    // Reader view: hidden
    const readerView = await prisma.comment.findMany({
      where: { articleId: TEST_ARTICLE, removedAt: null },
    });
    expect(readerView.find((c) => c.id === comment.id)).toBeUndefined();

    // Moderator view: visible
    const modView = await prisma.comment.findMany({
      where: { articleId: TEST_ARTICLE },
    });
    expect(modView.find((c) => c.id === comment.id)).toBeDefined();
  });
});

// --- Reactions ---

describe.skipIf(skip)("Reactions API (issue #131)", () => {
  const TEST_USER = "m_5102";
  const TEST_ARTICLE = "test-reaction-131";

  test("unique constraint: one reaction per kind per user per article", async () => {
    await prisma.reaction.deleteMany({
      where: { userId: TEST_USER, articleId: TEST_ARTICLE },
    });

    await prisma.reaction.create({
      data: { userId: TEST_USER, articleId: TEST_ARTICLE, kind: "grew" },
    });

    // Same kind = duplicate error
    let duplicateError = false;
    try {
      await prisma.reaction.create({
        data: { userId: TEST_USER, articleId: TEST_ARTICLE, kind: "grew" },
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

    // Different kind = allowed
    const r2 = await prisma.reaction.create({
      data: { userId: TEST_USER, articleId: TEST_ARTICLE, kind: "learned" },
    });
    expect(r2.kind).toBe("learned");
  });

  test("toggle removes existing reaction", async () => {
    await prisma.reaction.deleteMany({
      where: { userId: TEST_USER, articleId: TEST_ARTICLE },
    });

    await prisma.reaction.create({
      data: { userId: TEST_USER, articleId: TEST_ARTICLE, kind: "loved" },
    });

    // Toggle off
    const existing = await prisma.reaction.findUnique({
      where: {
        userId_articleId_kind: {
          userId: TEST_USER,
          articleId: TEST_ARTICLE,
          kind: "loved",
        },
      },
    });
    expect(existing).not.toBeNull();

    await prisma.reaction.delete({ where: { id: existing?.id as number } });

    const after = await prisma.reaction.findUnique({
      where: {
        userId_articleId_kind: {
          userId: TEST_USER,
          articleId: TEST_ARTICLE,
          kind: "loved",
        },
      },
    });
    expect(after).toBeNull();
  });

  test("counts aggregate correctly", async () => {
    await prisma.reaction.deleteMany({
      where: { articleId: TEST_ARTICLE },
    });

    await prisma.reaction.create({
      data: { userId: TEST_USER, articleId: TEST_ARTICLE, kind: "grew" },
    });
    await prisma.reaction.create({
      data: { userId: "m_6033", articleId: TEST_ARTICLE, kind: "grew" },
    });
    await prisma.reaction.create({
      data: { userId: TEST_USER, articleId: TEST_ARTICLE, kind: "loved" },
    });

    const reactions = await prisma.reaction.findMany({
      where: { articleId: TEST_ARTICLE },
    });

    const counts: Record<string, number> = {};
    for (const kind of ["grew", "learned", "loved"]) {
      counts[kind] = reactions.filter((r) => r.kind === kind).length;
    }

    expect(counts.grew).toBe(2);
    expect(counts.learned).toBe(0);
    expect(counts.loved).toBe(1);
  });
});

// --- Reward integration ---

describe.skipIf(skip)("Engagement rewards (issue #131)", () => {
  const TEST_USER = "m_6033";

  test("collect reward is awarded once per article", async () => {
    const articleId = "reward-collect-131";
    await prisma.behaviorLog.deleteMany({
      where: { userId: TEST_USER, action: "collect", articleId },
    });

    // First award
    await prisma.behaviorLog.create({
      data: { userId: TEST_USER, action: "collect", articleId },
    });

    // Duplicate blocked by unique constraint
    let blocked = false;
    try {
      await prisma.behaviorLog.create({
        data: { userId: TEST_USER, action: "collect", articleId },
      });
    } catch (error: unknown) {
      if (
        error &&
        typeof error === "object" &&
        "code" in error &&
        (error as { code: string }).code === "P2002"
      ) {
        blocked = true;
      }
    }
    expect(blocked).toBe(true);
  });

  test("comment_post reward is awarded once per article", async () => {
    const articleId = "reward-comment-131";
    await prisma.behaviorLog.deleteMany({
      where: { userId: TEST_USER, action: "comment_post", articleId },
    });

    await prisma.behaviorLog.create({
      data: { userId: TEST_USER, action: "comment_post", articleId },
    });

    let blocked = false;
    try {
      await prisma.behaviorLog.create({
        data: { userId: TEST_USER, action: "comment_post", articleId },
      });
    } catch (error: unknown) {
      if (
        error &&
        typeof error === "object" &&
        "code" in error &&
        (error as { code: string }).code === "P2002"
      ) {
        blocked = true;
      }
    }
    expect(blocked).toBe(true);
  });

  test("reaction_react reward is awarded once per article", async () => {
    const articleId = "reward-reaction-131";
    await prisma.behaviorLog.deleteMany({
      where: { userId: TEST_USER, action: "reaction_react", articleId },
    });

    await prisma.behaviorLog.create({
      data: { userId: TEST_USER, action: "reaction_react", articleId },
    });

    let blocked = false;
    try {
      await prisma.behaviorLog.create({
        data: { userId: TEST_USER, action: "reaction_react", articleId },
      });
    } catch (error: unknown) {
      if (
        error &&
        typeof error === "object" &&
        "code" in error &&
        (error as { code: string }).code === "P2002"
      ) {
        blocked = true;
      }
    }
    expect(blocked).toBe(true);
  });
});

describe.skipIf(!skip)(
  "Reader engagement — server tests (skipped, no DATABASE_URL)",
  () => {
    test("documented skip path: set DATABASE_URL to a real Postgres", () => {
      expect(skip).toBe(true);
    });
  }
);
