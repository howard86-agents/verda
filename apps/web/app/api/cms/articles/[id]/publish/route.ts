import { prisma } from "@verda/database";
import { NextResponse } from "next/server";
import { guardRole } from "../../../../_lib/guard-role";

// CMS publish action (issue #129).
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
  if (!article) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.article.update({
    where: { id },
    data: {
      status: "published",
      publishedAt: new Date(),
      scheduledAt: null,
    },
  });

  return NextResponse.json({ ok: true, status: "published" });
}
