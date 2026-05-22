import { prisma } from "@verda/database";
import { NextResponse } from "next/server";
import { guardRole } from "../../../_lib/guard-role";
import { serializeArticle } from "../../../stories/serialize";

// CMS article detail + edit (issue #129).
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
  const article = await prisma.article.findUnique({ where: { id } });
  if (!article) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json(serializeArticle(article));
}

export async function PUT(
  request: Request,
  { params }: Params
): Promise<Response> {
  const denied = await guardRole(request, "edit_draft");
  if (denied) {
    return denied;
  }

  const { id } = await params;
  const existing = await prisma.article.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const body = (await request.json()) as Record<string, unknown>;
  // Only allow safe fields to be updated
  const data: Record<string, unknown> = {};
  for (const key of [
    "title",
    "jp",
    "sum",
    "img",
    "author",
    "cat",
    "tag",
    "section",
    "kind",
    "bodyJson",
    "submittedBy",
  ]) {
    if (key in body) {
      data[key] = body[key];
    }
  }
  if (body.series !== undefined) {
    data.series = body.series;
  }

  const updated = await prisma.article.update({ where: { id }, data });
  return NextResponse.json(serializeArticle(updated));
}
