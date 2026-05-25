import { prisma } from "@verda/database";
import { NextResponse } from "next/server";
import { serializeArticle } from "../../stories/serialize";

// CMS submission approval queue (issue #133).
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(): Promise<Response> {
  const submissions = await prisma.article.findMany({
    where: { kind: "submission", status: "pending" },
    orderBy: { updatedAt: "asc" },
  });
  const submitterIds = [
    ...new Set(
      submissions
        .map((submission) => submission.submittedBy)
        .filter((id): id is string => typeof id === "string" && id.length > 0)
    ),
  ];
  const submitters = submitterIds.length
    ? await prisma.user.findMany({
        where: { id: { in: submitterIds } },
        select: { id: true, email: true, name: true },
      })
    : [];
  const submitterById = new Map(submitters.map((user) => [user.id, user]));

  const items = submissions.map((submission) => {
    const submitter = submission.submittedBy
      ? (submitterById.get(submission.submittedBy) ?? null)
      : null;
    return {
      ...serializeArticle(submission),
      submittedAt: submission.createdAt.toISOString(),
      submittedBy: submission.submittedBy ?? null,
      submitter,
      submitterName:
        submitter?.name ??
        submitter?.email ??
        submission.submittedBy ??
        "Anonymous",
    };
  });

  return NextResponse.json({ items, total: items.length });
}
