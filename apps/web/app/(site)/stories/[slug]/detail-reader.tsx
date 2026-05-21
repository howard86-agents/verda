"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { notFound } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { ArticleBody } from "@/_components/article-body";
import { CoverImage } from "@/_components/cover-image";
import { IconBookmark, IconShare } from "@/_components/glyphs";
import { useRewardToast } from "@/_components/reward-toast";
import { StoryReactions } from "@/_components/story-reactions";
import { useAuth } from "@/lib/auth";
import type { Article } from "@/lib/db";
import { track } from "@/lib/track";
import { useToggleSave } from "@/lib/use-collection";
import { useReadComplete } from "@/lib/use-read-complete";

interface ReadNextResponse {
  items: Article[];
}

/**
 * Public story detail reader.
 *
 * Resolves the article by slug from the same `/api/stories/:slug` handler the
 * CMS and listing already write/read against, then renders its persisted
 * `bodyJson` through the shared `<ArticleBody />` Tiptap renderer. Cover,
 * title, Japanese subtitle, author, category, reading time, and tag come from
 * the fetched article so CMS-authored content round-trips to the public URL
 * (issue #74). Read-completion still fires against the fetched article's id.
 */
export function DetailReader({ slug }: { slug: string }) {
  const articleQuery = useQuery<Article, Error>({
    queryKey: ["story", slug],
    queryFn: async () => {
      const res = await fetch(`/api/stories/${encodeURIComponent(slug)}`);
      if (res.status === 404) {
        // Sentinel so react-query treats this as a real error and we can fall
        // through to `notFound()` below instead of looping retries.
        throw new Error("not_found");
      }
      if (!res.ok) {
        throw new Error(`Failed to load story (${res.status})`);
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
          Loading story…
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
          Failed to load story. Please try again.
        </p>
      </div>
    </div>
  );
}

function DetailReaderBody({ article }: { article: Article }) {
  const [progress, setProgress] = useState(0);
  const { member } = useAuth();
  const { isSaved, toggle: toggleSave } = useToggleSave(article.id);
  const { push: pushToast } = useRewardToast();

  const handleReadComplete = useCallback(async () => {
    if (!member) {
      return;
    }
    track("story_read_complete", { articleId: article.id });
    try {
      const res = await fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "read_complete",
          memberId: member.id,
          articleId: article.id,
        }),
      });
      if (res.ok) {
        const data = (await res.json()) as {
          level?: number;
          points?: number;
        };
        if (data.level && data.level > 0) {
          track("growth_item_level_up", { level: data.level });
        }
        // Show a reward toast only when points actually granted —
        // a 409 (already rewarded for this article) is res.ok=false and
        // is naturally skipped here, per acceptance #4 of issue #79.
        if (typeof data.points === "number" && data.points > 0) {
          pushToast({
            kind: "read",
            points: data.points,
            subtitle: article.title,
          });
        }
      }
    } catch {
      // silent
    }
  }, [member, article.id, article.title, pushToast]);

  const { bottomRef } = useReadComplete({
    enabled: !!member,
    onComplete: handleReadComplete,
  });

  useEffect(() => {
    track("story_view", { articleId: article.id, slug: article.slug });
  }, [article.id, article.slug]);

  useEffect(() => {
    let raf = 0;
    const update = () => {
      raf = 0;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const pct =
        max > 0 ? Math.round((window.scrollY / max) * 1000) / 1000 : 0;
      setProgress((prev) => (prev === pct ? prev : pct));
    };
    const onScroll = () => {
      if (!raf) {
        raf = requestAnimationFrame(update);
      }
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      if (raf) {
        cancelAnimationFrame(raf);
      }
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  const initial = (article.author || "?").trim().charAt(0).toUpperCase() || "?";
  const tags = article.tag ? [article.tag] : [];

  return (
    <div className="bg-paper text-ink">
      {/* progress bar */}
      <div className="fixed top-0 right-0 left-0 z-50 h-[2px] bg-line">
        <div
          className="h-full bg-vermilion"
          style={{ width: `${progress * 100}%` }}
        />
      </div>

      {/* Issue strip */}
      <div className="border-ink border-b">
        <div className="shell flex items-center justify-between py-3 font-mono text-[10.5px] text-ink uppercase tracking-[0.22em]">
          <span>Vol.14 — №&nbsp;01</span>
          <span className="text-vermilion max-[640px]:hidden">
            {(article.cat || "Story").toUpperCase()}
          </span>
          <span>{article.read || 0} MIN READ</span>
        </div>
      </div>

      <div className="shell">
        {/* Cover */}
        <section className="pt-9">
          <div className="relative">
            <CoverImage
              alt={article.title}
              className="aspect-[21/9] border border-line"
              gradient={article.img}
              id={article.id}
              kind="stories"
              priority
              sizes="100vw"
            />
            <div className="absolute top-0 left-0 z-10 h-[120px] w-[6px] bg-vermilion" />
            <div className="absolute bottom-[18px] left-[22px] z-10 font-mono text-[10px] text-white/80 uppercase tracking-[0.22em]">
              cover · {article.cat || "story"}
            </div>
          </div>
        </section>

        {/* Title block — centered */}
        <section className="grid grid-cols-[1fr_720px_1fr] gap-10 pt-11 max-[1100px]:grid-cols-1">
          <div className="max-[1100px]:hidden" />
          <div className="mx-auto w-full max-w-[720px]">
            <h1 className="text-center font-display font-medium text-[64px] leading-[1.02] tracking-[-0.02em] max-[640px]:text-[44px]">
              {article.title}
              <span className="text-vermilion">.</span>
            </h1>
            {article.jp && (
              <div className="mt-[14px] text-center font-display text-[22px] text-muted italic">
                {article.jp}
              </div>
            )}
            <div className="mt-[30px] grid grid-cols-[auto_1fr_auto_auto] items-center gap-[18px] border-line border-t border-b pt-5 pb-[18px] max-[640px]:grid-cols-[auto_1fr] max-[640px]:gap-3">
              <div className="flex h-9 w-9 items-center justify-center bg-ink font-display text-[15px] text-cream">
                {initial}
              </div>
              <div>
                <div className="font-display font-medium text-[15px]">
                  {article.author || (
                    <span className="text-muted italic">No author</span>
                  )}
                </div>
                <div className="mt-[2px] font-mono text-[10px] text-muted uppercase tracking-[0.08em]">
                  {article.date}
                </div>
              </div>
              <button
                className={`flex items-center gap-2 border border-ink px-[14px] py-2 font-mono text-[10.5px] uppercase tracking-[0.16em] ${
                  isSaved ? "bg-ink text-cream" : "bg-transparent text-ink"
                }`}
                onClick={toggleSave}
                type="button"
              >
                <IconBookmark filled={isSaved} /> {isSaved ? "Saved" : "Save"}
              </button>
              <button
                className="flex items-center gap-2 border border-ink bg-transparent px-[14px] py-2 font-mono text-[10.5px] text-ink uppercase tracking-[0.16em]"
                type="button"
              >
                <IconShare /> Share
              </button>
            </div>
          </div>
          <div className="max-[1100px]:hidden" />
        </section>

        {/* Body with TOC sidebar */}
        <section className="grid grid-cols-[1fr_720px_1fr] items-start gap-10 pt-12 max-[1100px]:grid-cols-1">
          {/* Left margin — reading progress */}
          <div className="sticky top-[100px] max-[1100px]:static max-[1100px]:hidden">
            <div className="mb-[14px] font-mono text-[10px] text-muted uppercase tracking-[0.22em]">
              Reading · 読書
            </div>
            <div className="border-ink border-t pt-[14px]">
              <div className="font-mono text-[10px] text-muted uppercase tracking-[0.18em]">
                Progress
              </div>
              <div className="mt-1 flex items-baseline gap-[6px]">
                <span className="font-display font-medium text-[32px] text-ink leading-none">
                  {Math.round(progress * 100)}
                </span>
                <span className="font-display text-[14px] text-muted italic">
                  %
                </span>
              </div>
              <div className="mt-2 h-[2px] bg-line">
                <div
                  className="h-full bg-vermilion"
                  style={{ width: `${progress * 100}%` }}
                />
              </div>
            </div>
          </div>

          {/* Body column */}
          <div className="mx-auto w-full max-w-[720px]">
            <ArticleBody
              bodyJson={article.bodyJson ?? ""}
              className="font-display text-[18px] text-ink-soft leading-[1.7]"
            />

            {tags.length > 0 && (
              <div className="mt-8 flex flex-wrap gap-[18px] border-line border-t pt-[18px]">
                {tags.map((t) => (
                  <span
                    className="border-ink border-b pb-[2px] font-mono text-[11px] text-ink uppercase tracking-[0.18em]"
                    key={t}
                  >
                    #{t}
                  </span>
                ))}
              </div>
            )}
            <StoryReactions articleId={article.id} />
            <div ref={bottomRef} />
          </div>

          {/* Right sidebar — author + reward + read next */}
          <DetailSidebar article={article} initial={initial} />
        </section>

        <div className="h-20" />
      </div>
    </div>
  );
}

function DetailSidebar({
  article,
  initial,
}: {
  article: Article;
  initial: string;
}) {
  const readNextQuery = useQuery<ReadNextResponse>({
    queryKey: ["story-read-next", article.kind, article.id],
    queryFn: async () => {
      const params = new URLSearchParams({
        kind: article.kind || "brand",
        sort: "latest",
        page: "1",
        limit: "3",
      });
      const res = await fetch(`/api/stories?${params}`);
      if (!res.ok) {
        throw new Error("Failed to load read-next");
      }
      return (await res.json()) as ReadNextResponse;
    },
  });
  const readNext = (readNextQuery.data?.items ?? [])
    .filter((a) => a.id !== article.id)
    .slice(0, 2);

  return (
    <div className="sticky top-[100px] max-[1100px]:static">
      <div className="mb-6 border-vermilion border-l-4 bg-ink p-5 text-cream">
        <div className="font-mono text-[10px] uppercase tracking-[0.18em] opacity-75">
          Reward · 報酬
        </div>
        <div className="mt-[6px] font-display text-[18px] leading-[1.3]">
          Finish to earn <span className="text-[#ffc7c0]">+10 nutrients</span>
        </div>
      </div>

      <div className="mb-[10px] font-mono text-[10px] text-muted uppercase tracking-[0.22em]">
        About the author
      </div>
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 items-center justify-center bg-ink font-display text-[16px] text-cream">
          {initial}
        </div>
        <div>
          <div className="font-display font-medium text-[15px]">
            {article.author || (
              <span className="text-muted italic">No author</span>
            )}
          </div>
          {article.cat && (
            <p className="mt-1 font-display text-[13px] text-muted italic leading-[1.5]">
              {article.cat}
            </p>
          )}
        </div>
      </div>
      {readNext.length > 0 && (
        <div className="mt-[22px] border-line border-t pt-4">
          <div className="mb-3 font-mono text-[10px] text-muted uppercase tracking-[0.18em]">
            Read next · 続きを
          </div>
          {readNext.map((s) => (
            <Link
              className="grid grid-cols-[52px_1fr] gap-[10px] border-line border-b py-[10px]"
              href={`/stories/${s.slug}`}
              key={s.id}
            >
              <CoverImage
                alt={s.title}
                className="aspect-square"
                gradient={s.img}
                id={s.id}
                kind="stories"
                sizes="52px"
              />
              <div>
                <div className="font-mono text-[9px] text-muted uppercase tracking-[0.14em]">
                  {s.cat} · {s.read} min
                </div>
                <div className="mt-[3px] line-clamp-2 font-display text-[13px] leading-[1.2]">
                  {s.title}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
