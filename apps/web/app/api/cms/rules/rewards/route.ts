import { prisma } from "@verda/database";
import { NextResponse } from "next/server";
import { guardRole } from "../../../_lib/guard-role";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request): Promise<Response> {
  const denied = await guardRole(request, "manage_rules");
  if (denied) {
    return denied;
  }

  const rules = await prisma.rewardRule.findMany({
    orderBy: { action: "asc" },
  });
  return NextResponse.json(rules);
}
