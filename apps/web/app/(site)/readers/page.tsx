"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useState } from "react";
import { CoverImage } from "@/_components/cover-image";
import { Eyebrow } from "@/_components/eyebrow";
import { IconFilter } from "@/_components/glyphs";
import type { Article } from "@/lib/db";
import { fetchReaderStories } from "@/lib/reader-stories";

type SocialKind = "all" | "submission" | "repost" | "remix";

const KINDS: { id: SocialKind; label: string }[] = [
  { id: "all", label: "All" },
  { id: "submission", label: "Submission" },
  { id: "repost", label: "Repost" },
  { id: "remix", label: "Remix" },
];

function kindColor(kind: string): string {
  switch (kind) {
    case "submission":
      return "bg-[#c87a3a]";
    case "repost":
      return "bg-[#4a6b48]";
    case "remix":
      return "bg-vermilion";
    default:
      return "bg-muted";
  }
}

export default function ReadersPage() {
  const [kindFilter, setKindFilter] = useState<SocialKind>("all");

  const { data: articles, isLoading } = useQuery<Article[]>({
    queryKey: ["stories", "social"],
    queryFn: fetchReaderStories,
  });

  if (isLoading) {
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

  const filtered =
    kindFilter === "all"
      ? (articles ?? [])
      : (articles ?? []).filter((a) => a.kind === kindFilter);

  return (
    <div className="bg-cream text-ink">
      <div className="shell">
        <section className="pt-10">
          <Eyebrow en="From readers" jp="読者の投稿" />
          <div className="mt-[14px]">
            <h1 className="font-display font-medium text-[64px] leading-none tracking-[-0.02em] max-[640px]:text-[44px]">
              Reader stories<span className="text-vermilion">.</span>
            </h1>
            <p className="mt-4 max-w-[500px] font-display text-[16px] text-muted italic leading-[1.6]">
              Submissions, reposts, and remixes from the community.
            </p>
            <Link
              className="mt-5 inline-flex items-center gap-2 border border-ink bg-ink px-[18px] py-2 font-mono text-[10.5px] text-cream uppercase tracking-[0.18em]"
              href="/readers/submit"
            >
              Submit yours · 投稿する →
            </Link>
          </div>
        </section>

        {/* Kind filter */}
        <div className="mt-8 flex items-center gap-6 border-t border-t-ink border-b border-b-line py-3">
          {KINDS.map((k) => (
            <button
              className={`border-b-2 pb-[6px] font-mono text-[11px] uppercase tracking-[0.16em] ${
                k.id === kindFilter
                  ? "border-vermilion text-ink"
                  : "border-transparent text-muted"
              }`}
              key={k.id}
              onClick={() => setKindFilter(k.id)}
              type="button"
            >
              {k.label}
            </button>
          ))}
          <div className="ml-auto flex items-center gap-2 font-mono text-[11px] text-muted uppercase tracking-[0.14em]">
            <IconFilter />
            <span>{filtered.length} entries</span>
          </div>
        </div>

        {/* Empty state */}
        {filtered.length === 0 && (
          <div className="flex min-h-[30vh] items-center justify-center">
            <p className="font-mono text-[12px] text-muted uppercase tracking-[0.16em]">
              No reader stories match this filter.
            </p>
          </div>
        )}

        {/* Cards */}
        <section className="grid grid-cols-3 gap-8 pt-8 max-[640px]:grid-cols-1 max-[900px]:grid-cols-2">
          {filtered.map((s) => (
            <article key={s.id}>
              <Link className="relative block" href={`/readers/${s.slug}`}>
                <CoverImage
                  alt={s.title}
                  className="aspect-[4/5]"
                  gradient={s.img}
                  id={s.id}
                  kind="social"
                  sizes="(max-width: 640px) 100vw, (max-width: 900px) 50vw, 30vw"
                />
                {/* Type label */}
                <div
                  className={`absolute top-3 right-3 z-10 px-2 py-[3px] font-mono text-[9px] text-cream uppercase tracking-[0.16em] ${kindColor(s.kind)}`}
                >
                  {s.kind}
                </div>
              </Link>
              <div className="mt-3 border-line border-b pb-4">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[9.5px] text-vermilion uppercase tracking-[0.14em]">
                    {s.kind}
                  </span>
                  {s.src && (
                    <>
                      <span className="text-muted">·</span>
                      <span className="font-mono text-[9.5px] text-muted tracking-[0.08em]">
                        {s.src}
                      </span>
                    </>
                  )}
                  <span className="text-muted">·</span>
                  <span className="font-mono text-[9.5px] text-muted tracking-[0.08em]">
                    {s.date}
                  </span>
                </div>
                <h3 className="mt-[6px] font-display font-medium text-[20px] leading-[1.15]">
                  <Link href={`/readers/${s.slug}`}>{s.title}</Link>
                </h3>
                {s.tag && (
                  <span className="mt-2 inline-block border-ink border-b pb-px font-mono text-[10px] text-ink tracking-[0.12em]">
                    #{s.tag}
                  </span>
                )}
              </div>
            </article>
          ))}
        </section>

        <div className="h-20" />
      </div>
    </div>
  );
}
