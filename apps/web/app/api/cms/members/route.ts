import { type Prisma, prisma } from "@verda/database";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface MemberListItem {
  balance: number;
  deletedAt: string | null;
  email: string;
  id: string;
  joined: string;
  level: number;
  name: string;
}

type MemberWithUser = Prisma.MemberProfileGetPayload<{
  include: { user: true };
}>;

export async function GET(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const q = (url.searchParams.get("q") ?? "").trim().toLowerCase();
  const includeDeleted = ["1", "true"].includes(
    (url.searchParams.get("includeDeleted") ?? "").toLowerCase()
  );

  const members = await prisma.memberProfile.findMany({
    where: includeDeleted ? undefined : { deletedAt: null },
    include: { user: true },
    orderBy: { displayName: "asc" },
  });

  const visible = q
    ? members.filter((member) => memberMatchesSearch(member, q))
    : members;

  const items = await Promise.all(visible.map(serializeListItem));
  items.sort((a, b) => a.name.localeCompare(b.name));

  return NextResponse.json({ items, total: items.length });
}

function memberMatchesSearch(member: MemberWithUser, q: string): boolean {
  return (
    member.userId.toLowerCase().includes(q) ||
    member.displayName.toLowerCase().includes(q) ||
    member.user.email.toLowerCase().includes(q)
  );
}

async function serializeListItem(
  member: MemberWithUser
): Promise<MemberListItem> {
  const [balance, growth] = await Promise.all([
    currentBalance(member.userId),
    prisma.growthItem.findFirst({
      where: { userId: member.userId, completedAt: null },
      orderBy: { sequence: "desc" },
    }),
  ]);

  return {
    id: member.userId,
    name: member.displayName,
    email: member.user.email,
    joined: member.joined,
    deletedAt: member.deletedAt?.toISOString() ?? null,
    balance,
    level: growth?.level ?? (await levelForBalance(balance)),
  };
}

export async function currentBalance(userId: string): Promise<number> {
  const lastEntry = await prisma.pointLedgerEntry.findFirst({
    where: { userId },
    orderBy: { id: "desc" },
  });
  return lastEntry?.balanceAfter ?? 0;
}

export async function levelForBalance(balance: number): Promise<number> {
  const rule = await prisma.growthRule.findFirst({
    where: { threshold: { lte: balance } },
    orderBy: { level: "desc" },
  });
  return rule?.level ?? 1;
}
