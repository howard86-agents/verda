import { prisma } from "@verda/database";
import { NextResponse } from "next/server";
import { guardRole } from "../../../../_lib/guard-role";

// CMS unpublish action (issue #129).
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface Params {
  params: Promise<{ id: string }>;
}

export async function POST(
  request: Request,
  { params }: Params
): Promise<Response> {
  const denied = await guardRole(request, "unpublish");
  if (denied) {
    return denied;
  }

  const { id } = await params;
  await prisma.article.update({
    where: { id },
    data: { status: "unpublished" },
  });

  return NextResponse.json({ ok: true, status: "unpublished" });
}
