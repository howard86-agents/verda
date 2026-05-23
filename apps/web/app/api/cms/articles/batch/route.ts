import { type Prisma, prisma } from "@verda/database";
import { NextResponse } from "next/server";
import type { CmsAction } from "../../../../lib/cms-auth";
import { guardRole } from "../../../../_lib/guard-role";

// CMS article batch operations (issue #137).
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type BatchAction =
  | "publish"
  | "unpublish"
  | "set_category"
  | "set_tags"
  | "set_status";

interface BatchOperation {
  action?: BatchAction;
  articleIds?: unknown;
  category?: unknown;
  ids?: unknown;
  status?: unknown;
  tags?: unknown;
  value?: unknown;
}

interface BatchResult {
  action: string;
  count?: number;
  error?: string;
  status: number;
}

function operationsFromBody(body: Record<string, unknown>): BatchOperation[] {
  if (Array.isArray(body.operations)) {
    return body.operations as BatchOperation[];
  }
  return [body as BatchOperation];
}

function idsFor(operation: BatchOperation): string[] {
  const raw = operation.articleIds ?? operation.ids;
  if (!Array.isArray(raw)) {
    return [];
  }
  return raw.filter(
    (id): id is string => typeof id === "string" && id.length > 0
  );
}

function guardActionFor(operation: BatchOperation): CmsAction | null {
  switch (operation.action) {
    case "publish":
      return "publish";
    case "unpublish":
      return "unpublish";
    case "set_category":
      return "manage_taxonomy";
    case "set_tags":
      return "edit_draft";
    case "set_status": {
      const status = operation.status ?? operation.value;
      if (status === "published" || status === "scheduled") {
        return "publish";
      }
      if (status === "unpublished") {
        return "unpublish";
      }
      return "edit_draft";
    }
    default:
      return null;
  }
}

function dataFor(
  operation: BatchOperation
): Prisma.ArticleUpdateManyMutationInput {
  switch (operation.action) {
    case "publish":
      return {
        publishedAt: new Date(),
        scheduledAt: null,
        status: "published",
      };
    case "unpublish":
      return { status: "unpublished" };
    case "set_category": {
      const category = operation.category ?? operation.value;
      return { cat: typeof category === "string" ? category : "" };
    }
    case "set_tags": {
      const tags = operation.tags ?? operation.value;
      return { tag: typeof tags === "string" ? tags : "" };
    }
    case "set_status": {
      const status = operation.status ?? operation.value;
      return { status: typeof status === "string" ? status : "draft" };
    }
    default:
      return {};
  }
}

export async function POST(request: Request): Promise<Response> {
  const body = (await request.json()) as Record<string, unknown>;
  const operations = operationsFromBody(body);
  const results: BatchResult[] = [];

  for (const operation of operations) {
    const action = operation.action ?? "unknown";
    const guardAction = guardActionFor(operation);
    if (!guardAction) {
      results.push({ action, error: "Unknown action", status: 400 });
      continue;
    }

    const articleIds = idsFor(operation);
    if (articleIds.length === 0) {
      results.push({ action, error: "articleIds is required", status: 400 });
      continue;
    }

    const denied = await guardRole(request, guardAction);
    if (denied) {
      results.push({ action, status: denied.status });
      continue;
    }

    const update = await prisma.article.updateMany({
      where: { id: { in: articleIds } },
      data: dataFor(operation),
    });
    results.push({ action, count: update.count, status: 200 });
  }

  return NextResponse.json({
    ok: results.every((result) => result.status >= 200 && result.status < 300),
    results,
  });
}
