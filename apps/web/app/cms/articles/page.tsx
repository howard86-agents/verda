"use client";

// CMS · Article list — table with filters, status pills, batch actions.

import { useState } from "react";
import { CmsShell } from "@/_components/cms-shell";
import { IconFilter, IconMore } from "@/_components/glyphs";

type Status = "published" | "scheduled" | "draft" | "unpublished";

interface Row {
  author: string;
  cat: string;
  id: string;
  jp: string;
  status: Status;
  t: string;
  tags: string[];
  views: string;
  when: string;
}

const ROWS: Row[] = [
  {
    id: "a01",
    t: "Letters to a slower year, written in pencil",
    jp: "鉛筆で綴る、ゆるやかな一年",
    cat: "Mindful Living",
    tags: ["morning", "sundays"],
    status: "published",
    author: "Lin K.",
    views: "12,408",
    when: "18 May · 14:08",
  },
  {
    id: "a02",
    t: "A spring bowl, in five colors",
    jp: "春の五色丼",
    cat: "Nutrition",
    tags: ["recipe", "spring"],
    status: "published",
    author: "Sora M.",
    views: "8,201",
    when: "16 May · 09:22",
  },
  {
    id: "a03",
    t: "Reading the soil — what your basil is telling you",
    jp: "土を読む",
    cat: "Earth & Garden",
    tags: ["season", "garden"],
    status: "scheduled",
    author: "A. Chen",
    views: "—",
    when: "24 May · 08:00",
  },
  {
    id: "a04",
    t: "A walk, after dinner, in any weather",
    jp: "夕食後の一歩",
    cat: "Movement",
    tags: ["practice"],
    status: "draft",
    author: "J. Park",
    views: "—",
    when: "updated 2h ago",
  },
  {
    id: "a05",
    t: "Notes from a paper journal, week 19",
    jp: "手帳の余白",
    cat: "Mindful Living",
    tags: ["journal"],
    status: "published",
    author: "Lin K.",
    views: "6,442",
    when: "10 May · 17:01",
  },
  {
    id: "a06",
    t: "Six pantry items I now refuse to be without",
    jp: "六つの常備品",
    cat: "Nutrition",
    tags: ["pantry"],
    status: "published",
    author: "Sora M.",
    views: "4,930",
    when: "08 May · 11:45",
  },
  {
    id: "a07",
    t: "The quiet rituals that shape a slower morning",
    jp: "静かな朝の儀式",
    cat: "Mindful Living",
    tags: ["morning"],
    status: "unpublished",
    author: "Lin K.",
    views: "—",
    when: "07 May · 10:10",
  },
  {
    id: "a08",
    t: "Three pots, three teas",
    jp: "三つの茶器",
    cat: "Earth & Garden",
    tags: ["tea"],
    status: "draft",
    author: "A. Chen",
    views: "—",
    when: "updated yesterday",
  },
];

const FILTERS = [
  { n: "All", k: "142" },
  { n: "Published", k: "118" },
  { n: "Scheduled", k: "4" },
  { n: "Drafts", k: "14" },
  { n: "Unpublished", k: "6" },
];

const PAGES = ["‹", "1", "2", "3", "...", "18", "›"];

const GRID = "grid-cols-[40px_3fr_1.3fr_0.9fr_0.9fr_0.9fr_0.9fr_40px]";

function StatusPill({ s }: { s: Status }) {
  const map: Record<Status, { cls: string; label: string }> = {
    published: {
      cls: "bg-ink text-cream border-ink",
      label: "PUBLISHED",
    },
    scheduled: {
      cls: "bg-paper-alt text-vermilion border-vermilion",
      label: "SCHEDULED",
    },
    draft: {
      cls: "bg-paper text-muted border-line",
      label: "DRAFT",
    },
    unpublished: {
      cls: "bg-paper text-muted border-line",
      label: "UNPUBLISHED",
    },
  };
  const m = map[s];
  return (
    <span
      className={`border px-2 py-[2px] font-mono text-[9.5px] uppercase tracking-[0.16em] ${m.cls}`}
    >
      {m.label}
    </span>
  );
}

export default function CmsArticlesPage() {
  const [sel, setSel] = useState<Set<string>>(new Set(["a03", "a04"]));

  const toggle = (id: string) => {
    setSel((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  return (
    <CmsShell
      actions={
        <>
          <button
            className="border border-line bg-paper px-3 py-2 font-mono text-[11px] text-ink uppercase tracking-[0.16em]"
            type="button"
          >
            Import CSV
          </button>
          <button
            className="bg-vermilion px-[14px] py-2 font-mono text-[11px] text-cream uppercase tracking-[0.16em]"
            type="button"
          >
            + New article
          </button>
        </>
      }
      active="articles"
      breadcrumb="Articles · 記事"
    >
      <section className="px-8 pt-7 max-[860px]:px-5">
        {/* Title block */}
        <h1 className="m-0 font-display font-medium text-[36px] tracking-[-0.015em]">
          Articles<span className="text-vermilion">.</span>
          <span className="ml-[14px] font-display text-[16px] text-muted italic">
            記事一覧
          </span>
        </h1>

        {/* Filter strip */}
        <div className="mt-[22px] flex flex-wrap items-center gap-[26px] border-ink border-line border-t border-b py-3">
          {FILTERS.map((f, i) => {
            const on = i === 0;
            return (
              <button
                className={`flex items-baseline gap-[6px] border-b-2 pb-[6px] font-mono text-[11px] uppercase tracking-[0.16em] ${
                  on
                    ? "border-vermilion text-ink"
                    : "border-transparent text-muted"
                }`}
                key={f.n}
                type="button"
              >
                {f.n}
                <span
                  className={`font-mono text-[10px] ${on ? "text-vermilion" : "text-muted"}`}
                >
                  ({f.k})
                </span>
              </button>
            );
          })}
          <div className="ml-auto flex items-center gap-4 font-mono text-[11px] text-muted uppercase tracking-[0.14em]">
            <span className="flex items-center gap-[6px] text-ink">
              <IconFilter size={16} /> all categories
            </span>
            <span className="h-[14px] w-px bg-line" />
            <span className="text-ink">Sort · updated</span>
          </div>
        </div>

        {/* Batch toolbar */}
        {sel.size > 0 && (
          <div className="mt-[14px] flex items-center gap-[18px] border-vermilion border-l-4 bg-ink px-[14px] py-[10px] font-mono text-[11px] text-cream uppercase tracking-[0.14em]">
            <span>
              <strong className="font-medium text-cream">{sel.size}</strong>{" "}
              selected · 選択中
            </span>
            <span className="h-[14px] w-px bg-white/20" />
            <button className="uppercase" type="button">
              Set category
            </button>
            <button className="uppercase" type="button">
              Set tags
            </button>
            <button className="uppercase" type="button">
              Publish now
            </button>
            <button className="uppercase" type="button">
              Unpublish
            </button>
            <span className="ml-auto text-white/55">Esc to clear</span>
          </div>
        )}

        {/* Table — horizontal scroll on small screens */}
        <div className="mt-4 overflow-x-auto border border-line bg-paper">
          <div className="min-w-[860px]">
            {/* Header row */}
            <div
              className={`grid ${GRID} items-center gap-4 border-ink border-b px-4 py-[10px] font-mono text-[10px] text-muted uppercase tracking-[0.16em]`}
            >
              <span className="size-[14px] border-[1.5px] border-muted bg-transparent" />
              <span>Title</span>
              <span>Category · Tags</span>
              <span>Status</span>
              <span>Author</span>
              <span>Views</span>
              <span>Updated</span>
              <span />
            </div>
            {/* Rows */}
            {ROWS.map((r) => {
              const on = sel.has(r.id);
              return (
                <div
                  className={`grid ${GRID} items-center gap-4 border-line border-b px-4 py-[14px] font-sans ${
                    on ? "bg-vermilion/[0.04]" : ""
                  }`}
                  key={r.id}
                >
                  <button
                    aria-label={`Select ${r.t}`}
                    aria-pressed={on}
                    className={`flex size-[14px] items-center justify-center border-[1.5px] ${
                      on
                        ? "border-vermilion bg-vermilion"
                        : "border-muted bg-transparent"
                    }`}
                    onClick={() => toggle(r.id)}
                    type="button"
                  >
                    {on && (
                      <span className="text-[10px] text-cream leading-none">
                        ✓
                      </span>
                    )}
                  </button>
                  <div>
                    <div className="font-display font-medium text-[15.5px] leading-[1.25]">
                      {r.t}
                    </div>
                    <div className="mt-[2px] font-display text-[12px] text-muted italic">
                      {r.jp}
                    </div>
                  </div>
                  <div>
                    <div className="font-mono text-[10.5px] text-ink uppercase tracking-[0.12em]">
                      {r.cat}
                    </div>
                    <div className="mt-[2px] font-mono text-[10px] text-muted tracking-[0.06em]">
                      {r.tags.map((t) => `#${t}`).join(" · ")}
                    </div>
                  </div>
                  <span>
                    <StatusPill s={r.status} />
                  </span>
                  <span className="text-[12px]">{r.author}</span>
                  <span className="font-mono text-[11px] text-ink tracking-[0.04em]">
                    {r.views}
                  </span>
                  <span className="font-mono text-[10.5px] text-muted tracking-[0.04em]">
                    {r.when}
                  </span>
                  <button
                    aria-label={`More actions for ${r.t}`}
                    className="flex justify-end text-muted"
                    type="button"
                  >
                    <IconMore size={22} />
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between px-0 pt-[18px] pb-10 font-mono text-[11px] text-muted uppercase tracking-[0.14em]">
          <span>Showing 1–8 of 142</span>
          <div className="flex gap-1">
            {PAGES.map((p) => {
              const cur = p === "1";
              return (
                <button
                  className={`inline-flex h-[28px] min-w-[28px] items-center justify-center px-2 ${
                    cur ? "border border-ink bg-ink text-cream" : "text-ink"
                  }`}
                  key={p}
                  type="button"
                >
                  {p}
                </button>
              );
            })}
          </div>
        </div>
      </section>
    </CmsShell>
  );
}
