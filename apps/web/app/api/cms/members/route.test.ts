/**
 * Server tests for CMS members admin routes (issue #134).
 *
 * DB-backed assertions skip cleanly when DATABASE_URL is absent, but the
 * module import test stays active so missing route handlers are caught in CI.
 */
import { describe, expect, test } from "bun:test";
import { prisma } from "@verda/database";

const dbUrl = process.env.DATABASE_URL ?? "";
const dbAvailable = dbUrl.length > 0 && !dbUrl.includes("placeholder");
const TEST_MEMBER_ID = "cms_member_route_test";

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
    "x-cms-admin-id": `test_${role}`,
    "x-cms-role": role,
  });
}

async function resetTestMember(): Promise<void> {
  await prisma.auditLog.deleteMany({ where: { memberId: TEST_MEMBER_ID } });
  await prisma.pointLedgerEntry.deleteMany({
    where: { userId: TEST_MEMBER_ID },
  });
  await prisma.behaviorLog.deleteMany({ where: { userId: TEST_MEMBER_ID } });
  await prisma.growthItem.deleteMany({ where: { userId: TEST_MEMBER_ID } });
  await prisma.collection.deleteMany({ where: { userId: TEST_MEMBER_ID } });
  await prisma.memberProfile.deleteMany({ where: { userId: TEST_MEMBER_ID } });
  await prisma.user.deleteMany({ where: { id: TEST_MEMBER_ID } });
  await prisma.user.create({
    data: {
      id: TEST_MEMBER_ID,
      email: "cms-member-route-test@example.com",
      name: "CMS Member Route Test",
      role: "reader",
      memberProfile: {
        create: {
          displayName: "CMS Member Route Test",
          initial: "C",
          joined: "Joined May 2026",
        },
      },
    },
  });
}

test("CMS member route modules export handlers", async () => {
  const list = await import("./route");
  const detail = await import("./[id]/route");
  const adjust = await import("./[id]/point-adjust/route");
  expect(typeof list.GET).toBe("function");
  expect(typeof detail.GET).toBe("function");
  expect(typeof detail.DELETE).toBe("function");
  expect(typeof adjust.POST).toBe("function");
});

describe.skipIf(skip)("CMS members admin routes (issue #134)", () => {
  test("point-adjust role matrix writes ledger and audit rows", async () => {
    await resetTestMember();
    const { POST } = await import("./[id]/point-adjust/route");

    const editor = await POST(
      new Request(
        `http://localhost/api/cms/members/${TEST_MEMBER_ID}/point-adjust`,
        {
          method: "POST",
          headers: cmsHeaders("editor"),
          body: JSON.stringify({ amount: 7, reason: "editor denied" }),
        }
      ),
      { params: Promise.resolve({ id: TEST_MEMBER_ID }) }
    );
    expect(editor.status).toBe(403);

    const customerService = await POST(
      new Request(
        `http://localhost/api/cms/members/${TEST_MEMBER_ID}/point-adjust`,
        {
          method: "POST",
          headers: cmsHeaders("customer-service"),
          body: JSON.stringify({ amount: 7, reason: "service recovery" }),
        }
      ),
      { params: Promise.resolve({ id: TEST_MEMBER_ID }) }
    );
    expect(customerService.status).toBe(200);
    const body = (await customerService.json()) as {
      balance: number;
      balanceAfter: number;
    };
    expect(body.balance).toBe(7);
    expect(body.balanceAfter).toBe(7);

    const ledger = await prisma.pointLedgerEntry.findMany({
      where: { userId: TEST_MEMBER_ID },
    });
    const audit = await prisma.auditLog.findMany({
      where: { memberId: TEST_MEMBER_ID },
    });
    expect(ledger).toHaveLength(1);
    expect(audit).toHaveLength(1);
    expect(audit[0]).toMatchObject({
      action: "point_adjust",
      adminId: "test_customer-service",
      amount: 7,
      balanceBefore: 0,
      balanceAfter: 7,
      reason: "service recovery",
    });
  });

  test("soft-delete role matrix filters list unless includeDeleted", async () => {
    await resetTestMember();
    const { DELETE } = await import("./[id]/route");
    const { GET } = await import("./route");

    const customerService = await DELETE(
      new Request(
        `http://localhost/api/cms/members/${TEST_MEMBER_ID}?reason=nope`,
        {
          method: "DELETE",
          headers: cmsHeaders("customer-service"),
        }
      ),
      { params: Promise.resolve({ id: TEST_MEMBER_ID }) }
    );
    expect(customerService.status).toBe(403);

    const admin = await DELETE(
      new Request(
        `http://localhost/api/cms/members/${TEST_MEMBER_ID}?reason=requested`,
        {
          method: "DELETE",
          headers: cmsHeaders("admin"),
        }
      ),
      { params: Promise.resolve({ id: TEST_MEMBER_ID }) }
    );
    expect(admin.status).toBe(200);

    const activeList = await GET(
      new Request(
        "http://localhost/api/cms/members?q=CMS%20Member%20Route%20Test"
      )
    );
    const activeBody = (await activeList.json()) as { total: number };
    expect(activeBody.total).toBe(0);

    const deletedList = await GET(
      new Request(
        "http://localhost/api/cms/members?q=CMS%20Member%20Route%20Test&includeDeleted=true"
      )
    );
    const deletedBody = (await deletedList.json()) as {
      items: Array<{ deletedAt: string | null }>;
      total: number;
    };
    expect(deletedBody.total).toBe(1);
    expect(deletedBody.items[0]?.deletedAt).toBeTruthy();

    const audit = await prisma.auditLog.findFirst({
      where: { memberId: TEST_MEMBER_ID, action: "member_delete" },
    });
    expect(audit).toMatchObject({ adminId: "test_admin", reason: "requested" });
  });

  test("detail composes ledger, behavior, collections, growth, and audit trail", async () => {
    await resetTestMember();
    await prisma.pointLedgerEntry.create({
      data: {
        userId: TEST_MEMBER_ID,
        amount: 3,
        balanceAfter: 3,
        reason: "seed",
      },
    });
    await prisma.behaviorLog.create({
      data: { userId: TEST_MEMBER_ID, action: "daily_check_in" },
    });
    await prisma.growthItem.create({
      data: { userId: TEST_MEMBER_ID, level: 2, nutrients: 42, sequence: 1 },
    });
    const article = await prisma.article.create({
      data: {
        slug: `cms-member-route-test-${Date.now()}`,
        title: "Collected Test Article",
        status: "published",
      },
    });
    await prisma.collection.create({
      data: { userId: TEST_MEMBER_ID, articleId: article.id },
    });
    await prisma.auditLog.create({
      data: {
        memberId: TEST_MEMBER_ID,
        adminId: "test_admin",
        action: "point_adjust",
        reason: "seed",
        amount: 3,
        balanceBefore: 0,
        balanceAfter: 3,
      },
    });

    const { GET } = await import("./[id]/route");
    const res = await GET(
      new Request(`http://localhost/api/cms/members/${TEST_MEMBER_ID}`),
      {
        params: Promise.resolve({ id: TEST_MEMBER_ID }),
      }
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      auditLog: unknown[];
      behaviorLogs: unknown[];
      collections: unknown[];
      growth: { level: number; nutrients: number };
      ledger: unknown[];
      member: { id: string };
    };
    expect(body.member.id).toBe(TEST_MEMBER_ID);
    expect(body.ledger).toHaveLength(1);
    expect(body.behaviorLogs).toHaveLength(1);
    expect(body.collections).toHaveLength(1);
    expect(body.growth).toMatchObject({ level: 2, nutrients: 42 });
    expect(body.auditLog).toHaveLength(1);

    await prisma.article.delete({ where: { id: article.id } });
  });
});

describe.skipIf(!skip)(
  "CMS members admin routes — server tests (skipped, no DATABASE_URL)",
  () => {
    test("documented skip path: set DATABASE_URL to a real Postgres", () => {
      expect(skip).toBe(true);
    });
  }
);
