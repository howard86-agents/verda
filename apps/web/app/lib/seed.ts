import {
  CATEGORIES,
  GROWTH_LEVELS,
  MEMBER,
  SOCIAL,
  STORIES,
} from "@verda/data";
import { db } from "./db";

const SEED_KEY = "verda.seeded";

const PUBLIC_IMAGES = [
  { path: "/img/stories/s01.webp", filename: "s01.webp" },
  { path: "/img/stories/s02.webp", filename: "s02.webp" },
  { path: "/img/stories/s03.webp", filename: "s03.webp" },
  { path: "/img/stories/s04.webp", filename: "s04.webp" },
  { path: "/img/stories/s05.webp", filename: "s05.webp" },
  { path: "/img/stories/s06.webp", filename: "s06.webp" },
  { path: "/img/social/r01.webp", filename: "r01.webp" },
  { path: "/img/social/r02.webp", filename: "r02.webp" },
  { path: "/img/social/r03.webp", filename: "r03.webp" },
];

async function seedMedia() {
  const count = await db.mediaAssets.count();
  if (count > 0) {
    return;
  }
  const assets = await Promise.all(
    PUBLIC_IMAGES.map(async (img, i) => {
      try {
        const res = await fetch(img.path);
        if (!res.ok) {
          return null;
        }
        const blob = await res.blob();
        return {
          id: `seed_${i + 1}`,
          filename: img.filename,
          mimeType: "image/webp",
          blob,
          alt: img.filename.replace(".webp", ""),
          createdAt: new Date().toISOString(),
        };
      } catch {
        return null;
      }
    })
  );
  const valid = assets.filter(Boolean) as NonNullable<
    (typeof assets)[number]
  >[];
  if (valid.length > 0) {
    await db.mediaAssets.bulkPut(valid);
  }
}

export async function seedIfEmpty() {
  if (typeof window === "undefined") {
    return;
  }
  const count = await db.articles.count();
  if (count > 0) {
    return;
  }

  await db.articles.bulkPut(
    STORIES.map((s) => ({
      id: s.id,
      slug: s.slug,
      kind: s.kind,
      cat: s.cat,
      tag: s.tag,
      title: s.title,
      jp: s.jp,
      sum: s.sum,
      img: s.img,
      imagePrompt: s.imagePrompt,
      imageSeed: s.imageSeed,
      read: s.read,
      date: s.date,
      author: s.author,
      status: "published",
      bodyJson: JSON.stringify({
        type: "doc",
        content: [
          {
            type: "paragraph",
            content: [{ type: "text", text: s.sum }],
          },
        ],
      }),
    }))
  );

  await db.articles.bulkPut(
    SOCIAL.map((s) => ({
      id: s.id,
      slug: s.slug,
      kind: s.kind,
      cat: "",
      tag: s.tag,
      title: s.title,
      jp: "",
      sum: "",
      img: s.img,
      imagePrompt: s.imagePrompt,
      imageSeed: s.imageSeed,
      read: 0,
      date: s.date,
      author: "",
      src: s.src,
    }))
  );

  await db.growthRules.bulkPut(
    GROWTH_LEVELS.map((g) => ({
      level: g.n,
      name: g.name,
      jp: g.jp,
      threshold: g.threshold,
    }))
  );

  await db.members.put({
    id: MEMBER.memberId,
    name: MEMBER.name,
    email: MEMBER.email,
    joined: MEMBER.joined,
  });

  // Additional sample members so the CMS member admin list is exerciseable.
  // Each gets a starter ledger / growth so the detail view shows live data.
  await db.members.bulkPut([
    {
      id: "m_5102",
      name: "Hana Watanabe",
      email: "hana.w@example.com",
      joined: "Joined April 2024",
    },
    {
      id: "m_6033",
      name: "Renji Park",
      email: "renji.p@example.com",
      joined: "Joined May 2024",
    },
    {
      id: "m_7188",
      name: "Aiko Sato",
      email: "aiko.s@example.com",
      joined: "Joined July 2024",
    },
  ]);

  const now = new Date().toISOString();
  await db.pointLedger.bulkAdd([
    {
      memberId: "m_5102",
      amount: 60,
      balanceAfter: 60,
      reason: "Onboarding bonus",
      createdAt: now,
    },
    {
      memberId: "m_6033",
      amount: 25,
      balanceAfter: 25,
      reason: "Read · A walk after dinner",
      createdAt: now,
    },
    {
      memberId: "m_7188",
      amount: 5,
      balanceAfter: 5,
      reason: "Daily check-in",
      createdAt: now,
    },
  ]);

  await db.growthItems.bulkAdd([
    { memberId: "m_5102", nutrients: 60, level: 2 },
    { memberId: "m_6033", nutrients: 25, level: 1 },
    { memberId: "m_7188", nutrients: 5, level: 1 },
  ]);

  await db.behaviorLogs.bulkAdd([
    {
      memberId: "m_5102",
      action: "login_91app",
      createdAt: now,
    },
    {
      memberId: "m_6033",
      action: "read_complete",
      articleId: "s04",
      createdAt: now,
    },
    {
      memberId: "m_7188",
      action: "check_in",
      createdAt: now,
    },
  ]);

  await db.rewardRules.bulkPut([
    {
      id: "rr_read",
      action: "read_complete",
      points: 10,
      enabled: true,
      limitType: "per-article",
    },
    {
      id: "rr_checkin",
      action: "daily_check_in",
      points: 5,
      enabled: true,
      limitType: "per-day",
    },
    {
      id: "rr_collect",
      action: "collect",
      points: 2,
      enabled: true,
      limitType: "per-article",
    },
  ]);

  await db.categories.bulkPut(
    CATEGORIES.filter((c) => c !== "All").map((c) => ({
      id: c.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
      name: c,
    }))
  );

  const tags = [...new Set(STORIES.map((s) => s.tag))];
  await db.tags.bulkPut(
    tags.map((t) => ({
      id: t.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
      name: t,
    }))
  );

  await seedMedia();

  localStorage.setItem(SEED_KEY, "1");
}

export async function resetAndReseed() {
  await db.delete();
  await db.open();
  localStorage.removeItem(SEED_KEY);
  await seedIfEmpty();
}
