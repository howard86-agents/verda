import { prisma } from "@verda/database";
import { NextResponse } from "next/server";
import { auth } from "../../../../../auth";

// CMS comment soft-removal (issue #131).
// DELETE /api/cms/comments/:id — soft-remove a comment, gated by moderate_comments roles.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MODERATE_ROLES = ["editor", "publisher", "admin"] as const;

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function DELETE(
  _request: Request,
  context: RouteContext
): Promise<Response> {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const role = session.user.role;
  if (!MODERATE_ROLES.includes(role as (typeof MODERATE_ROLES)[number])) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await context.params;
  const commentId = Number.parseInt(id, 10);
  if (Number.isNaN(commentId)) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  const comment = await prisma.comment.findUnique({
    where: { id: commentId },
  });
  if (!comment) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.comment.update({
    where: { id: commentId },
    data: { removedAt: new Date() },
  });

  return NextResponse.json({ ok: true });
}
