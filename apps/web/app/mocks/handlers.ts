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

export const handlers = [
  http.get("/api/stories", async ({ request }) => {
    const url = new URL(request.url);
    const kind = url.searchParams.get("kind") ?? "brand";

    const articles = await db.articles.where("kind").equals(kind).toArray();
    return HttpResponse.json(articles);
  }),

  http.post("/api/cms/articles", ({ request }) => {
    const denied = guardRole(request, "create_draft");
    if (denied) {
      return denied;
    }
    return HttpResponse.json({ ok: true }, { status: 201 });
  }),

  http.post("/api/cms/articles/:id/publish", ({ request }) => {
    const denied = guardRole(request, "publish");
    if (denied) {
      return denied;
    }
    return HttpResponse.json({ ok: true });
  }),

  http.post("/api/cms/articles/:id/unpublish", ({ request }) => {
    const denied = guardRole(request, "unpublish");
    if (denied) {
      return denied;
    }
    return HttpResponse.json({ ok: true });
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

  // Taxonomy: Categories
  http.get("/api/cms/categories", async () => {
    const categories = await db.categories.toArray();
    return HttpResponse.json(categories);
  }),

  http.post("/api/cms/categories", async ({ request }) => {
    const denied = guardRole(request, "manage_taxonomy");
    if (denied) {
      return denied;
    }
    const body = (await request.json()) as { name: string };
    const id = body.name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    await db.categories.put({ id, name: body.name });
    return HttpResponse.json({ id, name: body.name }, { status: 201 });
  }),

  http.put("/api/cms/categories/:id", async ({ request, params }) => {
    const denied = guardRole(request, "manage_taxonomy");
    if (denied) {
      return denied;
    }
    const body = (await request.json()) as { name: string };
    const id = params.id as string;
    await db.categories.put({ id, name: body.name });
    return HttpResponse.json({ id, name: body.name });
  }),

  http.delete("/api/cms/categories/:id", async ({ request, params }) => {
    const denied = guardRole(request, "manage_taxonomy");
    if (denied) {
      return denied;
    }
    const id = params.id as string;
    // Check if any articles reference this category
    const cat = await db.categories.get(id);
    if (cat) {
      const refs = await db.articles.where("cat").equals(cat.name).count();
      if (refs > 0) {
        return HttpResponse.json(
          {
            error: `Cannot delete: ${refs} article(s) use this category. Reassign them first.`,
          },
          { status: 409 }
        );
      }
      await db.categories.delete(id);
    }
    return HttpResponse.json({ ok: true });
  }),

  // Taxonomy: Tags
  http.get("/api/cms/tags", async () => {
    const tags = await db.tags.toArray();
    return HttpResponse.json(tags);
  }),

  http.post("/api/cms/tags", async ({ request }) => {
    const denied = guardRole(request, "manage_taxonomy");
    if (denied) {
      return denied;
    }
    const body = (await request.json()) as { name: string };
    const id = body.name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    await db.tags.put({ id, name: body.name });
    return HttpResponse.json({ id, name: body.name }, { status: 201 });
  }),

  http.put("/api/cms/tags/:id", async ({ request, params }) => {
    const denied = guardRole(request, "manage_taxonomy");
    if (denied) {
      return denied;
    }
    const body = (await request.json()) as { name: string };
    const id = params.id as string;
    await db.tags.put({ id, name: body.name });
    return HttpResponse.json({ id, name: body.name });
  }),

  http.delete("/api/cms/tags/:id", async ({ request, params }) => {
    const denied = guardRole(request, "manage_taxonomy");
    if (denied) {
      return denied;
    }
    const id = params.id as string;
    const tag = await db.tags.get(id);
    if (tag) {
      const refs = await db.articles.where("tag").equals(tag.name).count();
      if (refs > 0) {
        return HttpResponse.json(
          {
            error: `Cannot delete: ${refs} article(s) use this tag. Reassign them first.`,
          },
          { status: 409 }
        );
      }
      await db.tags.delete(id);
    }
    return HttpResponse.json({ ok: true });
  }),
];
