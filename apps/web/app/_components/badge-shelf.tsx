"use client";

import { useQuery } from "@tanstack/react-query";
import { BADGE_CATALOG, type Badge, type BadgeId } from "@verda/data";
import { useAuth } from "@/lib/auth";
import { readBadgeShelf } from "@/lib/badges";

interface ShelfPayload {
  earnedAt: Record<string, string>;
  earnedIds: BadgeId[];
}

/**
 * Earned / locked badge shelf for the Grow page (issue #93).
 *
 * Renders all catalog badges in display order. Earned cards show the
 * icon + an "Earned" subtitle with the date; locked cards show the
 * dimmed icon + the criteria copy. The component talks to Dexie
 * directly via `readBadgeShelf` so it can react to live awards (the
 * shared react-query cache invalidates on any read_complete /
 * check_in / collect mutation that already invalidates "growth").
 */
export function BadgeShelf() {
  const { member } = useAuth();
  const { data: shelf } = useQuery<ShelfPayload>({
    queryKey: ["badge-shelf", member?.id],
    enabled: !!member,
    queryFn: async () => {
      const id = member?.id ?? "";
      const data = await readBadgeShelf(id);
      const earnedIds = data.earned.map((b) => b.badgeId as BadgeId);
      const earnedAt: Record<string, string> = {};
      for (const b of data.earned) {
        earnedAt[b.badgeId] = b.earnedAt;
      }
      return { earnedIds, earnedAt };
    },
  });

  const earned = new Set(shelf?.earnedIds ?? []);
  const earnedAt = shelf?.earnedAt ?? {};
  const earnedCount = earned.size;

  return (
    <section aria-label="Badges" className="mt-9">
      <div className="flex items-baseline justify-between border-ink border-b pb-3">
        <div>
          <div className="font-mono text-[10.5px] text-ink uppercase tracking-[0.22em]">
            Badges · 章
          </div>
          <div className="mt-[3px] font-display text-[22px] text-muted italic">
            {earnedCount}/{BADGE_CATALOG.length} earned
          </div>
        </div>
      </div>
      <ul className="mt-5 grid grid-cols-2 gap-3 max-[640px]:grid-cols-1">
        {BADGE_CATALOG.map((b) => (
          <BadgeCard
            badge={b}
            earnedAt={earnedAt[b.id]}
            isEarned={earned.has(b.id)}
            key={b.id}
          />
        ))}
      </ul>
    </section>
  );
}

function BadgeCard({
  badge,
  earnedAt,
  isEarned,
}: {
  badge: Badge;
  earnedAt?: string;
  isEarned: boolean;
}) {
  return (
    <li
      className={`grid grid-cols-[44px_1fr] gap-3 border p-4 ${
        isEarned ? "border-ink bg-paper" : "border-line bg-paper opacity-60"
      }`}
    >
      <div
        aria-hidden
        className={`flex h-11 w-11 items-center justify-center text-[22px] ${
          isEarned ? "" : "grayscale"
        }`}
      >
        {badge.icon}
      </div>
      <div>
        <div className="flex items-baseline gap-2">
          <span className="font-display font-medium text-[16px]">
            {badge.name}
          </span>
          <span className="font-display text-[12px] text-muted italic">
            {badge.jp}
          </span>
        </div>
        <p className="mt-1 font-display text-[13.5px] text-ink-soft leading-[1.4]">
          {isEarned ? badge.description : badge.criteria}
        </p>
        <div className="mt-2 font-mono text-[9.5px] uppercase tracking-[0.18em]">
          {isEarned ? (
            <span className="text-vermilion">
              Earned{earnedAt ? ` · ${formatEarned(earnedAt)}` : ""}
            </span>
          ) : (
            <span className="text-muted">Locked · 未獲得</span>
          )}
        </div>
      </div>
    </li>
  );
}

function formatEarned(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) {
    return "";
  }
  return d.toLocaleDateString([], { month: "short", day: "numeric" });
}
