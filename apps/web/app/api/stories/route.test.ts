/**
 * Server tests for the migrated stories Route Handlers (issue #126).
 *
 * These hit the real Prisma client against the docker-compose Postgres
 * specified in `DATABASE_URL`. They skip cleanly when the env var is
 * missing, points at the placeholder URL, or the DB simply isn't
 * reachable — that's the configuration `bun test` runs in CI today,
 * and we want the CI gate to stay green without provisioning a DB.
 *
 * Locally, run `docker compose up -d` then `bun run db:migrate:dev`
 * and `bun run db:seed` once before exercising these tests.
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

describe.skipIf(skip)("GET /api/stories — list (issue #126)", () => {
  test("returns brand stories with the documented response shape", async () => {
    const { GET } = await import("./route");
    const res = await GET(
      new Request("http://localhost/api/stories?kind=brand&page=1&limit=3")
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      items: Record<string, unknown>[];
      total: number;
      page: number;
      totalPages: number;
    };
    expect(body.page).toBe(1);
    expect(body.total).toBeGreaterThan(0);
    expect(body.totalPages).toBeGreaterThanOrEqual(1);
    expect(body.items.length).toBeGreaterThan(0);
    expect(body.items.length).toBeLessThanOrEqual(3);
    const first = body.items[0];
    // Sanity-check the wire shape — the public reader and CMS rely
    // on this exact contract.
    for (const key of [
      "id",
      "slug",
      "kind",
      "tag",
      "title",
      "img",
      "read",
      "date",
      "author",
    ] as const) {
      expect(first).toHaveProperty(key);
    }
  });

  test("filters by section and ignores non-published rows", async () => {
    const { GET } = await import("./route");
    const res = await GET(
      new Request(
        "http://localhost/api/stories?kind=brand&section=mindful-living&limit=10"
      )
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      items: Array<{ section?: string; status?: string }>;
    };
    for (const item of body.items) {
      expect(item.section).toBe("mindful-living");
      // `status` is omitted on serialised rows when empty; if
      // present it must always be `published` on the public listing.
      if (item.status != null) {
        expect(item.status).toBe("published");
      }
    }
  });
});

describe.skipIf(skip)("GET /api/stories/:slug — detail (issue #126)", () => {
  test("returns the article matching slug", async () => {
    const { GET: list } = await import("./route");
    const seed = await list(
      new Request("http://localhost/api/stories?kind=brand&page=1&limit=1")
    );
    const seedBody = (await seed.json()) as {
      items: Array<{ slug: string; title: string }>;
    };
    const target = seedBody.items[0];
    expect(target).toBeDefined();

    const { GET: detail } = await import("./[slug]/route");
    const res = await detail(
      new Request(`http://localhost/api/stories/${target.slug}`),
      { params: Promise.resolve({ slug: target.slug }) }
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as { slug: string; title: string };
    expect(body.slug).toBe(target.slug);
    expect(body.title).toBe(target.title);
  });

  test("returns 404 for unknown slugs with the expected error shape", async () => {
    const { GET: detail } = await import("./[slug]/route");
    const res = await detail(
      new Request("http://localhost/api/stories/this-slug-does-not-exist"),
      { params: Promise.resolve({ slug: "this-slug-does-not-exist" }) }
    );
    expect(res.status).toBe(404);
    const body = (await res.json()) as { error: string };
    expect(body.error).toBe("Not found");
  });
});

describe.skipIf(!skip)(
  "GET /api/stories — server tests (skipped, no DATABASE_URL)",
  () => {
    test("documented skip path: set DATABASE_URL to a real Postgres", () => {
      expect(skip).toBe(true);
    });
  }
);
