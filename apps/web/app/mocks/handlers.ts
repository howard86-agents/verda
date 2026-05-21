import { HttpResponse, http } from "msw";
import { db } from "@/lib/db";
import { levelFor } from "@/lib/rewards";

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

      // Check reward rule
      const rule = await db.rewardRules
        .where("action")
        .equals("read_complete")
        .first();
      if (!rule?.enabled) {
        return HttpResponse.json({ ok: true, points: 0 });
      }

      // Get current balance
      const ledger = await db.pointLedger
        .where("memberId")
        .equals(memberId)
        .toArray();
      const currentBalance =
        ledger.length > 0 ? Math.max(...ledger.map((e) => e.balanceAfter)) : 0;
      const newBalance = currentBalance + rule.points;

      // Write behaviorLog
      await db.behaviorLogs.add({
        memberId,
        action: "read_complete",
        articleId,
        createdAt: new Date().toISOString(),
      });

      // Write pointLedger
      await db.pointLedger.add({
        memberId,
        amount: rule.points,
        balanceAfter: newBalance,
        reason: `Read complete: ${articleId}`,
        createdAt: new Date().toISOString(),
      });

      // Recompute growth level
      const rules = await db.growthRules.toArray();
      const newLevel = levelFor(newBalance, rules);

      const growthItem = await db.growthItems
        .where("memberId")
        .equals(memberId)
        .first();

      if (growthItem?.id) {
        await db.growthItems.update(growthItem.id, {
          nutrients: newBalance,
          level: newLevel,
        });
      } else {
        await db.growthItems.add({
          memberId,
          nutrients: newBalance,
          level: newLevel,
        });
      }

      return HttpResponse.json({
        ok: true,
        points: rule.points,
        balance: newBalance,
        level: newLevel,
      });
    }

    return HttpResponse.json({ ok: true });
  }),
];
