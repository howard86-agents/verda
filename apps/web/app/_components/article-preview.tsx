"use client";

/**
 * Modal overlay that renders a CMS article draft through the real article
 * chrome with a desktop / mobile-WebView toggle.
 *
 * - The body is rendered via `<ArticleBody />`, which is a read-only Tiptap
 *   renderer using the same extensions as the editor — so what editors see
 *   here matches what the editor produces.
 * - In `mobile-webview` mode the chrome is the existing `WebViewHeader` /
 *   `WebViewFooter` from `webview-chrome.tsx`, presented inside a
 *   phone-sized frame that simulates the in-app rendering.
 * - In `desktop` mode the chrome is a minimal stand-in for the public site
 *   (matching the editorial layout: issue strip, cover, title, body) so
 *   editors can sanity-check spacing without leaving the CMS.
 *
 * Mounting / role gating is the caller's responsibility — see the editor.
 */

import { useEffect, useState } from "react";
import { ArticleBody } from "./article-body";
import { WebViewFooter, WebViewHeader } from "./webview-chrome";

type PreviewMode = "desktop" | "mobile-webview";

interface DraftPreview {
  author: string;
  bodyJson: string;
  cat: string;
  coverFocalPoint?: { x: number; y: number };
  coverUrl?: string | null;
  jp: string;
  tag: string;
  title: string;
}

interface ArticlePreviewProps {
  draft: DraftPreview;
  onClose: () => void;
}

function ModeToggle({
  mode,
  onChange,
}: {
  mode: PreviewMode;
  onChange: (m: PreviewMode) => void;
}) {
  return (
    <div className="flex items-center gap-1 border border-line bg-paper p-[2px]">
      <button
        aria-pressed={mode === "desktop"}
        className={`px-[10px] py-[5px] font-mono text-[10.5px] uppercase tracking-[0.14em] ${
          mode === "desktop" ? "bg-ink text-cream" : "text-muted"
        }`}
        onClick={() => onChange("desktop")}
        type="button"
      >
        Desktop
      </button>
      <button
        aria-pressed={mode === "mobile-webview"}
        className={`px-[10px] py-[5px] font-mono text-[10.5px] uppercase tracking-[0.14em] ${
          mode === "mobile-webview" ? "bg-ink text-cream" : "text-muted"
        }`}
        onClick={() => onChange("mobile-webview")}
        type="button"
      >
        Mobile · WebView
      </button>
    </div>
  );
}

function CoverBlock({
  coverUrl,
  coverFocalPoint,
  alt,
}: {
  coverUrl: string;
  coverFocalPoint: { x: number; y: number };
  alt: string;
}) {
  return (
    <div className="relative aspect-[21/9] w-full overflow-hidden border border-line">
      {/* biome-ignore lint/performance/noImgElement: blob/external URLs incompatible with next/image in preview */}
      {/* biome-ignore lint/correctness/useImageSize: dynamic preview cover */}
      <img
        alt={alt}
        className="absolute inset-0 size-full object-cover"
        src={coverUrl}
        style={{
          objectPosition: `${coverFocalPoint.x}% ${coverFocalPoint.y}%`,
        }}
      />
      <div className="absolute top-0 left-0 z-10 h-[120px] w-[6px] bg-vermilion" />
    </div>
  );
}

function TitleBlock({
  title,
  jp,
  author,
  cat,
}: {
  title: string;
  jp: string;
  author: string;
  cat: string;
}) {
  const initial = (author || "?").trim().charAt(0).toUpperCase() || "?";
  return (
    <div className="mx-auto w-full max-w-[720px]">
      <h1 className="text-center font-display font-medium text-[56px] leading-[1.05] tracking-[-0.02em] max-[640px]:text-[36px]">
        {title || <span className="text-muted italic">Untitled draft</span>}
        <span className="text-vermilion">.</span>
      </h1>
      {jp && (
        <div className="mt-[14px] text-center font-display text-[22px] text-muted italic">
          {jp}
        </div>
      )}
      <div className="mt-[26px] grid grid-cols-[auto_1fr_auto] items-center gap-[18px] border-line border-t border-b py-[14px] max-[640px]:grid-cols-[auto_1fr] max-[640px]:gap-3">
        <div className="flex h-9 w-9 items-center justify-center bg-ink font-display text-[15px] text-cream">
          {initial}
        </div>
        <div>
          <div className="font-display font-medium text-[15px]">
            {author || <span className="text-muted italic">No author</span>}
          </div>
          <div className="mt-[2px] font-mono text-[10px] text-muted uppercase tracking-[0.08em]">
            Draft preview · {cat || "uncategorised"}
          </div>
        </div>
        <div className="font-mono text-[10px] text-muted uppercase tracking-[0.18em] max-[640px]:hidden">
          unsaved
        </div>
      </div>
    </div>
  );
}

function DesktopFrame({ draft }: { draft: DraftPreview }) {
  return (
    <div className="bg-paper text-ink">
      <div className="border-ink border-b">
        <div className="flex items-center justify-between px-10 py-3 font-mono text-[10.5px] text-ink uppercase tracking-[0.22em] max-[820px]:px-5">
          <span>Draft preview · 下書き</span>
          <span className="text-vermilion max-[640px]:hidden">
            {draft.cat || "uncategorised"}
          </span>
          <span>Desktop</span>
        </div>
      </div>
      <div className="mx-auto w-full max-w-[1200px] px-10 max-[820px]:px-5">
        {draft.coverUrl && (
          <section className="pt-9">
            <CoverBlock
              alt={draft.title}
              coverFocalPoint={draft.coverFocalPoint ?? { x: 50, y: 50 }}
              coverUrl={draft.coverUrl}
            />
          </section>
        )}
        <section className="pt-11">
          <TitleBlock
            author={draft.author}
            cat={draft.cat}
            jp={draft.jp}
            title={draft.title}
          />
        </section>
        <section className="pt-9 pb-16">
          <ArticleBody
            bodyJson={draft.bodyJson}
            className="mx-auto max-w-[720px]"
          />
        </section>
      </div>
    </div>
  );
}

function MobileWebViewFrame({ draft }: { draft: DraftPreview }) {
  return (
    <div className="mx-auto w-[390px] max-[440px]:w-full">
      <div className="overflow-hidden border border-line bg-cream shadow-sm">
        <WebViewHeader />
        <main className="px-4 py-5">
          {draft.coverUrl && (
            <CoverBlock
              alt={draft.title}
              coverFocalPoint={draft.coverFocalPoint ?? { x: 50, y: 50 }}
              coverUrl={draft.coverUrl}
            />
          )}
          <h1 className="mt-5 font-display font-medium text-[28px] leading-[1.15] tracking-[-0.01em]">
            {draft.title || (
              <span className="text-muted italic">Untitled draft</span>
            )}
            <span className="text-vermilion">.</span>
          </h1>
          {draft.jp && (
            <div className="mt-1 font-display text-[15px] text-muted italic">
              {draft.jp}
            </div>
          )}
          <div className="mt-3 flex items-center gap-2 font-mono text-[10px] text-muted uppercase tracking-[0.12em]">
            <span>{draft.author || "No author"}</span>
            <span>·</span>
            <span>{draft.cat || "uncategorised"}</span>
          </div>
          <div className="mt-4 border-line border-t pt-4">
            <ArticleBody bodyJson={draft.bodyJson} />
          </div>
        </main>
        <WebViewFooter />
      </div>
    </div>
  );
}

export function ArticlePreview({ draft, onClose }: ArticlePreviewProps) {
  const [mode, setMode] = useState<PreviewMode>("desktop");

  // Close on Escape for keyboard accessibility.
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    <div
      aria-label="Article draft preview"
      aria-modal="true"
      className="fixed inset-0 z-50 flex flex-col bg-ink/80"
      role="dialog"
    >
      {/* Toolbar */}
      <div className="flex items-center gap-3 border-line border-b bg-paper px-6 py-3">
        <span className="font-mono text-[10.5px] text-ink uppercase tracking-[0.18em]">
          Draft preview
        </span>
        <span className="font-display text-[12px] text-muted italic">
          下書き
        </span>
        <div className="flex-1" />
        <ModeToggle mode={mode} onChange={setMode} />
        <button
          aria-label="Close preview"
          className="border border-ink bg-paper px-3 py-2 font-mono text-[11px] text-ink uppercase tracking-[0.16em]"
          onClick={onClose}
          type="button"
        >
          Close · Esc
        </button>
      </div>

      {/* Stage */}
      <div className="flex-1 overflow-y-auto bg-paper-alt p-6 max-[640px]:p-3">
        {mode === "desktop" ? (
          <DesktopFrame draft={draft} />
        ) : (
          <MobileWebViewFrame draft={draft} />
        )}
      </div>
    </div>
  );
}
