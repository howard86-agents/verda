import { prisma } from "@verda/database";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(): Promise<Response> {
  const rules = await prisma.rewardRule.findMany({
    orderBy: { action: "asc" },
  });
  return NextResponse.json(rules);
}
