import { CATEGORIES, GROWTH_LEVELS, STORIES } from "@verda/data";
import { db } from "./db";

const SEED_KEY = "verda.seeded";

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

  localStorage.setItem(SEED_KEY, "1");
}

export async function resetAndReseed() {
  await db.delete();
  await db.open();
  localStorage.removeItem(SEED_KEY);
  await seedIfEmpty();
}
