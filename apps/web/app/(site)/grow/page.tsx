"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { GROWTH_LEVELS } from "@verda/data";
import { useState } from "react";
import { AuthGate } from "@/_components/auth-gate";
import { CheckInButton } from "@/_components/check-in-button";
import { Eyebrow } from "@/_components/eyebrow";
import { IconDrop } from "@/_components/glyphs";
import { Plant } from "@/_components/plant";
import { useAuth } from "@/lib/auth";
import {
  db,
  GROWTH_CONFIG_DEFAULT_ID,
  GROWTH_CONFIG_DEFAULT_MAX_ITEMS,
  type GrowthItem,
  type GrowthRule,
  type Redemption,
} from "@/lib/db";
import { maxThresholdFor } from "@/lib/growth-allocation";
import { levelFor } from "@/lib/rewards";
import { computeStreak } from "@/lib/streak";
import { track } from "@/lib/track";

const CORNERS = [
  { pos: "top-[8px] left-[8px]", border: "border-t border-l" },
  { pos: "top-[8px] right-[8px]", border: "border-t border-r" },
  { pos: "bottom-[8px] left-[8px]", border: "border-b border-l" },
  { pos: "bottom-[8px] right-[8px]", border: "border-b border-r" },
] as const;

// Static fallback used until Dexie loads (e.g. first paint, SSR, or empty DB).
// Once db.growthRules has been seeded the live values take over.
const FALLBACK_RULES: GrowthRule[] = GROWTH_LEVELS.map((g) => ({
  level: g.n,
  name: g.name,
  jp: g.jp,
  threshold: g.threshold,
}));

function pipClass(rule: GrowthRule, currentLevel: number) {
  if (rule.level === currentLevel) {
    return "border-ink bg-ink text-cream";
  }
  const done = rule.level < currentLevel;
  const tone = done ? "text-ink" : "text-muted";
  return `border-line bg-paper ${tone}`;
}

function formatDate(iso?: string): string {
  if (!iso) {
    return "";
  }
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) {
    return iso;
  }
  return d.toLocaleDateString([], { month: "short", day: "numeric" });
}

function statusBadge(
  level: number,
  completed: boolean,
  redeemed: boolean
): string {
  if (redeemed) {
    return "Redeemed";
  }
  if (completed) {
    return "Complete";
  }
  return `Lv ${String(level).padStart(2, "0")}`;
}

function statusLabel(isActive: boolean, completed: boolean): string {
  if (isActive) {
    return "Active · 育成中";
  }
  if (completed) {
    return "Kept · 保管";
  }
  return "Idle";
}

function PlantCard({
  item,
  rules,
  isActive,
  onRedeem,
  redeemingId,
}: {
  item: GrowthItem;
  rules: GrowthRule[];
  isActive: boolean;
  onRedeem: (item: GrowthItem) => void;
  redeemingId: number | null;
}) {
  const level = item.level || levelFor(item.nutrients, rules);
  const rule = rules.find((r) => r.level === level);
  const sequenceLabel = String(item.sequence ?? 1).padStart(2, "0");
  const completed = !!item.completedAt;
  const redeemed = !!item.redeemedAt;
  const redeeming = redeemingId === item.id;

  return (
    <div className="relative aspect-[4/4.2] overflow-hidden border border-ink bg-paper p-8">
      <div className="absolute top-[18px] left-[22px] font-mono text-[10px] text-muted uppercase tracking-[0.22em]">
        Plant {sequenceLabel}
      </div>
      <div className="absolute top-[18px] right-[22px] font-mono text-[10px] text-vermilion uppercase tracking-[0.22em]">
        {statusBadge(level, completed, redeemed)}
        {!completed && rule ? ` · ${rule.name}` : ""}
      </div>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div className="relative size-[260px]">
          <div className="absolute inset-0 rounded-full bg-paper-alt" />
          <div className="absolute inset-0 flex items-center justify-center">
            <Plant level={level} size={220} />
          </div>
        </div>
      </div>
      <div className="absolute right-[22px] bottom-[18px] left-[22px] flex items-baseline justify-between font-mono text-[10px] text-muted uppercase tracking-[0.18em]">
        <span>{statusLabel(isActive, completed)}</span>
        {item.completedAt && <span>{formatDate(item.completedAt)}</span>}
      </div>
      {/* Redemption CTA / state — shown only on completed items. */}
      {completed && (
        <div className="absolute top-[44px] right-[22px] left-[22px] flex justify-center">
          {redeemed ? (
            <span className="border border-vermilion bg-paper-alt px-3 py-[6px] font-mono text-[10px] text-vermilion uppercase tracking-[0.18em]">
              ✓ Redeemed
            </span>
          ) : (
            <button
              className="border border-ink bg-ink px-4 py-[8px] font-mono text-[10.5px] text-cream uppercase tracking-[0.18em] disabled:opacity-50"
              disabled={redeeming}
              onClick={() => onRedeem(item)}
              type="button"
            >
              {redeeming ? "Redeeming…" : "Redeem reward"}
            </button>
          )}
        </div>
      )}
      {CORNERS.map((corner) => (
        <div
          className={`absolute size-[10px] border-ink ${corner.pos} ${corner.border}`}
          key={corner.pos}
        />
      ))}
    </div>
  );
}

function EmptyPlantSlot() {
  return (
    <div className="relative flex aspect-[4/4.2] flex-col items-center justify-center border border-line border-dashed bg-paper p-8 text-muted">
      <div className="font-display font-light text-[44px] leading-none">＋</div>
      <div className="mt-[10px] font-mono text-[10.5px] uppercase tracking-[0.14em]">
        Empty slot · 空き
      </div>
    </div>
  );
}

function FirstSeedlingCard() {
  return (
    <div className="col-span-2 max-[560px]:col-span-1">
      <div className="relative aspect-[4/4.2] overflow-hidden border border-ink bg-paper p-8">
        <div className="absolute top-[18px] left-[22px] font-mono text-[10px] text-muted uppercase tracking-[0.22em]">
          Plant 01 · 第一株
        </div>
        <div className="absolute top-[18px] right-[22px] font-mono text-[10px] text-vermilion uppercase tracking-[0.22em]">
          Lv 01 · Seed
        </div>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className="relative size-[300px]">
            <div className="absolute inset-0 rounded-full bg-paper-alt" />
            <div className="absolute inset-0 flex items-center justify-center">
              <Plant level={1} size={260} />
            </div>
          </div>
        </div>
        <div className="absolute right-[22px] bottom-[18px] left-[22px] font-mono text-[10px] text-muted uppercase tracking-[0.18em]">
          Read a story to begin growing.
        </div>
        {CORNERS.map((corner) => (
          <div
            className={`absolute size-[10px] border-ink ${corner.pos} ${corner.border}`}
            key={corner.pos}
          />
        ))}
      </div>
    </div>
  );
}

function PlantCollectionGrid({
  items,
  activeItem,
  emptySlotCount,
  rules,
  onRedeem,
  redeemingId,
}: {
  items: GrowthItem[];
  activeItem: GrowthItem | undefined;
  emptySlotCount: number;
  rules: GrowthRule[];
  onRedeem: (item: GrowthItem) => void;
  redeemingId: number | null;
}) {
  if (items.length === 0) {
    return <FirstSeedlingCard />;
  }
  return (
    <>
      {items.map((item) => (
        <PlantCard
          isActive={!!activeItem && activeItem.id === item.id}
          item={item}
          key={item.id ?? item.sequence}
          onRedeem={onRedeem}
          redeemingId={redeemingId}
          rules={rules}
        />
      ))}
      {Array.from({ length: emptySlotCount }).map((_, idx) => (
        // Empty slots are static placeholders; index keying is safe
        // because they have no identity of their own.
        // biome-ignore lint/suspicious/noArrayIndexKey: static placeholder
        <EmptyPlantSlot key={`empty-${idx}`} />
      ))}
    </>
  );
}

interface ProgressLabels {
  eyebrow: string;
  jp: string;
  title: string;
}

function activeProgressLabels(
  activeItem: GrowthItem | undefined,
  atCap: boolean,
  hasCompleted: boolean,
  nextLevel: GrowthRule | undefined
): ProgressLabels {
  if (activeItem) {
    return {
      eyebrow: `Active · Plant ${String(activeItem.sequence ?? 1).padStart(2, "0")}`,
      title: nextLevel?.name ?? "Max",
      jp: nextLevel?.jp ?? "結実",
    };
  }
  if (atCap) {
    return { eyebrow: "Collection · 完成", title: "All grown", jp: "—" };
  }
  if (hasCompleted) {
    return {
      eyebrow: "Next plant · 次の苗",
      title: "Earn nutrients to start",
      jp: "—",
    };
  }
  return { eyebrow: "Next · 次", title: "Awaiting first plant", jp: "—" };
}

function ProgressPanel({
  activeItem,
  activeNutrients,
  activeLevel,
  atCap,
  hasCompleted,
  nextLevel,
  nextThreshold,
  rules,
}: {
  activeItem: GrowthItem | undefined;
  activeNutrients: number;
  activeLevel: number;
  atCap: boolean;
  hasCompleted: boolean;
  nextLevel: GrowthRule | undefined;
  nextThreshold: number;
  rules: GrowthRule[];
}) {
  const labels = activeProgressLabels(
    activeItem,
    atCap,
    hasCompleted,
    nextLevel
  );
  const progressPct =
    nextThreshold > 0
      ? Math.min((activeNutrients / nextThreshold) * 100, 100)
      : 100;

  return (
    <div>
      <div className="flex items-baseline justify-between border-ink border-b pb-3">
        <div>
          <div className="font-mono text-[10.5px] text-ink uppercase tracking-[0.22em]">
            {labels.eyebrow}
          </div>
          <div className="mt-1 font-display font-medium text-[28px]">
            {labels.title}
            <span className="text-[18px] text-muted italic">
              {" "}
              · {labels.jp}
            </span>
          </div>
        </div>
        <div className="font-display font-medium text-[44px]">
          <span className="text-vermilion">{activeNutrients}</span>
          <span className="text-[28px] text-muted italic">
            {" "}
            / {nextThreshold}
          </span>
        </div>
      </div>
      <div className="relative mt-[14px] h-[8px] bg-line">
        <div
          className="h-full bg-vermilion"
          style={{ width: `${progressPct}%` }}
        />
      </div>

      <div
        className="mt-[18px] grid gap-[8px]"
        style={{
          gridTemplateColumns: `repeat(${rules.length}, minmax(0, 1fr))`,
        }}
      >
        {rules.map((p) => (
          <div
            className={`border px-[10px] py-[14px] text-center ${pipClass(p, activeLevel)}`}
            key={p.level}
          >
            <div className="font-mono text-[9.5px] tracking-[0.18em] opacity-75">
              LV {String(p.level).padStart(2, "0")}
            </div>
            <div
              className={`mt-1 font-display text-[16px] ${p.level === activeLevel ? "font-medium" : "font-normal"}`}
            >
              {p.name}
            </div>
            <div className="mt-px font-display text-[12px] italic opacity-60">
              {p.jp}
            </div>
            <div className="mt-[6px] font-mono text-[10px] opacity-70">
              {p.threshold} NUT
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Page() {
  const { member } = useAuth();
  const qc = useQueryClient();
  const [rewardToast, setRewardToast] = useState<Redemption | null>(null);

  const { data: items = [] } = useQuery({
    queryKey: ["growth-items", member?.id],
    enabled: !!member,
    queryFn: async () => {
      const id = member?.id ?? "";
      const rows = await db.growthItems.where("memberId").equals(id).toArray();
      return [...rows].sort((a, b) => (a.sequence ?? 0) - (b.sequence ?? 0));
    },
  });

  const redeemMutation = useMutation({
    mutationFn: async (target: GrowthItem) => {
      if (!(target.id && member)) {
        throw new Error("Cannot redeem: missing item or member");
      }
      const res = await fetch("/api/redemptions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          memberId: member.id,
          growthItemId: target.id,
        }),
      });
      const data = (await res.json()) as
        | { ok: true; redemption: Redemption }
        | { error: string; reason?: string };
      if (!("ok" in data)) {
        const reason =
          ("reason" in data && data.reason) ||
          ("error" in data && data.error) ||
          "Redemption failed";
        throw new Error(reason);
      }
      return { item: target, redemption: data.redemption };
    },
    onSuccess: ({ item, redemption }) => {
      track("growth_item_redeemed", {
        memberId: redemption.memberId,
        growthItemId: redemption.growthItemId,
        growthItemSequence: redemption.growthItemSequence,
        redemptionId: redemption.id,
        provider: redemption.provider,
      });
      setRewardToast(redemption);
      qc.invalidateQueries({ queryKey: ["growth-items", item.memberId] });
    },
  });

  const onRedeem = (target: GrowthItem) => {
    if (redeemMutation.isPending) {
      return;
    }
    redeemMutation.mutate(target);
  };
  const redeemingId =
    redeemMutation.isPending && redeemMutation.variables
      ? (redeemMutation.variables.id ?? null)
      : null;

  const { data: ledger } = useQuery({
    queryKey: ["ledger", member?.id],
    enabled: !!member,
    queryFn: async () => {
      const id = member?.id ?? "";
      return db.pointLedger
        .where("memberId")
        .equals(id)
        .reverse()
        .limit(5)
        .toArray();
    },
  });

  // Live growth rules from Dexie — admin edits via /cms/growth-rules update
  // these and the page picks them up on the next render. Falls back to the
  // static @verda/data data until the table is populated (first paint or
  // before seedIfEmpty has run).
  const { data: growthRules = FALLBACK_RULES } = useQuery({
    queryKey: ["growth-rules"],
    queryFn: async () => {
      const rows = await db.growthRules.orderBy("level").toArray();
      return rows.length > 0 ? rows : FALLBACK_RULES;
    },
  });

  const { data: cap = GROWTH_CONFIG_DEFAULT_MAX_ITEMS } = useQuery({
    queryKey: ["growth-cap"],
    queryFn: async () => {
      const cfg = await db.growthConfig.get(GROWTH_CONFIG_DEFAULT_ID);
      return cfg?.maxItemsPerMember ?? GROWTH_CONFIG_DEFAULT_MAX_ITEMS;
    },
  });

  // Consecutive-day streak (issue #92). Driven by check_in /
  // read_complete entries in the behavior log; refetches whenever the
  // ledger does so a fresh check-in flips the counter without a manual
  // invalidate.
  const { data: streak = 0 } = useQuery({
    queryKey: ["streak", member?.id],
    enabled: !!member,
    queryFn: async () => {
      const id = member?.id ?? "";
      const logs = await db.behaviorLogs.where("memberId").equals(id).toArray();
      return computeStreak(logs);
    },
  });

  const sortedRules = [...growthRules].sort((a, b) => a.level - b.level);
  const maxThreshold = maxThresholdFor(sortedRules) || 300;

  // Active item: newest non-completed (highest sequence). Falls back to a
  // virtual seed-state for first-time members so the existing layout copy
  // still has something to render.
  const completedItems = items.filter((i) => i.completedAt);
  const inProgressItems = items.filter((i) => !i.completedAt);
  const activeItem = inProgressItems.at(-1);
  const activeLevel = activeItem
    ? activeItem.level || levelFor(activeItem.nutrients, sortedRules)
    : 1;
  const activeNutrients = activeItem?.nutrients ?? 0;
  const currentLevelData = sortedRules.find((g) => g.level === activeLevel);
  const nextLevel = sortedRules.find((g) => g.level === activeLevel + 1);
  const nextThreshold = nextLevel?.threshold ?? maxThreshold;

  const slotsUsed = items.length;
  const atCap = slotsUsed >= cap;
  const emptySlotCount = Math.max(0, cap - slotsUsed);

  return (
    <AuthGate>
      <div className="bg-cream text-ink">
        <section className="shell pt-10">
          <Eyebrow en="Your seedlings · 養成中" jp="栄養を集めて育てよう" />
          <div className="mt-[14px] flex items-baseline justify-between max-[560px]:flex-col max-[560px]:items-start max-[560px]:gap-2">
            <h1 className="font-display font-medium text-[56px] leading-none tracking-[-0.02em] max-[560px]:text-[40px]">
              {currentLevelData?.name ?? "Seed"}
              <span className="text-vermilion">.</span>
            </h1>
            <div className="flex items-center gap-4">
              <div className="font-display text-[22px] text-muted italic">
                {currentLevelData?.jp ?? "種"} — Lv{" "}
                {String(activeLevel).padStart(2, "0")}
              </div>
              <CheckInButton />
            </div>
          </div>
          <div className="mt-3 font-mono text-[10.5px] text-muted uppercase tracking-[0.18em]">
            Collection · 養成物 {slotsUsed}/{cap}
            {atCap && (
              <span className="ml-3 text-vermilion">At max — keep tending</span>
            )}
            <span
              className="ml-4 inline-flex items-center gap-[6px] border-line border-l pl-3"
              role="status"
            >
              <span aria-hidden>🔥</span>
              <span className="text-ink">
                Streak {streak} day{streak === 1 ? "" : "s"}
              </span>
              <span className="text-muted normal-case">· 連続</span>
            </span>
          </div>
        </section>

        <section className="shell grid grid-cols-[1fr_1.1fr] gap-12 pt-9 max-[860px]:grid-cols-1">
          <div className="grid grid-cols-2 gap-4 max-[560px]:grid-cols-1">
            <PlantCollectionGrid
              activeItem={activeItem}
              emptySlotCount={emptySlotCount}
              items={[...completedItems, ...inProgressItems]}
              onRedeem={onRedeem}
              redeemingId={redeemingId}
              rules={sortedRules}
            />
          </div>

          <div>
            <ProgressPanel
              activeItem={activeItem}
              activeLevel={activeLevel}
              activeNutrients={activeNutrients}
              atCap={atCap}
              hasCompleted={completedItems.length > 0}
              nextLevel={nextLevel}
              nextThreshold={nextThreshold}
              rules={sortedRules}
            />

            <div className="mt-9">
              <div className="flex items-baseline justify-between border-ink border-b pb-3">
                <div>
                  <div className="font-mono text-[10.5px] text-ink uppercase tracking-[0.22em]">
                    Nutrient ledger
                  </div>
                  <div className="mt-[3px] font-display text-[22px] text-muted italic">
                    滋養の記録
                  </div>
                </div>
              </div>
              {(ledger ?? []).length === 0 && (
                <div className="py-8 text-center font-mono text-[11px] text-muted uppercase tracking-[0.14em]">
                  No entries yet. Read a story to earn nutrients.
                </div>
              )}
              {(ledger ?? []).map((r) => (
                <div
                  className="grid grid-cols-[70px_1fr_auto] items-center gap-[14px] border-line border-b py-[14px]"
                  key={r.id}
                >
                  <div className="flex items-center gap-[6px] font-display font-medium text-[22px] text-vermilion">
                    <IconDrop size={14} /> +{r.amount}
                  </div>
                  <div className="font-display text-[15px]">{r.reason}</div>
                  <div className="font-mono text-[10.5px] text-muted uppercase tracking-[0.1em]">
                    {new Date(r.createdAt).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <div className="h-20" />
        {rewardToast && (
          <RewardToast
            onClose={() => setRewardToast(null)}
            redemption={rewardToast}
          />
        )}
      </div>
    </AuthGate>
  );
}

function RewardToast({
  redemption,
  onClose,
}: {
  redemption: Redemption;
  onClose: () => void;
}) {
  return (
    <div
      aria-live="polite"
      className="fixed right-6 bottom-6 z-40 max-w-sm border border-vermilion border-l-[4px] bg-ink p-5 text-cream shadow-lg max-[640px]:right-3 max-[640px]:bottom-3 max-[640px]:left-3"
      role="status"
    >
      <div className="font-mono text-[10px] uppercase tracking-[0.2em] opacity-75">
        Reward redeemed · 報酬交換
      </div>
      <div className="mt-1 font-display text-[18px] leading-[1.2]">
        {redemption.displayName ?? "Reward"}
      </div>
      <div className="mt-2 font-mono text-[#ffc7c0] text-[12px] tracking-[0.12em]">
        {redemption.rewardCode}
      </div>
      {redemption.expiresAt && (
        <div className="mt-1 font-mono text-[10px] uppercase tracking-[0.14em] opacity-65">
          Expires {new Date(redemption.expiresAt).toLocaleDateString()}
        </div>
      )}
      <button
        className="mt-3 border border-cream/30 px-3 py-[5px] font-mono text-[10px] text-cream uppercase tracking-[0.16em]"
        onClick={onClose}
        type="button"
      >
        Close
      </button>
    </div>
  );
}
