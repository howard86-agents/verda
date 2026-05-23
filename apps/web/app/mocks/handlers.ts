import { HttpResponse, http } from "msw";
import { adjustPoints, currentBalance, softDeleteMember } from "@/lib/audit";
import { evaluateBadges } from "@/lib/badges";
import type { CmsAction, CmsRole } from "@/lib/cms-auth";
import { can } from "@/lib/cms-auth";
import {
  listAllRecentComments,
  listComments,
  postComment,
  removeComment,
} from "@/lib/comments";
import {
  db,
  GROWTH_CONFIG_DEFAULT_ID,
  GROWTH_CONFIG_DEFAULT_MAX_ITEMS,
} from "@/lib/db";
import { getReactionState, toggleReaction } from "@/lib/reactions";
import { composePublicReaderProfile } from "@/lib/reader-profile";
import { createSubmission } from "@/lib/reader-submissions";
import {
  buildRedemption,
  checkEligibility,
  mockRewardFor,
} from "@/lib/redemption";
import { allocateGrowthForMember, awardPoints, levelFor } from "@/lib/rewards";
import { searchArticles } from "@/lib/search";
import { computeStreak, isMaintainingStreak } from "@/lib/streak";

async function handleRedemption(body: {
  growthItemId?: number;
  memberId?: string;
}) {
  const { memberId, growthItemId } = body;
  if (!memberId || typeof growthItemId !== "number") {
    return HttpResponse.json(
      { error: "memberId and growthItemId required" },
      { status: 400 }
    );
  }

  const item = await db.growthItems.get(growthItemId);
  if (!item) {
    return HttpResponse.json(
      { error: "Growth item not found" },
      { status: 404 }
    );
  }
  if (item.memberId !== memberId) {
    return HttpResponse.json(
      { error: "Growth item does not belong to this member" },
      { status: 403 }
    );
  }

  const existing = await db.redemptions
    .where("growthItemId")
    .equals(growthItemId)
    .toArray();

  const eligibility = checkEligibility(item, existing);
  if (!eligibility.ok) {
    const status = eligibility.reason === "not_completed" ? 400 : 409;
    return HttpResponse.json(
      { error: "Redemption not allowed", reason: eligibility.reason },
      { status }
    );
  }

  const now = new Date().toISOString();
  const payload = mockRewardFor(item, now);
  const id = `red_${Date.now().toString(36)}`;
  const redemption = buildRedemption({ id, item, payload, now });

  await db.redemptions.put(redemption);
  await db.growthItems.update(growthItemId, {
    redeemedAt: now,
    redemptionId: id,
  });

  return HttpResponse.json({ ok: true, redemption });
}

/**
 * Auto-promote any `scheduled` articles whose `scheduledAt` time has
 * passed to `published` before serving listing handlers (issue #77).
 * The CMS UI wires `Schedule` to `POST /api/cms/articles/:id/schedule`,
 * which sets the row to `scheduled`; this side-effect ensures the
 * promotion eventually fires the next time *anyone* opens a list.
 */
async function promoteDueScheduled(): Promise<void> {
  const now = Date.now();
  const due = await db.articles
    .filter(
      (a) =>
        a.status === "scheduled" &&
        !!a.scheduledAt &&
        new Date(a.scheduledAt).getTime() <= now
    )
    .toArray();
  if (due.length === 0) {
    return;
  }
  const stamp = new Date().toISOString();
  await Promise.all(
    due.map((a) =>
      db.articles.update(a.id, {
        status: "published",
        publishedAt: stamp,
        scheduledAt: undefined,
      })
    )
  );
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
  const pts = rule?.enabled ? rule.points : 0;

  const ledger = await db.pointLedger
    .where("memberId")
    .equals(memberId)
    .toArray();
  const currentLedgerBalance =
    ledger.length > 0 ? Math.max(...ledger.map((e) => e.balanceAfter)) : 0;
  const newBalance = currentLedgerBalance + pts;

  await db.behaviorLogs.add({
    memberId,
    action: "check_in",
    createdAt: new Date().toISOString(),
  });

  if (pts > 0) {
    await db.pointLedger.add({
      memberId,
      amount: pts,
      balanceAfter: newBalance,
      reason: "Daily check-in",
      createdAt: new Date().toISOString(),
    });

    // Multi-collectible allocation (issue #67) — allocate the awarded
    // delta into the active growth item, overflow + cap enforced.
    await allocateGrowthForMember(memberId, pts);
  }

  // Streak bonus (issue #92) — fires from day 2 onwards. The
  // `streak_bonus` reward rule's per-day limit makes this idempotent if
  // multiple read_completes land in the same day too.
  const streakResult = await applyStreakBonus(memberId);

  // Badge evaluation (issue #93) — runs after the growth allocation +
  // streak bonus so a level-up triggered by either can light up
  // first_bloom in the same response.
  const newBadges = await evaluateBadges(memberId);

  return HttpResponse.json({
    ok: true,
    points: pts + streakResult.points,
    balance: streakResult.balance > 0 ? streakResult.balance : newBalance,
    streak: streakResult.streak,
    streakPoints: streakResult.points,
    newBadges: newBadges.map((b) => b.badgeId),
  });
}

/**
 * Apply the consecutive-day streak bonus (issue #92). Reads the
 * member's behavior log fresh — the calling check-in / read-complete
 * handler has already appended its own entry — so the streak count
 * includes today. The actual award goes through the standard reward
 * pipeline (`awardPoints("streak_bonus")`) so it inherits the per-day
 * guard, the configured points, and the growth allocation.
 */
async function applyStreakBonus(memberId: string): Promise<{
  balance: number;
  points: number;
  streak: number;
}> {
  const allLogs = await db.behaviorLogs
    .where("memberId")
    .equals(memberId)
    .toArray();
  const streak = computeStreak(allLogs);
  if (!isMaintainingStreak(streak)) {
    const ledger = await db.pointLedger
      .where("memberId")
      .equals(memberId)
      .toArray();
    const balance =
      ledger.length > 0 ? Math.max(...ledger.map((e) => e.balanceAfter)) : 0;
    return { points: 0, balance, streak };
  }
  const reward = await awardPoints(memberId, "streak_bonus");
  return { points: reward.points, balance: reward.balance, streak };
}

function getRoleFromHeader(request: Request): CmsRole {
  return (request.headers.get("x-cms-role") as CmsRole) || "editor";
}

function adminIdForRequest(request: Request): string {
  // Prefer an explicit admin id header if present; otherwise derive from the
  // role header so the audit trail records the active admin in dev/demo.
  const explicit = request.headers.get("x-cms-admin-id");
  if (explicit) {
    return explicit;
  }
  const role = getRoleFromHeader(request);
  const map: Record<CmsRole, string> = {
    editor: "admin_editor_01",
    publisher: "admin_publisher_01",
    admin: "admin_admin_01",
    "customer-service": "admin_cs_01",
  };
  return map[role];
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

// The Dexie-backed handlers for `/api/stories` and `/api/stories/:slug`
// are factored out so `mocks/browser.ts` can opt them out when
// `NEXT_PUBLIC_API_MODE=real` (issue #126). With the migrated handlers
// dropped, MSW falls through (`onUnhandledRequest: "bypass"`) and the
// real Postgres-backed Route Handlers under `app/api/stories/...`
// serve the request instead.
export const migratedStoriesHandlers = [
  http.get("/api/stories", async ({ request }) => {
    await promoteDueScheduled();
    const url = new URL(request.url);
    const kind = url.searchParams.get("kind") ?? "brand";
    const cat = url.searchParams.get("cat");
    const section = url.searchParams.get("section");
    const tag = url.searchParams.get("tag");
    const sort = url.searchParams.get("sort") ?? "latest";
    const page = Number(url.searchParams.get("page") ?? "1");
    const limit = Number(url.searchParams.get("limit") ?? "6");

    let articles = await db.articles.where("kind").equals(kind).toArray();

    // Only show published articles on public listing
    articles = articles.filter((a) => a.status === "published");

    if (cat && cat !== "All") {
      articles = articles.filter((a) => a.cat === cat);
    }
    if (section) {
      articles = articles.filter((a) => a.section === section);
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
];

// The Dexie-backed handler for `/api/search` is factored out so
// `mocks/browser.ts` can opt it out when `NEXT_PUBLIC_API_MODE=real`
// (issue #128). With the migrated handler dropped, MSW falls through
// and the real Postgres-backed Route Handler serves the request.
export const migratedSearchHandlers = [
  http.get("/api/search", async ({ request }) => {
    const url = new URL(request.url);
    const q = url.searchParams.get("q") ?? "";
    const limit = Math.max(
      1,
      Math.min(20, Number(url.searchParams.get("limit") ?? "8"))
    );
    if (!q.trim()) {
      return HttpResponse.json({ items: [], total: 0 });
    }
    const articles = await db.articles.toArray();
    const published = articles.filter((a) => a.status === "published");
    const hits = searchArticles(q, published, limit);
    return HttpResponse.json({
      items: hits.map((h) => ({
        id: h.article.id,
        slug: h.article.slug,
        title: h.article.title,
        sum: h.article.sum,
        tag: h.article.tag,
        kind: h.article.kind,
        cat: h.article.cat,
        section: h.article.section,
        date: h.article.date,
        score: h.score,
        matchedFields: h.matchedFields,
      })),
      total: hits.length,
    });
  }),
];

export const handlers = [
  ...migratedStoriesHandlers,

  http.get("/api/cms/articles", async () => {
    await promoteDueScheduled();
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
    const series = body.series as
      | { name?: unknown; ordinal?: unknown }
      | undefined;
    const article = {
      id,
      slug: (body.slug as string) || id,
      kind: (body.kind as string) || "brand",
      cat: (body.cat as string) || "",
      section:
        typeof body.section === "string" && body.section
          ? (body.section as string)
          : undefined,
      series:
        series &&
        typeof series.name === "string" &&
        series.name &&
        typeof series.ordinal === "number" &&
        series.ordinal > 0
          ? { name: series.name, ordinal: series.ordinal }
          : undefined,
      submittedBy:
        typeof body.submittedBy === "string" && body.submittedBy
          ? (body.submittedBy as string)
          : undefined,
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

  http.get("/api/cms/members", async ({ request }) => {
    const url = new URL(request.url);
    const q = (url.searchParams.get("q") ?? "").trim().toLowerCase();
    const includeDeleted = url.searchParams.get("includeDeleted") === "1";

    const all = await db.members.toArray();
    const visible = includeDeleted ? all : all.filter((m) => !m.deletedAt);
    const matched = q
      ? visible.filter(
          (m) =>
            m.id.toLowerCase().includes(q) ||
            m.name.toLowerCase().includes(q) ||
            m.email.toLowerCase().includes(q)
        )
      : visible;

    const enriched = await Promise.all(
      matched.map(async (m) => {
        const balance = await currentBalance(m.id);
        const growth = await db.growthItems
          .where("memberId")
          .equals(m.id)
          .first();
        return {
          id: m.id,
          name: m.name,
          email: m.email,
          joined: m.joined,
          deletedAt: m.deletedAt ?? null,
          balance,
          level: growth?.level ?? 1,
        };
      })
    );

    enriched.sort((a, b) => a.name.localeCompare(b.name));
    return HttpResponse.json({ items: enriched, total: enriched.length });
  }),

  http.get("/api/cms/members/:id", async ({ params }) => {
    const id = params.id as string;
    const member = await db.members.get(id);
    if (!member) {
      return HttpResponse.json({ error: "Not found" }, { status: 404 });
    }

    const ledger = await db.pointLedger.where("memberId").equals(id).toArray();
    const ledgerSorted = [...ledger].sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    const balance = await currentBalance(id);

    const growthItems = await db.growthItems
      .where("memberId")
      .equals(id)
      .toArray();
    const growthRules = await db.growthRules.toArray();
    // Pick the active item (newest non-completed, by sequence) so the
    // single-item summary the CMS detail UI consumes still makes sense
    // under the multi-collectible model. If every item is complete (or
    // none exist) fall back to the most recent item, then to the
    // member-level balance/level.
    const sortedItems = [...growthItems].sort(
      (a, b) => (b.sequence ?? 0) - (a.sequence ?? 0)
    );
    const activeItem =
      sortedItems.find((g) => !g.completedAt) ?? sortedItems[0];
    const growth = activeItem;
    const level = growth?.level ?? levelFor(balance, growthRules);
    const currentRule = growthRules.find((r) => r.level === level);
    const nextRule = growthRules.find((r) => r.level === level + 1);

    const behaviorLogs = await db.behaviorLogs
      .where("memberId")
      .equals(id)
      .toArray();
    const behaviorSorted = [...behaviorLogs].sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    const collections = await db.collections
      .where("memberId")
      .equals(id)
      .toArray();
    const articleIds = collections.map((c) => c.articleId);
    const collectedArticles =
      articleIds.length > 0
        ? await db.articles.where("id").anyOf(articleIds).toArray()
        : [];

    const auditEntries = await db.auditLog
      .where("memberId")
      .equals(id)
      .toArray();
    const auditSorted = [...auditEntries].sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    return HttpResponse.json({
      member: {
        id: member.id,
        name: member.name,
        email: member.email,
        joined: member.joined,
        deletedAt: member.deletedAt ?? null,
      },
      balance,
      growth: {
        level,
        nutrients: growth?.nutrients ?? balance,
        currentName: currentRule?.name ?? "Seed",
        currentJp: currentRule?.jp ?? "種",
        nextName: nextRule?.name ?? null,
        nextThreshold: nextRule?.threshold ?? null,
      },
      ledger: ledgerSorted,
      behaviorLogs: behaviorSorted,
      collections: collectedArticles,
      auditLog: auditSorted,
    });
  }),

  http.post(
    "/api/cms/members/:id/point-adjust",
    async ({ request, params }) => {
      const denied = guardRole(request, "point_adjust");
      if (denied) {
        return denied;
      }
      const id = params.id as string;
      const member = await db.members.get(id);
      if (!member) {
        return HttpResponse.json({ error: "Not found" }, { status: 404 });
      }
      if (member.deletedAt) {
        return HttpResponse.json(
          { error: "Member is deleted" },
          { status: 409 }
        );
      }
      const body = (await request.json()) as {
        amount?: number;
        reason?: string;
      };
      const amount = Number(body.amount);
      const reason = String(body.reason ?? "");
      try {
        const result = await adjustPoints({
          memberId: id,
          adminId: adminIdForRequest(request),
          amount,
          reason,
        });
        return HttpResponse.json({ ok: true, ...result });
      } catch (e) {
        return HttpResponse.json(
          { error: e instanceof Error ? e.message : "Adjustment failed" },
          { status: 400 }
        );
      }
    }
  ),

  http.delete("/api/cms/members/:id", async ({ request, params }) => {
    const denied = guardRole(request, "member_delete");
    if (denied) {
      return denied;
    }
    const id = params.id as string;
    const url = new URL(request.url);
    const reason = (url.searchParams.get("reason") ?? "").trim();
    if (!reason) {
      return HttpResponse.json(
        { error: "Reason is required" },
        { status: 400 }
      );
    }
    try {
      const result = await softDeleteMember({
        memberId: id,
        adminId: adminIdForRequest(request),
        reason,
      });
      return HttpResponse.json({ ok: true, ...result });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Delete failed";
      const status = msg.includes("not found") ? 404 : 400;
      return HttpResponse.json({ error: msg }, { status });
    }
  }),

  // Public reader profile (issue #103) — composes the member, their
  // active growth item summary, and their approved submissions into a
  // narrow, privacy-filtered payload. Returns 404 for unknown or
  // soft-deleted members. Email and the private nutrient ledger are
  // never part of this payload. Issue #105 adds the earned-badge
  // shelf alongside.
  http.get("/api/readers/u/:id", async ({ params }) => {
    const id = params.id as string;
    const member = await db.members.get(id);
    const articles = await db.articles
      .where("submittedBy")
      .equals(id)
      .toArray();
    const growthItems = await db.growthItems
      .where("memberId")
      .equals(id)
      .toArray();
    const growthRules = await db.growthRules.toArray();
    const badges = await db.memberBadges.where("memberId").equals(id).toArray();

    const profile = composePublicReaderProfile({
      member,
      articles,
      growthItems,
      growthRules,
      badges,
    });
    if (!profile) {
      return HttpResponse.json({ error: "Not found" }, { status: 404 });
    }
    return HttpResponse.json(profile);
  }),

  ...migratedSearchHandlers,

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

  http.post("/api/redemptions", async ({ request }) => {
    const body = (await request.json()) as {
      growthItemId?: number;
      memberId?: string;
    };
    return handleRedemption(body);
  }),

  // Public reader-submission endpoint (issue #91). Auth-gated by
  // requiring a memberId on the body — UI is also gated, this mirror
  // is so the storage record never lands without attribution. The
  // handler trusts the body's memberId because the public app's
  // session is mocked client-side; no SSR auth to verify.
  http.post("/api/readers/submissions", async ({ request }) => {
    const body = (await request.json()) as {
      bodyJson?: string;
      coverFocalPoint?: { x: number; y: number };
      coverUrl?: string;
      memberId?: string;
      title?: string;
    };
    if (!body.memberId) {
      return HttpResponse.json({ error: "Sign in to submit" }, { status: 401 });
    }
    try {
      const article = await createSubmission({
        memberId: body.memberId,
        draft: {
          title: body.title ?? "",
          bodyJson: body.bodyJson ?? "",
          coverUrl: body.coverUrl,
          coverFocalPoint: body.coverFocalPoint,
        },
      });
      return HttpResponse.json(article, { status: 201 });
    } catch (e) {
      return HttpResponse.json(
        { error: e instanceof Error ? e.message : "Submission failed" },
        { status: 400 }
      );
    }
  }),

  // CMS submission approval queue (issue #102). Listing returns
  // pending reader-contributed articles for the moderation desk;
  // approve flips the row to published (status===published is the
  // sentinel the public Readers listing already filters on), reject
  // sets a 'rejected' status that stays out of the public listing
  // too. Both mutations are role-guarded by the existing `publish`
  // policy so only publishers + admins can act.
  http.get("/api/cms/submissions", async () => {
    const pending = await db.articles
      .where("kind")
      .equals("submission")
      .filter((a) => a.status === "pending")
      .toArray();
    pending.sort((a, b) => b.date.localeCompare(a.date));
    // Enrich with the submitter's display name so the list doesn't
    // need a follow-up join.
    const ids = [
      ...new Set(
        pending.map((a) => a.submittedBy).filter((id): id is string => !!id)
      ),
    ];
    const members = ids.length
      ? await db.members.where("id").anyOf(ids).toArray()
      : [];
    const memberById = new Map(members.map((m) => [m.id, m]));
    return HttpResponse.json({
      items: pending.map((a) => ({
        id: a.id,
        title: a.title,
        slug: a.slug,
        submittedAt: a.date,
        submittedBy: a.submittedBy ?? null,
        submitterName: a.submittedBy
          ? (memberById.get(a.submittedBy)?.name ?? a.submittedBy)
          : "Anonymous",
        kind: a.kind,
      })),
      total: pending.length,
    });
  }),

  http.post("/api/cms/submissions/:id/approve", async ({ request, params }) => {
    const denied = guardRole(request, "publish");
    if (denied) {
      return denied;
    }
    const id = params.id as string;
    const existing = await db.articles.get(id);
    if (!existing) {
      return HttpResponse.json({ error: "Not found" }, { status: 404 });
    }
    if (existing.kind !== "submission") {
      return HttpResponse.json(
        { error: "Article is not a reader submission" },
        { status: 400 }
      );
    }
    await db.articles.update(id, {
      status: "published",
      publishedAt: new Date().toISOString(),
    });
    const updated = await db.articles.get(id);
    // Community reward (issue #104). Awarding through the standard
    // pipeline writes a behaviorLog + ledger entry and allocates the
    // delta to the submitter's growth item. The `per-article` limit on
    // `rr_submission_approved` ensures re-approval (e.g. unpublish →
    // approve again) doesn't double-award. Disabled rules silently
    // award zero, satisfying the disabled-rule acceptance path.
    let reward: Awaited<ReturnType<typeof awardPoints>> | undefined;
    let newBadges: string[] = [];
    if (existing.submittedBy) {
      reward = await awardPoints(
        existing.submittedBy,
        "submission_approved",
        id
      );
      // Community badges (issue #105). Re-evaluate the submitter's
      // shelf so `first_submission` lands the moment their first
      // approved piece is published. The evaluator is idempotent — a
      // member with the badge already keeps it without a duplicate row.
      const awarded = await evaluateBadges(existing.submittedBy);
      newBadges = awarded.map((b) => b.badgeId);
    }
    return HttpResponse.json({
      ok: true,
      article: updated,
      reward: reward && reward.points > 0 ? reward : undefined,
      newBadges,
    });
  }),

  http.post("/api/cms/submissions/:id/reject", async ({ request, params }) => {
    const denied = guardRole(request, "publish");
    if (denied) {
      return denied;
    }
    const id = params.id as string;
    const existing = await db.articles.get(id);
    if (!existing) {
      return HttpResponse.json({ error: "Not found" }, { status: 404 });
    }
    if (existing.kind !== "submission") {
      return HttpResponse.json(
        { error: "Article is not a reader submission" },
        { status: 400 }
      );
    }
    await db.articles.update(id, { status: "rejected" });
    const updated = await db.articles.get(id);
    return HttpResponse.json({ ok: true, article: updated });
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
      const streakResult = await applyStreakBonus(memberId);
      // Evaluate badges after the reward, growth allocation, and
      // streak bonus have landed so reading milestones and first-bloom
      // can trigger off the same write (issue #93). Awarded ids are
      // returned so the client can show a celebratory cue if it wants.
      const newBadges = await evaluateBadges(memberId);
      return HttpResponse.json({
        ok: true,
        ...reward,
        points: reward.points + streakResult.points,
        balance:
          streakResult.balance > 0 ? streakResult.balance : reward.balance,
        streak: streakResult.streak,
        streakPoints: streakResult.points,
        newBadges: newBadges.map((b) => b.badgeId),
      });
    }

    if (action === "check_in") {
      return handleCheckIn(memberId);
    }

    return HttpResponse.json({ ok: true });
  }),

  // Story comments (issue #89). Reads are public; writes require a
  // signed-in member id in the body. Newest-first ordering and
  // soft-removal filtering live in the helper so the same shape is
  // exercised by tests.
  http.get("/api/articles/:articleId/comments", async ({ params }) => {
    const articleId = params.articleId as string;
    const comments = await listComments(articleId);
    return HttpResponse.json({ items: comments });
  }),

  http.post(
    "/api/articles/:articleId/comments",
    async ({ request, params }) => {
      const articleId = params.articleId as string;
      const body = (await request.json()) as {
        memberId?: string;
        memberName?: string;
        text?: string;
      };
      if (!body.memberId) {
        return HttpResponse.json(
          { error: "Sign in to post a comment" },
          { status: 401 }
        );
      }
      if (!body.text?.trim()) {
        return HttpResponse.json(
          { error: "Comment text cannot be empty" },
          { status: 400 }
        );
      }
      const comment = await postComment({
        articleId,
        memberId: body.memberId,
        memberName: body.memberName ?? "",
        text: body.text,
      });
      // Community reward (issue #104). Awards run after the comment
      // is persisted so a failed insert can't leak nutrients. The
      // `per-article` limit on `rr_comment_post` rewards the first
      // comment a member leaves on an article and ignores subsequent
      // ones; disabled rules silently award zero.
      const reward = await awardPoints(
        body.memberId,
        "comment_post",
        articleId
      );
      // Community badges (issue #105). Re-evaluate the commenter's
      // shelf so `commenter` lands on their first comment. The
      // evaluator is idempotent — repeats keep the existing row.
      const awarded = await evaluateBadges(body.memberId);
      const newBadges = awarded.map((b) => b.badgeId);
      return HttpResponse.json(
        {
          ...comment,
          reward: reward.points > 0 ? reward : undefined,
          newBadges,
        },
        { status: 201 }
      );
    }
  ),

  // Story reactions (issue #90). Reads carry an optional `memberId`
  // query param so logged-out readers still see counts, and signed-in
  // readers see their own current state. Toggles require a `memberId`
  // in the body and use the same compound-unique storage layer to
  // ensure a member can hold at most one of each kind per article.
  http.get(
    "/api/articles/:articleId/reactions",
    async ({ params, request }) => {
      const articleId = params.articleId as string;
      const url = new URL(request.url);
      const memberId = url.searchParams.get("memberId");
      const state = await getReactionState({ articleId, memberId });
      return HttpResponse.json(state);
    }
  ),

  http.post(
    "/api/articles/:articleId/reactions",
    async ({ params, request }) => {
      const articleId = params.articleId as string;
      const body = (await request.json()) as {
        kind?: string;
        memberId?: string;
      };
      if (!body.memberId) {
        return HttpResponse.json(
          { error: "Sign in to react" },
          { status: 401 }
        );
      }
      if (
        body.kind !== "grew" &&
        body.kind !== "learned" &&
        body.kind !== "loved"
      ) {
        return HttpResponse.json(
          { error: "Unknown reaction kind" },
          { status: 400 }
        );
      }
      const result = await toggleReaction({
        articleId,
        memberId: body.memberId,
        kind: body.kind,
      });
      // Community reward (issue #104). Award only when the toggle
      // *added* a reaction (`active === true`); removing a reaction
      // never earns a reward and the `per-article` limit on
      // `rr_reaction_react` makes sure the first reaction a member
      // leaves on an article rewards once regardless of which kind
      // they pick later. Disabled rules silently award zero.
      let reward: Awaited<ReturnType<typeof awardPoints>> | undefined;
      if (result.active) {
        reward = await awardPoints(body.memberId, "reaction_react", articleId);
      }
      return HttpResponse.json({
        ...result,
        reward: reward && reward.points > 0 ? reward : undefined,
      });
    }
  ),

  // CMS comment moderation (issue #101). Listing returns recent
  // comments across every article, including soft-removed rows so
  // moderators can see history. Removal sets `removedAt` so the public
  // reader filters them out without losing the audit trail.
  http.get("/api/cms/comments", async ({ request }) => {
    const url = new URL(request.url);
    const limit = Math.max(
      1,
      Math.min(200, Number(url.searchParams.get("limit") ?? "50"))
    );
    const items = await listAllRecentComments(limit);
    const articleIds = [...new Set(items.map((c) => c.articleId))];
    const articles =
      articleIds.length > 0
        ? await db.articles.where("id").anyOf(articleIds).toArray()
        : [];
    const byId = new Map(articles.map((a) => [a.id, a]));
    return HttpResponse.json({
      items: items.map((c) => {
        const a = byId.get(c.articleId);
        return {
          ...c,
          articleSlug: a?.slug ?? "",
          articleTitle: a?.title ?? "(unknown article)",
          articleKind: a?.kind ?? "",
        };
      }),
      total: items.length,
    });
  }),

  http.delete("/api/cms/comments/:id", async ({ params, request }) => {
    const denied = guardRole(request, "moderate_comments");
    if (denied) {
      return denied;
    }
    const id = params.id as string;
    const updated = await removeComment(id);
    if (!updated) {
      return HttpResponse.json({ error: "Not found" }, { status: 404 });
    }
    return HttpResponse.json({ ok: true, comment: updated });
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

  // Article version history
  http.get("/api/cms/articles/:id/versions", async ({ params }) => {
    const articleId = params.id as string;
    const versions = await db.articleVersions
      .where("articleId")
      .equals(articleId)
      .reverse()
      .sortBy("timestamp");
    return HttpResponse.json(versions);
  }),

  http.post("/api/cms/articles/:id/versions", async ({ request, params }) => {
    const denied = guardRole(request, "edit_draft");
    if (denied) {
      return denied;
    }
    const articleId = params.id as string;
    const body = (await request.json()) as Record<string, unknown>;
    const version = {
      id: `ver_${Date.now().toString(36)}`,
      articleId,
      editor: (body.editor as string) || "unknown",
      timestamp: new Date().toISOString(),
      status: (body.status as string) || "draft",
      bodyJson: (body.bodyJson as string) || "",
      summary: (body.summary as string) || "",
    };
    await db.articleVersions.put(version);
    return HttpResponse.json(version, { status: 201 });
  }),

  // Growth-rule settings (issue #30). Reads/writes operate on `growthRules`
  // (level thresholds + display names) and `growthConfig` (the growth-item
  // quantity cap; enforcement deferred to #67).
  http.get("/api/cms/rules/growth", async () => {
    const rules = await db.growthRules.toArray();
    const config = (await db.growthConfig.get(GROWTH_CONFIG_DEFAULT_ID)) ?? {
      id: GROWTH_CONFIG_DEFAULT_ID,
      maxItemsPerMember: GROWTH_CONFIG_DEFAULT_MAX_ITEMS,
    };
    return HttpResponse.json({
      rules: [...rules].sort((a, b) => a.level - b.level),
      config,
    });
  }),

  http.put("/api/cms/rules/growth/config", async ({ request }) => {
    const denied = guardRole(request, "manage_rules");
    if (denied) {
      return denied;
    }
    const body = (await request.json()) as Partial<{
      maxItemsPerMember: number;
    }>;
    const existing = (await db.growthConfig.get(GROWTH_CONFIG_DEFAULT_ID)) ?? {
      id: GROWTH_CONFIG_DEFAULT_ID,
      maxItemsPerMember: GROWTH_CONFIG_DEFAULT_MAX_ITEMS,
    };
    const nextCap =
      typeof body.maxItemsPerMember === "number" &&
      Number.isFinite(body.maxItemsPerMember) &&
      body.maxItemsPerMember >= 0
        ? Math.floor(body.maxItemsPerMember)
        : existing.maxItemsPerMember;
    const next = { ...existing, maxItemsPerMember: nextCap };
    await db.growthConfig.put(next);
    return HttpResponse.json(next);
  }),

  http.put("/api/cms/rules/growth/:level", async ({ request, params }) => {
    const denied = guardRole(request, "manage_rules");
    if (denied) {
      return denied;
    }
    const level = Number.parseInt(params.level as string, 10);
    if (!Number.isFinite(level)) {
      return HttpResponse.json({ error: "Invalid level" }, { status: 400 });
    }
    const existing = await db.growthRules.get(level);
    if (!existing) {
      return HttpResponse.json({ error: "Not found" }, { status: 404 });
    }
    const body = (await request.json()) as Partial<{
      jp: string;
      name: string;
      threshold: number;
    }>;
    const next = {
      ...existing,
      ...(typeof body.name === "string" ? { name: body.name } : {}),
      ...(typeof body.jp === "string" ? { jp: body.jp } : {}),
      ...(typeof body.threshold === "number" &&
      Number.isFinite(body.threshold) &&
      body.threshold >= 0
        ? { threshold: Math.floor(body.threshold) }
        : {}),
    };
    await db.growthRules.put(next);
    return HttpResponse.json(next);
  }),

  // Reward rule settings (issue #29).
  http.get("/api/cms/rules/rewards", async () => {
    const rules = await db.rewardRules.toArray();
    return HttpResponse.json(
      [...rules].sort((a, b) => a.action.localeCompare(b.action))
    );
  }),

  http.put("/api/cms/rules/rewards/:id", async ({ request, params }) => {
    const denied = guardRole(request, "manage_rules");
    if (denied) {
      return denied;
    }
    const id = params.id as string;
    const existing = await db.rewardRules.get(id);
    if (!existing) {
      return HttpResponse.json({ error: "Not found" }, { status: 404 });
    }
    const body = (await request.json()) as Partial<{
      enabled: boolean;
      limitType: string;
      points: number;
    }>;
    const next = {
      ...existing,
      ...(typeof body.points === "number" ? { points: body.points } : {}),
      ...(typeof body.enabled === "boolean" ? { enabled: body.enabled } : {}),
      ...(typeof body.limitType === "string"
        ? { limitType: body.limitType }
        : {}),
    };
    await db.rewardRules.put(next);
    return HttpResponse.json(next);
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
