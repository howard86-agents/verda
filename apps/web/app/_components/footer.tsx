// Shared desktop footer.

import Link from "next/link";

export function Footer() {
  return (
    <footer className="shell mt-auto grid grid-cols-[2fr_1fr_1fr_1fr] gap-9 border-ink border-t py-8 pb-9 font-mono text-[10.5px] text-muted uppercase tracking-[0.12em] max-[820px]:grid-cols-1 max-[820px]:gap-6">
      <div>
        <div className="font-display font-medium text-[22px] text-ink normal-case tracking-[-0.01em]">
          VERDA<span className="text-vermilion">.</span>
        </div>
        <div className="mt-1 font-display text-[12px] text-muted normal-case italic tracking-[0.02em]">
          Stories that nourish. 滋養する物語。
        </div>
      </div>
      <div>
        <div className="mb-2 text-ink">Read</div>
        <div className="leading-[1.9]">
          Mindful · Nutrition · Movement · Earth
        </div>
      </div>
      <div>
        <div className="mb-2 text-ink">Member</div>
        <div className="leading-[1.9]">Sign in via 91APP · Help · Press</div>
      </div>
      <div>
        <div className="mb-2 text-ink">©2026 Verda</div>
        <div className="leading-[1.9]">
          故事中心 · Taipei · v4.2 ·{" "}
          <Link
            className="underline-offset-2 hover:text-ink hover:underline"
            href="/about"
          >
            About
          </Link>
        </div>
      </div>
    </footer>
  );
}
