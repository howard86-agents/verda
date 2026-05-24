import { prisma } from "@verda/database";
import { NextResponse } from "next/server";
import { allocateGrowth } from "../../../../_lib/growth-allocation";
import { guardRole } from "../../../../_lib/guard-role";
import { currentBalance, levelForBalance } from "../../route";
import { adminIdForRequest } from "../route";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface RouteContext {
  params: Promise<{ id: string }>;
}

interface AdjustBody {
  amount?: number;
  reason?: string;
}

export async function POST(
  request: Request,
  context: RouteContext
): Promise<Response> {
  const denied = await guardRole(request, "point_adjust");
  if (denied) {
    return denied;
  }

  const { id } = await context.params;
  const profile = await prisma.memberProfile.findUnique({
    where: { userId: id },
  });
  if (!profile) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (profile.deletedAt) {
    return NextResponse.json({ error: "Member is deleted" }, { status: 409 });
  }

  const body = (await request.json()) as AdjustBody;
  const amount = Number(body.amount);
  const reason = String(body.reason ?? "").trim();
  if (!reason) {
    return NextResponse.json(
      { error: "Reason is required for point adjustments" },
      { status: 400 }
    );
  }
  if (!(Number.isFinite(amount) && amount !== 0)) {
    return NextResponse.json(
      { error: "Adjustment amount must be a non-zero number" },
      { status: 400 }
    );
  }

  const adminId = adminIdForRequest(request);
  const balanceBefore = await currentBalance(id);
  const balanceAfter = balanceBefore + amount;

  await prisma.$transaction(async (tx) => {
    await tx.pointLedgerEntry.create({
      data: {
        userId: id,
        amount,
        balanceAfter,
        reason,
      },
    });
    if (amount > 0) {
      await allocateGrowth(tx, id, amount);
    }
    await tx.auditLog.create({
      data: {
        memberId: id,
        adminId,
        action: "point_adjust",
        amount,
        balanceBefore,
        balanceAfter,
        reason,
      },
    });
  });

  return NextResponse.json({
    ok: true,
    balanceBefore,
    balanceAfter,
    balance: balanceAfter,
    level: await levelForBalance(balanceAfter),
  });
}
