import { HttpResponse, http } from "msw";
import { db } from "@/lib/db";
import { awardPoints } from "@/lib/rewards";

export const handlers = [
  http.get("/api/stories", async ({ request }) => {
    const url = new URL(request.url);
    const kind = url.searchParams.get("kind") ?? "brand";

    const articles = await db.articles.where("kind").equals(kind).toArray();
    return HttpResponse.json(articles);
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
];
