import { type Prisma, prisma } from "@verda/database";
import { NextResponse } from "next/server";
import { guardRole } from "../../../_lib/guard-role";
import { serializeArticle } from "../../../stories/serialize";
import { currentBalance, levelForBalance } from "../route";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(
  _request: Request,
  context: RouteContext
): Promise<Response> {
  const { id } = await context.params;
  const profile = await prisma.memberProfile.findUnique({
    where: { userId: id },
    include: { user: true },
  });

  if (!profile) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const [
    balance,
    ledger,
    behaviorLogs,
    growthItems,
    growthRules,
    collections,
    auditLog,
  ] = await Promise.all([
    currentBalance(id),
    prisma.pointLedgerEntry.findMany({
      where: { userId: id },
      orderBy: { createdAt: "desc" },
    }),
    prisma.behaviorLog.findMany({
      where: { userId: id },
      orderBy: { createdAt: "desc" },
    }),
    prisma.growthItem.findMany({
      where: { userId: id },
      orderBy: { sequence: "desc" },
    }),
    prisma.growthRule.findMany({ orderBy: { level: "asc" } }),
    readCollections(id),
    prisma.auditLog.findMany({
      where: { memberId: id },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const activeGrowth =
    growthItems.find((item) => !item.completedAt) ?? growthItems[0];
  const level = activeGrowth?.level ?? (await levelForBalance(balance));
  const currentRule = growthRules.find((rule) => rule.level === level);
  const nextRule = growthRules.find((rule) => rule.level === level + 1);

  return NextResponse.json({
    member: {
      id: profile.userId,
      name: profile.displayName,
      email: profile.user.email,
      joined: profile.joined,
      deletedAt: profile.deletedAt?.toISOString() ?? null,
    },
    balance,
    growth: {
      level,
      nutrients: activeGrowth?.nutrients ?? balance,
      currentName: currentRule?.name ?? "Seed",
      currentJp: currentRule?.jp ?? "種",
      nextName: nextRule?.name ?? null,
      nextThreshold: nextRule?.threshold ?? null,
    },
    ledger: ledger.map(serializeLedger),
    behaviorLogs: behaviorLogs.map(serializeBehaviorLog),
    collections,
    auditLog: auditLog.map(serializeAuditLog),
  });
}

export async function DELETE(
  request: Request,
  context: RouteContext
): Promise<Response> {
  const denied = await guardRole(request, "member_delete");
  if (denied) {
    return denied;
  }

  const { id } = await context.params;
  const reason = (new URL(request.url).searchParams.get("reason") ?? "").trim();
  if (!reason) {
    return NextResponse.json({ error: "Reason is required" }, { status: 400 });
  }

  const profile = await prisma.memberProfile.findUnique({
    where: { userId: id },
  });
  if (!profile) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const adminId = adminIdForRequest(request);
  const result = await prisma.$transaction(async (tx) => {
    const deleted = await tx.memberProfile.update({
      where: { userId: id },
      data: { deletedAt: new Date() },
    });
    await tx.auditLog.create({
      data: {
        memberId: id,
        adminId,
        action: "member_delete",
        reason,
      },
    });
    return deleted;
  });

  return NextResponse.json({
    ok: true,
    deletedAt: result.deletedAt?.toISOString() ?? null,
  });
}

async function readCollections(userId: string) {
  const rows = await prisma.collection.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });
  if (rows.length === 0) {
    return [];
  }
  const articles = await prisma.article.findMany({
    where: { id: { in: rows.map((row) => row.articleId) } },
  });
  const articleById = new Map(articles.map((article) => [article.id, article]));
  return rows
    .map((row) => articleById.get(row.articleId))
    .filter((article): article is NonNullable<typeof article> => !!article)
    .map(serializeArticle);
}

export function adminIdForRequest(request: Request): string {
  const explicit = request.headers.get("x-cms-admin-id");
  if (explicit) {
    return explicit;
  }
  switch (request.headers.get("x-cms-role")) {
    case "admin":
      return "admin_admin_01";
    case "customer-service":
      return "admin_cs_01";
    case "publisher":
      return "admin_publisher_01";
    default:
      return "admin_editor_01";
  }
}

function serializeLedger(entry: Prisma.PointLedgerEntryGetPayload<object>) {
  return {
    id: entry.id,
    memberId: entry.userId,
    userId: entry.userId,
    amount: entry.amount,
    balanceAfter: entry.balanceAfter,
    reason: entry.reason,
    createdAt: entry.createdAt.toISOString(),
  };
}

function serializeBehaviorLog(log: Prisma.BehaviorLogGetPayload<object>) {
  return {
    id: log.id,
    memberId: log.userId,
    userId: log.userId,
    action: log.action,
    articleId: log.articleId ?? undefined,
    createdAt: log.createdAt.toISOString(),
  };
}

function serializeAuditLog(log: Prisma.AuditLogGetPayload<object>) {
  return {
    id: log.id,
    action: log.action,
    memberId: log.memberId,
    adminId: log.adminId,
    amount: log.amount ?? undefined,
    balanceBefore: log.balanceBefore ?? undefined,
    balanceAfter: log.balanceAfter ?? undefined,
    reason: log.reason,
    createdAt: log.createdAt.toISOString(),
  };
}
