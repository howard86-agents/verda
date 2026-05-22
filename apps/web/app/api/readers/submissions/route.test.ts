/**
 * Server tests for the public reader-submission route (issue #133).
 *
 * Uses the same skip pattern as the rest of the server suite — skips
 * cleanly when DATABASE_URL is missing or points at the placeholder
 * so `bun test` stays green in CI without a provisioned database.
 *
 * The route resolves the submitter from the Auth.js session, so we
 * stub `auth()` per-test instead of swapping the whole prisma module
 * (process-wide `mock.module` swaps leak into adjacent test files).
 */
import { afterAll, beforeEach, describe, expect, mock, test } from "bun:test";
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

const TEST_USER_ID = "m_submissions_133";
const TEST_USER_EMAIL = "submissions_133@example.test";

const VALID_BODY = JSON.stringify({
  type: "doc",
  content: [
    {
      type: "paragraph",
      content: [
        { type: "text", text: "A real reader submission body for approval." },
      ],
    },
  ],
});

let currentSession: {
  user: { email?: string | null; id: string; name?: string | null };
} | null = null;

mock.module("../../../../auth", () => ({
  auth: async () => currentSession,
}));

async function ensureUser(): Promise<void> {
  await prisma.user.upsert({
    where: { id: TEST_USER_ID },
    update: { email: TEST_USER_EMAIL, name: "Submitter 133" },
    create: {
      id: TEST_USER_ID,
      email: TEST_USER_EMAIL,
      name: "Submitter 133",
    },
  });
}

async function clearSubmissions(): Promise<void> {
  await prisma.article.deleteMany({
    where: { submittedBy: TEST_USER_ID },
  });
}

describe.skipIf(skip)("POST /api/readers/submissions (issue #133)", () => {
  if (!skip) {
    afterAll(async () => {
      await clearSubmissions();
      await prisma.user.deleteMany({ where: { id: TEST_USER_ID } });
    });
  }

  beforeEach(async () => {
    if (skip) {
      return;
    }
    await ensureUser();
    await clearSubmissions();
    currentSession = {
      user: {
        id: TEST_USER_ID,
        email: TEST_USER_EMAIL,
        name: "Submitter 133",
      },
    };
  });

  test("creates a pending submission attributed to the signed-in user", async () => {
    const { POST } = await import("./route");

    const res = await POST(
      new Request("http://localhost/api/readers/submissions", {
        method: "POST",
        body: JSON.stringify({
          title: "Reader field note",
          bodyJson: VALID_BODY,
        }),
      })
    );

    expect(res.status).toBe(201);
    const body = (await res.json()) as {
      id: string;
      kind: string;
      status: string;
      submittedBy: string | null;
    };
    expect(body.status).toBe("pending");
    expect(body.kind).toBe("submission");
    expect(body.submittedBy).toBe(TEST_USER_ID);

    const stored = await prisma.article.findUnique({ where: { id: body.id } });
    expect(stored?.status).toBe("pending");
    expect(stored?.submittedBy).toBe(TEST_USER_ID);
  });

  test("rejects signed-out submission attempts", async () => {
    currentSession = null;
    const { POST } = await import("./route");

    const res = await POST(
      new Request("http://localhost/api/readers/submissions", {
        method: "POST",
        body: JSON.stringify({
          title: "Reader field note",
          bodyJson: VALID_BODY,
        }),
      })
    );

    expect(res.status).toBe(401);

    const count = await prisma.article.count({
      where: { submittedBy: TEST_USER_ID, status: "pending" },
    });
    expect(count).toBe(0);
  });
});

describe.skipIf(!skip)(
  "POST /api/readers/submissions — server tests (skipped, no DATABASE_URL)",
  () => {
    test("documented skip path: set DATABASE_URL to a real Postgres", () => {
      expect(skip).toBe(true);
    });
  }
);
