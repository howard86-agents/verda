"use client";

import { STORIES, type Story } from "@verda/data";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { CoverImage } from "@/_components/cover-image";
import { IconBookmark, IconShare } from "@/_components/glyphs";
import { useAuth } from "@/lib/auth";
import { track } from "@/lib/track";
import { useReadComplete } from "@/lib/use-read-complete";

const TOC = [
  { n: "I", t: "A Sunday in February", on: true },
  { n: "II", t: "Pressing into the paper", on: false },
  { n: "III", t: "The small wooden box", on: false },
  { n: "IV", t: "After four weeks", on: false },
];

const TAGS = ["morning", "notebooks", "sundays", "letters"];

export function DetailReader({ story }: { story: Story }) {
  const [saved, setSaved] = useState(true);
  const [progress, setProgress] = useState(0);
  const { member } = useAuth();

  const handleReadComplete = useCallback(async () => {
    if (!member) {
      return;
    }
    track("story_read_complete", { articleId: story.id });
    try {
      const res = await fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "read_complete",
          memberId: member.id,
          articleId: story.id,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.level && data.level > 0) {
          track("growth_item_level_up", { level: data.level });
        }
      }
    } catch {
      // silent
    }
  }, [member, story.id]);

  const { bottomRef } = useReadComplete({
    enabled: !!member,
    onComplete: handleReadComplete,
  });

  useEffect(() => {
    track("story_view", { articleId: story.id, slug: story.slug });
  }, [story.id, story.slug]);

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

  const readNext = STORIES.slice(1, 3);

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
            MINDFUL LIVING · 心の暮らし
          </span>
          <span>12 MIN READ</span>
        </div>
      </div>

      <div className="shell">
        {/* Cover */}
        <section className="pt-9">
          <div className="relative">
            <CoverImage
              alt={story.title}
              className="aspect-[21/9] border border-line"
              gradient={story.img}
              id={story.id}
              kind="stories"
              priority
              sizes="100vw"
            />
            <div className="absolute top-0 left-0 z-10 h-[120px] w-[6px] bg-vermilion" />
            <div className="absolute bottom-[18px] left-[22px] z-10 font-mono text-[10px] text-white/80 uppercase tracking-[0.22em]">
              cover · pencils on linen — photo by author
            </div>
          </div>
        </section>

        {/* Title block — centered */}
        <section className="grid grid-cols-[1fr_720px_1fr] gap-10 pt-11 max-[1100px]:grid-cols-1">
          <div className="max-[1100px]:hidden" />
          <div className="mx-auto w-full max-w-[720px]">
            <h1 className="text-center font-display font-medium text-[64px] leading-[1.02] tracking-[-0.02em] max-[640px]:text-[44px]">
              Letters to a slower year,
              <br />
              written in <span className="text-vermilion italic">pencil</span>
              <span className="text-vermilion">.</span>
            </h1>
            <div className="mt-[14px] text-center font-display text-[22px] text-muted italic">
              鉛筆で綴る、ゆるやかな一年。
            </div>
            <div className="mt-[30px] grid grid-cols-[auto_1fr_auto_auto] items-center gap-[18px] border-line border-t border-b pt-5 pb-[18px] max-[640px]:grid-cols-[auto_1fr] max-[640px]:gap-3">
              <div className="flex h-9 w-9 items-center justify-center bg-ink font-display text-[15px] text-cream">
                L
              </div>
              <div>
                <div className="font-display font-medium text-[15px]">
                  Lin K. <span className="text-muted italic">· essayist</span>
                </div>
                <div className="mt-[2px] font-mono text-[10px] text-muted uppercase tracking-[0.08em]">
                  18 May 2026 · 14:08 JST
                </div>
              </div>
              <button
                className={`flex items-center gap-2 border border-ink px-[14px] py-2 font-mono text-[10.5px] uppercase tracking-[0.16em] ${
                  saved ? "bg-ink text-cream" : "bg-transparent text-ink"
                }`}
                onClick={() => setSaved((s) => !s)}
                type="button"
              >
                <IconBookmark filled={saved} /> {saved ? "Saved" : "Save"}
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
          {/* Left margin — TOC */}
          <div className="sticky top-[100px] max-[1100px]:static max-[1100px]:hidden">
            <div className="mb-[14px] font-mono text-[10px] text-muted uppercase tracking-[0.22em]">
              Contents · 目次
            </div>
            {TOC.map((s) => (
              <div
                className={`grid grid-cols-[28px_1fr] gap-[10px] border-line border-t py-2 ${
                  s.on ? "text-ink" : "text-muted"
                }`}
                key={s.n}
              >
                <div
                  className={`font-display text-[14px] italic ${
                    s.on ? "text-vermilion" : "text-muted"
                  }`}
                >
                  {s.n}.
                </div>
                <div className="font-display text-[14px] leading-[1.3]">
                  {s.t}
                </div>
              </div>
            ))}
            <div className="mt-[22px] border-ink border-t pt-[14px]">
              <div className="font-mono text-[10px] text-muted uppercase tracking-[0.18em]">
                Reading
              </div>
              <div className="mt-1 flex items-baseline gap-[6px]">
                <span className="font-display font-medium text-[32px] text-ink leading-none">
                  62
                </span>
                <span className="font-display text-[14px] text-muted italic">
                  % · 4 min left
                </span>
              </div>
            </div>
          </div>

          {/* Body column */}
          <div className="mx-auto w-full max-w-[720px] font-display text-[18px] text-ink-soft leading-[1.7]">
            <p className="m-0 font-display text-[22px] text-ink italic leading-[1.45]">
              On a Sunday in February, three of us agreed to write one letter a
              week — by hand, in pencil, to nobody in particular.
            </p>
            <p className="mt-[1.2em]">
              We didn&apos;t tell each other what to write. We didn&apos;t set a
              topic. The pencils we chose were ordinary — the kind you find in a
              desk drawer that you didn&apos;t know you had.
            </p>
            <p className="mt-[1.2em]">
              The first week, I noticed how much I press into the paper.
            </p>

            <div className="my-10 border-t-2 border-t-vermilion border-b border-b-line px-10 py-6 max-[640px]:mx-0 max-[640px]:px-0">
              <div className="text-center font-display text-[32px] text-ink italic leading-[1.25]">
                「 A pencil forgives you. A pen has plans. 」
              </div>
              <div className="mt-3 text-center font-mono text-[10px] text-muted uppercase tracking-[0.18em]">
                — Week 1, Field Notes
              </div>
            </div>

            <CoverImage
              alt="Three pencils, three notebooks"
              className="aspect-[3/2]"
              gradient="linear-gradient(135deg, #efd9b5, #c2603a)"
              id={story.id}
              kind="stories"
              label="figure 01 · pencils on linen"
              sizes="720px"
            />
            <div className="mt-2 mb-[26px] font-mono text-[10.5px] text-muted uppercase tracking-[0.1em]">
              Fig. 01 — Three pencils, three notebooks. By the author.
            </div>

            <p className="mt-[1.2em]">
              By week four, the practice had quietly rearranged my Sundays. The
              letters stayed in a small wooden box on a shelf I rarely use, and
              the box began to feel important without ever being shown to
              anyone.
            </p>

            <p className="mt-[1.2em]">
              I started to look forward to the act of choosing the pencil more
              than the writing itself. The choosing was the practice.
            </p>

            <div className="hatch relative my-[22px] aspect-video overflow-hidden bg-[linear-gradient(135deg,#5a5a4e,#1a1a1a)]">
              <div className="absolute inset-0 z-10 flex items-center justify-center">
                <div className="flex h-[72px] w-[72px] items-center justify-center bg-vermilion">
                  <svg
                    aria-hidden="true"
                    focusable="false"
                    height="28"
                    viewBox="0 0 24 24"
                    width="28"
                  >
                    <path d="M6 4l14 8-14 8V4z" fill="#fff" />
                  </svg>
                </div>
              </div>
              <div className="absolute bottom-[14px] left-[18px] z-10 font-mono text-[10px] text-white/85 uppercase tracking-[0.2em]">
                video 02 · 2:48 · reading aloud
              </div>
            </div>

            <p className="mt-[1.2em] text-muted italic">
              (Continue reading — 8 more paragraphs, three more letters.)
            </p>

            <div className="mt-8 flex flex-wrap gap-[18px] border-line border-t pt-[18px]">
              {TAGS.map((t) => (
                <span
                  className="border-ink border-b pb-[2px] font-mono text-[11px] text-ink uppercase tracking-[0.18em]"
                  key={t}
                >
                  #{t}
                </span>
              ))}
            </div>
            <div ref={bottomRef} />
          </div>

          {/* Right sidebar — author + reward */}
          <div className="sticky top-[100px] max-[1100px]:static">
            <div className="mb-6 border-vermilion border-l-4 bg-ink p-5 text-cream">
              <div className="font-mono text-[10px] uppercase tracking-[0.18em] opacity-75">
                Reward · 報酬
              </div>
              <div className="mt-[6px] font-display text-[18px] leading-[1.3]">
                Finish to earn{" "}
                <span className="text-[#ffc7c0]">+10 nutrients</span>
              </div>
              <div className="mt-[14px] h-[3px] bg-white/15">
                <div className="h-full w-[62%] bg-vermilion" />
              </div>
              <div className="mt-2 font-mono text-[10px] uppercase tracking-[0.14em] opacity-70">
                4 min left
              </div>
            </div>

            <div className="mb-[10px] font-mono text-[10px] text-muted uppercase tracking-[0.22em]">
              About the author
            </div>
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 items-center justify-center bg-ink font-display text-[16px] text-cream">
                L
              </div>
              <div>
                <div className="font-display font-medium text-[15px]">
                  Lin K.
                </div>
                <p className="mt-1 font-display text-[13px] text-muted italic leading-[1.5]">
                  Essayist. Lives between Taipei &amp; Kyoto. Writes about quiet
                  practices.
                </p>
              </div>
            </div>
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
          </div>
        </section>

        <div className="h-20" />
      </div>
    </div>
  );
}
