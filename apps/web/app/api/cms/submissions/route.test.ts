/**
 * Server tests for the CMS submission approval queue (issue #133).
 *
 * Skips when DATABASE_URL is missing or points at the placeholder,
 * matching the rest of the server suite. Uses the same role-header
 * pattern as the CMS articles tests so no auth session is needed.
 */
import { afterAll, beforeEach, describe, expect, test } from "bun:test";
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

const TEST_USER_ID = "m_submission_queue_133";
const TEST_USER_EMAIL = "submission_queue_133@example.test";

function cmsHeaders(role: string): Headers {
  return new Headers({
    "x-cms-role": role,
    "content-type": "application/json",
  });
}

async function ensureSubmitter(): Promise<void> {
  await prisma.user.upsert({
    where: { id: TEST_USER_ID },
    update: { email: TEST_USER_EMAIL, name: "Submission Queue 133" },
    create: {
      id: TEST_USER_ID,
      email: TEST_USER_EMAIL,
      name: "Submission Queue 133",
    },
  });
}

async function clearTestState(): Promise<void> {
  // Behavior logs / ledger / growth allocations + the article rows
  // are all keyed off the submitter — wiping them keeps each test
  // hermetic without dropping shared seed data.
  await prisma.behaviorLog.deleteMany({ where: { userId: TEST_USER_ID } });
  await prisma.pointLedgerEntry.deleteMany({
    where: { userId: TEST_USER_ID },
  });
  await prisma.memberBadge.deleteMany({ where: { userId: TEST_USER_ID } });
  await prisma.growthItem.deleteMany({ where: { userId: TEST_USER_ID } });
  await prisma.article.deleteMany({ where: { submittedBy: TEST_USER_ID } });
}

function createPendingSubmission(slug: string) {
  return prisma.article.create({
    data: {
      slug: `test-${slug}-${Date.now().toString(36)}`,
      kind: "submission",
      cat: "",
      tag: "reader",
      title: `Test submission ${slug}`,
      jp: "",
      sum: "",
      status: "pending",
      submittedBy: TEST_USER_ID,
    },
  });
}

describe.skipIf(skip)("CMS submission queue (issue #133)", () => {
  if (!skip) {
    afterAll(async () => {
      await clearTestState();
      await prisma.user.deleteMany({ where: { id: TEST_USER_ID } });
    });
  }

  beforeEach(async () => {
    if (skip) {
      return;
    }
    await ensureSubmitter();
    await clearTestState();
  });

  test("GET /api/cms/submissions lists pending submissions with submitter info", async () => {
    await createPendingSubmission("listed");
    // A published submission should NOT appear.
    await prisma.article.create({
      data: {
        slug: `test-published-${Date.now().toString(36)}`,
        kind: "submission",
        cat: "",
        tag: "reader",
        title: "Already published",
        jp: "",
        sum: "",
        status: "published",
        submittedBy: TEST_USER_ID,
      },
    });

    const { GET } = await import("./route");
    const res = await GET();

    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      items: Array<{
        id: string;
        status: string;
        submitter: { id: string; name: string | null } | null;
      }>;
    };
    const ours = body.items.filter((item) => item.status === "pending");
    expect(ours.length).toBeGreaterThan(0);
    const target = ours.find((item) =>
      item.submitter ? item.submitter.id === TEST_USER_ID : false
    );
    expect(target).toBeDefined();
    expect(target?.submitter?.id).toBe(TEST_USER_ID);
  });

  test("approve is publish-gated, publishes once, awards points, and evaluates badges", async () => {
    const article = await createPendingSubmission("approve");

    const { POST } = await import("./[id]/approve/route");

    // Editor (not a publisher) must be rejected with 403.
    const forbidden = await POST(
      new Request(
        `http://localhost/api/cms/submissions/${article.id}/approve`,
        { method: "POST", headers: cmsHeaders("editor") }
      ),
      { params: Promise.resolve({ id: article.id }) }
    );
    expect(forbidden.status).toBe(403);

    const approved = await POST(
      new Request(
        `http://localhost/api/cms/submissions/${article.id}/approve`,
        { method: "POST", headers: cmsHeaders("publisher") }
      ),
      { params: Promise.resolve({ id: article.id }) }
    );
    expect(approved.status).toBe(200);

    const stored = await prisma.article.findUnique({
      where: { id: article.id },
    });
    expect(stored?.status).toBe("published");
    expect(stored?.publishedAt).toBeTruthy();

    const ledger = await prisma.pointLedgerEntry.findFirst({
      where: { userId: TEST_USER_ID, reason: { contains: "submission" } },
    });
    expect(ledger).not.toBeNull();
    expect(ledger?.amount).toBeGreaterThan(0);

    const badges = await prisma.memberBadge.findMany({
      where: { userId: TEST_USER_ID },
    });
    expect(badges.map((badge) => badge.badgeId)).toContain("first_submission");

    // Re-approval must NOT double-award.
    const ledgerCountBefore = await prisma.pointLedgerEntry.count({
      where: { userId: TEST_USER_ID },
    });
    const reapproved = await POST(
      new Request(
        `http://localhost/api/cms/submissions/${article.id}/approve`,
        { method: "POST", headers: cmsHeaders("publisher") }
      ),
      { params: Promise.resolve({ id: article.id }) }
    );
    expect(reapproved.status).toBe(200);
    const ledgerCountAfter = await prisma.pointLedgerEntry.count({
      where: { userId: TEST_USER_ID },
    });
    expect(ledgerCountAfter).toBe(ledgerCountBefore);
  });

  test("reject is publish-gated and leaves the submission unpublished", async () => {
    const article = await createPendingSubmission("reject");

    const { POST } = await import("./[id]/reject/route");

    const forbidden = await POST(
      new Request(`http://localhost/api/cms/submissions/${article.id}/reject`, {
        method: "POST",
        headers: cmsHeaders("editor"),
      }),
      { params: Promise.resolve({ id: article.id }) }
    );
    expect(forbidden.status).toBe(403);

    const rejected = await POST(
      new Request(`http://localhost/api/cms/submissions/${article.id}/reject`, {
        method: "POST",
        headers: cmsHeaders("publisher"),
      }),
      { params: Promise.resolve({ id: article.id }) }
    );
    expect(rejected.status).toBe(200);

    const stored = await prisma.article.findUnique({
      where: { id: article.id },
    });
    expect(stored?.status).toBe("rejected");
    expect(stored?.publishedAt).toBeNull();

    const ledgerCount = await prisma.pointLedgerEntry.count({
      where: { userId: TEST_USER_ID, reason: { contains: "submission" } },
    });
    expect(ledgerCount).toBe(0);
  });
});

describe.skipIf(!skip)(
  "CMS submission queue — server tests (skipped, no DATABASE_URL)",
  () => {
    test("documented skip path: set DATABASE_URL to a real Postgres", () => {
      expect(skip).toBe(true);
    });
  }
);
