/**
 * Server tests for public reader profiles (issue #139).
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

describe.skipIf(skip)("GET /api/readers/u/:id (issue #139)", () => {
  // m_5102 is a seeded reader with a member profile
  const TEST_USER = "m_5102";

  test("returns public profile fields", async () => {
    const { GET } = await import("./route");
    const res = await GET(
      new Request(`http://localhost/api/readers/u/${TEST_USER}`),
      { params: Promise.resolve({ id: TEST_USER }) }
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as Record<string, unknown>;

    // Public fields present
    expect(body).toHaveProperty("displayName");
    expect(body).toHaveProperty("joined");
    expect(body).toHaveProperty("initial");
    expect(body).toHaveProperty("growthItem");
    expect(body).toHaveProperty("submissions");
    expect(body).toHaveProperty("badges");
  });

  test("privacy filter: no private data exposed", async () => {
    const { GET } = await import("./route");
    const res = await GET(
      new Request(`http://localhost/api/readers/u/${TEST_USER}`),
      { params: Promise.resolve({ id: TEST_USER }) }
    );
    const body = (await res.json()) as Record<string, unknown>;

    // Private fields must NOT be present
    expect(body).not.toHaveProperty("email");
    expect(body).not.toHaveProperty("pointLedger");
    expect(body).not.toHaveProperty("behaviorLogs");
    expect(body).not.toHaveProperty("userId");
    expect(body).not.toHaveProperty("id");
  });

  test("returns 404 for unknown user", async () => {
    const { GET } = await import("./route");
    const res = await GET(
      new Request("http://localhost/api/readers/u/nonexistent"),
      { params: Promise.resolve({ id: "nonexistent" }) }
    );
    expect(res.status).toBe(404);
  });
});

describe.skipIf(!skip)(
  "GET /api/readers/u/:id — server tests (skipped, no DATABASE_URL)",
  () => {
    test("documented skip path: set DATABASE_URL to a real Postgres", () => {
      expect(skip).toBe(true);
    });
  }
);
