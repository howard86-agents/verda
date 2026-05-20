// CMS · Article editor — rich text + media + side panel for metadata + preview.
// Static render — the contenteditable / cursor bits are decorative.

import type { ReactNode } from "react";
import { CmsShell } from "@/_components/cms-shell";

export function generateStaticParams() {
  return [{ id: "a01" }];
}

interface Version {
  cur?: boolean;
  v: string;
  when: string;
  who: string;
}

const VERSIONS: Version[] = [
  { v: "v3", who: "H. Tsai", when: "today 14:24", cur: true },
  { v: "v2", who: "L. Kim", when: "today 09:11" },
  { v: "v1", who: "L. Kim", when: "yesterday" },
];

function SidePanel({
  title,
  jp,
  children,
}: {
  title: string;
  jp: string;
  children: ReactNode;
}) {
  return (
    <div className="border border-line bg-paper">
      <div className="flex items-baseline gap-2 border-line border-b px-[14px] py-[10px] font-mono text-[10.5px] text-ink uppercase tracking-[0.18em]">
        {title}
        <span className="font-display text-[11px] text-muted normal-case italic tracking-normal">
          {jp}
        </span>
      </div>
      <div className="px-[14px] py-3">{children}</div>
    </div>
  );
}

function FieldRow({ label, v }: { label: string; v: ReactNode }) {
  return (
    <div className="grid grid-cols-[90px_1fr] items-baseline gap-[10px] border-line border-b border-dotted py-2">
      <span className="font-mono text-[9.5px] text-muted uppercase tracking-[0.14em]">
        {label}
      </span>
      <span className="font-sans text-[12.5px] text-ink">{v}</span>
    </div>
  );
}

function Chip({ children }: { children: ReactNode }) {
  return (
    <span className="mr-1 inline-block border border-ink px-2 py-[2px] font-mono text-[10px] tracking-[0.08em]">
      #{children}
    </span>
  );
}

export default async function CmsEditorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await params;

  return (
    <CmsShell
      actions={
        <>
          <button
            className="border border-line bg-paper px-3 py-2 font-mono text-[11px] text-ink uppercase tracking-[0.16em]"
            type="button"
          >
            Preview · Web
          </button>
          <button
            className="border border-line bg-paper px-3 py-2 font-mono text-[11px] text-ink uppercase tracking-[0.16em]"
            type="button"
          >
            Preview · WebView
          </button>
          <button
            className="bg-ink px-[14px] py-2 font-mono text-[11px] text-cream uppercase tracking-[0.16em]"
            type="button"
          >
            Save draft
          </button>
          <button
            className="bg-vermilion px-[14px] py-2 font-mono text-[11px] text-cream uppercase tracking-[0.16em]"
            type="button"
          >
            Publish →
          </button>
        </>
      }
      active="articles"
      breadcrumb="Articles / Editor"
    >
      <section className="grid grid-cols-[1fr_320px] items-start gap-6 px-8 pt-6 max-[1000px]:grid-cols-1 max-[860px]:px-5">
        {/* Editor canvas */}
        <div className="border border-line bg-paper">
          {/* Format toolbar */}
          <div className="flex flex-wrap items-center gap-3 border-line border-b px-[18px] py-[10px] font-mono text-[11px] text-muted uppercase tracking-[0.12em]">
            <span className="text-ink">H1</span>
            <span className="text-ink">H2</span>
            <span>Body</span>
            <span className="h-[14px] w-px bg-line" />
            <span className="font-bold text-ink normal-case">B</span>
            <span className="text-ink normal-case italic">I</span>
            <span className="text-ink normal-case underline">U</span>
            <span className="h-[14px] w-px bg-line" />
            <span className="text-ink">Quote</span>
            <span className="text-ink">List</span>
            <span className="text-ink">Link</span>
            <span className="h-[14px] w-px bg-line" />
            <span className="text-vermilion">+ Image</span>
            <span className="text-vermilion">+ Video</span>
            <span className="text-vermilion">+ Embed</span>
            <span className="ml-auto text-muted tracking-[0.1em]">
              ↺ auto-saved · 14:24
            </span>
          </div>

          {/* Hero / cover slot */}
          <div className="border-line border-b p-[22px]">
            <div className="mb-2 font-mono text-[10px] text-muted uppercase tracking-[0.22em]">
              Cover image · 表紙
            </div>
            <div className="hatch relative aspect-[21/9] overflow-hidden border border-line border-dashed bg-[linear-gradient(160deg,#5a5a4e_0%,#1a1a1a_100%)]">
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
                <div className="font-mono text-[10px] text-white/70 uppercase tracking-[0.22em]">
                  cover_v3.jpg · 4032 × 1728
                </div>
                <div className="flex gap-2">
                  <button
                    className="border border-white/40 bg-white/10 px-3 py-[6px] font-mono text-[10.5px] text-white uppercase tracking-[0.14em]"
                    type="button"
                  >
                    Replace
                  </button>
                  <button
                    className="border border-white/25 bg-white/[0.06] px-3 py-[6px] font-mono text-[10.5px] text-white uppercase tracking-[0.14em]"
                    type="button"
                  >
                    Focal point
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Title field */}
          <div className="border-line border-b p-[22px]">
            <div className="mb-2 font-mono text-[10px] text-muted uppercase tracking-[0.22em]">
              Title · タイトル <span className="ml-1 text-vermilion">*</span>
            </div>
            <h1 className="m-0 border-vermilion border-b-2 py-1 font-display font-medium text-[38px] leading-[1.06] tracking-[-0.015em]">
              Letters to a slower year, written in{" "}
              <span className="text-vermilion italic">pencil</span>
              <span className="ml-1 inline-block h-[32px] w-[2px] bg-vermilion align-middle" />
            </h1>
            <div className="mt-2 font-display text-[16px] text-muted italic">
              鉛筆で綴る、ゆるやかな一年。
            </div>
          </div>

          {/* Body editor */}
          <div className="p-6 font-display text-[17px] text-ink-soft leading-[1.65]">
            <p className="m-0 text-[20px] text-ink italic leading-[1.45]">
              On a Sunday in February, three of us agreed to write one letter a
              week — by hand, in pencil, to nobody in particular.
            </p>
            <p className="mt-4">
              We didn&apos;t tell each other what to write. We didn&apos;t set a
              topic. The pencils we chose were ordinary — the kind you find in a
              desk drawer that you didn&apos;t know you had.
            </p>

            {/* Inline embedded image block — selected */}
            <div className="relative -mx-2 my-[18px] border-2 border-vermilion p-2">
              <div className="absolute -top-3 left-2 bg-vermilion px-2 py-[2px] font-mono text-[9.5px] text-cream uppercase tracking-[0.14em]">
                Image block · selected
              </div>
              <div className="hatch relative aspect-[3/2] overflow-hidden bg-[linear-gradient(135deg,#efd9b5,#c2603a)]" />
              <div className="flex items-center gap-[10px] px-1 pt-[10px] font-mono text-[10.5px] text-muted uppercase tracking-[0.12em]">
                <label className="text-ink" htmlFor="alt-text">
                  Alt
                </label>
                <input
                  className="flex-1 border border-line bg-white px-2 py-1 font-sans text-[12px] text-ink"
                  defaultValue="Three pencils, three notebooks."
                  id="alt-text"
                />
                <span>Fig. 01 ↑↓ delete</span>
              </div>
            </div>

            <p className="mt-4">
              The first week, I noticed how much I press into the paper.
            </p>

            {/* Block insertion hint */}
            <div className="my-3 flex items-center gap-[10px] border border-line border-dashed px-[14px] py-3 font-mono text-[11px] text-muted uppercase tracking-[0.12em]">
              <span className="flex size-[22px] items-center justify-center border border-muted">
                +
              </span>
              Type / for blocks · 画像・動画・引用
            </div>
          </div>
        </div>

        {/* Side panel */}
        <aside className="flex flex-col gap-4">
          <SidePanel jp="状態" title="Status">
            <div className="flex items-center justify-between font-mono text-[11px] text-ink tracking-[0.14em]">
              <span className="flex items-center gap-2">
                <span className="size-2 bg-muted" />
                DRAFT v3
              </span>
              <span className="text-muted">↺ 14:24</span>
            </div>
            <div className="mt-3 bg-paper-alt px-3 py-[10px] font-mono text-[10.5px] text-ink tracking-[0.06em]">
              <div className="mb-1 font-mono text-[9.5px] text-muted uppercase tracking-[0.18em]">
                Schedule · 公開予定
              </div>
              Tuesday, 21 May 2026 · 08:00 JST
              <div className="mt-1 text-[10.5px] text-vermilion tracking-[0.06em]">
                Change schedule →
              </div>
            </div>
          </SidePanel>

          <SidePanel jp="分類" title="Classification">
            <FieldRow label="CATEGORY" v="Mindful Living" />
            <FieldRow
              label="TAGS"
              v={
                <span>
                  <Chip>morning</Chip> <Chip>sundays</Chip> <Chip>letters</Chip>
                  <span className="ml-[6px] font-mono text-[10.5px] text-vermilion uppercase tracking-[0.12em]">
                    + add
                  </span>
                </span>
              }
            />
            <FieldRow label="AUTHOR" v="Lin K." />
          </SidePanel>

          <SidePanel jp="報酬" title="Reward">
            <FieldRow
              label="ON COMPLETE"
              v={<span className="text-vermilion">+10 nutrients</span>}
            />
            <FieldRow
              label="ON SAVE"
              v={<span className="text-vermilion">+2 nutrients</span>}
            />
            <FieldRow label="LIMIT" v="Once per member" />
          </SidePanel>

          <SidePanel jp="履歴" title="Versions">
            {VERSIONS.map((h) => (
              <div
                className={`grid grid-cols-[30px_1fr_auto] gap-[6px] border-line border-b py-[7px] font-mono text-[10.5px] tracking-[0.06em] ${
                  h.cur ? "text-ink" : "text-muted"
                }`}
                key={h.v}
              >
                <span className={h.cur ? "text-vermilion" : "text-muted"}>
                  {h.v}
                </span>
                <span>{h.who}</span>
                <span>{h.when}</span>
              </div>
            ))}
          </SidePanel>

          <SidePanel jp="SEO・プレビュー" title="SEO & preview">
            <div className="font-sans text-[12px] text-ink leading-[1.4]">
              <div className="font-mono text-[9px] text-muted uppercase tracking-[0.16em]">
                verda.com/stories/letters-to-a-slower-year
              </div>
              <div className="mt-1 text-[#1a0dab] text-[14px]">
                Letters to a slower year, written in pencil
              </div>
              <div className="mt-[2px] text-[12px] text-muted">
                On a Sunday in February, three of us agreed to write one letter
                a week…
              </div>
            </div>
          </SidePanel>
        </aside>
      </section>
      <div className="h-10" />
    </CmsShell>
  );
}
