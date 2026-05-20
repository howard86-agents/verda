"use client";

import type { ImageKind } from "@verda/data";
import Image from "next/image";
import { useState } from "react";

export function CoverImage({
  kind,
  id,
  gradient,
  label,
  alt = "",
  className = "",
  sizes = "100vw",
  priority = false,
}: {
  kind: ImageKind;
  id: string;
  /** CSS gradient shown as backdrop + fallback if the cover file is missing. */
  gradient: string;
  label?: string;
  alt?: string;
  className?: string;
  sizes?: string;
  priority?: boolean;
}) {
  const [errored, setErrored] = useState(false);

  return (
    <div
      className={`hatch relative overflow-hidden ${className}`}
      style={{ background: gradient }}
    >
      {!errored && (
        <Image
          alt={alt}
          className="object-cover"
          fill
          onError={() => setErrored(true)}
          priority={priority}
          sizes={sizes}
          src={`/img/${kind}/${id}.webp`}
        />
      )}
      {label && (
        <span className="absolute bottom-[10px] left-3 z-10 font-mono text-[9.5px] text-white/90 uppercase tracking-[0.16em]">
          {label}
        </span>
      )}
    </div>
  );
}
