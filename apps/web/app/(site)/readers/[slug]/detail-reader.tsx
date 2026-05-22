"use client";

import { useQuery } from "@tanstack/react-query";
import { notFound } from "next/navigation";
import { ArticleBody } from "@/_components/article-body";
import { ArticleComments } from "@/_components/article-comments";
import { CoverImage } from "@/_components/cover-image";
import { IconExternal } from "@/_components/glyphs";
import { StoryReactions } from "@/_components/story-reactions";
import type { Article, ArticleContributor } from "@/lib/db";

interface ReadNextResponse {
  items: Article[];
}

const KIND_LABEL: Record<string, string> = {
  submission: "Reader submission · 投稿",
  repost: "Repost · 転載",
  remix: "Remix · 編集再構成",
};

/**
 * Public reader detail.
 *
 * Mirrors the /stories/[slug] pattern (issue #74): fetch the article by slug
 * from `/api/stories/:slug`, render the persisted `bodyJson` through the
 * shared `<ArticleBody />`, and surface attribution (source, source URL,
 * license, contributors) directly from the fetched record so reposts and
 * remixes show their own real attribution rather than hardcoded text.
 */
export function DetailReader({ slug }: { slug: string }) {
  const articleQuery = useQuery<Article, Error>({
    queryKey: ["reader", slug],
    queryFn: async () => {
      const res = await fetch(`/api/stories/${encodeURIComponent(slug)}`);
      if (res.status === 404) {
        throw new Error("not_found");
      }
      if (!res.ok) {
        throw new Error(`Failed to load (${res.status})`);
      }
      return (await res.json()) as Article;
    },
  });

  if (articleQuery.isLoading) {
    return <DetailLoading />;
  }
  if (articleQuery.isError) {
    if (articleQuery.error.message === "not_found") {
      notFound();
    }
    return <DetailError />;
  }
  const article = articleQuery.data;
  if (!article) {
    notFound();
  }
  return <DetailReaderBody article={article} />;
}

function DetailLoading() {
  return (
    <div className="bg-paper text-ink">
      <div className="shell flex min-h-[60vh] items-center justify-center">
        <p className="font-mono text-[12px] text-muted uppercase tracking-[0.16em]">
          Loading…
        </p>
      </div>
    </div>
  );
}

function DetailError() {
  return (
    <div className="bg-paper text-ink">
      <div className="shell flex min-h-[60vh] items-center justify-center">
        <p className="font-mono text-[12px] text-vermilion uppercase tracking-[0.16em]">
          Failed to load. Please try again.
        </p>
      </div>
    </div>
  );
}

function AttributionSlab({ article }: { article: Article }) {
  const kindLabel = KIND_LABEL[article.kind] ?? article.kind;
  return (
    <section className="shell pt-6">
      <div className="grid grid-cols-[auto_1fr_auto] items-center gap-[22px] border border-ink border-l-[4px] border-l-vermilion bg-paper-alt p-[18px] max-[700px]:grid-cols-1 max-[700px]:gap-4">
        <div
          className="flex size-[56px] items-center justify-center font-display font-medium text-[22px] text-white"
          style={{ background: article.img }}
        >
          {(article.src ?? article.title).trim().charAt(0).toUpperCase() || "?"}
        </div>
        <div>
          <div className="font-mono text-[10px] text-muted uppercase tracking-[0.22em]">
            Originally by · 原典
          </div>
          <div className="mt-1 font-display font-medium text-[19px]">
            {article.src ?? (
              <span className="text-muted italic">Unknown source</span>
            )}
          </div>
          <div className="mt-[6px] flex items-center gap-[14px] font-mono text-[10.5px] text-ink tracking-[0.08em] max-[700px]:flex-wrap">
            {article.sourceUrl ? (
              <a
                className="inline-flex items-center gap-[6px] underline-offset-2 hover:underline"
                href={article.sourceUrl}
                rel="noreferrer"
                target="_blank"
              >
                <IconExternal size={13} />
                {displayUrl(article.sourceUrl)}
              </a>
            ) : (
              <span className="text-muted">No source URL on file</span>
            )}
            {article.license && (
              <>
                <span className="text-muted">·</span>
                <span className="text-vermilion">{article.license}</span>
              </>
            )}
          </div>
        </div>
        <div className="text-right max-[700px]:text-left">
          <div className="font-mono text-[10px] text-muted uppercase tracking-[0.18em]">
            {article.src}
          </div>
          <div className="mt-[6px] inline-block bg-vermilion px-[10px] py-1 font-mono text-[10px] text-cream uppercase tracking-[0.18em]">
            {kindLabel}
          </div>
        </div>
      </div>
    </section>
  );
}

function ContributorList({
  contributors,
}: {
  contributors: ArticleContributor[];
}) {
  return (
    <div className="sticky top-[100px] max-[1100px]:hidden">
      <div className="mb-3 font-mono text-[10px] text-muted uppercase tracking-[0.22em]">
        Contributors · 寄稿者
      </div>
      {contributors.map((p) => (
        <div
          className="grid grid-cols-[10px_1fr] items-center gap-[10px] border-line border-t py-[10px]"
          key={p.name}
        >
          <div
            className="size-[8px]"
            style={{ background: p.color ?? "#8a6c40" }}
          />
          <div>
            <div className="font-display font-medium text-[14px]">{p.name}</div>
            {p.role && (
              <div className="mt-[2px] font-mono text-[10px] text-muted tracking-[0.08em]">
                {p.role}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

function MoreFromReaders({ excludeId }: { excludeId: string }) {
  const moreQuery = useQuery<ReadNextResponse>({
    queryKey: ["reader-more", excludeId],
    queryFn: async () => {
      // The reader/social store is keyed under `kind` values that aren't
      // shared with brand stories; pull a small batch of each social kind.
      const kinds = ["submission", "repost", "remix"] as const;
      const lists = await Promise.all(
        kinds.map(async (k) => {
          const params = new URLSearchParams({
            kind: k,
            sort: "latest",
            page: "1",
            limit: "3",
          });
          const res = await fetch(`/api/stories?${params}`);
          if (!res.ok) {
            return [] as Article[];
          }
          const data = (await res.json()) as ReadNextResponse;
          return data.items;
        })
      );
      return { items: lists.flat() };
    },
  });
  const items = (moreQuery.data?.items ?? [])
    .filter((a) => a.id !== excludeId)
    .slice(0, 2);
  if (items.length === 0) {
    return null;
  }
  return (
    <div className="mt-[22px] border-ink border-t pt-[14px]">
      <div className="mb-3 font-mono text-[10px] text-muted uppercase tracking-[0.18em]">
        More from readers · もっと
      </div>
      {items.map((r) => (
        <a
          className="grid grid-cols-[52px_1fr] gap-[10px] border-line border-b py-[10px]"
          href={`/readers/${r.slug}`}
          key={r.id}
        >
          <CoverImage
            alt={r.title}
            className="aspect-square"
            gradient={r.img}
            id={r.id}
            kind="social"
            sizes="52px"
          />
          <div>
            <div className="font-mono text-[9px] text-vermilion uppercase tracking-[0.14em]">
              {r.kind}
            </div>
            <div className="mt-[3px] line-clamp-2 font-display text-[13px] leading-[1.2]">
              {r.title}
            </div>
          </div>
        </a>
      ))}
    </div>
  );
}

function DetailReaderBody({ article }: { article: Article }) {
  const contributors = article.contributors ?? [];
  return (
    <div className="bg-paper text-ink">
      {/* Issue strip */}
      <div className="flex items-center justify-between border-ink border-b px-10 py-3 font-mono text-[10.5px] text-ink uppercase tracking-[0.22em] max-[820px]:px-5">
        <span>Vol.14 — From readers</span>
        <span className="text-vermilion">
          {KIND_LABEL[article.kind] ?? article.kind}
        </span>
        <span>{article.read || 8} MIN</span>
      </div>

      <AttributionSlab article={article} />

      {/* Cover */}
      <section className="shell pt-7">
        <div className="relative aspect-[21/9] overflow-hidden border border-line">
          <CoverImage
            alt={article.title}
            className="absolute inset-0 size-full"
            gradient={article.img}
            id={article.id}
            kind="social"
            priority
            sizes="100vw"
          />
          <div className="absolute top-0 left-0 z-10 h-[120px] w-[6px] bg-vermilion" />
          <div className="absolute bottom-[18px] left-[22px] z-10 font-mono text-[10px] text-white/[0.78] uppercase tracking-[0.22em]">
            {article.src ?? "from readers"}
          </div>
        </div>
      </section>

      {/* Title block */}
      <section className="shell grid grid-cols-[1fr_720px_1fr] gap-10 pt-9 max-[1100px]:grid-cols-1">
        <div className="max-[1100px]:hidden" />
        <div className="max-[1100px]:mx-auto max-[1100px]:max-w-[720px]">
          <h1 className="text-center font-display font-medium text-[58px] leading-[1.02] tracking-[-0.02em] max-[560px]:text-[40px]">
            {article.title}
            <span className="text-vermilion">.</span>
          </h1>
          {article.jp && (
            <div className="mt-3 text-center font-display text-[20px] text-muted italic">
              {article.jp}
            </div>
          )}
        </div>
        <div className="max-[1100px]:hidden" />
      </section>

      {/* Body with attribution sidebar */}
      <section className="shell grid grid-cols-[1fr_720px_1fr] items-start gap-10 pt-11 max-[1100px]:grid-cols-1">
        {/* Left contributors / license sidebar */}
        {contributors.length > 0 || article.license ? (
          <div className="sticky top-[100px] max-[1100px]:hidden">
            {contributors.length > 0 && (
              <ContributorList contributors={contributors} />
            )}
            {article.license && (
              <div className="mt-6 border-ink border-t pt-[14px]">
                <div className="font-mono text-[10px] text-muted uppercase tracking-[0.18em]">
                  License · 許諾
                </div>
                <div className="mt-[6px] font-display text-[13.5px] text-ink-soft leading-[1.45]">
                  <span className="text-vermilion">{article.license}</span>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="max-[1100px]:hidden" />
        )}

        {/* Body */}
        <div className="font-display text-[18px] text-ink-soft leading-[1.7] max-[1100px]:mx-auto max-[1100px]:max-w-[720px]">
          <ArticleBody bodyJson={article.bodyJson ?? ""} />
          <StoryReactions articleId={article.id} />
        </div>

        {/* Right sidebar */}
        <div className="sticky top-[100px] max-[1100px]:static max-[1100px]:mx-auto max-[1100px]:max-w-[720px]">
          <div className="border-vermilion border-l-[4px] bg-ink p-5 text-cream">
            <div className="font-mono text-[10px] uppercase tracking-[0.18em] opacity-70">
              Reward · 報酬
            </div>
            <div className="mt-[6px] font-display text-[17px] leading-[1.3]">
              Finish to earn{" "}
              <span style={{ color: "#ffc7c0" }}>+8 nutrients</span>
            </div>
            <div className="mt-[6px] font-mono text-[9.5px] uppercase tracking-[0.12em] opacity-65">
              Lower reward than brand stories · per editorial rule
            </div>
          </div>
          <MoreFromReaders excludeId={article.id} />
        </div>
      </section>

      <section className="shell grid grid-cols-[1fr_720px_1fr] items-start gap-10 max-[1100px]:grid-cols-1">
        <div className="max-[1100px]:hidden" />
        <div className="max-[1100px]:mx-auto max-[1100px]:max-w-[720px]">
          <ArticleComments articleId={article.id} />
        </div>
        <div className="max-[1100px]:hidden" />
      </section>

      <div className="h-20" />
    </div>
  );
}

function displayUrl(url: string): string {
  try {
    const u = new URL(url);
    return `${u.host}${u.pathname === "/" ? "" : u.pathname}`;
  } catch {
    return url;
  }
}
