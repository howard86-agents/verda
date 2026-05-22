import { prisma } from "@verda/database";
import { NextResponse } from "next/server";
import { serializeArticle } from "../serialize";

// Per-article fetch — `GET /api/stories/:slug` (issue #126).
//
// 404s match the existing MSW handler shape (`{ error: "Not found" }`)
// so the React Query callers downstream don't need new error paths
// when `NEXT_PUBLIC_API_MODE=real` flips them onto the real backend.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  context: { params: Promise<{ slug: string }> }
): Promise<Response> {
  const { slug } = await context.params;
  const article = await prisma.article.findUnique({ where: { slug } });
  if (!article) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json(serializeArticle(article));
}
