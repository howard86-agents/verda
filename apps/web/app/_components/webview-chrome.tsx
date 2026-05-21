/**
 * Simplified header for WebView mode — minimal branding, no full nav.
 */
export function WebViewHeader() {
  return (
    <header className="safe-top sticky top-0 z-40 flex items-center justify-between border-line border-b bg-paper px-4 py-3">
      <div className="font-display font-medium text-[18px] tracking-[-0.01em]">
        VERDA<span className="text-vermilion">.</span>
      </div>
      <div className="font-mono text-[9.5px] text-muted uppercase tracking-[0.18em]">
        In-app · アプリ内
      </div>
    </header>
  );
}

/**
 * Simplified footer for WebView mode — minimal, respects safe-area.
 */
export function WebViewFooter() {
  return (
    <footer className="safe-bottom border-line border-t bg-paper px-4 py-3 text-center font-mono text-[9.5px] text-muted uppercase tracking-[0.14em]">
      © 2026 Verda · 故事中心
    </footer>
  );
}
