import {
  CATEGORIES,
  GROWTH_LEVELS,
  MEMBER,
  SECTIONS,
  SOCIAL,
  type Social,
  STORIES,
} from "@verda/data";
import { COMMUNITY_REWARD_RULES } from "./community-rewards";
import {
  type Article,
  db,
  GROWTH_CONFIG_DEFAULT_ID,
  GROWTH_CONFIG_DEFAULT_MAX_ITEMS,
} from "./db";
import {
  buildReaderMemberSeed,
  READER_ATTRIBUTION,
  SEEDED_READER_MEMBERS,
} from "./reader-seed-data";
import { STORY_BODIES } from "./story-bodies";

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

function readerSeedFor(s: Social): Article {
  const attr = READER_ATTRIBUTION[s.id];
  // Compose a Tiptap doc out of the attribution paragraphs so the public
  // reader detail (#75) renders the seeded body the same way it would
  // any CMS-authored article. Items missing an attribution entry fall
  // back to a single-paragraph caption so the renderer still mounts.
  const paragraphs =
    attr?.body && attr.body.length > 0
      ? attr.body
      : [`${s.title} — sent in by ${s.src} on ${s.date}.`];
  return {
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
    submittedBy: s.submittedBy,
    sourceUrl: attr?.sourceUrl,
    license: attr?.license,
    contributors: attr?.contributors,
    // Seeded reader items are editorially approved; mark them
    // `published` so the public Readers listing (and the homepage
    // reader sidebar) populates on first boot. The user-submission
    // path (#91) keeps creating `pending` rows, which the listing
    // continues to filter out.
    status: "published",
    bodyJson: JSON.stringify({
      type: "doc",
      content: paragraphs.map((text) => ({
        type: "paragraph",
        content: [{ type: "text", text }],
      })),
    }),
  };
}

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
    STORIES.map((s) => {
      // Section-fill stories (issue #96) ship multi-paragraph bodies via
      // STORY_BODIES so the public reader has real ~400-700 word content
      // to render. Stories without a custom body fall back to the
      // single-paragraph behaviour used by s01–s06 (paragraph derived
      // from `sum`). Both shapes are valid Tiptap docs the renderer
      // already understands.
      const customBody = STORY_BODIES[s.id];
      const bodyJson = customBody
        ? JSON.stringify(customBody)
        : JSON.stringify({
            type: "doc",
            content: [
              {
                type: "paragraph",
                content: [{ type: "text", text: s.sum }],
              },
            ],
          });
      return {
        id: s.id,
        slug: s.slug,
        kind: s.kind,
        cat: s.cat,
        section: s.section,
        series: s.series,
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
        submittedBy: s.submittedBy,
        status: "published",
        bodyJson,
      };
    })
  );

  await db.articles.bulkPut(SOCIAL.map((s) => readerSeedFor(s)));

  // Seed the canonical editorial sections (issue #87) so section-aware
  // surfaces — listing filter, browse pages (#98), search (#99) — can
  // query the taxonomy directly rather than re-deriving it from articles.
  await db.sections.bulkPut(SECTIONS);

  await db.growthRules.bulkPut(
    GROWTH_LEVELS.map((g) => ({
      level: g.n,
      name: g.name,
      jp: g.jp,
      threshold: g.threshold,
    }))
  );

  await db.growthConfig.put({
    id: GROWTH_CONFIG_DEFAULT_ID,
    maxItemsPerMember: GROWTH_CONFIG_DEFAULT_MAX_ITEMS,
  });

  await db.members.put({
    id: MEMBER.memberId,
    name: MEMBER.name,
    email: MEMBER.email,
    joined: MEMBER.joined,
  });

  // Sample members beyond the logged-in MEMBER (issue #31 + #97). Every
  // member here ships starter ledger / growth / behavior so the CMS
  // member admin detail view shows live data and so each reader item's
  // `submittedBy` (issue #97) maps to a real seeded member.
  await db.members.bulkPut(SEEDED_READER_MEMBERS);

  const now = new Date().toISOString();
  const memberSeed = buildReaderMemberSeed(now);
  await db.pointLedger.bulkAdd(memberSeed.pointLedger);

  await db.growthItems.bulkAdd(memberSeed.growthItems);

  await db.behaviorLogs.bulkAdd(memberSeed.behaviorLogs);

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
    {
      id: "rr_streak_bonus",
      action: "streak_bonus",
      points: 5,
      enabled: true,
      limitType: "per-day",
    },
    // Community rules (issue #104). Posting a comment, adding a
    // reaction, and having a submission approved each award nutrients
    // through the same `awardPoints` pipeline as the brand actions
    // above. See `community-rewards.ts` for the action / id contract
    // shared between seed, CMS labels, handlers, and tests.
    ...COMMUNITY_REWARD_RULES,
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

  // Seed a handful of comments so the public reader looks alive on first
  // boot (issue #89). Spread across two stories so the empty state is
  // also exercised on the rest.
  await db.comments.bulkPut([
    {
      id: "cmt_seed_01",
      articleId: "s01",
      memberId: "m_5102",
      memberName: "Hana Watanabe",
      text: "The 'one small thing' framing landed for me. I've been overcomplicating mornings.",
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 26).toISOString(),
    },
    {
      id: "cmt_seed_02",
      articleId: "s01",
      memberId: "m_6033",
      memberName: "Renji Park",
      text: "Reading this on the train; somehow it slowed the train down too.",
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(),
    },
    {
      id: "cmt_seed_03",
      articleId: "s04",
      memberId: "m_7188",
      memberName: "Aiko Sato",
      text: "We've kept up the after-dinner walk for three weeks now. Ten minutes is enough.",
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString(),
    },
  ]);

  // Seed a handful of reactions across two stories so the buttons show
  // live counts on first boot (issue #90). Different kinds across the
  // members exercise the per-kind rollup; the rest of the library
  // exercises the zero-count empty state.
  const reactionStamp = (offsetMinutes: number): string =>
    new Date(Date.now() - offsetMinutes * 60 * 1000).toISOString();
  await db.reactions.bulkAdd([
    {
      memberId: "m_5102",
      articleId: "s01",
      kind: "grew",
      createdAt: reactionStamp(120),
    },
    {
      memberId: "m_6033",
      articleId: "s01",
      kind: "loved",
      createdAt: reactionStamp(60),
    },
    {
      memberId: "m_7188",
      articleId: "s01",
      kind: "learned",
      createdAt: reactionStamp(30),
    },
    {
      memberId: "m_5102",
      articleId: "s04",
      kind: "loved",
      createdAt: reactionStamp(20),
    },
    {
      memberId: "m_6033",
      articleId: "s04",
      kind: "grew",
      createdAt: reactionStamp(10),
    },
  ]);

  localStorage.setItem(SEED_KEY, "1");
}

export async function resetAndReseed() {
  await db.delete();
  await db.open();
  localStorage.removeItem(SEED_KEY);
  await seedIfEmpty();
}
