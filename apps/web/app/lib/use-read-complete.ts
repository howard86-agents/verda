"use client";

import { useEffect, useRef, useState } from "react";

interface ReadCompleteOpts {
  enabled: boolean;
  minDwellMs?: number;
  minScrollDepth?: number;
  onComplete: () => void;
}

/**
 * Detects read completion via:
 * - Minimum scroll depth (default 80%)
 * - Minimum dwell time (default 30s)
 * - Article bottom exposed in viewport
 * - `enabled` flag (must be logged in)
 */
export function useReadComplete({
  enabled,
  minDwellMs = 30_000,
  minScrollDepth = 0.8,
  onComplete,
}: ReadCompleteOpts) {
  const [completed, setCompleted] = useState(false);
  const firedRef = useRef(false);
  const startRef = useRef(Date.now());
  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!enabled || firedRef.current) {
      return;
    }

    startRef.current = Date.now();

    let maxScroll = 0;
    let bottomExposed = false;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            bottomExposed = true;
          }
        }
      },
      { threshold: 0.1 }
    );

    if (bottomRef.current) {
      observer.observe(bottomRef.current);
    }

    const check = () => {
      if (firedRef.current) {
        return;
      }
      const scrollH =
        document.documentElement.scrollHeight - window.innerHeight;
      if (scrollH > 0) {
        maxScroll = Math.max(maxScroll, window.scrollY / scrollH);
      }
      const dwell = Date.now() - startRef.current;

      if (maxScroll >= minScrollDepth && dwell >= minDwellMs && bottomExposed) {
        firedRef.current = true;
        setCompleted(true);
        onComplete();
      }
    };

    const interval = setInterval(check, 2000);
    window.addEventListener("scroll", check, { passive: true });

    return () => {
      clearInterval(interval);
      window.removeEventListener("scroll", check);
      observer.disconnect();
    };
  }, [enabled, minDwellMs, minScrollDepth, onComplete]);

  return { bottomRef, completed };
}
