import { type Prisma, prisma } from "@verda/database";
import { NextResponse } from "next/server";
import { guardRole } from "../../_lib/guard-role";
import { serializeArticle } from "../../stories/serialize";

// CMS article routes — list + create (issue #129).
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(): Promise<Response> {
  const articles = await prisma.article.findMany({
    orderBy: { updatedAt: "desc" },
  });
  return NextResponse.json(articles.map(serializeArticle));
}

export async function POST(request: Request): Promise<Response> {
  const denied = await guardRole(request, "create_draft");
  if (denied) {
    return denied;
  }

  const body = (await request.json()) as Record<string, unknown>;
  const data: Prisma.ArticleCreateInput = {
    slug: (body.slug as string) || `draft-${Date.now().toString(36)}`,
    kind: (body.kind as string) || "brand",
    cat: (body.cat as string) || "",
    tag: (body.tag as string) || "",
    title: (body.title as string) || "Untitled",
    jp: (body.jp as string) || "",
    sum: (body.sum as string) || "",
    img: (body.img as string) || "",
    author: (body.author as string) || "",
    status: "draft",
    bodyJson: (body.bodyJson as string) || "",
  };

  if (typeof body.section === "string" && body.section) {
    data.section = body.section;
  }
  if (typeof body.submittedBy === "string" && body.submittedBy) {
    data.submittedBy = body.submittedBy;
  }
  if (body.series && typeof body.series === "object") {
    data.series = body.series as Prisma.InputJsonValue;
  }

  const article = await prisma.article.create({ data });
  return NextResponse.json(serializeArticle(article), { status: 201 });
}
