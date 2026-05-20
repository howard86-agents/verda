import type { CSSProperties } from "react";

type Aspect = "square" | "4x5" | "3x4" | "16x9" | "none";

export function Placeholder({
  caption,
  aspect = "none",
  brackets = false,
  style,
  className = "",
}: {
  caption: string;
  aspect?: Aspect;
  brackets?: boolean;
  style?: CSSProperties;
  className?: string;
}) {
  const aspectClass = aspect === "none" ? "" : `ph-${aspect}`;
  const classes = ["ph", aspectClass, brackets ? "brackets" : "", className]
    .filter(Boolean)
    .join(" ");
  return <div className={classes} data-ph={caption} style={style} />;
}
