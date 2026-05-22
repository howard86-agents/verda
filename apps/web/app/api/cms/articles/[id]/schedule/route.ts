import { prisma } from "@verda/database";
import { NextResponse } from "next/server";
import { guardRole } from "../../../../_lib/guard-role";

// CMS schedule action (issue #129).
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface Params {
  params: Promise<{ id: string }>;
}

export async function POST(
  request: Request,
  { params }: Params
): Promise<Response> {
  const denied = await guardRole(request, "publish");
  if (denied) {
    return denied;
  }

  const { id } = await params;
  const body = (await request.json()) as { scheduledAt: string };
  await prisma.article.update({
    where: { id },
    data: {
      status: "scheduled",
      scheduledAt: new Date(body.scheduledAt),
    },
  });

  return NextResponse.json({ ok: true, status: "scheduled" });
}
