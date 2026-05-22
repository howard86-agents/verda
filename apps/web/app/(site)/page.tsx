"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { CoverImage } from "@/_components/cover-image";
import { Eyebrow } from "@/_components/eyebrow";
import { IconDrop } from "@/_components/glyphs";
import { Plant } from "@/_components/plant";
import type { Article } from "@/lib/db";
import { type HomeFeed, pickHomeFeed } from "@/lib/home";
import { sectionLabel, seriesPartLabel } from "@/lib/section";

interface ListingResponse {
  items: Article[];
  page: number;
  total: number;
  totalPages: number;
}

/**
 * Pull a small batch of reader-contributed items for the homepage sidebar.
 *
 * Mirrors the existing `/readers` page approach: each social kind is its
 * own listing query so we can fan out and merge. We sort the merged set
 * by `date` (lexicographic — the listing API does the same) and keep at
 * most three items.
 */
async function fetchReaderItems(): Promise<Article[]> {
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
      const data = (await res.json()) as ListingResponse;
      return data.items;
    })
  );
  return lists.flat().slice(0, 3);
}

function HomeLoading() {
  return (
    <div className="bg-cream text-ink">
      <div className="shell flex min-h-[50vh] items-center justify-center">
        <p className="font-mono text-[12px] text-muted uppercase tracking-[0.16em]">
          Loading…
        </p>
      </div>
    </div>
  );
}

function HomeError() {
  return (
    <div className="bg-cream text-ink">
      <div className="shell flex min-h-[50vh] items-center justify-center">
        <p className="font-mono text-[12px] text-vermilion uppercase tracking-[0.16em]">
          Failed to load. Please try again.
        </p>
      </div>
    </div>
  );
}

function HomeEmpty() {
  return (
    <div className="bg-cream text-ink">
      <div className="shell flex min-h-[50vh] items-center justify-center">
        <p className="font-mono text-[12px] text-muted uppercase tracking-[0.16em]">
          No published stories yet.
        </p>
      </div>
    </div>
  );
}

export default function HomePage() {
  const brandQuery = useQuery<HomeFeed>({
    queryKey: ["home", "brand"],
    queryFn: async () => {
      const params = new URLSearchParams({
        kind: "brand",
        sort: "latest",
        page: "1",
        limit: "7",
      });
      const res = await fetch(`/api/stories?${params}`);
      if (!res.ok) {
        throw new Error("Failed to load home feed");
      }
      const data = (await res.json()) as ListingResponse;
      return pickHomeFeed(data.items);
    },
  });
  const readersQuery = useQuery<Article[]>({
    queryKey: ["home", "readers"],
    queryFn: fetchReaderItems,
  });

  if (brandQuery.isLoading) {
    return <HomeLoading />;
  }
  if (brandQuery.isError) {
    return <HomeError />;
  }
  const feed = brandQuery.data ?? { featured: null, latest: [] };
  if (!feed.featured) {
    return <HomeEmpty />;
  }

  return (
    <HomeContent
      featured={feed.featured}
      latest={feed.latest}
      readers={readersQuery.data ?? []}
    />
  );
}

function HomeContent({
  featured,
  latest,
  readers,
}: {
  featured: Article;
  latest: Article[];
  readers: Article[];
}) {
  const featuredMetaParts = [
    sectionLabel(featured) || "Story",
    `${featured.read || 0} min`,
    featured.author ? `By ${featured.author}` : null,
  ].filter(Boolean) as string[];
  const firstLatest = latest.slice(0, 3);
  const secondLatest = latest.slice(3, 6);
  const featuredSection = sectionLabel(featured);

  return (
    <div className="bg-cream text-ink">
      <div className="shell">
        {/* Hero feature — full width */}
        <section className="pt-9">
          <div className="grid grid-cols-[1.4fr_1fr] gap-10 max-[900px]:grid-cols-1">
            {/* Cover */}
            <Link
              className="hatch relative block aspect-[16/11] overflow-hidden border border-line"
              href={`/stories/${featured.slug}`}
            >
              <CoverImage
                alt={featured.title}
                className="absolute inset-0 size-full"
                gradient={featured.img}
                id={featured.id}
                kind="stories"
                priority
                sizes="(max-width: 900px) 100vw, 60vw"
              />
              <div className="absolute top-0 left-0 z-10 h-24 w-[6px] bg-vermilion" />
              <div className="absolute bottom-4 left-[18px] z-10 font-mono text-[10px] text-white/80 uppercase tracking-[0.18em]">
                cover · {featuredSection || "story"}
              </div>
            </Link>
            {/* Headline column */}
            <div className="flex flex-col justify-between">
              <div>
                <Eyebrow en="This week · feature" jp="今週の一篇" />
                <h1 className="mt-5 font-display font-medium text-[56px] leading-[1.02] tracking-[-0.02em]">
                  {featured.title}
                  <span className="text-vermilion">.</span>
                </h1>
                {featured.jp && (
                  <div className="mt-[14px] font-display text-[22px] text-muted italic">
                    {featured.jp}
                  </div>
                )}
                {featured.sum && (
                  <p className="mt-[22px] max-w-[460px] font-display text-[18px] text-ink-soft leading-[1.55]">
                    {featured.sum}
                  </p>
                )}
              </div>
              <div className="mt-[26px] flex items-center gap-5 border-line border-t pt-[18px]">
                <Link
                  className="border border-ink bg-ink px-[22px] py-3 font-mono text-[11px] text-cream uppercase tracking-[0.18em]"
                  href={`/stories/${featured.slug}`}
                >
                  Read · 読む →
                </Link>
                <div className="font-mono text-[10.5px] text-muted uppercase tracking-[0.14em]">
                  {featuredMetaParts.join(" · ")}
                </div>
                <div className="ml-auto flex items-center gap-2 font-mono text-[10.5px] text-muted uppercase tracking-[0.12em]">
                  <span className="inline-flex text-vermilion">
                    <IconDrop />
                  </span>
                  +10 on complete
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Main grid */}
        <section className="grid grid-cols-[1fr_360px] gap-12 pt-14 max-[900px]:grid-cols-1">
          {/* Latest stories index */}
          <div>
            <div className="flex items-baseline justify-between border-ink border-b pb-3">
              <div>
                <div className="font-mono text-[10.5px] text-ink uppercase tracking-[0.22em]">
                  Index 01
                </div>
                <div className="mt-1 font-display font-medium text-[32px] tracking-[-0.01em]">
                  Latest stories{" "}
                  <span className="text-[18px] text-muted">最新の物語</span>
                </div>
              </div>
              <Link
                className="font-mono text-[11px] text-ink uppercase tracking-[0.18em]"
                href="/stories"
              >
                See all →
              </Link>
            </div>

            {firstLatest.length === 0 ? (
              <p className="mt-7 font-mono text-[11px] text-muted uppercase tracking-[0.16em]">
                More stories coming soon.
              </p>
            ) : (
              <div className="mt-7 grid grid-cols-3 gap-7 max-[640px]:grid-cols-1">
                {firstLatest.map((s, i) => {
                  const seriesPart = seriesPartLabel(s.series);
                  return (
                    <article key={s.id}>
                      <Link href={`/stories/${s.slug}`}>
                        <CoverImage
                          alt={s.title}
                          className="aspect-[4/5]"
                          gradient={s.img}
                          id={s.id}
                          kind="stories"
                          sizes="(max-width: 640px) 100vw, 30vw"
                        />
                        <div className="mt-[14px] grid grid-cols-[38px_1fr] gap-[10px]">
                          <div className="font-display font-medium text-[22px] text-vermilion leading-none">
                            {String(i + 1).padStart(2, "0")}
                          </div>
                          <div>
                            <div className="font-mono text-[9.5px] text-muted uppercase tracking-[0.18em]">
                              {sectionLabel(s)} · {s.read} min · {s.date}
                            </div>
                            <h3 className="mt-[6px] font-display font-medium text-[22px] leading-[1.15] tracking-[-0.005em]">
                              {s.title}
                            </h3>
                            {seriesPart && (
                              <div className="mt-[3px] font-mono text-[9px] text-vermilion uppercase tracking-[0.16em]">
                                {seriesPart}
                              </div>
                            )}
                            {s.jp && (
                              <div className="mt-1 font-display text-[13px] text-muted italic">
                                {s.jp}
                              </div>
                            )}
                            {s.sum && (
                              <p className="mt-2 font-display text-[14px] text-ink-soft leading-[1.5]">
                                {s.sum}
                              </p>
                            )}
                          </div>
                        </div>
                      </Link>
                    </article>
                  );
                })}
              </div>
            )}

            {secondLatest.length > 0 && (
              <div className="mt-9 grid grid-cols-3 gap-7 border-line border-t pt-7 max-[640px]:grid-cols-1">
                {secondLatest.map((s, i) => (
                  <article
                    className="grid grid-cols-[38px_1fr] gap-[10px]"
                    key={s.id}
                  >
                    <div className="font-display font-medium text-[22px] text-vermilion leading-none">
                      {String(i + 4).padStart(2, "0")}
                    </div>
                    <div>
                      <div className="font-mono text-[9.5px] text-muted uppercase tracking-[0.18em]">
                        {sectionLabel(s)} · {s.read} min
                      </div>
                      <h3 className="mt-1 font-display font-medium text-[18px] leading-[1.18]">
                        <Link href={`/stories/${s.slug}`}>{s.title}</Link>
                      </h3>
                      {s.jp && (
                        <div className="mt-[3px] font-display text-[12px] text-muted italic">
                          {s.jp}
                        </div>
                      )}
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>

          {/* Sidebar */}
          <aside className="flex flex-col gap-8">
            {/* Growable */}
            <div className="border border-ink bg-paper p-[22px]">
              <div className="font-mono text-[10.5px] text-ink uppercase tracking-[0.22em]">
                Your seedling · 育成中
              </div>
              <div className="mt-[14px] grid grid-cols-[90px_1fr] items-center gap-[14px]">
                <Plant level={2} size={80} />
                <div>
                  <div className="font-display font-medium text-[22px] leading-[1.1]">
                    63 to <em className="text-vermilion italic">Bloom</em>
                  </div>
                  <div className="mt-[2px] font-display text-[13px] text-muted italic">
                    開花まで
                  </div>
                </div>
              </div>
              <div className="mt-4 h-[3px] bg-line">
                <div className="h-full w-[58%] bg-vermilion" />
              </div>
              <div className="mt-2 flex justify-between font-mono text-[10px] text-muted uppercase tracking-[0.1em]">
                <span>87 / 150</span>
                <span>Lv 02 · Sprout</span>
              </div>
              <div className="mt-[14px] flex justify-between border-line border-t pt-3 font-mono text-[11px] text-ink uppercase tracking-[0.16em]">
                <span>Open seedling</span>
                <span className="text-vermilion">→</span>
              </div>
            </div>

            {/* Reader submissions */}
            <div>
              <div className="flex items-baseline justify-between border-ink border-b pb-[10px]">
                <div>
                  <div className="font-mono text-[10.5px] text-ink uppercase tracking-[0.22em]">
                    Index 02
                  </div>
                  <div className="mt-[3px] font-display font-medium text-[22px] tracking-[-0.005em]">
                    From readers
                  </div>
                </div>
                <Link
                  className="font-mono text-[10px] text-ink uppercase tracking-[0.16em]"
                  href="/readers"
                >
                  Browse →
                </Link>
              </div>
              {readers.length === 0 ? (
                <p className="mt-[14px] font-mono text-[10px] text-muted uppercase tracking-[0.14em]">
                  No reader items yet.
                </p>
              ) : (
                readers.map((r) => (
                  <Link
                    className="grid grid-cols-[56px_1fr] items-center gap-3 border-line border-b py-3"
                    href={`/readers/${r.slug}`}
                    key={r.id}
                  >
                    <CoverImage
                      alt={r.title}
                      className="aspect-square"
                      gradient={r.img}
                      id={r.id}
                      kind="social"
                      sizes="56px"
                    />
                    <div className="min-w-0">
                      <div className="font-mono text-[9px] text-vermilion uppercase tracking-[0.14em]">
                        {r.kind}
                      </div>
                      <div className="mt-[3px] line-clamp-2 font-display text-[14px] leading-[1.18]">
                        {r.title}
                      </div>
                      {(r.src || r.date) && (
                        <div className="mt-1 font-mono text-[10px] text-muted tracking-[0.04em]">
                          {[r.src, r.date].filter(Boolean).join(" · ")}
                        </div>
                      )}
                    </div>
                  </Link>
                ))
              )}
            </div>

            {/* Editor's picks ribbon */}
            <Link
              className="block border-vermilion border-l-4 bg-ink p-[22px] text-cream"
              href="/stories"
            >
              <div className="font-mono text-[10px] uppercase tracking-[0.22em] opacity-70">
                Editor&apos;s pick · 編集者の選択
              </div>
              <div className="mt-[6px] font-display font-medium text-[20px] leading-[1.2]">
                The May reading list, in 7 essays.
              </div>
              <div className="mt-[14px] font-mono text-[10px] text-cream uppercase tracking-[0.18em] opacity-85">
                Open collection →
              </div>
            </Link>
          </aside>
        </section>

        <div className="h-[60px]" />
      </div>
    </div>
  );
}
