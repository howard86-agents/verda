"use client";

import { useQuery } from "@tanstack/react-query";
import { SECTIONS } from "@verda/data";
import Link from "next/link";
import { notFound, useParams } from "next/navigation";
import { useState } from "react";
import { CoverImage } from "@/_components/cover-image";
import { Eyebrow } from "@/_components/eyebrow";
import type { Article } from "@/lib/db";
import { sectionLabel, seriesPartLabel } from "@/lib/section";

interface ListingResponse {
  items: Article[];
  page: number;
  total: number;
  totalPages: number;
}

type SortKey = "latest" | "recommended" | "popular";

const SORTS: { id: SortKey; label: string }[] = [
  { id: "latest", label: "Latest" },
  { id: "recommended", label: "Recommended" },
  { id: "popular", label: "Popular" },
];

const PAGE_SIZE = 6;

/**
 * Section landing (issue #98).
 *
 * Lists published stories in a single section. Pagination + sort mirror
 * the main listing at /stories so the surface stays consistent. Returns
 * not-found for unknown section ids.
 */
export default function TopicLandingPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const section = SECTIONS.find((s) => s.id === id);
  if (!section) {
    notFound();
  }

  const [sort, setSort] = useState<SortKey>("latest");
  const [page, setPage] = useState(1);

  const { data, isLoading, isError } = useQuery<ListingResponse>({
    queryKey: ["topic", id, sort, page],
    queryFn: async () => {
      const url = new URLSearchParams({
        kind: "brand",
        section: section.id,
        sort,
        page: String(page),
        limit: String(PAGE_SIZE),
      });
      const res = await fetch(`/api/stories?${url}`);
      if (!res.ok) {
        throw new Error("Failed to load section");
      }
      return (await res.json()) as ListingResponse;
    },
  });

  if (isLoading) {
    return (
      <div className="bg-cream text-ink">
        <div className="shell flex min-h-[50vh] items-center justify-center">
          <p className="font-mono text-[12px] text-muted uppercase tracking-[0.16em]">
            Loading {section.name}…
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
            Failed to load {section.name}.
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
        <section className="pt-10">
          <Eyebrow en={`Topic · ${section.name}`} jp="セクション" />
          <div className="mt-[14px] flex items-baseline justify-between gap-6 max-[640px]:flex-col max-[640px]:items-start">
            <h1 className="font-display font-medium text-[64px] leading-none tracking-[-0.02em] max-[640px]:text-[44px]">
              {section.name}
              <span className="text-vermilion">.</span>
            </h1>
            <Link
              className="font-mono text-[11px] text-ink uppercase tracking-[0.18em]"
              href="/topics"
            >
              ← All topics
            </Link>
          </div>
        </section>

        <div className="mt-8 flex items-center gap-4 border-t border-t-ink border-b border-b-line py-3 font-mono text-[11px] text-muted uppercase tracking-[0.16em]">
          <span>{String(total).padStart(2, "0")} entries</span>
          <span className="ml-auto flex items-center gap-3">
            {SORTS.map((s) => (
              <button
                className={s.id === sort ? "text-ink" : "text-muted"}
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

        {stories.length === 0 ? (
          <div className="flex min-h-[30vh] items-center justify-center">
            <p className="font-mono text-[12px] text-muted uppercase tracking-[0.16em]">
              No stories yet in {section.name}.
            </p>
          </div>
        ) : (
          <section className="grid grid-cols-3 gap-9 pt-9 max-[640px]:grid-cols-1 max-[900px]:grid-cols-2">
            {stories.map((s, i) => (
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
                  {s.jp && (
                    <div className="mt-1 font-display text-[14px] text-muted italic">
                      {s.jp}
                    </div>
                  )}
                  {s.sum && (
                    <p className="mt-[10px] line-clamp-2 font-display text-[15px] text-ink-soft leading-[1.5]">
                      {s.sum}
                    </p>
                  )}
                </div>
              </article>
            ))}
          </section>
        )}

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

        <div className="h-12" />
      </div>
    </div>
  );
}
