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

  // Media handlers
  http.get("/api/cms/media", async () => {
    const assets = await db.mediaAssets.toArray();
    return HttpResponse.json(
      assets.map((a) => ({
        id: a.id,
        filename: a.filename,
        mimeType: a.mimeType,
        alt: a.alt,
        focalPoint: a.focalPoint,
        createdAt: a.createdAt,
        url: URL.createObjectURL(a.blob),
      }))
    );
  }),

  http.post("/api/cms/media", async ({ request }) => {
    const denied = guardRole(request, "upload_media");
    if (denied) {
      return denied;
    }
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    if (!file) {
      return HttpResponse.json({ error: "No file" }, { status: 400 });
    }
    const alt = (formData.get("alt") as string) || "";
    const id = `media_${Date.now().toString(36)}`;
    const asset = {
      id,
      filename: file.name,
      mimeType: file.type,
      blob: new Blob([await file.arrayBuffer()], { type: file.type }),
      alt,
      createdAt: new Date().toISOString(),
    };
    await db.mediaAssets.put(asset);
    return HttpResponse.json(
      {
        id: asset.id,
        filename: asset.filename,
        mimeType: asset.mimeType,
        alt: asset.alt,
        createdAt: asset.createdAt,
        url: URL.createObjectURL(asset.blob),
      },
      { status: 201 }
    );
  }),

  http.delete("/api/cms/media/:id", async ({ request, params }) => {
    const denied = guardRole(request, "upload_media");
    if (denied) {
      return denied;
    }
    const id = params.id as string;
    const existing = await db.mediaAssets.get(id);
    if (!existing) {
      return HttpResponse.json({ error: "Not found" }, { status: 404 });
    }
    await db.mediaAssets.delete(id);
    return HttpResponse.json({ ok: true });
  }),
];
