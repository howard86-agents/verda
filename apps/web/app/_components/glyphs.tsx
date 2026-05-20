// Tokyo Press glyph set. Icons inherit `currentColor`; size via the `size` prop.
// Decorative by default (aria-hidden on every svg so assistive tech skips them).

interface IconProps {
  className?: string;
  size?: number;
}

export function IconSearch({ size = 18, className }: IconProps) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      focusable="false"
      height={size}
      viewBox="0 0 24 24"
      width={size}
    >
      <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.4" />
      <path
        d="M20 20l-3.5-3.5"
        stroke="currentColor"
        strokeLinecap="square"
        strokeWidth="1.4"
      />
    </svg>
  );
}

export function IconBack({ size = 22, className }: IconProps) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      focusable="false"
      height={size}
      viewBox="0 0 24 24"
      width={size}
    >
      <path
        d="M15 5l-7 7 7 7"
        stroke="currentColor"
        strokeLinecap="square"
        strokeLinejoin="miter"
        strokeWidth="1.4"
      />
    </svg>
  );
}

export function IconMore({ size = 22, className }: IconProps) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      focusable="false"
      height={size}
      viewBox="0 0 24 24"
      width={size}
    >
      <circle cx="5" cy="12" fill="currentColor" r="1.4" />
      <circle cx="12" cy="12" fill="currentColor" r="1.4" />
      <circle cx="19" cy="12" fill="currentColor" r="1.4" />
    </svg>
  );
}

export function IconFilter({ size = 16, className }: IconProps) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      focusable="false"
      height={size}
      viewBox="0 0 24 24"
      width={size}
    >
      <path
        d="M4 6h16M7 12h10M10 18h4"
        stroke="currentColor"
        strokeLinecap="square"
        strokeWidth="1.4"
      />
    </svg>
  );
}

export function IconBookmark({
  size = 20,
  className,
  filled = false,
}: IconProps & { filled?: boolean }) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill={filled ? "currentColor" : "none"}
      focusable="false"
      height={size}
      viewBox="0 0 24 24"
      width={size}
    >
      <path
        d="M6 4h12v17l-6-4-6 4V4z"
        stroke="currentColor"
        strokeLinejoin="miter"
        strokeWidth="1.4"
      />
    </svg>
  );
}

export function IconDrop({ size = 14, className }: IconProps) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="currentColor"
      focusable="false"
      height={size}
      viewBox="0 0 24 24"
      width={size}
    >
      <path d="M12 3c4 5 6 8.5 6 12a6 6 0 11-12 0c0-3.5 2-7 6-12z" />
    </svg>
  );
}

export function IconShare({ size = 20, className }: IconProps) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      focusable="false"
      height={size}
      viewBox="0 0 24 24"
      width={size}
    >
      <path
        d="M12 3v13M7 8l5-5 5 5M5 14v5a2 2 0 002 2h10a2 2 0 002-2v-5"
        stroke="currentColor"
        strokeLinecap="square"
        strokeLinejoin="miter"
        strokeWidth="1.4"
      />
    </svg>
  );
}

export function IconSpark({ size = 14, className }: IconProps) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      focusable="false"
      height={size}
      viewBox="0 0 24 24"
      width={size}
    >
      <path
        d="M12 2v6M12 16v6M2 12h6M16 12h6M5 5l4 4M15 15l4 4M19 5l-4 4M9 15l-4 4"
        stroke="currentColor"
        strokeLinecap="square"
        strokeWidth="1.4"
      />
    </svg>
  );
}

export function IconExternal({ size = 13, className }: IconProps) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      focusable="false"
      height={size}
      viewBox="0 0 24 24"
      width={size}
    >
      <path
        d="M14 4h6v6M20 4l-9 9M19 14v5a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h5"
        stroke="currentColor"
        strokeLinecap="square"
        strokeLinejoin="miter"
        strokeWidth="1.4"
      />
    </svg>
  );
}
