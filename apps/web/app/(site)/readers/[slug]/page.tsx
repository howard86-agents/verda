import { SOCIAL } from "@verda/data";
import { notFound } from "next/navigation";
import { CoverImage } from "@/_components/cover-image";
import { IconExternal } from "@/_components/glyphs";

interface Contributor {
  c: string;
  color: string;
  what: string;
}

const CONTRIBUTORS: Contributor[] = [
  { c: "@maya.cooks", what: "turmeric porridge note", color: "#c87a3a" },
  { c: "@a.field", what: "two morning walks", color: "#4a6b48" },
  { c: "@yu.papers", what: "three handwritten cards", color: "#9a4a68" },
];

interface Section {
  body: string;
  c: string;
  color: string;
  what: string;
  when: string;
}

const SECTIONS: Section[] = [
  {
    c: "@maya.cooks",
    what: "turmeric porridge note",
    when: "18 Apr",
    color: "#c87a3a",
    body: "My mother boiled the turmeric for twenty-three minutes. I asked her once why twenty-three; she said she had stopped counting and the kitchen timer was broken. The number stayed.",
  },
  {
    c: "@a.field",
    what: "two morning walks",
    when: "02 May",
    color: "#4a6b48",
    body: "One walk in the rain, one in light fog. The fog was preferable. The rain made me feel like I was performing a discipline; the fog made me feel like I was inside a slow room.",
  },
  {
    c: "@yu.papers",
    what: "three handwritten cards",
    when: "11 May",
    color: "#9a4a68",
    body: "I wrote three cards I will never send. One to a sister who is fine. One to a friend who would not understand it. One to a version of myself I am no longer in conversation with.",
  },
];

export function generateStaticParams() {
  return SOCIAL.map((r) => ({ slug: r.slug }));
}

export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const item = SOCIAL.find((r) => r.slug === slug);
  if (!item) {
    notFound();
  }

  const more = SOCIAL.slice(0, 2);

  return (
    <div className="bg-paper text-ink">
      {/* progress */}
      <div className="h-[2px] bg-line">
        <div className="h-full w-[34%] bg-vermilion" />
      </div>

      {/* Issue strip */}
      <div className="flex items-center justify-between border-ink border-b px-10 py-3 font-mono text-[10.5px] text-ink uppercase tracking-[0.22em] max-[820px]:px-5">
        <span>Vol.14 — From readers № 03</span>
        <span className="text-vermilion">REMIX · 編集再構成</span>
        <span>8 MIN</span>
      </div>

      {/* Attribution slab */}
      <section className="shell pt-6">
        <div className="grid grid-cols-[auto_1fr_auto] items-center gap-[22px] border border-ink border-l-[4px] border-l-vermilion bg-paper-alt p-[18px] max-[700px]:grid-cols-1 max-[700px]:gap-4">
          <div
            className="flex size-[56px] items-center justify-center font-display font-medium text-[22px] text-white"
            style={{ background: "linear-gradient(135deg, #e9c4d0, #9a4a68)" }}
          >
            SH
          </div>
          <div>
            <div className="font-mono text-[10px] text-muted uppercase tracking-[0.22em]">
              Originally by · 原典
            </div>
            <div className="mt-1 font-display font-medium text-[19px]">
              <span>Studio H </span>
              <span className="text-[16px] text-muted italic">· @studioh</span>
            </div>
            <div className="mt-[6px] flex items-center gap-[14px] font-mono text-[10.5px] text-ink tracking-[0.08em] max-[700px]:flex-wrap">
              <span className="inline-flex items-center gap-[6px]">
                <IconExternal size={13} /> studioh.tw/field-notes
              </span>
              <span className="text-muted">·</span>
              <span className="text-vermilion">
                Used with permission · CC BY-NC 4.0
              </span>
            </div>
          </div>
          <div className="text-right max-[700px]:text-left">
            <div className="font-mono text-[10px] text-muted uppercase tracking-[0.18em]">
              {item.src}
            </div>
            <div className="mt-[6px] inline-block bg-vermilion px-[10px] py-1 font-mono text-[10px] text-cream uppercase tracking-[0.18em]">
              {item.kind}
            </div>
          </div>
        </div>
      </section>

      {/* Cover */}
      <section className="shell pt-7">
        <div className="relative aspect-[21/9] overflow-hidden border border-line">
          <CoverImage
            alt={item.title}
            className="absolute inset-0 size-full"
            gradient="linear-gradient(160deg, #c8d8c4 0%, #4a6b48 100%)"
            id={item.id}
            kind="social"
            priority
            sizes="100vw"
          />
          <div className="absolute top-0 left-0 z-10 h-[120px] w-[6px] bg-vermilion" />
          <div className="absolute bottom-[18px] left-[22px] z-10 font-mono text-[10px] text-white/[0.78] uppercase tracking-[0.22em]">
            collage · field notes 2024–2026
          </div>
        </div>
      </section>

      {/* Title block */}
      <section className="shell grid grid-cols-[1fr_720px_1fr] gap-10 pt-9 max-[1100px]:grid-cols-1">
        <div className="max-[1100px]:hidden" />
        <div className="max-[1100px]:mx-auto max-[1100px]:max-w-[720px]">
          <h1 className="text-center font-display font-medium text-[58px] leading-[1.02] tracking-[-0.02em] max-[560px]:text-[40px]">
            Field notes — a <span className="text-vermilion italic">remix</span>
            <br />
            of three reader essays
            <span className="text-vermilion">.</span>
          </h1>
          <div className="mt-3 text-center font-display text-[20px] text-muted italic">
            読者三篇のフィールドノート再構成。
          </div>
          <p className="mx-auto mt-[26px] max-w-[600px] text-center font-display text-[17px] text-ink-soft leading-[1.6]">
            Three readers sent us their May field notes. Studio H rearranged
            them into one continuous piece, with the originals lightly edited
            and clearly attributed.
          </p>
        </div>
        <div className="max-[1100px]:hidden" />
      </section>

      {/* Body with attribution sidebar */}
      <section className="shell grid grid-cols-[1fr_720px_1fr] items-start gap-10 pt-11 max-[1100px]:grid-cols-1">
        {/* Left contributors / license sidebar */}
        <div className="sticky top-[100px] max-[1100px]:hidden">
          <div className="mb-3 font-mono text-[10px] text-muted uppercase tracking-[0.22em]">
            Contributors · 寄稿者
          </div>
          {CONTRIBUTORS.map((p) => (
            <div
              className="grid grid-cols-[10px_1fr] items-center gap-[10px] border-line border-t py-[10px]"
              key={p.c}
            >
              <div className="size-[8px]" style={{ background: p.color }} />
              <div>
                <div className="font-display font-medium text-[14px]">
                  {p.c}
                </div>
                <div className="mt-[2px] font-mono text-[10px] text-muted tracking-[0.08em]">
                  {p.what}
                </div>
              </div>
            </div>
          ))}
          <div className="mt-6 border-ink border-t pt-[14px]">
            <div className="font-mono text-[10px] text-muted uppercase tracking-[0.18em]">
              License · 許諾
            </div>
            <div className="mt-[6px] font-display text-[13.5px] text-ink-soft leading-[1.45]">
              All originals used with permission. Reused under{" "}
              <span className="text-vermilion">CC BY-NC 4.0</span>. Contact{" "}
              <em className="text-ink">readers@verda</em> for rights questions.
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="font-display text-[18px] text-ink-soft leading-[1.7] max-[1100px]:mx-auto max-[1100px]:max-w-[720px]">
          <p className="text-[22px] text-ink italic leading-[1.45]">
            What follows is three months of reader notes, stitched together by
            the editorial team without rewriting them.
          </p>

          {SECTIONS.map((sec) => (
            <div
              className="mt-[30px] border-vermilion border-t-[2px] pt-4"
              key={sec.c}
            >
              <div className="flex items-center gap-[10px] font-mono text-[10px] uppercase tracking-[0.2em]">
                <span
                  className="size-[8px]"
                  style={{ background: sec.color }}
                />
                <span className="text-ink">{sec.c}</span>
                <span className="text-muted">
                  · {sec.what} · {sec.when}
                </span>
              </div>
              <p className="mt-[14px]">{sec.body}</p>
            </div>
          ))}

          <div className="mt-9 flex justify-between border-line border-t border-b py-5 font-mono text-[10.5px] text-muted uppercase tracking-[0.18em]">
            <span>End of remix · 終</span>
            <span>Editors: H. Tsai, Studio H · 編集</span>
          </div>
        </div>

        {/* Right sidebar */}
        <div className="sticky top-[100px] max-[1100px]:static max-[1100px]:mx-auto max-[1100px]:max-w-[720px]">
          <div className="border-vermilion border-l-[4px] bg-ink p-5 text-cream">
            <div className="font-mono text-[10px] uppercase tracking-[0.18em] opacity-70">
              Reward · 報酬
            </div>
            <div className="mt-[6px] font-display text-[17px] leading-[1.3]">
              Finish to earn{" "}
              <span style={{ color: "#ffc7c0" }}>+8 nutrients</span>
            </div>
            <div className="mt-[6px] font-mono text-[9.5px] uppercase tracking-[0.12em] opacity-65">
              Lower reward than brand stories · per editorial rule
            </div>
          </div>

          <div className="mt-[22px] border-ink border-t pt-[14px]">
            <div className="mb-3 font-mono text-[10px] text-muted uppercase tracking-[0.18em]">
              More from readers · もっと
            </div>
            {more.map((r) => (
              <div
                className="grid grid-cols-[52px_1fr] gap-[10px] border-line border-b py-[10px]"
                key={r.id}
              >
                <CoverImage
                  alt={r.title}
                  className="aspect-square"
                  gradient={r.img}
                  id={r.id}
                  kind="social"
                  sizes="52px"
                />
                <div>
                  <div className="font-mono text-[9px] text-vermilion uppercase tracking-[0.14em]">
                    {r.kind}
                  </div>
                  <div className="mt-[3px] line-clamp-2 font-display text-[13px] leading-[1.2]">
                    {r.title}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="h-20" />
    </div>
  );
}
