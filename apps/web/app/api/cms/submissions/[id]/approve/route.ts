import { prisma } from "@verda/database";
import { NextResponse } from "next/server";
import { guardRole } from "../../../../_lib/guard-role";
import { evaluateBadges } from "../../../../badges/evaluate";
import { awardPoints } from "../../../../events/route";

// Approve a pending reader submission (issue #133).
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
  if (!article.submittedBy) {
    return NextResponse.json(
      { error: "Submission is missing submitter" },
      { status: 409 }
    );
  }

  const wasAlreadyPublished = article.status === "published";
  const updated = await prisma.article.update({
    where: { id },
    data: {
      status: "published",
      publishedAt: article.publishedAt ?? new Date(),
      scheduledAt: null,
    },
  });

  const points = wasAlreadyPublished
    ? null
    : await awardPoints(article.submittedBy, "submission_approved", article.id);
  const newBadges = await evaluateBadges(article.submittedBy);

  return NextResponse.json({
    ok: true,
    id: updated.id,
    status: updated.status,
    points: points?.points ?? 0,
    balance: points?.balance ?? null,
    level: points?.level ?? null,
    newBadges,
  });
}
