import type { GrowthLevel } from "@verda/data";
import { GROWTH_LEVELS, LEDGER } from "@verda/data";
import { Eyebrow } from "@/_components/eyebrow";
import { IconDrop } from "@/_components/glyphs";
import { Plant } from "@/_components/plant";

const CORNERS = [
  { pos: "top-[8px] left-[8px]", border: "border-t border-l" },
  { pos: "top-[8px] right-[8px]", border: "border-t border-r" },
  { pos: "bottom-[8px] left-[8px]", border: "border-b border-l" },
  { pos: "bottom-[8px] right-[8px]", border: "border-b border-r" },
] as const;

function pipClass(p: GrowthLevel) {
  if (p.current) {
    return "border-ink bg-ink text-cream";
  }
  const tone = p.done ? "text-ink" : "text-muted";
  return `border-line bg-paper ${tone}`;
}

export default function Page() {
  return (
    <div className="bg-cream text-ink">
      <section className="shell pt-10">
        <Eyebrow en="Your seedling · 育成中" jp="栄養を集めて育てよう" />
        <div className="mt-[14px] flex items-baseline justify-between max-[560px]:flex-col max-[560px]:items-start max-[560px]:gap-2">
          <h1 className="font-display font-medium text-[56px] leading-none tracking-[-0.02em] max-[560px]:text-[40px]">
            Sprout<span className="text-vermilion">.</span>
          </h1>
          <div className="font-display text-[22px] text-muted italic">
            芽 — Lv 02 · started 21 Mar
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
            Lv 02 · Sprout
          </div>
          {/* Circle backdrop + plant */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className="relative size-[340px]">
              <div className="absolute inset-0 rounded-full bg-paper-alt" />
              <div className="absolute inset-0 flex items-center justify-center">
                <Plant level={2} size={300} />
              </div>
            </div>
            <div className="mt-[18px] font-mono text-[10px] text-muted uppercase tracking-[0.18em]">
              Grown by 4 stories &amp; 12 check-ins
            </div>
          </div>
          {/* Tick marks at corners */}
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
                  Next · 開花
                </div>
                <div className="mt-1 font-display font-medium text-[28px]">
                  Bloom
                  <span className="text-[18px] text-muted italic"> · 花</span>
                </div>
              </div>
              <div className="font-display font-medium text-[44px]">
                <span className="text-vermilion">87</span>
                <span className="text-[28px] text-muted italic"> / 150</span>
              </div>
            </div>
            <div className="relative mt-[14px] h-[8px] bg-line">
              <div className="h-full w-[58%] bg-vermilion" />
            </div>

            {/* Level pips */}
            <div className="mt-[18px] grid grid-cols-4 gap-[8px]">
              {GROWTH_LEVELS.map((p) => (
                <div
                  className={`border px-[10px] py-[14px] text-center ${pipClass(p)}`}
                  key={p.n}
                >
                  <div className="font-mono text-[9.5px] tracking-[0.18em] opacity-75">
                    LV {String(p.n).padStart(2, "0")}
                  </div>
                  <div
                    className={`mt-1 font-display text-[16px] ${p.current ? "font-medium" : "font-normal"}`}
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
              <div className="font-mono text-[11px] text-ink uppercase tracking-[0.18em]">
                Full ledger →
              </div>
            </div>
            {LEDGER.map((r) => (
              <div
                className="grid grid-cols-[70px_1fr_auto] items-center gap-[14px] border-line border-b py-[14px]"
                key={`${r.amt}-${r.why}-${r.when}`}
              >
                <div className="flex items-center gap-[6px] font-display font-medium text-[22px] text-vermilion">
                  <IconDrop size={14} /> {r.amt}
                </div>
                <div className="font-display text-[15px]">{r.why}</div>
                <div className="font-mono text-[10.5px] text-muted uppercase tracking-[0.1em]">
                  {r.when}
                </div>
              </div>
            ))}
          </div>

          {/* Redemption slab */}
          <div className="mt-8 grid grid-cols-[100px_1fr_auto] items-center gap-[22px] border-vermilion border-l-[4px] bg-ink p-[22px] text-cream max-[560px]:grid-cols-1">
            <div className="flex size-[100px] items-center justify-center bg-vermilion font-display text-[38px] text-cream">
              ★
            </div>
            <div>
              <div className="font-mono text-[10px] uppercase tracking-[0.18em] opacity-70">
                When fully grown · 結実時
              </div>
              <div className="mt-[6px] font-display font-medium text-[24px]">
                Hand-blended seed packet
              </div>
              <div className="mt-[6px] font-mono text-[10.5px] uppercase tracking-[0.1em] opacity-70">
                Redeem at Verda · while supplies last
              </div>
            </div>
            <div className="font-mono text-[11px] uppercase tracking-[0.18em] opacity-85">
              Preview →
            </div>
          </div>
        </div>
      </section>

      <div className="h-20" />
    </div>
  );
}
