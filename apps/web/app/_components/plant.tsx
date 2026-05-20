// Growable plant — ink stem, vermilion accent leaves/blooms; grows by level.
// Colors use theme tokens (not literal hex) so the plant survives dark mode.

const INK = "var(--color-ink)";
const ACCENT = "var(--color-vermilion)";

export function Plant({
  level = 2,
  size = 80,
}: {
  level?: number;
  size?: number;
}) {
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      height={size}
      viewBox="0 0 80 80"
      width={size}
    >
      {/* sharp-edged pot */}
      <path d="M22 56 L58 56 L54 72 L26 72 Z" fill={INK} />
      <rect fill={INK} height="4" width="40" x="20" y="54" />
      {/* soil */}
      <rect fill={ACCENT} height="2" width="36" x="22" y="55" />
      {/* stem */}
      {level >= 2 && <path d="M40 56 L40 36" stroke={INK} strokeWidth="2.2" />}
      {/* base leaf */}
      {level >= 1 && (
        <path
          d="M40 56 C40 50, 38 47, 40 44 C42 47, 40 50, 40 56 Z"
          fill={INK}
        />
      )}
      {level >= 2 && (
        <>
          <path
            d="M40 44 C32 42, 30 38, 30 30 C36 31, 39 37, 40 44 Z"
            fill={INK}
          />
          <path
            d="M40 40 C46 37, 50 34, 52 28 C46 29, 42 33, 40 40 Z"
            fill={ACCENT}
          />
        </>
      )}
      {level >= 3 && <circle cx="40" cy="26" fill={ACCENT} r="6" />}
      {level >= 4 && (
        <>
          <circle cx="34" cy="20" fill={ACCENT} r="5" />
          <circle cx="46" cy="18" fill={INK} r="5" />
          <circle cx="40" cy="12" fill={ACCENT} r="5" />
        </>
      )}
    </svg>
  );
}
