"use client";

import { GROWTH } from "@verda/data";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "../lib/auth";
import { useTheme } from "../providers";
import { CommandPalette } from "./command-palette";
import { IconDrop, IconSearch } from "./glyphs";

const NAV = [
  {
    id: "home",
    en: "Home",
    jp: "家",
    href: "/",
    match: (p: string) => p === "/",
  },
  {
    id: "stories",
    en: "Stories",
    jp: "読",
    href: "/stories",
    match: (p: string) => p.startsWith("/stories"),
  },
  {
    id: "topics",
    en: "Topics",
    jp: "章",
    href: "/topics",
    match: (p: string) => p.startsWith("/topics"),
  },
  {
    id: "readers",
    en: "Readers",
    jp: "読者",
    href: "/readers",
    match: (p: string) => p.startsWith("/readers"),
  },
  {
    id: "grow",
    en: "Grow",
    jp: "育",
    href: "/grow",
    match: (p: string) => p.startsWith("/grow"),
  },
  {
    id: "saved",
    en: "Saved",
    jp: "蔵",
    href: "/collection",
    match: (p: string) => p.startsWith("/collection"),
  },
  {
    id: "about",
    en: "About",
    jp: "誌",
    href: "/about",
    match: (p: string) => p.startsWith("/about"),
  },
];

function ThemeToggle() {
  const { toggleDark } = useTheme();
  return (
    <button
      aria-label="Toggle dark mode"
      className="grid size-[30px] place-items-center border border-line text-ink transition-colors hover:border-ink"
      onClick={toggleDark}
      type="button"
    >
      <svg
        aria-hidden="true"
        focusable="false"
        height="15"
        viewBox="0 0 24 24"
        width="15"
      >
        <circle
          cx="12"
          cy="12"
          fill="none"
          r="8"
          stroke="currentColor"
          strokeWidth="1.4"
        />
        <path d="M12 4a8 8 0 000 16z" fill="currentColor" />
      </svg>
    </button>
  );
}

export function TopNav() {
  const pathname = usePathname();
  const { member, login } = useAuth();
  return (
    <>
      <header className="sticky top-0 z-10 border-line border-b bg-paper">
        <div className="shell grid grid-cols-[auto_1fr_auto] items-center gap-7 py-[14px] max-[900px]:grid-cols-[1fr_auto]">
          {/* Mark */}
          <Link className="flex items-baseline gap-3" href="/">
            <span className="font-display font-medium text-[26px] tracking-[-0.01em]">
              VERDA<span className="text-vermilion">.</span>
            </span>
            <span className="font-display text-[12px] text-muted italic max-[560px]:hidden">
              故事中心
            </span>
            <span className="ml-1 border-line border-l pl-3 font-mono text-[10px] text-muted tracking-[0.18em] max-[1100px]:hidden">
              VOL.14 · MAY 2026
            </span>
          </Link>

          {/* Nav */}
          <nav className="flex justify-center gap-6 max-[900px]:hidden">
            {NAV.map((it) => {
              const on = it.match(pathname);
              return (
                <Link
                  className={`border-b-2 pb-1 font-mono text-[11px] uppercase tracking-[0.18em] ${
                    on
                      ? "border-vermilion text-ink"
                      : "border-transparent text-muted hover:text-ink"
                  }`}
                  href={it.href}
                  key={it.id}
                >
                  {it.en}{" "}
                  <span className="ml-1 font-display text-muted italic opacity-60">
                    {it.jp}
                  </span>
                </Link>
              );
            })}
          </nav>

          {/* Right utility */}
          <div className="flex items-center gap-[14px] text-ink">
            <button
              aria-label="Open search · ⌘K"
              className="flex items-center gap-[6px] border border-line bg-paper px-[8px] py-[4px] font-mono text-[10.5px] text-muted hover:border-ink hover:text-ink"
              onClick={() => {
                window.dispatchEvent(new Event("verda:command-palette"));
              }}
              type="button"
            >
              <span className="inline-flex">
                <IconSearch />
              </span>
              <span className="max-[560px]:hidden">⌘K</span>
            </button>
            {member ? (
              <>
                <span className="flex items-center gap-[6px] border border-ink px-[10px] py-[5px] font-mono text-[10.5px] uppercase tracking-[0.14em] max-[560px]:hidden">
                  <span className="inline-flex text-vermilion">
                    <IconDrop />
                  </span>
                  <strong className="font-medium">{GROWTH.nutrients}</strong>
                  <span className="text-muted">NUT.</span>
                </span>
                <ThemeToggle />
                <span className="grid size-[30px] place-items-center bg-ink font-display text-[13px] text-cream">
                  {member.initial}
                </span>
              </>
            ) : (
              <>
                <ThemeToggle />
                <button
                  className="border border-ink px-[10px] py-[5px] font-mono text-[10.5px] uppercase tracking-[0.14em]"
                  onClick={login}
                  type="button"
                >
                  Sign in
                </button>
              </>
            )}
          </div>
        </div>
      </header>
      <CommandPalette />
    </>
  );
}
