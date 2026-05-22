import { prisma } from "@verda/database";
import { NextResponse } from "next/server";
import { guardRole } from "../../../../_lib/guard-role";
import { notFound } from "../../../_lib/route-utils";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface Params {
  params: Promise<{ id: string }>;
}

export async function GET(
  _request: Request,
  { params }: Params
): Promise<Response> {
  const { id } = await params;
  const rule = await prisma.rewardRule.findUnique({ where: { id } });
  return rule ? NextResponse.json(rule) : notFound();
}

export async function PUT(
  request: Request,
  { params }: Params
): Promise<Response> {
  const denied = await guardRole(request, "manage_rules");
  if (denied) {
    return denied;
  }

  const { id } = await params;
  const existing = await prisma.rewardRule.findUnique({ where: { id } });
  if (!existing) {
    return notFound();
  }

  const body = (await request.json()) as Partial<{
    enabled: boolean;
    limitType: string;
    points: number;
  }>;
  const rule = await prisma.rewardRule.update({
    where: { id },
    data: {
      ...(typeof body.points === "number" && Number.isFinite(body.points)
        ? { points: Math.floor(body.points) }
        : {}),
      ...(typeof body.enabled === "boolean" ? { enabled: body.enabled } : {}),
      ...(typeof body.limitType === "string"
        ? { limitType: body.limitType }
        : {}),
    },
  });
  return NextResponse.json(rule);
}
