"use client";

import { useQuery } from "@tanstack/react-query";
import type { GrowthLevel } from "@verda/data";
import { GROWTH_LEVELS } from "@verda/data";
import { AuthGate } from "@/_components/auth-gate";
import { CheckInButton } from "@/_components/check-in-button";
import { Eyebrow } from "@/_components/eyebrow";
import { IconDrop } from "@/_components/glyphs";
import { Plant } from "@/_components/plant";
import { useAuth } from "@/lib/auth";
import { db } from "@/lib/db";

const CORNERS = [
  { pos: "top-[8px] left-[8px]", border: "border-t border-l" },
  { pos: "top-[8px] right-[8px]", border: "border-t border-r" },
  { pos: "bottom-[8px] left-[8px]", border: "border-b border-l" },
  { pos: "bottom-[8px] right-[8px]", border: "border-b border-r" },
] as const;

function pipClass(p: GrowthLevel, currentLevel: number) {
  if (p.n === currentLevel) {
    return "border-ink bg-ink text-cream";
  }
  const done = p.n < currentLevel;
  const tone = done ? "text-ink" : "text-muted";
  return `border-line bg-paper ${tone}`;
}

export default function Page() {
  const { member } = useAuth();

  const { data: growth } = useQuery({
    queryKey: ["growth", member?.id],
    enabled: !!member,
    queryFn: async () => {
      const id = member?.id ?? "";
      const item = await db.growthItems.where("memberId").equals(id).first();
      return item ?? { level: 1, nutrients: 0 };
    },
  });

  const { data: ledger } = useQuery({
    queryKey: ["ledger", member?.id],
    enabled: !!member,
    queryFn: async () => {
      const id = member?.id ?? "";
      return db.pointLedger
        .where("memberId")
        .equals(id)
        .reverse()
        .limit(5)
        .toArray();
    },
  });

  const level = growth?.level ?? 1;
  const nutrients = growth?.nutrients ?? 0;
  const currentLevelData = GROWTH_LEVELS.find((g) => g.n === level);
  const nextLevel = GROWTH_LEVELS.find((g) => g.n === level + 1);
  const nextThreshold = nextLevel?.threshold ?? 300;
  const progressPct =
    nextThreshold > 0 ? Math.min((nutrients / nextThreshold) * 100, 100) : 100;

  return (
    <AuthGate>
      <div className="bg-cream text-ink">
        <section className="shell pt-10">
          <Eyebrow en="Your seedling · 育成中" jp="栄養を集めて育てよう" />
          <div className="mt-[14px] flex items-baseline justify-between max-[560px]:flex-col max-[560px]:items-start max-[560px]:gap-2">
            <h1 className="font-display font-medium text-[56px] leading-none tracking-[-0.02em] max-[560px]:text-[40px]">
              {currentLevelData?.name ?? "Seed"}
              <span className="text-vermilion">.</span>
            </h1>
            <div className="flex items-center gap-4">
              <div className="font-display text-[22px] text-muted italic">
                {currentLevelData?.jp ?? "種"} — Lv{" "}
                {String(level).padStart(2, "0")}
              </div>
              <CheckInButton />
            </div>
          </div>
        </section>

        <section className="shell grid grid-cols-[1fr_1.1fr] gap-12 pt-9 max-[860px]:grid-cols-1">
          {/* Plant card */}
          <div className="relative aspect-[4/4.2] overflow-hidden border border-ink bg-paper p-8">
            <div className="absolute top-[18px] left-[22px] font-mono text-[10px] text-muted uppercase tracking-[0.22em]">
              Plant 01 · 第一株
            </div>
            <div className="absolute top-[18px] right-[22px] font-mono text-[10px] text-vermilion uppercase tracking-[0.22em]">
              Lv {String(level).padStart(2, "0")} ·{" "}
              {currentLevelData?.name ?? "Seed"}
            </div>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <div className="relative size-[340px]">
                <div className="absolute inset-0 rounded-full bg-paper-alt" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <Plant level={level} size={300} />
                </div>
              </div>
            </div>
            {CORNERS.map((corner) => (
              <div
                className={`absolute size-[10px] border-ink ${corner.pos} ${corner.border}`}
                key={corner.pos}
              />
            ))}
          </div>

          {/* Right column */}
          <div>
            {/* Progress */}
            <div>
              <div className="flex items-baseline justify-between border-ink border-b pb-3">
                <div>
                  <div className="font-mono text-[10.5px] text-ink uppercase tracking-[0.22em]">
                    Next · {nextLevel?.jp ?? "—"}
                  </div>
                  <div className="mt-1 font-display font-medium text-[28px]">
                    {nextLevel?.name ?? "Max"}
                    <span className="text-[18px] text-muted italic">
                      {" "}
                      · {nextLevel?.jp ?? ""}
                    </span>
                  </div>
                </div>
                <div className="font-display font-medium text-[44px]">
                  <span className="text-vermilion">{nutrients}</span>
                  <span className="text-[28px] text-muted italic">
                    {" "}
                    / {nextThreshold}
                  </span>
                </div>
              </div>
              <div className="relative mt-[14px] h-[8px] bg-line">
                <div
                  className="h-full bg-vermilion"
                  style={{ width: `${progressPct}%` }}
                />
              </div>

              {/* Level pips */}
              <div className="mt-[18px] grid grid-cols-4 gap-[8px]">
                {GROWTH_LEVELS.map((p) => (
                  <div
                    className={`border px-[10px] py-[14px] text-center ${pipClass(p, level)}`}
                    key={p.n}
                  >
                    <div className="font-mono text-[9.5px] tracking-[0.18em] opacity-75">
                      LV {String(p.n).padStart(2, "0")}
                    </div>
                    <div
                      className={`mt-1 font-display text-[16px] ${p.n === level ? "font-medium" : "font-normal"}`}
                    >
                      {p.name}
                    </div>
                    <div className="mt-px font-display text-[12px] italic opacity-60">
                      {p.jp}
                    </div>
                    <div className="mt-[6px] font-mono text-[10px] opacity-70">
                      {p.threshold} NUT
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Ledger */}
            <div className="mt-9">
              <div className="flex items-baseline justify-between border-ink border-b pb-3">
                <div>
                  <div className="font-mono text-[10.5px] text-ink uppercase tracking-[0.22em]">
                    Nutrient ledger
                  </div>
                  <div className="mt-[3px] font-display text-[22px] text-muted italic">
                    滋養の記録
                  </div>
                </div>
              </div>
              {(ledger ?? []).length === 0 && (
                <div className="py-8 text-center font-mono text-[11px] text-muted uppercase tracking-[0.14em]">
                  No entries yet. Read a story to earn nutrients.
                </div>
              )}
              {(ledger ?? []).map((r) => (
                <div
                  className="grid grid-cols-[70px_1fr_auto] items-center gap-[14px] border-line border-b py-[14px]"
                  key={r.id}
                >
                  <div className="flex items-center gap-[6px] font-display font-medium text-[22px] text-vermilion">
                    <IconDrop size={14} /> +{r.amount}
                  </div>
                  <div className="font-display text-[15px]">{r.reason}</div>
                  <div className="font-mono text-[10.5px] text-muted uppercase tracking-[0.1em]">
                    {new Date(r.createdAt).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <div className="h-20" />
      </div>
    </AuthGate>
  );
}
