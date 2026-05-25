import { type Prisma, prisma } from "@verda/database";
import { NextResponse } from "next/server";
import { auth } from "../../../../auth";
import { serializeArticle } from "../../stories/serialize";
import {
  type SubmissionDraft,
  slugForTitle,
  validateSubmission,
} from "./validation";

// Reader submission creation route (issue #133).
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request): Promise<Response> {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as Partial<SubmissionDraft>;
  const draft: SubmissionDraft = {
    bodyJson: typeof body.bodyJson === "string" ? body.bodyJson : "",
    coverUrl: typeof body.coverUrl === "string" ? body.coverUrl : undefined,
    title: typeof body.title === "string" ? body.title : "",
  };

  const validation = validateSubmission(draft);
  if (!validation.ok) {
    return NextResponse.json({ error: validation.reason }, { status: 400 });
  }

  const title = draft.title.trim();
  const data: Prisma.ArticleCreateInput = {
    slug: `${slugForTitle(title)}-${Date.now().toString(36)}`,
    kind: "submission",
    cat: "",
    tag: "reader",
    title,
    jp: "",
    sum: "",
    img: draft.coverUrl || "linear-gradient(135deg, #e9c4d0, #9a4a68)",
    author: session.user.name ?? "",
    status: "pending",
    bodyJson: draft.bodyJson,
    submittedBy: userId,
  };

  const article = await prisma.article.create({ data });
  return NextResponse.json(serializeArticle(article), { status: 201 });
}
