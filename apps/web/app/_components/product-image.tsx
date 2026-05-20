"use client";

import Image from "next/image";
import type { CSSProperties } from "react";
import { useState } from "react";
import { Placeholder } from "./placeholder";

type Aspect = "square" | "4x5" | "3x4" | "16x9" | "none";

type Kind = "products" | "matches" | "reference";

const ASPECT_CLASS: Record<Aspect, string> = {
  square: "aspect-square",
  "4x5": "aspect-[4/5]",
  "3x4": "aspect-[3/4]",
  "16x9": "aspect-[16/9]",
  none: "",
};

function srcFor(kind: Kind, id: string): string {
  if (kind === "reference") {
    return "/img/reference.webp";
  }
  return `/img/${kind}/${id}.webp`;
}

export function ImageOrPlaceholder({
  kind,
  id,
  alt,
  caption,
  aspect = "none",
  brackets = false,
  className = "",
  style,
  sizes = "(min-width: 1280px) 25vw, (min-width: 768px) 33vw, 50vw",
  priority = false,
}: {
  kind: Kind;
  id: string;
  alt: string;
  caption: string;
  aspect?: Aspect;
  brackets?: boolean;
  className?: string;
  style?: CSSProperties;
  sizes?: string;
  priority?: boolean;
}) {
  const [errored, setErrored] = useState(false);

  if (errored) {
    return (
      <Placeholder
        aspect={aspect}
        brackets={brackets}
        caption={caption}
        className={className}
        style={style}
      />
    );
  }

  const wrapClasses = [
    "relative overflow-hidden bg-bg-soft",
    ASPECT_CLASS[aspect],
    brackets ? "brackets" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={wrapClasses} style={style}>
      <Image
        alt={alt}
        className="object-cover"
        fill
        onError={() => setErrored(true)}
        priority={priority}
        sizes={sizes}
        src={srcFor(kind, id)}
      />
    </div>
  );
}
