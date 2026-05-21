"use client";

import { useQuery } from "@tanstack/react-query";
import { SECTIONS } from "@verda/data";
import Link from "next/link";
import { Eyebrow } from "@/_components/eyebrow";
import type { Article } from "@/lib/db";

interface ListingResponse {
  items: Article[];
  page: number;
  total: number;
  totalPages: number;
}

interface SectionRow {
  count: number;
  cover?: Article;
  id: string;
  name: string;
}

/**
 * Section index (issue #98).
 *
 * Lists all five canonical sections with a published-story count and a
 * representative-cover thumbnail (the latest published piece in that
 * section). Queries the listing API once per section in parallel — fine
 * at five sections; if the taxonomy ever grows we can fold this into a
 * batched endpoint without changing the page surface.
 */
export default function TopicsIndexPage() {
  const sectionsQuery = useQuery<SectionRow[]>({
    queryKey: ["topics", "index"],
    queryFn: async () => {
      const rows = await Promise.all(
        SECTIONS.map(async (s) => {
          const params = new URLSearchParams({
            kind: "brand",
            section: s.id,
            sort: "latest",
            page: "1",
            limit: "1",
          });
          const res = await fetch(`/api/stories?${params}`);
          if (!res.ok) {
            return { id: s.id, name: s.name, count: 0 };
          }
          const data = (await res.json()) as ListingResponse;
          return {
            id: s.id,
            name: s.name,
            count: data.total,
            cover: data.items[0],
          };
        })
      );
      return rows;
    },
  });

  if (sectionsQuery.isLoading) {
    return <TopicsLoading />;
  }
  if (sectionsQuery.isError) {
    return <TopicsError />;
  }
  const sections = sectionsQuery.data ?? [];

  return (
    <div className="bg-cream text-ink">
      <div className="shell">
        <section className="pt-10">
          <Eyebrow en="Topics · 章" jp="セクション一覧" />
          <h1 className="mt-[14px] font-display font-medium text-[64px] leading-none tracking-[-0.02em] max-[640px]:text-[44px]">
            Five quiet sections
            <span className="text-vermilion">.</span>
          </h1>
          <p className="mt-3 max-w-[560px] font-display text-[16px] text-ink-soft leading-[1.6]">
            Verda's library is organised into five editorial sections. Pick one
            to read; each holds its own pace.
          </p>
        </section>

        <section className="grid grid-cols-2 gap-6 pt-10 pb-16 max-[640px]:grid-cols-1">
          {sections.map((s) => (
            <SectionCard key={s.id} section={s} />
          ))}
        </section>
      </div>
    </div>
  );
}

function SectionCard({ section }: { section: SectionRow }) {
  return (
    <Link
      className="group grid grid-cols-[1fr_120px] items-center gap-4 border border-ink bg-paper p-5"
      href={`/topics/${section.id}`}
    >
      <div>
        <div className="font-mono text-[10.5px] text-muted uppercase tracking-[0.22em]">
          {String(section.count).padStart(2, "0")} stories
        </div>
        <div className="mt-1 font-display font-medium text-[26px] leading-tight tracking-[-0.005em] group-hover:text-vermilion">
          {section.name}
        </div>
        {section.cover ? (
          <p className="mt-2 line-clamp-2 font-display text-[14px] text-ink-soft italic leading-[1.4]">
            Latest: {section.cover.title}
          </p>
        ) : (
          <p className="mt-2 font-display text-[14px] text-muted italic leading-[1.4]">
            Coming soon.
          </p>
        )}
        <span className="mt-3 inline-block font-mono text-[10px] text-vermilion uppercase tracking-[0.18em] group-hover:translate-x-[2px]">
          Browse →
        </span>
      </div>
      <div
        aria-hidden
        className="aspect-[4/5] border border-line"
        style={{
          background:
            section.cover?.img ?? "linear-gradient(135deg, #d6d3c8, #4a4a45)",
        }}
      />
    </Link>
  );
}

function TopicsLoading() {
  return (
    <div className="bg-cream text-ink">
      <div className="shell flex min-h-[50vh] items-center justify-center">
        <p className="font-mono text-[12px] text-muted uppercase tracking-[0.16em]">
          Loading sections…
        </p>
      </div>
    </div>
  );
}

function TopicsError() {
  return (
    <div className="bg-cream text-ink">
      <div className="shell flex min-h-[50vh] items-center justify-center">
        <p className="font-mono text-[12px] text-vermilion uppercase tracking-[0.16em]">
          Failed to load sections.
        </p>
      </div>
    </div>
  );
}
