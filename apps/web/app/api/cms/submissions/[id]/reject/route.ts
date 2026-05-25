import { prisma } from "@verda/database";
import { NextResponse } from "next/server";
import { guardRole } from "../../../../_lib/guard-role";

// Reject a pending reader submission (issue #133).
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
  const article = await prisma.article.findUnique({ where: { id } });
  if (!(article && article.kind === "submission")) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const updated = await prisma.article.update({
    where: { id },
    data: {
      status: "rejected",
      publishedAt: null,
      scheduledAt: null,
    },
  });

  return NextResponse.json({
    ok: true,
    id: updated.id,
    status: updated.status,
  });
}
