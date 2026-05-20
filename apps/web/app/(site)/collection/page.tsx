"use client";

import { COLLECTED, STORIES } from "@verda/data";
import Link from "next/link";
import { useState } from "react";
import { CoverImage } from "@/_components/cover-image";
import { IconBookmark, IconDrop } from "@/_components/glyphs";
import { Plant } from "@/_components/plant";
import { StatSlab } from "@/_components/stat-slab";

type TabId = "saved" | "read" | "items" | "activity";

const TABS: { id: TabId; n: string; jp: string }[] = [
  { id: "saved", n: "Saved", jp: "保存" },
  { id: "read", n: "Read", jp: "読了" },
  { id: "items", n: "Items earned", jp: "獲得" },
  { id: "activity", n: "Activity", jp: "記録" },
];

const STATS: {
  n: string;
  en: string;
  jp: string;
  divider?: boolean;
  accent?: boolean;
}[] = [
  { n: "14", en: "Read", jp: "読了" },
  { n: "3", en: "Saved", jp: "保存", divider: true },
  { n: "87", en: "Nutrients", jp: "滋養", divider: true, accent: true },
  { n: "02", en: "Level", jp: "Sprout · 芽", divider: true },
];

const HEATMAP_ROWS = 8;
const HEATMAP_COLS = 7;

function heatOpacity(v: number) {
  if (v > 7) {
    return 1;
  }
  if (v > 4) {
    return 0.7;
  }
  if (v > 2) {
    return 0.4;
  }
  return 0.15;
}

export default function Page() {
  const [tab, setTab] = useState<TabId>("saved");
  const saved = STORIES.filter((s) => COLLECTED.includes(s.id));
  const savedCards = [...saved, ...STORIES.slice(0, 1)].map((s, i) => ({
    story: s,
    num: String(i + 1).padStart(2, "0"),
    key: `${s.id}-${i + 1}`,
  }));

  return (
    <div className="bg-cream text-ink">
      {/* Profile masthead */}
      <section className="shell pt-10">
        <div className="grid grid-cols-[auto_1fr_auto] items-center gap-7 max-[640px]:grid-cols-1 max-[640px]:gap-4">
          <div className="flex size-[88px] items-center justify-center bg-ink font-display font-medium text-[40px] text-cream">
            M
          </div>
          <div>
            <div className="font-mono text-[10.5px] text-muted uppercase tracking-[0.22em]">
              Member · 会員
            </div>
            <h1 className="mt-[6px] font-display font-medium text-[48px] leading-none tracking-[-0.015em] max-[560px]:text-[36px]">
              Mira&apos;s collection<span className="text-vermilion">.</span>
            </h1>
            <div className="mt-2 font-mono text-[10.5px] text-muted uppercase tracking-[0.12em]">
              Joined Mar 2026 · 91APP linked · Member ID 4421
            </div>
          </div>
          <button
            className="border border-ink bg-transparent px-4 py-[10px] font-mono text-[11px] text-ink uppercase tracking-[0.18em] max-[640px]:justify-self-start"
            type="button"
          >
            Account settings →
          </button>
        </div>

        {/* Stat slabs */}
        <div className="mt-8 grid grid-cols-4 border border-ink max-[640px]:grid-cols-2">
          {STATS.map((s) => (
            <StatSlab key={s.en} size="lg" {...s} />
          ))}
        </div>
      </section>

      {/* Tabs */}
      <div className="shell mt-10">
        <div className="-mb-px flex border-t border-t-ink border-b border-b-line">
          {TABS.map((t, i) => {
            const on = t.id === tab;
            return (
              <button
                className={`flex items-baseline gap-2 border-b-[2px] px-7 py-4 font-mono text-[11.5px] uppercase tracking-[0.18em] ${
                  on
                    ? "border-b-vermilion text-vermilion"
                    : "border-b-transparent text-muted"
                } ${i < TABS.length - 1 ? "border-r border-r-line" : ""}`}
                key={t.id}
                onClick={() => setTab(t.id)}
                type="button"
              >
                {t.n}
                <span className="font-display text-[12px] italic tracking-normal opacity-65">
                  {t.jp}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Content */}
      {tab === "saved" && (
        <section className="shell grid grid-cols-4 gap-8 pt-9 max-[1100px]:grid-cols-3 max-[560px]:grid-cols-1 max-[860px]:grid-cols-2">
          {savedCards.map(({ story: s, num, key }) => (
            <Link href={`/stories/${s.slug}`} key={key}>
              <article>
                <div className="relative">
                  <CoverImage
                    alt={s.title}
                    className="aspect-[4/5]"
                    gradient={s.img}
                    id={s.id}
                    kind="stories"
                    sizes="(max-width: 560px) 100vw, (max-width: 860px) 50vw, 25vw"
                  />
                  <div className="absolute top-3 left-3 z-10 font-display font-medium text-[22px] text-white leading-none [text-shadow:0_1px_6px_rgba(0,0,0,0.5)]">
                    {num}
                  </div>
                  <div className="absolute top-[10px] right-[10px] z-10 flex size-[28px] items-center justify-center bg-vermilion text-cream">
                    <IconBookmark filled size={20} />
                  </div>
                </div>
                <div className="mt-3">
                  <div className="font-mono text-[9.5px] text-muted uppercase tracking-[0.16em]">
                    {s.cat} · {s.read} min
                  </div>
                  <div className="mt-1 line-clamp-2 font-display text-[17px] leading-[1.18]">
                    {s.title}
                  </div>
                  <div className="mt-[3px] font-display text-[12px] text-muted italic">
                    {s.jp}
                  </div>
                </div>
              </article>
            </Link>
          ))}
          {/* empty placeholder */}
          <div className="flex aspect-[4/5] flex-col items-center justify-center border border-muted border-dashed p-[18px] text-center text-muted">
            <div className="font-display font-light text-[44px] leading-none">
              ＋
            </div>
            <div className="mt-[10px] font-mono text-[10.5px] uppercase tracking-[0.14em]">
              Save more to keep
            </div>
          </div>
        </section>
      )}

      {tab === "read" && (
        <section className="shell pt-6">
          {STORIES.slice(0, 5).map((s, i) => (
            <div
              className="grid grid-cols-[48px_80px_1fr_auto_auto] items-center gap-[18px] border-line border-b py-[18px] max-[640px]:grid-cols-[40px_64px_1fr]"
              key={s.id}
            >
              <div className="font-display font-medium text-[28px] text-vermilion leading-none">
                {String(i + 1).padStart(2, "0")}
              </div>
              <CoverImage
                alt={s.title}
                className="aspect-square max-[640px]:size-16"
                gradient={s.img}
                id={s.id}
                kind="stories"
                sizes="80px"
              />
              <div>
                <div className="font-display text-[18px] leading-[1.2]">
                  {s.title}
                </div>
                <div className="mt-[3px] font-mono text-[10px] text-muted uppercase tracking-[0.16em]">
                  {s.cat} · completed · {s.date}
                </div>
              </div>
              <div className="flex items-center gap-[6px] font-mono text-[11px] text-vermilion tracking-[0.12em] max-[640px]:hidden">
                <IconDrop size={14} /> +10 NUT
              </div>
              <div className="font-mono text-[10.5px] text-ink uppercase tracking-[0.16em] max-[640px]:hidden">
                Re-open →
              </div>
            </div>
          ))}
        </section>
      )}

      {tab === "items" && (
        <section className="shell grid grid-cols-2 items-center gap-[60px] pt-12 max-[860px]:grid-cols-1 max-[860px]:gap-10">
          <div className="text-center">
            <Plant level={2} size={260} />
          </div>
          <div>
            <div className="font-mono text-[11px] text-vermilion uppercase tracking-[0.22em]">
              No items earned yet · 未獲得
            </div>
            <div className="mt-[10px] font-display font-medium text-[40px] leading-[1.05] tracking-[-0.015em]">
              Your first seedling
              <br />
              is still growing<span className="text-vermilion">.</span>
            </div>
            <div className="mt-[10px] max-w-[400px] font-display text-[16px] text-muted italic leading-[1.55]">
              Fully grown items appear here once you redeem them. Until then,
              keep tending.
            </div>
            <button
              className="mt-[22px] bg-ink px-[22px] py-3 font-mono text-[11px] text-cream uppercase tracking-[0.18em]"
              type="button"
            >
              View seedling →
            </button>
          </div>
        </section>
      )}

      {tab === "activity" && (
        <section className="shell pt-9">
          <div className="grid grid-cols-7 gap-[3px]">
            {Array.from({ length: HEATMAP_ROWS * HEATMAP_COLS }).map((_, i) => {
              const row = Math.floor(i / HEATMAP_COLS);
              const col = i % HEATMAP_COLS;
              const v = (i * 13 + 7) % 10;
              return (
                <div
                  className="aspect-square bg-vermilion"
                  key={`${row}-${col}`}
                  style={{ opacity: heatOpacity(v) }}
                />
              );
            })}
          </div>
          <div className="mt-4 flex justify-between font-mono text-[10.5px] text-muted uppercase tracking-[0.14em]">
            <span>8 weeks · 56 days</span>
            <span>
              fewer · <span className="text-vermilion">■</span>
              <span className="text-vermilion opacity-70">■</span>
              <span className="text-vermilion opacity-40">■</span>
              <span className="text-vermilion opacity-[0.15]">■</span> · more
            </span>
          </div>
        </section>
      )}

      <div className="h-20" />
    </div>
  );
}
