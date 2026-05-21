"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import { resetAndReseed } from "@/lib/seed";

export function DevTools() {
  const qc = useQueryClient();

  const handleReseed = useCallback(async () => {
    await resetAndReseed();
    qc.invalidateQueries();
  }, [qc]);

  if (process.env.NODE_ENV === "production") {
    return null;
  }

  return (
    <button
      className="fixed right-3 bottom-3 z-50 rounded bg-ink px-2 py-1 font-mono text-[10px] text-cream opacity-50 hover:opacity-100"
      onClick={handleReseed}
      type="button"
    >
      ↻ Reseed
    </button>
  );
}
