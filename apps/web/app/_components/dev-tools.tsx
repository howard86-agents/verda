"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import { useAuth } from "@/lib/auth";
import { resetAndReseed } from "@/lib/seed";

export function DevTools() {
  const qc = useQueryClient();
  const { member, login, logout } = useAuth();

  const handleReseed = useCallback(async () => {
    await resetAndReseed();
    qc.invalidateQueries();
  }, [qc]);

  if (process.env.NODE_ENV === "production") {
    return null;
  }

  return (
    <div className="fixed right-3 bottom-3 z-50 flex gap-2">
      <button
        className="rounded bg-ink px-2 py-1 font-mono text-[10px] text-cream opacity-50 hover:opacity-100"
        onClick={member ? logout : login}
        type="button"
      >
        {member ? "🔓 Logout" : "🔒 Login"}
      </button>
      <button
        className="rounded bg-ink px-2 py-1 font-mono text-[10px] text-cream opacity-50 hover:opacity-100"
        onClick={handleReseed}
        type="button"
      >
        ↻ Reseed
      </button>
    </div>
  );
}
