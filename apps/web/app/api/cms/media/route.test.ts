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

function cmsHeaders(role: string): Headers {
  return new Headers({
    "content-type": "application/json",
    "x-cms-role": role,
  });
}

describe("CMS media signing authorization (issue #136)", () => {
  test("reader role cannot sign uploads", async () => {
    const { POST } = await import("./sign/route");
    const res = await POST(
      new Request("http://localhost/api/cms/media/sign", {
        method: "POST",
        headers: cmsHeaders("reader"),
        body: JSON.stringify({
          filename: "blocked.png",
          mimeType: "image/png",
        }),
      })
    );
    // `reader` is not a valid CmsRole; guardRole returns 401, not 403.
    expect(res.status).toBe(401);
  });

  test("editor role receives a short-lived signed upload URL", async () => {
    const { POST } = await import("./sign/route");
    const res = await POST(
      new Request("http://localhost/api/cms/media/sign", {
        method: "POST",
        headers: cmsHeaders("editor"),
        body: JSON.stringify({ filename: "hero.png", mimeType: "image/png" }),
      })
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      expiresAt: string;
      method: string;
      path: string;
      publicUrl: string;
      uploadUrl: string;
    };
    expect(body.method).toBe("PUT");
    expect(body.path).toContain("hero.png");
    expect(body.uploadUrl).toContain("/api/storage/local");
    expect(new Date(body.expiresAt).getTime()).toBeGreaterThan(Date.now());
  });
});

describe.skipIf(!ready)("CMS media metadata persistence (issue #136)", () => {
  test("records media asset metadata after direct upload", async () => {
    const { POST } = await import("./route");
    const path = `media/test-${Date.now()}.png`;
    const res = await POST(
      new Request("http://localhost/api/cms/media", {
        method: "POST",
        headers: cmsHeaders("editor"),
        body: JSON.stringify({
          alt: "test asset",
          filename: "test.png",
          mimeType: "image/png",
          path,
          provider: "local",
          url: `/api/storage/local/public/${encodeURIComponent(path)}`,
        }),
      })
    );
    expect(res.status).toBe(201);
    const body = (await res.json()) as { id: string; url: string };
    expect(body.url).toContain("/api/storage/local/public/");

    const row = await prisma.mediaAsset.findUnique({ where: { id: body.id } });
    expect(row?.filename).toBe("test.png");
    expect(row?.mimeType).toBe("image/png");
    expect(row?.url).toBe(body.url);

    await prisma.mediaAsset.delete({ where: { id: body.id } });
  });
});

describe.skipIf(ready)(
  "CMS media metadata persistence — server test skipped (no DATABASE_URL)",
  () => {
    test("documented skip path: set DATABASE_URL to a migrated Postgres", () => {
      expect(ready).toBe(false);
    });
  }
);
