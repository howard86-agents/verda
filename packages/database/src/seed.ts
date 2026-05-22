import "dotenv/config";
import { SECTIONS, STORIES } from "@verda/data";
import type { Prisma } from "../generated/client";
import { prisma } from "./client";

/**
 * Seed sections + brand stories for the walking skeleton (issue #126).
 *
 * The data lives in `@verda/data` so the static design fixtures and
 * the Postgres seed share a single source of truth. Each story is
 * upserted by `slug` (the public URL key) so reseeding against an
 * existing DB is idempotent.
 *
 * Articles ship a minimal Tiptap doc derived from the `sum` field so
 * the public reader detail still renders something on first boot;
 * later slices (#137 article versions, #136 media) replace this with
 * the richer authored bodies.
 */
async function main(): Promise<void> {
  // Sections — upsert keeps the names current if a later edition
  // tweaks display copy.
  await Promise.all(
    SECTIONS.map((section) =>
      prisma.section.upsert({
        where: { id: section.id },
        update: { name: section.name },
        create: section,
      })
    )
  );

  // Brand stories — published immediately so the public listing has
  // content the moment the cutover lands. Reader-contributed items
  // arrive with later issues (#133 submissions).
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

  const [sectionCount, articleCount] = await Promise.all([
    prisma.section.count(),
    prisma.article.count(),
  ]);
  console.log(
    `[seed] sections=${sectionCount} articles=${articleCount} (issue #126)`
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
