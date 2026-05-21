import { HttpResponse, http } from "msw";
import type { CmsAction, CmsRole } from "@/lib/cms-auth";
import { can } from "@/lib/cms-auth";
import { db } from "@/lib/db";

function getRoleFromHeader(request: Request): CmsRole {
  return (request.headers.get("x-cms-role") as CmsRole) || "editor";
}

function guardRole(request: Request, action: CmsAction) {
  const role = getRoleFromHeader(request);
  if (!can(action, role)) {
    return HttpResponse.json(
      { error: "Forbidden", action, role },
      { status: 403 }
    );
  }
  return null;
}

async function applyBatchAction(
  id: string,
  action: string,
  body: { cat?: string; status?: string; tag?: string }
): Promise<boolean> {
  const article = await db.articles.get(id);
  if (!article) {
    return false;
  }
  switch (action) {
    case "set_category":
      if (body.cat != null) {
        await db.articles.update(id, { cat: body.cat });
        return true;
      }
      return false;
    case "set_tags":
      if (body.tag != null) {
        await db.articles.update(id, { tag: body.tag });
        return true;
      }
      return false;
    case "set_status":
      if (body.status != null) {
        await db.articles.update(id, { status: body.status });
        return true;
      }
      return false;
    case "publish":
      await db.articles.update(id, {
        status: "published",
        publishedAt: new Date().toISOString(),
      });
      return true;
    case "unpublish":
      await db.articles.update(id, { status: "unpublished" });
      return true;
    default:
      return false;
  }
}

export const handlers = [
  http.get("/api/stories", async ({ request }) => {
    const url = new URL(request.url);
    const kind = url.searchParams.get("kind") ?? "brand";

    const articles = await db.articles
      .where("kind")
      .equals(kind)
      .filter((a) => a.status === "published")
      .toArray();
    return HttpResponse.json(articles);
  }),

  http.get("/api/cms/articles", async () => {
    const articles = await db.articles.toArray();
    return HttpResponse.json(articles);
  }),

  http.get("/api/cms/articles/:id", async ({ params }) => {
    const article = await db.articles.get(params.id as string);
    if (!article) {
      return HttpResponse.json({ error: "Not found" }, { status: 404 });
    }
    return HttpResponse.json(article);
  }),

  http.post("/api/cms/articles", async ({ request }) => {
    const denied = guardRole(request, "create_draft");
    if (denied) {
      return denied;
    }
    const body = (await request.json()) as Record<string, unknown>;
    const id = `a_${Date.now().toString(36)}`;
    const article = {
      id,
      slug: (body.slug as string) || id,
      kind: (body.kind as string) || "brand",
      cat: (body.cat as string) || "",
      tag: (body.tag as string) || "",
      title: (body.title as string) || "Untitled",
      jp: (body.jp as string) || "",
      sum: (body.sum as string) || "",
      img: (body.img as string) || "",
      imagePrompt: "",
      imageSeed: 0,
      read: 0,
      date: new Date().toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      }),
      author: (body.author as string) || "",
      status: "draft",
      bodyJson: (body.bodyJson as string) || "",
    };
    await db.articles.put(article);
    return HttpResponse.json(article, { status: 201 });
  }),

  http.put("/api/cms/articles/:id", async ({ request, params }) => {
    const denied = guardRole(request, "edit_draft");
    if (denied) {
      return denied;
    }
    const existing = await db.articles.get(params.id as string);
    if (!existing) {
      return HttpResponse.json({ error: "Not found" }, { status: 404 });
    }
    const body = (await request.json()) as Record<string, unknown>;
    const updated = { ...existing, ...body, id: existing.id };
    await db.articles.put(updated);
    return HttpResponse.json(updated);
  }),

  http.post("/api/cms/articles/:id/publish", async ({ request, params }) => {
    const denied = guardRole(request, "publish");
    if (denied) {
      return denied;
    }
    const id = params.id as string;
    const article = await db.articles.get(id);
    if (!article) {
      return HttpResponse.json({ error: "Not found" }, { status: 404 });
    }
    await db.articles.update(id, {
      status: "published",
      publishedAt: new Date().toISOString(),
      scheduledAt: undefined,
    });
    return HttpResponse.json({ ok: true, status: "published" });
  }),

  http.post("/api/cms/articles/:id/unpublish", async ({ request, params }) => {
    const denied = guardRole(request, "unpublish");
    if (denied) {
      return denied;
    }
    const id = params.id as string;
    await db.articles.update(id, { status: "unpublished" });
    return HttpResponse.json({ ok: true, status: "unpublished" });
  }),

  http.post("/api/cms/articles/:id/schedule", async ({ request, params }) => {
    const denied = guardRole(request, "publish");
    if (denied) {
      return denied;
    }
    const id = params.id as string;
    const body = (await request.json()) as { scheduledAt: string };
    await db.articles.update(id, {
      status: "scheduled",
      scheduledAt: body.scheduledAt,
    });
    return HttpResponse.json({ ok: true, status: "scheduled" });
  }),

  http.post("/api/cms/members/:id/point-adjust", ({ request }) => {
    const denied = guardRole(request, "point_adjust");
    if (denied) {
      return denied;
    }
    return HttpResponse.json({ ok: true });
  }),

  http.delete("/api/cms/members/:id", ({ request }) => {
    const denied = guardRole(request, "member_delete");
    if (denied) {
      return denied;
    }
    return HttpResponse.json({ ok: true });
  }),

  // Batch operations on articles
  http.post("/api/cms/articles/batch", async ({ request }) => {
    const body = (await request.json()) as {
      action: string;
      cat?: string;
      ids: string[];
      status?: string;
      tag?: string;
    };
    const { ids, action } = body;

    if (action === "publish" || action === "unpublish") {
      const denied = guardRole(request, action);
      if (denied) {
        return denied;
      }
    } else {
      const denied = guardRole(request, "edit_draft");
      if (denied) {
        return denied;
      }
    }

    let updated = 0;
    for (const id of ids) {
      const ok = await applyBatchAction(id, action, body);
      if (ok) {
        updated++;
      }
    }
    return HttpResponse.json({ ok: true, updated });
  }),
];
