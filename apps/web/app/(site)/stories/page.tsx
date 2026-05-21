"use client";

import { useQuery } from "@tanstack/react-query";
import { CATEGORIES, COLLECTED } from "@verda/data";
import Link from "next/link";
import { useState } from "react";
import { CoverImage } from "@/_components/cover-image";
import { Eyebrow } from "@/_components/eyebrow";
import { IconBookmark, IconFilter } from "@/_components/glyphs";
import type { Article } from "@/lib/db";

const PAGES = ["1", "2", "3", "...", "12"];

export default function StoriesPage() {
  const [cat, setCat] = useState("All");

  const {
    data: stories,
    isLoading,
    isError,
  } = useQuery<Article[]>({
    queryKey: ["stories", "brand"],
    queryFn: async () => {
      const res = await fetch("/api/stories?kind=brand");
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

  const filtered =
    cat === "All"
      ? (stories ?? [])
      : (stories ?? []).filter((s) => s.cat === cat);

  if (!stories || stories.length === 0) {
    return (
      <div className="bg-cream text-ink">
        <div className="shell flex min-h-[50vh] items-center justify-center">
          <p className="font-mono text-[12px] text-muted uppercase tracking-[0.16em]">
            No stories yet.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-cream text-ink">
      <div className="shell">
        {/* Title block — magazine cover */}
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

        {/* Filter + sort bar */}
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
                onClick={() => setCat(c)}
                type="button"
              >
                {c}
              </button>
            );
          })}
          <div className="ml-auto flex items-center gap-4 font-mono text-[11px] text-muted uppercase tracking-[0.14em]">
            <span>{String(filtered.length).padStart(2, "0")} entries</span>
            <span className="h-[14px] w-px bg-line" />
            <span className="flex items-center gap-[6px] text-ink">
              <IconFilter /> latest first
            </span>
          </div>
        </div>

        {/* Story grid */}
        <section className="grid grid-cols-3 gap-9 pt-9 max-[640px]:grid-cols-1 max-[900px]:grid-cols-2">
          {filtered.map((s, i) => {
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
                    {String(i + 1).padStart(2, "0")}
                  </div>
                  {saved && (
                    <div className="absolute top-[10px] right-[10px] z-10 flex h-7 w-7 items-center justify-center bg-vermilion text-cream">
                      <IconBookmark filled />
                    </div>
                  )}
                </Link>
                <div className="mt-4 border-line border-b pb-[18px]">
                  <div className="font-mono text-[10px] text-muted uppercase tracking-[0.18em]">
                    {s.cat} · {s.read} min · {s.date}
                  </div>
                  <h3 className="mt-[6px] font-display font-medium text-[24px] leading-[1.12] tracking-[-0.005em]">
                    <Link href={`/stories/${s.slug}`}>{s.title}</Link>
                  </h3>
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

        {/* Pagination */}
        <div className="flex items-center justify-between py-12 font-mono text-[11px] text-ink uppercase tracking-[0.16em]">
          <button className="text-muted" type="button">
            ← Previous
          </button>
          <div className="flex gap-1">
            {PAGES.map((p, i) => (
              <button
                className={`inline-flex h-7 min-w-7 items-center justify-center px-2 ${
                  i === 0 ? "border border-ink bg-ink text-cream" : "text-ink"
                }`}
                key={p}
                type="button"
              >
                {p}
              </button>
            ))}
          </div>
          <button className="text-ink" type="button">
            Next →
          </button>
        </div>
      </div>
    </div>
  );
}
