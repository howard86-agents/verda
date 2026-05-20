// Shared CMS shell — dark sidebar + sticky topbar. The sidebar stays dark in
// both themes (admin chrome, not a themed surface).

import Link from "next/link";
import type { ReactNode } from "react";
import { IconSearch } from "./glyphs";

const NAV = [
  { id: "dashboard", en: "Dashboard", jp: "ダッシュ", href: null },
  { id: "articles", en: "Articles", jp: "記事", href: "/cms/articles" },
  { id: "social", en: "Submissions", jp: "投稿", href: null },
  { id: "media", en: "Media", jp: "メディア", href: null },
  { id: "members", en: "Members", jp: "会員", href: "/cms/members/m_4421" },
  { id: "rules", en: "Gamification", jp: "報酬", href: null },
  { id: "redeem", en: "Redemption", jp: "引換", href: null },
  { id: "analytics", en: "Analytics", jp: "解析", href: null },
  { id: "settings", en: "Settings", jp: "設定", href: null },
] as const;

type NavId = (typeof NAV)[number]["id"];

export function CmsShell({
  active = "articles",
  breadcrumb = "CMS",
  actions,
  children,
}: {
  active?: NavId;
  breadcrumb?: string;
  actions?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="grid min-h-screen grid-cols-[232px_1fr] bg-cream text-ink max-[860px]:grid-cols-1">
      {/* Sidebar — always dark */}
      <aside className="sticky top-0 flex h-screen flex-col bg-[#0a0a0a] py-5 text-[#fafaf7] max-[860px]:static max-[860px]:h-auto max-[860px]:border-line max-[860px]:border-b">
        <div className="border-white/10 border-b px-5 pb-[18px]">
          <div className="font-display font-medium text-[22px] tracking-[-0.01em]">
            VERDA<span className="text-vermilion">.</span>
          </div>
          <div className="mt-1 font-mono text-[10px] text-white/55 uppercase tracking-[0.2em]">
            CMS · 管理
          </div>
        </div>
        <nav className="flex-1 overflow-hidden py-[14px] max-[860px]:flex max-[860px]:overflow-x-auto">
          {NAV.map((it, i) => {
            const on = it.id === active;
            const inner = (
              <>
                <span
                  className="h-4 w-[3px]"
                  style={{
                    background: on ? "var(--color-vermilion)" : "transparent",
                  }}
                />
                <span>
                  <span
                    className={`block font-sans text-[13px] ${on ? "font-medium" : ""}`}
                  >
                    {it.en}
                  </span>
                  <span className="block font-display text-[10.5px] italic opacity-50">
                    {it.jp}
                  </span>
                </span>
                {on && (
                  <span className="font-mono text-[9px] opacity-50">
                    ⌘{i + 1}
                  </span>
                )}
              </>
            );
            const cls = `grid grid-cols-[4px_1fr_auto] items-center gap-3 px-5 py-[10px] ${
              on ? "bg-vermilion/12 text-[#fafaf7]" : "text-white/60"
            }`;
            return it.href ? (
              <Link className={cls} href={it.href} key={it.id}>
                {inner}
              </Link>
            ) : (
              <div className={cls} key={it.id}>
                {inner}
              </div>
            );
          })}
        </nav>
        <div className="border-white/10 border-t px-5 py-[14px] font-mono text-[10px] text-white/50 uppercase tracking-[0.12em]">
          <div className="flex items-center gap-[10px]">
            <span className="grid size-7 place-items-center bg-vermilion font-display text-[#fafaf7] text-[12px]">
              H
            </span>
            <span>
              <span className="block font-sans text-[#fafaf7] text-[12px] normal-case">
                H. Tsai
              </span>
              <span className="block">Publisher</span>
            </span>
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="min-w-0">
        <div className="sticky top-0 z-[9] flex items-center gap-[18px] border-line border-b bg-paper px-8 py-[14px] max-[860px]:px-5">
          <div className="font-mono text-[10.5px] text-muted uppercase tracking-[0.16em]">
            {breadcrumb}
          </div>
          <div className="flex-1" />
          <div className="flex w-[280px] items-center gap-2 border border-line bg-paper px-3 py-[7px] text-[12px] text-muted max-[860px]:hidden">
            <IconSearch size={16} />
            <span>Search articles, members, logs…</span>
            <span className="ml-auto font-mono text-[10px]">⌘K</span>
          </div>
          <div className="flex items-center gap-[10px]">{actions}</div>
        </div>
        {children}
      </div>
    </div>
  );
}
