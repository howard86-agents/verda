"use client";

import type { Tier } from "@verda/data";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { CCY, CURRENCY_CODES } from "../../lib/currency";
import { type Lang, TRANSLATIONS } from "../../lib/translations";
import { useLocale, useTheme } from "../providers";
import { TierChip } from "./tier-chip";

const LANGS: Lang[] = ["EN", "TC"];

export function Header({ tier = "Professional" as Tier }: { tier?: Tier }) {
  const { lang, ccy, setLang, setCcy } = useLocale();
  const { dark, toggleDark } = useTheme();
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) {
      return;
    }
    const onDoc = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  const t = TRANSLATIONS[lang];

  const nav: { href: string; label: string; match: (p: string) => boolean }[] =
    [
      { href: "/", label: t.nav.atelier, match: (p) => p === "/" },
      {
        href: "/collection",
        label: t.nav.collection,
        match: (p) => p.startsWith("/collection") || p.startsWith("/product"),
      },
      {
        href: "/request",
        label: t.nav.request,
        match: (p) => p.startsWith("/request"),
      },
      {
        href: "/order",
        label: t.nav.journal,
        match: (p) =>
          p.startsWith("/order") ||
          p.startsWith("/quote") ||
          p.startsWith("/checkout"),
      },
    ];

  return (
    <header className="hdr">
      <div className="shell hdr-top">
        <Link className="row no-underline" href="/">
          <div className="hdr-mark">VERDA</div>
          <sup>EST · 2019 · TAIPEI</sup>
        </Link>
        <nav className="hdr-nav">
          {nav.map((it) => (
            <button
              data-on={it.match(pathname) ? "1" : "0"}
              key={it.href}
              onClick={() => router.push(it.href)}
              type="button"
            >
              {it.label}
            </button>
          ))}
        </nav>
        <div className="hdr-right">
          <div className="relative" data-menu ref={wrapRef}>
            <button
              aria-expanded={open}
              aria-haspopup="menu"
              className="pill"
              onClick={() => setOpen((o) => !o)}
              type="button"
            >
              <span className="dot" />
              <span className="mono">{lang}</span>
              <span className="text-ink-3">·</span>
              <span className="mono">{ccy}</span>
              <span className="ml-[2px] text-ink-3">▾</span>
            </button>
            {open && (
              <div className="dropdown" role="menu">
                <div className="group">Language</div>
                {LANGS.map((l) => (
                  <button
                    data-on={l === lang ? "1" : "0"}
                    key={l}
                    onClick={() => setLang(l)}
                    type="button"
                  >
                    <span>{l === "EN" ? "English" : "繁體中文"}</span>
                    <span className="mono text-ink-3">{l}</span>
                  </button>
                ))}
                <div className="group">Currency · reference</div>
                {CURRENCY_CODES.map((c) => (
                  <button
                    data-on={c === ccy ? "1" : "0"}
                    key={c}
                    onClick={() => {
                      setCcy(c);
                      setOpen(false);
                    }}
                    type="button"
                  >
                    <span>{CCY[c].label}</span>
                    <span className="mono text-ink-3">{CCY[c].sym}</span>
                  </button>
                ))}
                <div className="group flex items-center gap-2">
                  Updated 13·05·26 09:42 GMT+8
                </div>
              </div>
            )}
          </div>

          <TierChip tier={tier} />

          <button
            aria-label="Toggle dark mode"
            className="icon-btn"
            onClick={toggleDark}
            type="button"
          >
            {dark ? (
              <svg
                aria-hidden="true"
                fill="none"
                height="16"
                viewBox="0 0 16 16"
                width="16"
              >
                <circle
                  cx="8"
                  cy="8"
                  r="3"
                  stroke="currentColor"
                  strokeWidth="0.8"
                />
                <path
                  d="M8 1v2M8 13v2M1 8h2M13 8h2M3.2 3.2l1.4 1.4M11.4 11.4l1.4 1.4M3.2 12.8l1.4-1.4M11.4 4.6l1.4-1.4"
                  stroke="currentColor"
                  strokeWidth="0.8"
                />
              </svg>
            ) : (
              <svg
                aria-hidden="true"
                fill="none"
                height="16"
                viewBox="0 0 16 16"
                width="16"
              >
                <path
                  d="M13 9.5A5.5 5.5 0 0 1 6.5 3a1 1 0 0 0-1.2-1.2A6.5 6.5 0 1 0 14.2 10.7 1 1 0 0 0 13 9.5z"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="0.8"
                />
              </svg>
            )}
          </button>
          <button aria-label="Search" className="icon-btn" type="button">
            <svg
              aria-hidden="true"
              fill="none"
              height="16"
              viewBox="0 0 16 16"
              width="16"
            >
              <circle
                cx="7"
                cy="7"
                r="5"
                stroke="currentColor"
                strokeWidth="0.8"
              />
              <path d="M11 11 14 14" stroke="currentColor" strokeWidth="0.8" />
            </svg>
          </button>
          <button
            aria-label="Account"
            className="icon-btn"
            onClick={() => router.push("/account")}
            type="button"
          >
            <svg
              aria-hidden="true"
              fill="none"
              height="16"
              viewBox="0 0 16 16"
              width="16"
            >
              <circle
                cx="8"
                cy="5.5"
                r="2.4"
                stroke="currentColor"
                strokeWidth="0.8"
              />
              <path
                d="M2.5 13.5c.7-2.5 2.9-4 5.5-4s4.8 1.5 5.5 4"
                stroke="currentColor"
                strokeWidth="0.8"
              />
            </svg>
          </button>
        </div>
      </div>
    </header>
  );
}
