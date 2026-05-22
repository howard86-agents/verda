import Link from "next/link";
import { Eyebrow } from "@/_components/eyebrow";
import { Plant } from "@/_components/plant";

/**
 * Public `/about` page (issue #94).
 *
 * Three-section editorial layout, bilingual where the established voice
 * uses pairs (English headings + JP italic subtitle) — mission, the
 * seedling/nutrients explainer, and an editorial note.
 */
export default function AboutPage() {
  return (
    <div className="bg-cream text-ink">
      <div className="shell">
        {/* Title */}
        <section className="pt-12">
          <Eyebrow en="About · 故事中心" jp="ヴェルダについて" />
          <h1 className="mt-[14px] font-display font-medium text-[72px] leading-none tracking-[-0.02em] max-[640px]:text-[48px]">
            Stories that
            <br />
            nourish<span className="text-vermilion">.</span>
          </h1>
          <p className="mt-[18px] max-w-[640px] font-display text-[18px] text-ink-soft leading-[1.6]">
            Verda is a slow-reading, slow-living quarterly published as a
            bilingual web magazine. We collect editorial essays, reader
            submissions, and seasonal field notes from a small editorial desk in
            Taipei.
          </p>
        </section>

        {/* Mission */}
        <section className="grid grid-cols-[1fr_360px] gap-12 pt-14 max-[900px]:grid-cols-1">
          <div>
            <div className="font-mono text-[10.5px] text-ink uppercase tracking-[0.22em]">
              Mission · 使命
            </div>
            <h2 className="mt-2 font-display font-medium text-[36px] leading-[1.1] tracking-[-0.01em]">
              Read once, with care
              <span className="text-vermilion">.</span>
            </h2>
            <div className="mt-4 grid gap-5 font-display text-[16.5px] text-ink-soft leading-[1.65]">
              <p>
                We believe a small library, kept close, beats an endless feed.
                Verda's editorial voice is bilingual on purpose — Mindful
                Living, Nutrition, Movement, Earth &amp; Garden, and Recipes are
                all approached as quiet practices, returned to weekly rather
                than consumed once.
              </p>
              <p>
                Stories are short by default. Reader submissions sit alongside
                editorial features under the same chrome, with attribution that
                stays visible. The magazine is funded directly by our members —
                no advertising, no behavioural targeting.
              </p>
            </div>
          </div>
          <aside className="border border-ink bg-paper p-6 font-mono text-[10.5px] text-muted uppercase tracking-[0.18em]">
            <div className="text-ink">Editorial principles</div>
            <ul className="mt-4 grid list-disc gap-3 pl-5 normal-case tracking-[0.04em]">
              <li>Short, finishable pieces over endless feeds.</li>
              <li>
                Attribution stays visible — for editors and readers alike.
              </li>
              <li>Bilingual where the voice asks for it; never as ornament.</li>
              <li>No advertising. No behavioural targeting.</li>
            </ul>
          </aside>
        </section>

        {/* How the seedling model works */}
        <section className="grid grid-cols-[1.2fr_1fr] gap-12 pt-16 max-[900px]:grid-cols-1">
          <div>
            <div className="font-mono text-[10.5px] text-ink uppercase tracking-[0.22em]">
              How growth works · 育成のしくみ
            </div>
            <h2 className="mt-2 font-display font-medium text-[36px] leading-[1.1] tracking-[-0.01em]">
              A seedling, one nutrient at a time
              <span className="text-vermilion">.</span>
            </h2>
            <div className="mt-4 grid gap-5 font-display text-[16.5px] text-ink-soft leading-[1.65]">
              <p>
                Reading a story to the end earns nutrients. Nutrients feed a
                seedling — yours — that grows from{" "}
                <em className="text-ink not-italic">Seed</em> to{" "}
                <em className="text-ink not-italic">Sprout</em>, then{" "}
                <em className="text-ink not-italic">Bloom</em>, then{" "}
                <em className="text-ink not-italic">Fully grown</em>. A
                fully-grown seedling can be redeemed; the next one starts from
                any leftover.
              </p>
              <p>
                You can hold a small collection at once — three growth slots per
                member by default — so progress isn't lost when one plant
                matures. Daily check-ins, finishing reads, and saving stories
                all add nutrients, and a maintained streak adds a little more on
                top.
              </p>
              <p>
                The model is editable from the CMS, by design: editors tune
                point values, growth thresholds, and the collection cap as the
                year evolves.
              </p>
            </div>
            <ol className="mt-6 grid grid-cols-2 gap-4 max-[640px]:grid-cols-1">
              <li className="border border-line bg-paper p-4">
                <div className="font-mono text-[10px] text-vermilion uppercase tracking-[0.18em]">
                  01 · Read
                </div>
                <p className="mt-2 font-display text-[14.5px] text-ink-soft leading-[1.5]">
                  Finish a story. Earn nutrients via the configured reward rule
                  (default <strong>+10</strong>).
                </p>
              </li>
              <li className="border border-line bg-paper p-4">
                <div className="font-mono text-[10px] text-vermilion uppercase tracking-[0.18em]">
                  02 · Grow
                </div>
                <p className="mt-2 font-display text-[14.5px] text-ink-soft leading-[1.5]">
                  Nutrients land on your active seedling, walk it through Seed →
                  Sprout → Bloom → Fully grown.
                </p>
              </li>
              <li className="border border-line bg-paper p-4">
                <div className="font-mono text-[10px] text-vermilion uppercase tracking-[0.18em]">
                  03 · Collect
                </div>
                <p className="mt-2 font-display text-[14.5px] text-ink-soft leading-[1.5]">
                  Hold up to three plants at once. Overflow seeds the next one —
                  progress stays, nothing resets.
                </p>
              </li>
              <li className="border border-line bg-paper p-4">
                <div className="font-mono text-[10px] text-vermilion uppercase tracking-[0.18em]">
                  04 · Redeem
                </div>
                <p className="mt-2 font-display text-[14.5px] text-ink-soft leading-[1.5]">
                  A fully-grown plant becomes redeemable. The reward is
                  recorded; the plant stays in your collection.
                </p>
              </li>
            </ol>
            <div className="mt-7 flex items-center gap-4 border-line border-t pt-5">
              <Link
                className="border border-ink bg-ink px-[22px] py-3 font-mono text-[11px] text-cream uppercase tracking-[0.18em]"
                href="/grow"
              >
                Open your seedling · 育成中 →
              </Link>
              <span className="font-mono text-[10.5px] text-muted uppercase tracking-[0.14em]">
                Sign in to collect nutrients.
              </span>
            </div>
          </div>
          <aside className="flex flex-col items-center justify-center gap-3 border-vermilion border-l-4 bg-ink p-7 text-cream">
            <div className="font-mono text-[10px] uppercase tracking-[0.22em] opacity-70">
              Yours · あなたの一鉢
            </div>
            <Plant level={2} size={140} />
            <div className="text-center font-display font-medium text-[22px] leading-[1.2]">
              Lv 02 · Sprout
            </div>
            <div className="text-center font-display text-[14px] text-cream/70 italic">
              次の節目へ — Bloom
            </div>
            <div className="mt-3 grid w-full grid-cols-3 gap-2 font-mono text-[9.5px] uppercase tracking-[0.14em] opacity-80">
              <div className="border border-cream/30 px-2 py-1 text-center">
                Seed
              </div>
              <div className="border border-vermilion bg-vermilion px-2 py-1 text-center text-cream">
                Sprout
              </div>
              <div className="border border-cream/30 px-2 py-1 text-center">
                Bloom
              </div>
            </div>
          </aside>
        </section>

        {/* Editorial note */}
        <section className="grid grid-cols-[1fr_2fr] gap-12 pt-16 max-[900px]:grid-cols-1">
          <div>
            <div className="font-mono text-[10.5px] text-ink uppercase tracking-[0.22em]">
              From the editor · 編集後記
            </div>
            <div className="mt-2 font-display text-[20px] text-muted italic">
              May 2026, Vol.14
            </div>
          </div>
          <div>
            <blockquote className="border-vermilion border-l-4 pl-6 font-display text-[20px] text-ink leading-[1.55]">
              <p>
                We started Verda quietly, with a paper notebook and a single
                editorial principle: stories that finish. A year later the
                community we hoped for showed up — readers who write back, send
                us a Sunday recipe, photograph the pop-up garden behind their
                stationery shop. Thank you for staying.
              </p>
              <footer className="mt-4 font-mono text-[10.5px] text-muted uppercase not-italic tracking-[0.18em]">
                — Lin K., editor in chief
              </footer>
            </blockquote>
          </div>
        </section>

        <div className="h-20" />
      </div>
    </div>
  );
}
