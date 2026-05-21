/**
 * Branded loading state shown while the MSW worker registers and the
 * Dexie seed completes (issue #78). Replaces the previous blank-screen
 * `null` render in `Providers` so a first cold load shows the wordmark
 * and a small progress affordance instead of looking broken.
 *
 * Kept dependency-light (no react-query, no auth, no MSW touch) so it
 * can render before any of those finish booting; uses CSS-driven
 * animation rather than JS so it is hydration-safe.
 */
export function AppSplash() {
  return (
    <div
      aria-busy="true"
      aria-label="Loading Verda"
      className="flex min-h-screen flex-col items-center justify-center bg-cream text-ink"
      role="status"
    >
      <div className="text-center">
        <div className="font-display font-medium text-[56px] leading-none tracking-[-0.02em] max-[640px]:text-[40px]">
          VERDA<span className="text-vermilion">.</span>
        </div>
        <div className="mt-2 font-display text-[16px] text-muted italic">
          故事中心 · Story Center
        </div>
      </div>
      <div
        aria-hidden="true"
        className="mt-10 h-[2px] w-[160px] overflow-hidden bg-line"
      >
        <div className="verda-splash-bar h-full bg-vermilion" />
      </div>
      <div className="mt-3 font-mono text-[10.5px] text-muted uppercase tracking-[0.22em]">
        Loading · 読込中
      </div>
    </div>
  );
}
