import { prisma } from "@verda/database";
import { NextResponse } from "next/server";
import { auth } from "../../../../auth";

// CMS comment moderation (issue #131).
// GET /api/cms/comments — list all comments (including removed), gated by moderate_comments roles.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MODERATE_ROLES = ["editor", "publisher", "admin"] as const;

export async function GET(): Promise<Response> {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const role = session.user.role;
  if (!MODERATE_ROLES.includes(role as (typeof MODERATE_ROLES)[number])) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const comments = await prisma.comment.findMany({
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
  });

  return NextResponse.json({ comments });
}
