/**
 * Server tests for CMS article lifecycle routes (issue #129).
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

// In mock API mode, guardRole trusts x-cms-role header
function cmsHeaders(role: string): Headers {
  return new Headers({
    "x-cms-role": role,
    "content-type": "application/json",
  });
}

describe.skipIf(skip)("CMS article lifecycle (issue #129)", () => {
  let testArticleId: string;

  test("POST /api/cms/articles — editor can create a draft", async () => {
    const { POST } = await import("./route");
    const res = await POST(
      new Request("http://localhost/api/cms/articles", {
        method: "POST",
        headers: cmsHeaders("editor"),
        body: JSON.stringify({ title: "Test Draft", tag: "test" }),
      })
    );
    expect(res.status).toBe(201);
    const body = (await res.json()) as {
      id: string;
      status: string;
      title: string;
    };
    expect(body.title).toBe("Test Draft");
    expect(body.status).toBe("draft");
    testArticleId = body.id;
  });

  test("POST /api/cms/articles — reader role is rejected (401)", async () => {
    const { POST } = await import("./route");
    const res = await POST(
      new Request("http://localhost/api/cms/articles", {
        method: "POST",
        headers: new Headers({
          "x-cms-role": "reader" as string,
          "content-type": "application/json",
        }),
        body: JSON.stringify({ title: "Nope" }),
      })
    );
    // reader is not a valid CmsRole, so guardRole returns 401
    expect(res.status).toBe(401);
  });

  test("PUT /api/cms/articles/:id — editor can edit", async () => {
    const { PUT } = await import("./[id]/route");
    const res = await PUT(
      new Request(`http://localhost/api/cms/articles/${testArticleId}`, {
        method: "PUT",
        headers: cmsHeaders("editor"),
        body: JSON.stringify({ title: "Updated Title" }),
      }),
      { params: Promise.resolve({ id: testArticleId }) }
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as { title: string };
    expect(body.title).toBe("Updated Title");
  });

  test("POST publish — editor is forbidden (403)", async () => {
    const { POST } = await import("./[id]/publish/route");
    const res = await POST(
      new Request(
        `http://localhost/api/cms/articles/${testArticleId}/publish`,
        {
          method: "POST",
          headers: cmsHeaders("editor"),
        }
      ),
      { params: Promise.resolve({ id: testArticleId }) }
    );
    expect(res.status).toBe(403);
  });

  test("POST publish — publisher succeeds", async () => {
    const { POST } = await import("./[id]/publish/route");
    const res = await POST(
      new Request(
        `http://localhost/api/cms/articles/${testArticleId}/publish`,
        {
          method: "POST",
          headers: cmsHeaders("publisher"),
        }
      ),
      { params: Promise.resolve({ id: testArticleId }) }
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as { ok: boolean; status: string };
    expect(body.ok).toBe(true);
    expect(body.status).toBe("published");
  });

  test("POST unpublish — publisher succeeds", async () => {
    const { POST } = await import("./[id]/unpublish/route");
    const res = await POST(
      new Request(
        `http://localhost/api/cms/articles/${testArticleId}/unpublish`,
        { method: "POST", headers: cmsHeaders("publisher") }
      ),
      { params: Promise.resolve({ id: testArticleId }) }
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as { ok: boolean; status: string };
    expect(body.status).toBe("unpublished");
  });

  test("POST schedule — admin succeeds", async () => {
    const { POST } = await import("./[id]/schedule/route");
    const future = new Date(Date.now() + 86_400_000).toISOString();
    const res = await POST(
      new Request(
        `http://localhost/api/cms/articles/${testArticleId}/schedule`,
        {
          method: "POST",
          headers: cmsHeaders("admin"),
          body: JSON.stringify({ scheduledAt: future }),
        }
      ),
      { params: Promise.resolve({ id: testArticleId }) }
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as { ok: boolean; status: string };
    expect(body.status).toBe("scheduled");
  });

  test("scheduled article with past scheduledAt is publicly visible", async () => {
    // Set scheduledAt to the past
    const past = new Date(Date.now() - 60_000).toISOString();
    await prisma.article.update({
      where: { id: testArticleId },
      data: { status: "scheduled", scheduledAt: new Date(past) },
    });

    const { GET } = await import("../../stories/route");
    const res = await GET(
      new Request("http://localhost/api/stories?kind=brand&limit=50")
    );
    const body = (await res.json()) as {
      items: Array<{ id: string }>;
    };
    const found = body.items.some((item) => item.id === testArticleId);
    expect(found).toBe(true);

    // Clean up test article
    await prisma.article.delete({ where: { id: testArticleId } });
  });
});

describe.skipIf(!skip)(
  "CMS article lifecycle — server tests (skipped, no DATABASE_URL)",
  () => {
    test("documented skip path: set DATABASE_URL to a real Postgres", () => {
      expect(skip).toBe(true);
    });
  }
);
