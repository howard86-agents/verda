"use client";

/**
 * Reward-earned toast surface (issue #79).
 *
 * A small global queue exposed via `useRewardToast()` so the disparate
 * reward-earning surfaces — story/reader read-complete, daily check-in,
 * and save/collect — share the same visible feedback when a reward
 * actually fires. Callers must only push when a reward is granted: a
 * 409 from the API (already checked in today, already rewarded for a
 * read), or a no-op save (already saved), must not surface a toast,
 * per acceptance #4 of the issue.
 *
 * Toasts auto-dismiss after `DEFAULT_DURATION_MS` and can be closed
 * manually. The `kind` decides the small accent label; the `points`
 * are rendered as `+N nutrients` so all three reward sources speak the
 * same vocabulary.
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

const DEFAULT_DURATION_MS = 4500;

export type RewardToastKind = "read" | "check_in" | "collect";

export interface RewardToast {
  id: string;
  /** Optional short Japanese accent shown beneath the kind label. */
  jp?: string;
  kind: RewardToastKind;
  /** Plus-prefixed nutrients amount, e.g. 10 for "+10 nutrients". */
  points: number;
  /** Subtitle line — e.g. the article title for read/collect. */
  subtitle?: string;
}

interface RewardToastCtx {
  push: (toast: Omit<RewardToast, "id">) => void;
}

const Ctx = createContext<RewardToastCtx | null>(null);

export function useRewardToast(): RewardToastCtx {
  const ctx = useContext(Ctx);
  if (!ctx) {
    throw new Error("useRewardToast must be used within a RewardToastProvider");
  }
  return ctx;
}

const KIND_LABELS: Record<RewardToastKind, { label: string; jp: string }> = {
  read: { label: "Story read", jp: "読了" },
  check_in: { label: "Daily check-in", jp: "毎日のチェックイン" },
  collect: { label: "Story saved", jp: "保存" },
};

export function RewardToastProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [items, setItems] = useState<RewardToast[]>([]);
  const seqRef = useRef(0);

  const dismiss = useCallback((id: string) => {
    setItems((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const push = useCallback((toast: Omit<RewardToast, "id">) => {
    seqRef.current += 1;
    const id = `t_${seqRef.current}_${Date.now().toString(36)}`;
    setItems((prev) => [...prev, { ...toast, id }]);
  }, []);

  const value = useMemo(() => ({ push }), [push]);

  return (
    <Ctx.Provider value={value}>
      {children}
      <RewardToastStack items={items} onDismiss={dismiss} />
    </Ctx.Provider>
  );
}

function RewardToastStack({
  items,
  onDismiss,
}: {
  items: RewardToast[];
  onDismiss: (id: string) => void;
}) {
  if (items.length === 0) {
    return null;
  }
  return (
    <div
      aria-live="polite"
      className="pointer-events-none fixed right-6 bottom-6 z-50 flex flex-col gap-3 max-[640px]:right-3 max-[640px]:bottom-3 max-[640px]:left-3"
    >
      {items.map((t) => (
        <RewardToastCard key={t.id} onDismiss={onDismiss} toast={t} />
      ))}
    </div>
  );
}

function RewardToastCard({
  toast,
  onDismiss,
}: {
  toast: RewardToast;
  onDismiss: (id: string) => void;
}) {
  const { id, kind, points, subtitle } = toast;
  useEffect(() => {
    const timer = setTimeout(() => onDismiss(id), DEFAULT_DURATION_MS);
    return () => clearTimeout(timer);
  }, [id, onDismiss]);

  const meta = KIND_LABELS[kind];

  return (
    <div
      className="pointer-events-auto max-w-sm border border-vermilion border-l-[4px] bg-ink p-4 text-cream shadow-lg"
      role="status"
    >
      <div className="font-mono text-[10px] uppercase tracking-[0.2em] opacity-75">
        {meta.label} · {meta.jp}
      </div>
      <div className="mt-1 font-display font-medium text-[18px] leading-[1.25]">
        +{points} <span className="text-[#ffc7c0]">nutrients</span>
      </div>
      {subtitle && (
        <div className="mt-1 line-clamp-2 font-display text-[12px] text-cream/80 italic">
          {subtitle}
        </div>
      )}
      <button
        aria-label="Dismiss reward notification"
        className="absolute top-1 right-2 font-mono text-[14px] text-cream/60"
        onClick={() => onDismiss(id)}
        type="button"
      >
        ×
      </button>
    </div>
  );
}
