"use client";

import { useQuery } from "@tanstack/react-query";
import { CATEGORIES, COLLECTED } from "@verda/data";
import Link from "next/link";
import { useState } from "react";
import { CoverImage } from "@/_components/cover-image";
import { Eyebrow } from "@/_components/eyebrow";
import { IconBookmark, IconFilter } from "@/_components/glyphs";
import type { Article } from "@/lib/db";
import { sectionLabel, seriesPartLabel } from "@/lib/section";

type SortKey = "latest" | "recommended" | "popular";

const SORTS: { id: SortKey; label: string }[] = [
  { id: "latest", label: "Latest" },
  { id: "recommended", label: "Recommended" },
  { id: "popular", label: "Popular" },
];

const TAGS = [
  "all",
  "morning",
  "recipe",
  "season",
  "practice",
  "journal",
  "pantry",
];

const PAGE_SIZE = 6;

interface StoriesResponse {
  items: Article[];
  page: number;
  total: number;
  totalPages: number;
}

export default function StoriesPage() {
  const [cat, setCat] = useState("All");
  const [tag, setTag] = useState("all");
  const [sort, setSort] = useState<SortKey>("latest");
  const [page, setPage] = useState(1);

  const { data, isLoading, isError } = useQuery<StoriesResponse>({
    queryKey: ["stories", "brand", cat, tag, sort, page],
    queryFn: async () => {
      const params = new URLSearchParams({
        kind: "brand",
        sort,
        page: String(page),
        limit: String(PAGE_SIZE),
      });
      if (cat !== "All") {
        params.set("cat", cat);
      }
      if (tag !== "all") {
        params.set("tag", tag);
      }
      const res = await fetch(`/api/stories?${params}`);
      if (!res.ok) {
        throw new Error("Failed to fetch stories");
      }
      return res.json();
    },
  });

  if (isLoading) {
    return (
      <div className="bg-cream text-ink">
        <div className="shell flex min-h-[50vh] items-center justify-center">
          <p className="font-mono text-[12px] text-muted uppercase tracking-[0.16em]">
            Loading stories…
          </p>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="bg-cream text-ink">
        <div className="shell flex min-h-[50vh] items-center justify-center">
          <p className="font-mono text-[12px] text-vermilion uppercase tracking-[0.16em]">
            Failed to load stories. Please try again.
          </p>
        </div>
      </div>
    );
  }

  const stories = data?.items ?? [];
  const total = data?.total ?? 0;
  const totalPages = data?.totalPages ?? 1;

  return (
    <div className="bg-cream text-ink">
      <div className="shell">
        {/* Title block */}
        <section className="pt-10">
          <Eyebrow en="Brand stories" jp="ブランドの物語" />
          <div className="mt-[14px] grid grid-cols-[1.4fr_1fr] items-baseline gap-[60px] max-[900px]:grid-cols-1 max-[900px]:gap-6">
            <h1 className="font-display font-medium text-[76px] leading-none tracking-[-0.02em] max-[640px]:text-[52px]">
              Things worth
              <br />
              slowing down for<span className="text-vermilion">.</span>
            </h1>
            <div>
              <div className="font-display text-[20px] text-muted italic tracking-[0.2px]">
                ゆっくり過ごすに値するもの。
              </div>
              <p className="mt-4 font-display text-[16px] text-ink-soft leading-[1.6]">
                Six essays this month from the editorial desk &amp; field.
                Filter by category, save for later, finish reading to grow your
                seedling.
              </p>
            </div>
          </div>
        </section>

        {/* Category filter */}
        <div className="mt-10 flex items-center gap-6 border-t border-t-ink border-b border-b-line py-3 max-[640px]:flex-wrap max-[640px]:gap-x-5 max-[640px]:gap-y-3">
          {CATEGORIES.map((c) => {
            const on = c === cat;
            return (
              <button
                className={`border-b-2 pb-[6px] font-mono text-[11px] uppercase tracking-[0.16em] ${
                  on
                    ? "border-vermilion text-ink"
                    : "border-transparent text-muted"
                }`}
                key={c}
                onClick={() => {
                  setCat(c);
                  setPage(1);
                }}
                type="button"
              >
                {c}
              </button>
            );
          })}
        </div>

        {/* Tag filter + sort */}
        <div className="flex items-center gap-4 border-line border-b py-3 max-[640px]:flex-wrap">
          <div className="flex items-center gap-2">
            <span className="font-mono text-[10px] text-muted uppercase tracking-[0.14em]">
              Tag:
            </span>
            {TAGS.map((t) => (
              <button
                className={`px-2 py-[2px] font-mono text-[10px] uppercase tracking-[0.12em] ${
                  t === tag ? "bg-ink text-cream" : "text-muted hover:text-ink"
                }`}
                key={t}
                onClick={() => {
                  setTag(t);
                  setPage(1);
                }}
                type="button"
              >
                {t === "all" ? "All" : `#${t}`}
              </button>
            ))}
          </div>
          <div className="ml-auto flex items-center gap-4 font-mono text-[11px] text-muted uppercase tracking-[0.14em]">
            <span>{String(total).padStart(2, "0")} entries</span>
            <span className="h-[14px] w-px bg-line" />
            <span className="flex items-center gap-[6px]">
              <IconFilter />
              {SORTS.map((s) => (
                <button
                  className={`${s.id === sort ? "text-ink" : "text-muted"}`}
                  key={s.id}
                  onClick={() => {
                    setSort(s.id);
                    setPage(1);
                  }}
                  type="button"
                >
                  {s.label}
                </button>
              ))}
            </span>
          </div>
        </div>

        {/* Empty state */}
        {stories.length === 0 && (
          <div className="flex min-h-[30vh] items-center justify-center">
            <p className="font-mono text-[12px] text-muted uppercase tracking-[0.16em]">
              No stories match your filters.
            </p>
          </div>
        )}

        {/* Story grid */}
        {stories.length > 0 && (
          <section className="grid grid-cols-3 gap-9 pt-9 max-[640px]:grid-cols-1 max-[900px]:grid-cols-2">
            {stories.map((s, i) => {
              const saved = COLLECTED.includes(s.id);
              return (
                <article className="flex flex-col" key={s.id}>
                  <Link className="relative" href={`/stories/${s.slug}`}>
                    <CoverImage
                      alt={s.title}
                      className="aspect-[4/5]"
                      gradient={s.img}
                      id={s.id}
                      kind="stories"
                      sizes="(max-width: 640px) 100vw, (max-width: 900px) 50vw, 30vw"
                    />
                    <div className="absolute top-3 left-3 z-10 font-display font-medium text-[26px] text-white leading-none [text-shadow:0_1px_6px_rgba(0,0,0,0.4)]">
                      {String((page - 1) * PAGE_SIZE + i + 1).padStart(2, "0")}
                    </div>
                    {saved && (
                      <div className="absolute top-[10px] right-[10px] z-10 flex h-7 w-7 items-center justify-center bg-vermilion text-cream">
                        <IconBookmark filled />
                      </div>
                    )}
                  </Link>
                  <div className="mt-4 border-line border-b pb-[18px]">
                    <div className="font-mono text-[10px] text-muted uppercase tracking-[0.18em]">
                      {sectionLabel(s)} · {s.read} min · {s.date}
                    </div>
                    <h3 className="mt-[6px] font-display font-medium text-[24px] leading-[1.12] tracking-[-0.005em]">
                      <Link href={`/stories/${s.slug}`}>{s.title}</Link>
                    </h3>
                    {seriesPartLabel(s.series) && (
                      <div className="mt-[4px] font-mono text-[10px] text-vermilion uppercase tracking-[0.18em]">
                        {seriesPartLabel(s.series)}
                      </div>
                    )}
                    <div className="mt-1 font-display text-[14px] text-muted italic">
                      {s.jp}
                    </div>
                    <p className="mt-[10px] mb-3 line-clamp-2 font-display text-[15px] text-ink-soft leading-[1.5]">
                      {s.sum}
                    </p>
                    <div className="flex items-center gap-[14px]">
                      <span className="border-ink border-b pb-px font-mono text-[10.5px] text-ink tracking-[0.12em]">
                        #{s.tag}
                      </span>
                      <span className="font-mono text-[10.5px] text-muted">
                        {s.author}
                      </span>
                      <Link
                        className="ml-auto font-mono text-[10.5px] text-vermilion uppercase tracking-[0.14em]"
                        href={`/stories/${s.slug}`}
                      >
                        Read →
                      </Link>
                    </div>
                  </div>
                </article>
              );
            })}
          </section>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between py-12 font-mono text-[11px] text-ink uppercase tracking-[0.16em]">
            <button
              className={page <= 1 ? "text-muted" : "text-ink"}
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
              type="button"
            >
              ← Previous
            </button>
            <div className="flex gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  className={`inline-flex h-7 min-w-7 items-center justify-center px-2 ${
                    p === page
                      ? "border border-ink bg-ink text-cream"
                      : "text-ink"
                  }`}
                  key={p}
                  onClick={() => setPage(p)}
                  type="button"
                >
                  {p}
                </button>
              ))}
            </div>
            <button
              className={page >= totalPages ? "text-muted" : "text-ink"}
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
              type="button"
            >
              Next →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
