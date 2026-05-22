/**
 * Server tests for CMS taxonomy + rules admin routes (issue #135).
 *
 * These mirror the article lifecycle server tests and skip when a real
 * DATABASE_URL is unavailable.
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

function cmsHeaders(role: string): Headers {
  return new Headers({
    "content-type": "application/json",
    "x-cms-role": role,
  });
}

function uniqueName(prefix: string): string {
  return `${prefix} ${Date.now()} ${Math.random().toString(36).slice(2, 8)}`;
}

describe.skipIf(skip)("CMS taxonomy routes (issue #135)", () => {
  test("DELETE /api/cms/categories/:id blocks referenced categories", async () => {
    const { POST } = await import("./categories/route");
    const { DELETE } = await import("./categories/[id]/route");
    const name = uniqueName("Referenced Category");
    const create = await POST(
      new Request("http://localhost/api/cms/categories", {
        method: "POST",
        headers: cmsHeaders("admin"),
        body: JSON.stringify({ name }),
      })
    );
    expect(create.status).toBe(201);
    const category = (await create.json()) as { id: string; name: string };

    const article = await prisma.article.create({
      data: {
        slug: `taxonomy-category-${category.id}`,
        title: "Referenced taxonomy article",
        cat: category.name,
        tag: "taxonomy-test",
        kind: "brand",
        status: "draft",
      },
    });

    try {
      const res = await DELETE(
        new Request(`http://localhost/api/cms/categories/${category.id}`, {
          method: "DELETE",
          headers: cmsHeaders("admin"),
        }),
        { params: Promise.resolve({ id: category.id }) }
      );
      expect(res.status).toBe(409);
      const body = (await res.json()) as { error: string };
      expect(body.error).toContain("Cannot delete");
      expect(body.error).toContain("category");
    } finally {
      await prisma.article.delete({ where: { id: article.id } });
      await prisma.category.deleteMany({ where: { id: category.id } });
    }
  });

  test("POST /api/cms/tags is gated by manage_taxonomy", async () => {
    const { POST } = await import("./tags/route");
    const res = await POST(
      new Request("http://localhost/api/cms/tags", {
        method: "POST",
        headers: cmsHeaders("editor"),
        body: JSON.stringify({ name: uniqueName("Forbidden Tag") }),
      })
    );
    expect(res.status).toBe(403);
  });
});

describe.skipIf(skip)("CMS rule routes (issue #135)", () => {
  test("PUT /api/cms/rules/growth/:level edits thresholds and config cap", async () => {
    const { GET } = await import("./rules/growth/route");
    const { PUT: PUT_LEVEL } = await import("./rules/growth/[level]/route");
    const { PUT: PUT_CONFIG } = await import("./rules/growth/config/route");

    const before = await prisma.growthRule.findUniqueOrThrow({
      where: { level: 2 },
    });
    const beforeConfig = await prisma.growthConfig.upsert({
      where: { id: "default" },
      update: {},
      create: { id: "default", maxItemsPerMember: 3 },
    });

    try {
      const updatedThreshold = before.threshold + 7;
      const ruleRes = await PUT_LEVEL(
        new Request("http://localhost/api/cms/rules/growth/2", {
          method: "PUT",
          headers: cmsHeaders("admin"),
          body: JSON.stringify({ threshold: updatedThreshold }),
        }),
        { params: Promise.resolve({ level: "2" }) }
      );
      expect(ruleRes.status).toBe(200);
      const ruleBody = (await ruleRes.json()) as {
        level: number;
        threshold: number;
      };
      expect(ruleBody).toMatchObject({ level: 2, threshold: updatedThreshold });

      const configRes = await PUT_CONFIG(
        new Request("http://localhost/api/cms/rules/growth/config", {
          method: "PUT",
          headers: cmsHeaders("admin"),
          body: JSON.stringify({
            maxItemsPerMember: beforeConfig.maxItemsPerMember + 1,
          }),
        })
      );
      expect(configRes.status).toBe(200);

      const getRes = await GET(
        new Request("http://localhost/api/cms/rules/growth")
      );
      const body = (await getRes.json()) as {
        config: { maxItemsPerMember: number };
        rules: Array<{ level: number; threshold: number }>;
      };
      expect(body.rules.find((rule) => rule.level === 2)?.threshold).toBe(
        updatedThreshold
      );
      expect(body.config.maxItemsPerMember).toBe(
        beforeConfig.maxItemsPerMember + 1
      );
    } finally {
      await prisma.growthRule.update({
        where: { level: before.level },
        data: {
          jp: before.jp,
          name: before.name,
          threshold: before.threshold,
        },
      });
      await prisma.growthConfig.upsert({
        where: { id: "default" },
        update: { maxItemsPerMember: beforeConfig.maxItemsPerMember },
        create: beforeConfig,
      });
    }
  });

  test("PUT /api/cms/rules/rewards/:id edits point values used by awards", async () => {
    const { PUT } = await import("./rules/rewards/[id]/route");
    const { POST: EVENT_POST } = await import("../events/route");

    const rule = await prisma.rewardRule.findUniqueOrThrow({
      where: { id: "rr_read" },
    });
    const userId = `rule-user-${Date.now()}`;
    const articleId = `rule-article-${Date.now()}`;

    await prisma.user.create({
      data: {
        id: userId,
        email: `${userId}@example.com`,
        name: "Rule User",
      },
    });

    try {
      const newPoints = rule.points + 3;
      const res = await PUT(
        new Request(`http://localhost/api/cms/rules/rewards/${rule.id}`, {
          method: "PUT",
          headers: cmsHeaders("admin"),
          body: JSON.stringify({ points: newPoints }),
        }),
        { params: Promise.resolve({ id: rule.id }) }
      );
      expect(res.status).toBe(200);
      const body = (await res.json()) as { id: string; points: number };
      expect(body).toMatchObject({ id: rule.id, points: newPoints });

      const eventRes = await EVENT_POST(
        new Request("http://localhost/api/events", {
          method: "POST",
          headers: new Headers({ "content-type": "application/json" }),
          body: JSON.stringify({
            userId,
            action: "read_complete",
            articleId,
          }),
        })
      );
      expect(eventRes.status).toBe(200);
      const eventBody = (await eventRes.json()) as { points: number };
      expect(eventBody.points).toBeGreaterThanOrEqual(newPoints);
    } finally {
      await prisma.rewardRule.update({
        where: { id: rule.id },
        data: {
          enabled: rule.enabled,
          limitType: rule.limitType,
          points: rule.points,
        },
      });
      await prisma.behaviorLog.deleteMany({ where: { userId } });
      await prisma.pointLedgerEntry.deleteMany({ where: { userId } });
      await prisma.growthItem.deleteMany({ where: { userId } });
      await prisma.user.deleteMany({ where: { id: userId } });
    }
  });
});

describe.skipIf(!skip)(
  "CMS taxonomy + rules — server tests (skipped, no DATABASE_URL)",
  () => {
    test("documented skip path: set DATABASE_URL to a real Postgres", () => {
      expect(skip).toBe(true);
    });
  }
);
