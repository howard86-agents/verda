import "dotenv/config";
import {
  CATEGORIES,
  GROWTH_LEVELS,
  MEMBER,
  SECTIONS,
  STORIES,
} from "@verda/data";
import type { $Enums, Prisma } from "../generated/client";
import { prisma } from "./client";

/**
 * Seed sections, brand stories, and identity rows for the verda
 * backend.
 *
 * Issue #126 introduced the section + article seed for the walking
 * skeleton. Issue #127 layers in the Auth.js identity rows so reader
 * + staff users land in Postgres as real `User` rows with stable ids,
 * and the JWT `sub` claim round-trips into the legacy reader UI
 * (which expects `m_4421` / `m_5102` style ids) without rewriting
 * every component.
 *
 * Each entity is upserted on a stable key so reseeding is idempotent.
 */

interface SeedReader {
  email: string;
  id: string;
  initial: string;
  joined: string;
  name: string;
}

// Mirrors `MEMBER` from `@verda/data` plus the three reader members
// that the in-browser Dexie store ships with from `reader-seed-data`.
// Keeping the list small here avoids importing app-level code from a
// platform package; later slices (#133, #134) flesh out the staff
// roster and submission queue.
const SEEDED_READER_USERS: SeedReader[] = [
  {
    id: MEMBER.memberId,
    name: MEMBER.name,
    email: MEMBER.email,
    joined: MEMBER.joined,
    initial: MEMBER.initial,
  },
  {
    id: "m_5102",
    name: "Hana Watanabe",
    email: "hana.w@example.com",
    joined: "Joined April 2024",
    initial: "H",
  },
  {
    id: "m_6033",
    name: "Renji Park",
    email: "renji.p@example.com",
    joined: "Joined May 2024",
    initial: "R",
  },
  {
    id: "m_7188",
    name: "Aiko Sato",
    email: "aiko.s@example.com",
    joined: "Joined July 2024",
    initial: "A",
  },
];

interface SeedStaff {
  email: string;
  id: string;
  name: string;
  role: $Enums.Role;
}

const SEEDED_STAFF_USERS: SeedStaff[] = [
  {
    id: "admin_editor_01",
    name: "Editor Eve",
    email: "editor@verda.local",
    role: "editor",
  },
  {
    id: "admin_publisher_01",
    name: "Publisher Pat",
    email: "publisher@verda.local",
    role: "publisher",
  },
  {
    id: "admin_admin_01",
    name: "Admin Ada",
    email: "admin@verda.local",
    role: "admin",
  },
  {
    id: "admin_cs_01",
    name: "Customer Service Cat",
    email: "cs@verda.local",
    role: "customer_service",
  },
];

async function seedSections(): Promise<number> {
  await Promise.all(
    SECTIONS.map((section) =>
      prisma.section.upsert({
        where: { id: section.id },
        update: { name: section.name },
        create: section,
      })
    )
  );
  return prisma.section.count();
}

async function seedArticles(): Promise<number> {
  const now = new Date();
  for (const story of STORIES.filter((s) => s.kind === "brand")) {
    const bodyJson = JSON.stringify({
      type: "doc",
      content: [
        {
          type: "paragraph",
          content: [{ type: "text", text: story.sum }],
        },
      ],
    });
    const data: Prisma.ArticleUncheckedCreateInput = {
      slug: story.slug,
      kind: story.kind,
      cat: story.cat,
      tag: story.tag,
      title: story.title,
      jp: story.jp,
      sum: story.sum,
      img: story.img,
      imagePrompt: story.imagePrompt,
      imageSeed: story.imageSeed,
      read: story.read,
      date: story.date,
      author: story.author,
      section: story.section,
      status: "published",
      publishedAt: now,
      bodyJson,
    };
    if (story.series) {
      data.series = { ...story.series } as Prisma.InputJsonObject;
    }
    if (story.submittedBy) {
      data.submittedBy = story.submittedBy;
    }
    await prisma.article.upsert({
      where: { slug: story.slug },
      update: data,
      create: { id: story.id, ...data },
    });
  }
  return prisma.article.count();
}

async function seedReaders(): Promise<number> {
  for (const reader of SEEDED_READER_USERS) {
    await prisma.user.upsert({
      where: { email: reader.email },
      create: {
        id: reader.id,
        email: reader.email,
        name: reader.name,
        role: "reader",
        memberProfile: {
          create: {
            displayName: reader.name,
            joined: reader.joined,
            initial: reader.initial,
          },
        },
      },
      update: {
        name: reader.name,
        role: "reader",
        memberProfile: {
          upsert: {
            create: {
              displayName: reader.name,
              joined: reader.joined,
              initial: reader.initial,
            },
            update: {
              displayName: reader.name,
              joined: reader.joined,
              initial: reader.initial,
            },
          },
        },
      },
    });
  }
  return prisma.user.count({ where: { role: "reader" } });
}

async function seedStaff(): Promise<number> {
  for (const staff of SEEDED_STAFF_USERS) {
    await prisma.user.upsert({
      where: { email: staff.email },
      create: {
        id: staff.id,
        email: staff.email,
        name: staff.name,
        role: staff.role,
      },
      update: {
        name: staff.name,
        role: staff.role,
      },
    });
  }
  return prisma.user.count({ where: { role: { not: "reader" } } });
}

async function seedGamificationRules(): Promise<void> {
  // Growth rules (4 levels)
  for (const g of GROWTH_LEVELS) {
    await prisma.growthRule.upsert({
      where: { level: g.n },
      update: { name: g.name, jp: g.jp, threshold: g.threshold },
      create: { level: g.n, name: g.name, jp: g.jp, threshold: g.threshold },
    });
  }

  // Growth config (cap = 3)
  await prisma.growthConfig.upsert({
    where: { id: "default" },
    update: { maxItemsPerMember: 3 },
    create: { id: "default", maxItemsPerMember: 3 },
  });

  // Reward rules (7 total: 4 core + 3 community)
  const rules = [
    {
      id: "rr_read",
      action: "read_complete",
      points: 10,
      limitType: "per-article",
    },
    {
      id: "rr_checkin",
      action: "daily_check_in",
      points: 5,
      limitType: "per-day",
    },
    {
      id: "rr_collect",
      action: "collect",
      points: 2,
      limitType: "per-article",
    },
    {
      id: "rr_streak_bonus",
      action: "streak_bonus",
      points: 5,
      limitType: "per-day",
    },
    {
      id: "rr_submission_approved",
      action: "submission_approved",
      points: 20,
      limitType: "per-article",
    },
    {
      id: "rr_comment_post",
      action: "comment_post",
      points: 3,
      limitType: "per-article",
    },
    {
      id: "rr_reaction_react",
      action: "reaction_react",
      points: 1,
      limitType: "per-article",
    },
  ];
  for (const r of rules) {
    await prisma.rewardRule.upsert({
      where: { id: r.id },
      update: { points: r.points, limitType: r.limitType, enabled: true },
      create: { ...r, enabled: true },
    });
  }
}

async function seedTaxonomy(): Promise<{ categories: number; tags: number }> {
  // Seed CMS-managed categories from the public taxonomy. The "All"
  // pseudo-category is the listing-page filter sentinel, not a real
  // row.
  for (const name of CATEGORIES.filter((category) => category !== "All")) {
    const id = slugify(name);
    await prisma.category.upsert({
      where: { id },
      update: { name },
      create: { id, name },
    });
  }

  // Tags are derived from the seeded stories so the CMS dropdown
  // mirrors the live content surface from day one.
  const tagNames = [
    ...new Set(STORIES.map((story) => story.tag).filter(Boolean)),
  ];
  for (const name of tagNames) {
    const id = slugify(name);
    await prisma.tag.upsert({
      where: { id },
      update: { name },
      create: { id, name },
    });
  }

  const [categories, tags] = await Promise.all([
    prisma.category.count(),
    prisma.tag.count(),
  ]);
  return { categories, tags };
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

async function main(): Promise<void> {
  const sectionCount = await seedSections();
  const articleCount = await seedArticles();
  const readerCount = await seedReaders();
  const staffCount = await seedStaff();
  await seedGamificationRules();
  const taxonomyCount = await seedTaxonomy();
  console.log(
    `[seed] sections=${sectionCount} articles=${articleCount} readers=${readerCount} staff=${staffCount} gamification=seeded categories=${taxonomyCount.categories} tags=${taxonomyCount.tags}`
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
