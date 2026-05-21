import { HttpResponse, http } from "msw";
import type { CmsAction, CmsRole } from "@/lib/cms-auth";
import { can } from "@/lib/cms-auth";
import { db } from "@/lib/db";
import { awardPoints } from "@/lib/rewards";

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
    const cat = url.searchParams.get("cat");
    const tag = url.searchParams.get("tag");
    const sort = url.searchParams.get("sort") ?? "latest";
    const page = Number(url.searchParams.get("page") ?? "1");
    const limit = Number(url.searchParams.get("limit") ?? "6");

    let articles = await db.articles.where("kind").equals(kind).toArray();

    if (cat && cat !== "All") {
      articles = articles.filter((a) => a.cat === cat);
    }
    if (tag) {
      articles = articles.filter((a) => a.tag === tag);
    }

    if (sort === "popular") {
      articles.sort((a, b) => b.read - a.read);
    } else if (sort === "recommended") {
      // Shuffle deterministically by id for demo
      articles.sort((a, b) => a.id.localeCompare(b.id));
    } else {
      // latest — by date descending (string compare works for "May DD" format)
      articles.sort((a, b) => b.date.localeCompare(a.date));
    }

    const total = articles.length;
    const start = (page - 1) * limit;
    const paged = articles.slice(start, start + limit);

    return HttpResponse.json({
      items: paged,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
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

  http.get("/api/stories/:slug", async ({ params }) => {
    const { slug } = params;
    const article = await db.articles
      .where("slug")
      .equals(slug as string)
      .first();
    if (!article) {
      return HttpResponse.json({ error: "Not found" }, { status: 404 });
    }
    return HttpResponse.json(article);
  }),

  http.get("/api/collections", async ({ request }) => {
    const url = new URL(request.url);
    const memberId = url.searchParams.get("memberId");
    if (!memberId) {
      return HttpResponse.json({ error: "memberId required" }, { status: 400 });
    }
    const collections = await db.collections
      .where("memberId")
      .equals(memberId)
      .toArray();
    const articleIds = collections.map((c) => c.articleId);
    const articles = await db.articles.where("id").anyOf(articleIds).toArray();
    return HttpResponse.json({ collections, articles });
  }),

  http.post("/api/collections", async ({ request }) => {
    const body = (await request.json()) as {
      articleId: string;
      memberId: string;
    };
    const { memberId, articleId } = body;

    // Dedupe: already collected?
    const existing = await db.collections
      .where("[memberId+articleId]")
      .equals([memberId, articleId])
      .first();
    if (existing) {
      return HttpResponse.json({ ok: true, alreadySaved: true });
    }

    await db.collections.add({
      memberId,
      articleId,
      createdAt: new Date().toISOString(),
    });

    // Award points via collect rule (once-per-article)
    const reward = await awardPoints(memberId, "collect", articleId);

    return HttpResponse.json({ ok: true, ...reward });
  }),

  http.delete("/api/collections", async ({ request }) => {
    const url = new URL(request.url);
    const memberId = url.searchParams.get("memberId");
    const articleId = url.searchParams.get("articleId");
    if (!(memberId && articleId)) {
      return HttpResponse.json(
        { error: "memberId and articleId required" },
        { status: 400 }
      );
    }

    const entry = await db.collections
      .where("[memberId+articleId]")
      .equals([memberId, articleId])
      .first();
    if (entry?.id) {
      await db.collections.delete(entry.id);
    }

    return HttpResponse.json({ ok: true });
  }),

  http.post("/api/events", async ({ request }) => {
    const body = (await request.json()) as {
      action: string;
      articleId?: string;
      memberId: string;
    };
    const { action, memberId, articleId } = body;

    if (action === "read_complete" && articleId) {
      // Once-per-article guard
      const existing = await db.behaviorLogs
        .where("[memberId+action+articleId]")
        .equals([memberId, "read_complete", articleId])
        .first();

      if (existing) {
        return HttpResponse.json(
          { error: "Already rewarded for this article" },
          { status: 409 }
        );
      }

      const reward = await awardPoints(memberId, "read_complete", articleId);
      return HttpResponse.json({ ok: true, ...reward });
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
