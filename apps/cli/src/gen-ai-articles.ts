#!/usr/bin/env bun
import type { Prisma } from "@verda/database";
import { buildDraft, parseDraftArgs, sectionsForRun } from "./ai-drafts";

function toCreateInput(
  draft: ReturnType<typeof buildDraft>
): Prisma.ArticleUncheckedCreateInput {
  return {
    author: draft.author,
    bodyJson: draft.bodyJson,
    cat: draft.cat,
    date: draft.date,
    imagePrompt: draft.imagePrompt,
    imageSeed: draft.imageSeed,
    img: draft.img,
    jp: draft.jp,
    kind: draft.kind,
    license: draft.license,
    read: draft.read,
    section: draft.section,
    slug: draft.slug,
    sourceUrl: draft.sourceUrl,
    status: draft.status,
    sum: draft.sum,
    tag: draft.tag,
    title: draft.title,
  };
}

async function main(): Promise<void> {
  const args = parseDraftArgs(process.argv.slice(2));
  const sections = sectionsForRun(args);
  const generatedAt = new Date();
  const drafts = sections.map((sectionId, index) =>
    buildDraft({
      generatedAt,
      index,
      referenceTitle: args.referenceTitle,
      referenceUrl: args.referenceUrl,
      sectionId,
      theme: args.theme,
    })
  );

  if (args.dryRun) {
    console.log(JSON.stringify({ drafts }, null, 2));
    return;
  }

  const { prisma } = await import("@verda/database");

  try {
    const created = await prisma.$transaction(async (tx) => {
      const rows: Array<{ id: string; slug: string; title: string }> = [];
      for (const draft of drafts) {
        const exists = await tx.article.findUnique({
          select: { id: true },
          where: { slug: draft.slug },
        });
        if (exists) {
          throw new Error(
            `Draft slug already exists: ${draft.slug}. Re-run with a different --theme or on a new day.`
          );
        }
        const article = await tx.article.create({ data: toCreateInput(draft) });
        rows.push({ id: article.id, slug: article.slug, title: article.title });
      }
      return rows;
    });

    console.log(
      JSON.stringify(
        {
          created: created.length,
          drafts: created,
          status: "draft",
        },
        null,
        2
      )
    );
  } finally {
    await prisma.$disconnect();
  }
}

await main().catch((error) => {
  console.error(`[gen:ai-articles] ${(error as Error).message}`);
  process.exit(1);
});
