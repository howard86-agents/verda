/**
 * Server tests for the search Route Handler (issue #128).
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

describe.skipIf(skip)("GET /api/search (issue #128)", () => {
  test("returns ranked hits across multiple fields", async () => {
    const { GET } = await import("./route");
    // "quiet" appears in the title of the seeded story
    // "Quiet Rituals for a Slower Morning"
    const res = await GET(
      new Request("http://localhost/api/search?q=quiet&limit=5")
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      items: Array<{
        id: string;
        matchedFields: string[];
        score: number;
        slug: string;
        title: string;
      }>;
      total: number;
    };
    expect(body.total).toBeGreaterThan(0);
    expect(body.items.length).toBeGreaterThan(0);
    // First hit should have title match
    expect(body.items[0].matchedFields).toContain("title");
    expect(body.items[0].score).toBeGreaterThan(0);
    // Shape check
    for (const item of body.items) {
      expect(item).toHaveProperty("id");
      expect(item).toHaveProperty("slug");
      expect(item).toHaveProperty("title");
      expect(item).toHaveProperty("score");
      expect(item).toHaveProperty("matchedFields");
    }
  });

  test("returns empty for no-match query", async () => {
    const { GET } = await import("./route");
    const res = await GET(
      new Request("http://localhost/api/search?q=xyznonexistent999")
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as { items: unknown[]; total: number };
    expect(body.items).toEqual([]);
    expect(body.total).toBe(0);
  });

  test("returns empty for blank query", async () => {
    const { GET } = await import("./route");
    const res = await GET(new Request("http://localhost/api/search?q="));
    expect(res.status).toBe(200);
    const body = (await res.json()) as { items: unknown[]; total: number };
    expect(body.items).toEqual([]);
    expect(body.total).toBe(0);
  });
});

describe.skipIf(!skip)(
  "GET /api/search — server tests (skipped, no DATABASE_URL)",
  () => {
    test("documented skip path: set DATABASE_URL to a real Postgres", () => {
      expect(skip).toBe(true);
    });
  }
);
