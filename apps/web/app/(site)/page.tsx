import { SOCIAL, STORIES } from "@verda/data";
import Link from "next/link";
import { CoverImage } from "@/_components/cover-image";
import { Eyebrow } from "@/_components/eyebrow";
import { IconDrop } from "@/_components/glyphs";
import { Plant } from "@/_components/plant";
import { sectionLabel, seriesPartLabel } from "@/lib/section";

export default function HomePage() {
  return (
    <div className="bg-cream text-ink">
      <div className="shell">
        {/* Hero feature — full width */}
        <section className="pt-9">
          <div className="grid grid-cols-[1.4fr_1fr] gap-10 max-[900px]:grid-cols-1">
            {/* Cover */}
            <div className="hatch relative aspect-[16/11] overflow-hidden border border-line bg-[linear-gradient(160deg,#5a5a4e_0%,#1a1a1a_100%)]">
              <div className="absolute top-0 left-0 z-10 h-24 w-[6px] bg-vermilion" />
              <div className="absolute bottom-4 left-[18px] z-10 font-mono text-[10px] text-white/80 uppercase tracking-[0.18em]">
                cover · pencils on linen
              </div>
            </div>
            {/* Headline column */}
            <div className="flex flex-col justify-between">
              <div>
                <Eyebrow en="This week · feature" jp="今週の一篇" />
                <h1 className="mt-5 font-display font-medium text-[56px] leading-[1.02] tracking-[-0.02em]">
                  Letters to a slower year,
                  <br />
                  written in{" "}
                  <span className="text-vermilion italic">pencil</span>
                  <span className="text-vermilion">.</span>
                </h1>
                <div className="mt-[14px] font-display text-[22px] text-muted italic">
                  鉛筆で綴る、ゆるやかな一年。
                </div>
                <p className="mt-[22px] max-w-[460px] font-display text-[18px] text-ink-soft leading-[1.55]">
                  Three readers, three notebooks, one shared experiment with
                  doing less. An essay in four parts, on writing as a Sunday
                  practice.
                </p>
              </div>
              <div className="mt-[26px] flex items-center gap-5 border-line border-t pt-[18px]">
                <Link
                  className="border border-ink bg-ink px-[22px] py-3 font-mono text-[11px] text-cream uppercase tracking-[0.18em]"
                  href="/stories/quiet-rituals-slower-morning"
                >
                  Read · 読む →
                </Link>
                <div className="font-mono text-[10.5px] text-muted uppercase tracking-[0.14em]">
                  Mindful Living · 12 min · By Lin K.
                </div>
                <div className="ml-auto flex items-center gap-2 font-mono text-[10.5px] text-muted uppercase tracking-[0.12em]">
                  <span className="inline-flex text-vermilion">
                    <IconDrop />
                  </span>
                  +10 on complete
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Main grid */}
        <section className="grid grid-cols-[1fr_360px] gap-12 pt-14 max-[900px]:grid-cols-1">
          {/* Latest stories index */}
          <div>
            <div className="flex items-baseline justify-between border-ink border-b pb-3">
              <div>
                <div className="font-mono text-[10.5px] text-ink uppercase tracking-[0.22em]">
                  Index 01
                </div>
                <div className="mt-1 font-display font-medium text-[32px] tracking-[-0.01em]">
                  Latest stories{" "}
                  <span className="text-[18px] text-muted">最新の物語</span>
                </div>
              </div>
              <Link
                className="font-mono text-[11px] text-ink uppercase tracking-[0.18em]"
                href="/stories"
              >
                See all →
              </Link>
            </div>

            <div className="mt-7 grid grid-cols-3 gap-7 max-[640px]:grid-cols-1">
              {STORIES.slice(0, 3).map((s, i) => (
                <article key={s.id}>
                  <Link href={`/stories/${s.slug}`}>
                    <CoverImage
                      alt={s.title}
                      className="aspect-[4/5]"
                      gradient={s.img}
                      id={s.id}
                      kind="stories"
                      sizes="(max-width: 640px) 100vw, 30vw"
                    />
                    <div className="mt-[14px] grid grid-cols-[38px_1fr] gap-[10px]">
                      <div className="font-display font-medium text-[22px] text-vermilion leading-none">
                        {String(i + 1).padStart(2, "0")}
                      </div>
                      <div>
                        <div className="font-mono text-[9.5px] text-muted uppercase tracking-[0.18em]">
                          {sectionLabel(s)} · {s.read} min · {s.date}
                        </div>
                        <h3 className="mt-[6px] font-display font-medium text-[22px] leading-[1.15] tracking-[-0.005em]">
                          {s.title}
                        </h3>
                        {seriesPartLabel(s.series) && (
                          <div className="mt-[3px] font-mono text-[9px] text-vermilion uppercase tracking-[0.16em]">
                            {seriesPartLabel(s.series)}
                          </div>
                        )}
                        <div className="mt-1 font-display text-[13px] text-muted italic">
                          {s.jp}
                        </div>
                        <p className="mt-2 font-display text-[14px] text-ink-soft leading-[1.5]">
                          {s.sum}
                        </p>
                      </div>
                    </div>
                  </Link>
                </article>
              ))}
            </div>

            {/* Second row — 3 more */}
            <div className="mt-9 grid grid-cols-3 gap-7 border-line border-t pt-7 max-[640px]:grid-cols-1">
              {STORIES.slice(3, 6).map((s, i) => (
                <article
                  className="grid grid-cols-[38px_1fr] gap-[10px]"
                  key={s.id}
                >
                  <div className="font-display font-medium text-[22px] text-vermilion leading-none">
                    {String(i + 4).padStart(2, "0")}
                  </div>
                  <div>
                    <div className="font-mono text-[9.5px] text-muted uppercase tracking-[0.18em]">
                      {sectionLabel(s)} · {s.read} min
                    </div>
                    <h3 className="mt-1 font-display font-medium text-[18px] leading-[1.18]">
                      <Link href={`/stories/${s.slug}`}>{s.title}</Link>
                    </h3>
                    <div className="mt-[3px] font-display text-[12px] text-muted italic">
                      {s.jp}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>

          {/* Sidebar */}
          <aside className="flex flex-col gap-8">
            {/* Growable */}
            <div className="border border-ink bg-paper p-[22px]">
              <div className="font-mono text-[10.5px] text-ink uppercase tracking-[0.22em]">
                Your seedling · 育成中
              </div>
              <div className="mt-[14px] grid grid-cols-[90px_1fr] items-center gap-[14px]">
                <Plant level={2} size={80} />
                <div>
                  <div className="font-display font-medium text-[22px] leading-[1.1]">
                    63 to <em className="text-vermilion italic">Bloom</em>
                  </div>
                  <div className="mt-[2px] font-display text-[13px] text-muted italic">
                    開花まで
                  </div>
                </div>
              </div>
              <div className="mt-4 h-[3px] bg-line">
                <div className="h-full w-[58%] bg-vermilion" />
              </div>
              <div className="mt-2 flex justify-between font-mono text-[10px] text-muted uppercase tracking-[0.1em]">
                <span>87 / 150</span>
                <span>Lv 02 · Sprout</span>
              </div>
              <div className="mt-[14px] flex justify-between border-line border-t pt-3 font-mono text-[11px] text-ink uppercase tracking-[0.16em]">
                <span>Open seedling</span>
                <span className="text-vermilion">→</span>
              </div>
            </div>

            {/* Reader submissions */}
            <div>
              <div className="flex items-baseline justify-between border-ink border-b pb-[10px]">
                <div>
                  <div className="font-mono text-[10.5px] text-ink uppercase tracking-[0.22em]">
                    Index 02
                  </div>
                  <div className="mt-[3px] font-display font-medium text-[22px] tracking-[-0.005em]">
                    From readers
                  </div>
                </div>
                <div className="font-mono text-[10px] text-ink uppercase tracking-[0.16em]">
                  Browse →
                </div>
              </div>
              {SOCIAL.slice(0, 3).map((r) => (
                <article
                  className="grid grid-cols-[56px_1fr] items-center gap-3 border-line border-b py-3"
                  key={r.id}
                >
                  <CoverImage
                    alt={r.title}
                    className="aspect-square"
                    gradient={r.img}
                    id={r.id}
                    kind="social"
                    sizes="56px"
                  />
                  <div className="min-w-0">
                    <div className="font-mono text-[9px] text-vermilion uppercase tracking-[0.14em]">
                      {r.kind}
                    </div>
                    <div className="mt-[3px] line-clamp-2 font-display text-[14px] leading-[1.18]">
                      {r.title}
                    </div>
                    <div className="mt-1 font-mono text-[10px] text-muted tracking-[0.04em]">
                      {r.src} · {r.date}
                    </div>
                  </div>
                </article>
              ))}
            </div>

            {/* Editor's picks ribbon */}
            <div className="border-vermilion border-l-4 bg-ink p-[22px] text-cream">
              <div className="font-mono text-[10px] uppercase tracking-[0.22em] opacity-70">
                Editor&apos;s pick · 編集者の選択
              </div>
              <div className="mt-[6px] font-display font-medium text-[20px] leading-[1.2]">
                The May reading list, in 7 essays.
              </div>
              <div className="mt-[14px] font-mono text-[10px] text-cream uppercase tracking-[0.18em] opacity-85">
                Open collection →
              </div>
            </div>
          </aside>
        </section>

        <div className="h-[60px]" />
      </div>
    </div>
  );
}
