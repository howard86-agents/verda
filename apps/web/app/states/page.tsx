// Edge states gallery — empty / loading / error / login-required / throttle /
// 91APP WebView shell.
// Renders bare (no chrome) on a cream page.

import type { ReactNode } from "react";
import { Eyebrow } from "@/_components/eyebrow";

function StateCard({
  title,
  jp,
  children,
}: {
  title: string;
  jp: string;
  children: ReactNode;
}) {
  return (
    <div className="flex min-h-[460px] flex-col border border-ink bg-paper">
      <div className="flex items-baseline gap-2 border-line border-b px-[14px] py-[10px] font-mono text-[10.5px] text-ink uppercase tracking-[0.18em]">
        {title}
        <span className="font-display text-[11px] text-muted normal-case italic tracking-normal">
          {jp}
        </span>
      </div>
      <div className="flex-1">{children}</div>
    </div>
  );
}

function Shimmer({ w, h }: { w: string; h: string }) {
  return <div className="shimmer" style={{ width: w, height: h }} />;
}

export default function StatesPage() {
  return (
    <div className="min-h-screen w-full bg-cream p-10 font-sans text-ink max-[680px]:p-5">
      <div className="mb-[26px]">
        <Eyebrow
          en="Edge states · 状態集"
          jp="空・読込・エラー・要ログイン・WebView"
        />
        <h1 className="mt-3 font-display font-medium text-[44px] tracking-[-0.015em]">
          Empty, loading, error<span className="text-vermilion">.</span>
        </h1>
        <p className="mt-[10px] max-w-[720px] font-display text-[16px] text-muted italic">
          Six states the team will hit before launch: empty collection, list
          loading skeleton, server error, login-required gate,
          throttle/cooldown, and the 91APP WebView chrome — same
          Mincho/vermilion grammar.
        </p>
      </div>

      <div className="grid grid-cols-3 gap-[22px] max-[1100px]:grid-cols-2 max-[680px]:grid-cols-1">
        {/* 1. Empty collection */}
        <StateCard jp="保存ゼロ件" title="01 · Empty collection">
          <div className="flex flex-col items-center px-[18px] py-[30px] text-center">
            <svg
              aria-hidden="true"
              focusable="false"
              height={92}
              viewBox="0 0 80 80"
              width={92}
            >
              <rect
                fill="none"
                height="50"
                stroke="var(--color-ink)"
                strokeWidth="1.5"
                width="52"
                x="14"
                y="20"
              />
              <path
                d="M28 20 v18 l6 -5 6 5 v-18"
                fill="none"
                stroke="var(--color-vermilion)"
                strokeWidth="1.5"
              />
              <line
                stroke="var(--color-line)"
                strokeWidth="1"
                x1="14"
                x2="66"
                y1="34"
                y2="34"
              />
              <line
                stroke="var(--color-line)"
                strokeWidth="1"
                x1="14"
                x2="66"
                y1="48"
                y2="48"
              />
            </svg>
            <div className="mt-[14px] font-display font-medium text-[20px]">
              Nothing saved yet<span className="text-vermilion">.</span>
            </div>
            <div className="mt-1 font-display text-[13px] text-muted italic">
              読みかけの物語は、ここに集まる。
            </div>
            <p className="mt-[10px] max-w-[240px] font-display text-[14px] text-ink-soft leading-[1.5]">
              Tap the bookmark on any story to keep it here for later reading.
            </p>
            <button
              className="mt-4 bg-ink px-4 py-[9px] font-mono text-[11px] text-cream uppercase tracking-[0.16em]"
              type="button"
            >
              Browse stories →
            </button>
          </div>
        </StateCard>

        {/* 2. Loading skeleton */}
        <StateCard jp="読込中" title="02 · Loading skeleton">
          <div className="px-[18px] pt-[18px] pb-[26px]">
            <div className="flex items-center gap-2 font-mono text-[10px] text-muted uppercase tracking-[0.18em]">
              <span className="size-2 bg-vermilion" />
              Loading · 読込中
            </div>
            {["s1", "s2", "s3"].map((row) => (
              <div className="mt-4 grid grid-cols-[60px_1fr] gap-3" key={row}>
                <Shimmer h="60px" w="60px" />
                <div className="flex flex-col gap-[6px]">
                  <Shimmer h="10px" w="40%" />
                  <Shimmer h="16px" w="90%" />
                  <Shimmer h="12px" w="70%" />
                </div>
              </div>
            ))}
            <div className="mt-[18px] font-mono text-[10px] text-muted uppercase tracking-[0.12em]">
              Avg load · 240 ms · cached
            </div>
          </div>
        </StateCard>

        {/* 3. Server error */}
        <StateCard jp="サーバエラー" title="03 · Server error">
          <div className="flex flex-col items-center px-[18px] py-7 text-center">
            <div className="font-display font-medium text-[76px] text-vermilion leading-[0.9] tracking-[-0.02em]">
              5<span className="text-ink">00</span>
            </div>
            <div className="mt-[6px] font-mono text-[10px] text-vermilion uppercase tracking-[0.22em]">
              Something tipped over · 何かが倒れた
            </div>
            <p className="mt-3 max-w-[260px] font-display text-[14px] text-ink-soft italic leading-[1.55]">
              We&apos;ve logged the error and the engineering tea kettle is on.
              Try again in a moment, or read something offline.
            </p>
            <div className="mt-4 flex gap-[10px]">
              <button
                className="bg-ink px-[14px] py-[9px] font-mono text-[11px] text-cream uppercase tracking-[0.16em]"
                type="button"
              >
                Retry
              </button>
              <button
                className="border border-ink bg-transparent px-[14px] py-[9px] font-mono text-[11px] text-ink uppercase tracking-[0.16em]"
                type="button"
              >
                Go home
              </button>
            </div>
            <div className="mt-[18px] font-mono text-[10px] text-muted tracking-[0.08em]">
              Request ID · req_8f3a1c4 · 14:23:08
            </div>
          </div>
        </StateCard>

        {/* 4. Login required */}
        <StateCard jp="要ログイン" title="04 · Login required">
          <div className="px-[22px] pt-6 pb-[26px]">
            <div className="inline-block border border-vermilion px-[9px] py-[3px] font-mono text-[10px] text-vermilion uppercase tracking-[0.16em]">
              Member only · 会員限定
            </div>
            <div className="mt-[14px] font-display font-medium text-[24px] leading-[1.18]">
              Sign in to grow your
              <br />
              seedling<span className="text-vermilion">.</span>
            </div>
            <p className="mt-2 font-display text-[13.5px] text-ink-soft italic leading-[1.55]">
              Reading is free, but nutrients and saved stories live with your
              91APP member identity.
            </p>
            <button
              className="mt-[18px] flex w-full items-center justify-center gap-2 bg-vermilion py-3 font-mono text-[12px] text-cream uppercase tracking-[0.18em]"
              type="button"
            >
              <span className="flex size-4 items-center justify-center bg-cream font-bold font-display text-[10px] text-vermilion">
                91
              </span>
              Continue with 91APP
            </button>
            <button
              className="mt-2 w-full border border-line bg-transparent py-[10px] font-mono text-[11px] text-ink uppercase tracking-[0.16em]"
              type="button"
            >
              Continue reading without sign-in
            </button>
            <div className="mt-3 font-mono text-[9.5px] text-muted leading-[1.5] tracking-[0.08em]">
              By signing in you agree to Verda&apos;s reader terms ·
              プライバシー
            </div>
          </div>
        </StateCard>

        {/* 5. Throttle / cooldown */}
        <StateCard jp="既受領" title="05 · Throttle / cooldown">
          <div className="px-[22px] py-7">
            <div className="flex items-center gap-2 font-mono text-[10px] text-muted uppercase tracking-[0.22em]">
              <span className="size-2 bg-muted" />
              Already credited · 既に受領済み
            </div>
            <div className="mt-[10px] font-display font-medium text-[22px] leading-[1.2]">
              You&apos;ve already earned nutrients for this story.
            </div>
            <div className="mt-[14px] border border-line bg-paper-alt p-[14px]">
              <div className="flex justify-between font-mono text-[10.5px] text-muted uppercase tracking-[0.1em]">
                <span>First credited</span>
                <span className="text-ink">18 May · 14:08</span>
              </div>
              <div className="mt-[6px] flex justify-between font-mono text-[10.5px] text-muted uppercase tracking-[0.1em]">
                <span>Amount</span>
                <span className="text-vermilion">+10 nutrients</span>
              </div>
              <div className="mt-[6px] flex justify-between font-mono text-[10.5px] text-muted uppercase tracking-[0.1em]">
                <span>Rule</span>
                <span className="text-ink">Once per member · 会員一回</span>
              </div>
            </div>
            <p className="mt-3 font-display text-[13px] text-muted italic leading-[1.5]">
              You can still re-read or save it for later — just no new nutrients
              today.
            </p>
          </div>
        </StateCard>

        {/* 6. 91APP WebView entry */}
        <StateCard jp="アプリ内表示" title="06 · 91APP WebView entry">
          <div className="px-[14px] pt-[14px] pb-[18px]">
            {/* Fake phone shell mini */}
            <div className="relative mx-auto h-[380px] w-[220px] rounded-[28px] bg-[#0a0a0a] p-2 shadow-[0_8px_28px_rgba(0,0,0,0.18)]">
              <div className="relative h-full w-full overflow-hidden rounded-[22px] bg-paper">
                {/* 91APP shell header */}
                <div className="flex items-center gap-2 border-line border-b px-[14px] pt-[14px] pb-[10px] font-sans text-[11px]">
                  <span className="flex size-[22px] items-center justify-center bg-vermilion font-bold font-display text-[10px] text-cream">
                    91
                  </span>
                  <span className="font-display font-medium text-[12px]">
                    VERDA
                  </span>
                  <span className="ml-auto font-mono text-[9px] text-muted">
                    ×
                  </span>
                </div>
                {/* Hero */}
                <div className="p-3">
                  <div className="font-mono text-[8px] text-muted uppercase tracking-[0.2em]">
                    WebView · 読
                  </div>
                  <div className="mt-1 font-display font-medium text-[16px] leading-[1.1]">
                    鉛筆で綴る、
                    <br />
                    ゆるやかな一年。
                  </div>
                  <div className="relative mt-[10px] h-[100px] bg-[linear-gradient(160deg,#5a5a4e_0%,#1a1a1a_100%)]">
                    <div className="absolute top-0 left-0 h-[30px] w-[3px] bg-vermilion" />
                  </div>
                  <div className="mt-2 font-mono text-[8px] text-muted uppercase tracking-[0.16em]">
                    12 MIN · +10 NUT
                  </div>
                </div>
                {/* WebView indicator strip */}
                <div className="absolute right-0 bottom-0 left-0 flex justify-between bg-ink px-[10px] py-[6px] font-mono text-[8.5px] text-cream uppercase tracking-[0.16em]">
                  <span>via 91APP</span>
                  <span>m_4421 ✓</span>
                </div>
              </div>
            </div>
            <div className="mt-3 text-center font-mono text-[10px] text-muted uppercase leading-[1.5] tracking-[0.14em]">
              In-app shell · safe-area aware · member identity passed
            </div>
          </div>
        </StateCard>
      </div>
    </div>
  );
}
