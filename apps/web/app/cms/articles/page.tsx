"use client";

// CMS · Article list — live data, multi-select, batch operations.

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { CmsShell } from "@/_components/cms-shell";
import { IconFilter, IconMore } from "@/_components/glyphs";
import { can, useCmsAuth } from "@/lib/cms-auth";
import type { Article } from "@/lib/db";

type Status = "published" | "scheduled" | "draft" | "unpublished";

const GRID = "grid-cols-[40px_3fr_1.3fr_0.9fr_0.9fr_0.9fr_40px]";

function StatusPill({ s }: { s: string }) {
  const map: Record<string, { cls: string; label: string }> = {
    published: { cls: "bg-ink text-cream border-ink", label: "PUBLISHED" },
    scheduled: {
      cls: "bg-paper-alt text-vermilion border-vermilion",
      label: "SCHEDULED",
    },
    draft: { cls: "bg-paper text-muted border-line", label: "DRAFT" },
    unpublished: {
      cls: "bg-paper text-muted border-line",
      label: "UNPUBLISHED",
    },
  };
  const m = map[s] || map.draft;
  return (
    <span
      className={`border px-2 py-[2px] font-mono text-[9.5px] uppercase tracking-[0.16em] ${m.cls}`}
    >
      {m.label}
    </span>
  );
}

function BatchFeedback({ message }: { message: string | null }) {
  if (!message) {
    return null;
  }
  return (
    <div className="mt-2 font-mono text-[10px] text-vermilion uppercase tracking-[0.12em]">
      {message}
    </div>
  );
}

export default function CmsArticlesPage() {
  const { role } = useCmsAuth();
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [sel, setSel] = useState<Set<string>>(new Set());
  const [filter, setFilter] = useState<Status | "all">("all");
  const [feedback, setFeedback] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/cms/articles");
    if (res.ok) {
      setArticles(await res.json());
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

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

  const clearSel = () => setSel(new Set());

  const batch = useCallback(
    async (action: string, extra?: Record<string, string>) => {
      setFeedback(null);
      const res = await fetch("/api/cms/articles/batch", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-cms-role": role,
        },
        body: JSON.stringify({ ids: [...sel], action, ...extra }),
      });
      if (res.ok) {
        const data = await res.json();
        setFeedback(`${action}: ${data.updated} article(s) updated`);
        setSel(new Set());
        await load();
      } else if (res.status === 403) {
        setFeedback(`${action}: forbidden for ${role} role`);
      }
    },
    [sel, role, load]
  );

  const handleSetCategory = useCallback(async () => {
    // biome-ignore lint/suspicious/noAlert: dev-only CMS tool
    const cat = window.prompt("Category:");
    if (cat) {
      await batch("set_category", { cat });
    }
  }, [batch]);

  const handleSetTags = useCallback(async () => {
    // biome-ignore lint/suspicious/noAlert: dev-only CMS tool
    const tag = window.prompt("Tags (comma-separated):");
    if (tag) {
      await batch("set_tags", { tag });
    }
  }, [batch]);

  const filtered =
    filter === "all" ? articles : articles.filter((a) => a.status === filter);

  const counts = {
    all: articles.length,
    published: articles.filter((a) => a.status === "published").length,
    scheduled: articles.filter((a) => a.status === "scheduled").length,
    draft: articles.filter((a) => a.status === "draft").length,
    unpublished: articles.filter((a) => a.status === "unpublished").length,
  };

  const canPublish = can("publish", role);

  return (
    <CmsShell
      actions={
        <Link
          className="bg-vermilion px-[14px] py-2 font-mono text-[11px] text-cream uppercase tracking-[0.16em]"
          href="/cms/articles/new"
        >
          + New article
        </Link>
      }
      active="articles"
      breadcrumb="Articles · 記事"
    >
      <section className="px-8 pt-7 max-[860px]:px-5">
        <h1 className="m-0 font-display font-medium text-[36px] tracking-[-0.015em]">
          Articles<span className="text-vermilion">.</span>
          <span className="ml-[14px] font-display text-[16px] text-muted italic">
            記事一覧
          </span>
        </h1>

        {/* Filter strip */}
        <div className="mt-[22px] flex flex-wrap items-center gap-[26px] border-line border-t border-b py-3">
          {(
            [
              ["all", "All"],
              ["published", "Published"],
              ["scheduled", "Scheduled"],
              ["draft", "Drafts"],
              ["unpublished", "Unpublished"],
            ] as const
          ).map(([key, label]) => {
            const on = filter === key;
            return (
              <button
                className={`flex items-baseline gap-[6px] border-b-2 pb-[6px] font-mono text-[11px] uppercase tracking-[0.16em] ${
                  on
                    ? "border-vermilion text-ink"
                    : "border-transparent text-muted"
                }`}
                key={key}
                onClick={() => setFilter(key)}
                type="button"
              >
                {label}
                <span
                  className={`font-mono text-[10px] ${on ? "text-vermilion" : "text-muted"}`}
                >
                  ({counts[key]})
                </span>
              </button>
            );
          })}
          <div className="ml-auto flex items-center gap-4 font-mono text-[11px] text-muted uppercase tracking-[0.14em]">
            <span className="flex items-center gap-[6px] text-ink">
              <IconFilter size={16} /> all categories
            </span>
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
            <button
              className="uppercase"
              onClick={handleSetCategory}
              type="button"
            >
              Set category
            </button>
            <button className="uppercase" onClick={handleSetTags} type="button">
              Set tags
            </button>
            {canPublish && (
              <>
                <button
                  className="uppercase"
                  onClick={() => batch("publish")}
                  type="button"
                >
                  Publish now
                </button>
                <button
                  className="uppercase"
                  onClick={() => batch("unpublish")}
                  type="button"
                >
                  Unpublish
                </button>
              </>
            )}
            <button
              className="ml-auto text-white/55 uppercase"
              onClick={clearSel}
              type="button"
            >
              Esc to clear
            </button>
          </div>
        )}

        <BatchFeedback message={feedback} />

        {/* Table */}
        {loading ? (
          <p className="mt-8 font-mono text-[12px] text-muted uppercase tracking-[0.14em]">
            Loading…
          </p>
        ) : (
          <div className="mt-4 overflow-x-auto border border-line bg-paper">
            <div className="min-w-[860px]">
              <div
                className={`grid ${GRID} items-center gap-4 border-ink border-b px-4 py-[10px] font-mono text-[10px] text-muted uppercase tracking-[0.16em]`}
              >
                <span className="size-[14px] border-[1.5px] border-muted bg-transparent" />
                <span>Title</span>
                <span>Category · Tags</span>
                <span>Status</span>
                <span>Author</span>
                <span>Updated</span>
                <span />
              </div>
              {filtered.map((r) => {
                const on = sel.has(r.id);
                return (
                  <div
                    className={`grid ${GRID} items-center gap-4 border-line border-b px-4 py-[14px] font-sans ${
                      on ? "bg-vermilion/[0.04]" : ""
                    }`}
                    key={r.id}
                  >
                    <button
                      aria-label={`Select ${r.title}`}
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
                      <Link
                        className="font-display font-medium text-[15.5px] leading-[1.25] hover:text-vermilion"
                        href={`/cms/articles/${r.id}/edit`}
                      >
                        {r.title}
                      </Link>
                      <div className="mt-[2px] font-display text-[12px] text-muted italic">
                        {r.jp}
                      </div>
                    </div>
                    <div>
                      <div className="font-mono text-[10.5px] text-ink uppercase tracking-[0.12em]">
                        {r.cat}
                      </div>
                      <div className="mt-[2px] font-mono text-[10px] text-muted tracking-[0.06em]">
                        {r.tag
                          ? r.tag
                              .split(",")
                              .map((t) => `#${t.trim()}`)
                              .join(" · ")
                          : ""}
                      </div>
                    </div>
                    <span>
                      <StatusPill s={r.status || "draft"} />
                    </span>
                    <span className="text-[12px]">{r.author}</span>
                    <span className="font-mono text-[10.5px] text-muted tracking-[0.04em]">
                      {r.date}
                    </span>
                    <button
                      aria-label={`More actions for ${r.title}`}
                      className="flex justify-end text-muted"
                      type="button"
                    >
                      <IconMore size={22} />
                    </button>
                  </div>
                );
              })}
              {filtered.length === 0 && (
                <div className="px-4 py-8 text-center font-mono text-[11px] text-muted uppercase tracking-[0.14em]">
                  No articles
                </div>
              )}
            </div>
          </div>
        )}

        {/* Count */}
        <div className="pt-[18px] pb-10 font-mono text-[11px] text-muted uppercase tracking-[0.14em]">
          Showing {filtered.length} of {articles.length}
        </div>
      </section>
    </CmsShell>
  );
}
