import { type ArticleVersion, type Prisma, prisma } from "@verda/database";
import { NextResponse } from "next/server";
import { guardRole } from "../../../../_lib/guard-role";
import { serializeArticle } from "../../../../stories/serialize";

// CMS article version history (issue #137).
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface Params {
  params: Promise<{ id: string }>;
}

function serializeVersion(version: ArticleVersion) {
  return {
    id: version.id,
    articleId: version.articleId,
    timestamp: version.timestamp.toISOString(),
    snapshot: version.snapshot,
  };
}

export async function GET(
  request: Request,
  { params }: Params
): Promise<Response> {
  const denied = await guardRole(request, "edit_draft");
  if (denied) {
    return denied;
  }

  const { id } = await params;
  const versions = await prisma.articleVersion.findMany({
    where: { articleId: id },
    orderBy: { timestamp: "desc" },
  });

  return NextResponse.json(versions.map(serializeVersion));
}

export async function POST(
  request: Request,
  { params }: Params
): Promise<Response> {
  const denied = await guardRole(request, "edit_draft");
  if (denied) {
    return denied;
  }

  const { id } = await params;
  const article = await prisma.article.findUnique({ where: { id } });
  if (!article) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const snapshot = serializeArticle(
    article
  ) as unknown as Prisma.InputJsonValue;
  const version = await prisma.articleVersion.create({
    data: { articleId: id, snapshot },
  });

  return NextResponse.json(serializeVersion(version), { status: 201 });
}
