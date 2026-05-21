"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useState } from "react";
import { useAuth } from "@/lib/auth";
import { db } from "@/lib/db";
import { track } from "@/lib/track";
import { useRewardToast } from "./reward-toast";

export function CheckInButton() {
  const { member } = useAuth();
  const qc = useQueryClient();
  const { push: pushToast } = useRewardToast();
  const [loading, setLoading] = useState(false);

  const { data: checkedIn } = useQuery({
    queryKey: ["checkin-today", member?.id],
    enabled: !!member,
    queryFn: async () => {
      const today = new Date().toISOString().slice(0, 10);
      const logs = await db.behaviorLogs
        .where("memberId")
        .equals(member?.id ?? "")
        .toArray();
      return logs.some(
        (l) => l.action === "check_in" && l.createdAt.slice(0, 10) === today
      );
    },
  });

  const handleCheckIn = useCallback(async () => {
    if (!member || checkedIn || loading) {
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "check_in", memberId: member.id }),
      });
      if (res.ok) {
        const data = (await res.json()) as { points?: number };
        track("daily_check_in", { memberId: member.id });
        // Only surface the reward toast when a reward actually fires —
        // a 409 (already checked in today) goes through `if (res.ok)`,
        // but we additionally skip a no-points response defensively
        // per acceptance #4 of issue #79.
        if (typeof data.points === "number" && data.points > 0) {
          pushToast({ kind: "check_in", points: data.points });
        }
        qc.invalidateQueries({ queryKey: ["checkin-today"] });
        qc.invalidateQueries({ queryKey: ["growth"] });
        qc.invalidateQueries({ queryKey: ["growth-items"] });
        qc.invalidateQueries({ queryKey: ["ledger"] });
        qc.invalidateQueries({ queryKey: ["badge-shelf"] });
      }
    } finally {
      setLoading(false);
    }
  }, [member, checkedIn, loading, qc, pushToast]);

  if (!member) {
    return null;
  }

  return (
    <button
      className={`flex items-center gap-2 px-[18px] py-3 font-mono text-[11px] uppercase tracking-[0.18em] ${
        checkedIn
          ? "border border-line bg-paper text-muted"
          : "bg-vermilion text-cream"
      }`}
      disabled={!!checkedIn || loading}
      onClick={handleCheckIn}
      type="button"
    >
      {checkedIn ? "✓ Checked in today" : "Check in · +5 NUT"}
    </button>
  );
}
