"use client";

import type { ReactNode } from "react";
import { useAuth } from "@/lib/auth";

export function AuthGate({ children }: { children: ReactNode }) {
  const { member, login } = useAuth();

  if (!member) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="font-mono text-[10.5px] text-muted uppercase tracking-[0.22em]">
          Members only · 会員限定
        </div>
        <div className="mt-4 font-display font-medium text-[32px]">
          Sign in to continue<span className="text-vermilion">.</span>
        </div>
        <button
          className="mt-6 border border-ink bg-ink px-[22px] py-3 font-mono text-[11px] text-cream uppercase tracking-[0.18em]"
          onClick={login}
          type="button"
        >
          Sign in · ログイン
        </button>
      </div>
    );
  }

  return <>{children}</>;
}
