import { HttpResponse, http } from "msw";
import { db } from "@/lib/db";
import { levelFor } from "@/lib/rewards";

async function getBalance(memberId: string): Promise<number> {
  const ledger = await db.pointLedger
    .where("memberId")
    .equals(memberId)
    .toArray();
  return ledger.length > 0 ? Math.max(...ledger.map((e) => e.balanceAfter)) : 0;
}

async function updateGrowth(memberId: string, newBalance: number) {
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

  return newLevel;
}

async function handleReadComplete(memberId: string, articleId: string) {
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

  const rule = await db.rewardRules
    .where("action")
    .equals("read_complete")
    .first();
  if (!rule?.enabled) {
    return HttpResponse.json({ ok: true, points: 0 });
  }

  const currentBalance = await getBalance(memberId);
  const newBalance = currentBalance + rule.points;

  await db.behaviorLogs.add({
    memberId,
    action: "read_complete",
    articleId,
    createdAt: new Date().toISOString(),
  });

  await db.pointLedger.add({
    memberId,
    amount: rule.points,
    balanceAfter: newBalance,
    reason: `Read complete: ${articleId}`,
    createdAt: new Date().toISOString(),
  });

  const newLevel = await updateGrowth(memberId, newBalance);

  return HttpResponse.json({
    ok: true,
    points: rule.points,
    balance: newBalance,
    level: newLevel,
  });
}

async function handleCheckIn(memberId: string) {
  const today = new Date().toISOString().slice(0, 10);
  const logs = await db.behaviorLogs
    .where("memberId")
    .equals(memberId)
    .toArray();
  const alreadyToday = logs.some(
    (l) => l.action === "check_in" && l.createdAt.slice(0, 10) === today
  );

  if (alreadyToday) {
    return HttpResponse.json(
      { error: "Already checked in today" },
      { status: 409 }
    );
  }

  const rule = await db.rewardRules
    .where("action")
    .equals("daily_check_in")
    .first();
  const points = rule?.enabled ? rule.points : 0;

  const currentBalance = await getBalance(memberId);
  const newBalance = currentBalance + points;

  await db.behaviorLogs.add({
    memberId,
    action: "check_in",
    createdAt: new Date().toISOString(),
  });

  if (points > 0) {
    await db.pointLedger.add({
      memberId,
      amount: points,
      balanceAfter: newBalance,
      reason: "Daily check-in",
      createdAt: new Date().toISOString(),
    });

    await updateGrowth(memberId, newBalance);
  }

  return HttpResponse.json({ ok: true, points, balance: newBalance });
}

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
      return handleReadComplete(memberId, articleId);
    }

    if (action === "check_in") {
      return handleCheckIn(memberId);
    }

    return HttpResponse.json({ ok: true });
  }),
];
