"use client";

// CMS · Member detail. Live balance from pointLedger, growth from
// growthItems, saved articles from collections, behavior log from
// behaviorLogs, and the per-member audit trail. Customer-service /
// admin can apply manual point adjustments (writes pointLedger +
// auditLog with before/after) and admin can soft-delete the member.

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import { CmsShell } from "@/_components/cms-shell";
import { IconDrop } from "@/_components/glyphs";
import { StatSlab } from "@/_components/stat-slab";
import { can, useCmsAuth } from "@/lib/cms-auth";
import type { Article, AuditLog, BehaviorLog, PointLedger } from "@/lib/db";

interface MemberPayload {
  auditLog: AuditLog[];
  balance: number;
  behaviorLogs: BehaviorLog[];
  collections: Article[];
  growth: {
    currentJp: string;
    currentName: string;
    level: number;
    nextName: string | null;
    nextThreshold: number | null;
    nutrients: number;
  };
  ledger: PointLedger[];
  member: {
    deletedAt: string | null;
    email: string;
    id: string;
    joined: string;
    name: string;
  };
}

function formatTime(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) {
    return iso;
  }
  return d.toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function auditAmountLabel(a: AuditLog): string {
  if (a.action === "member_delete") {
    return "DEL";
  }
  if (a.amount == null) {
    return "";
  }
  return a.amount >= 0 ? `+${a.amount}` : String(a.amount);
}

function PointAdjustForm({
  canAdjust,
  memberId,
  balance,
  onSuccess,
}: {
  canAdjust: boolean;
  memberId: string;
  balance: number;
  onSuccess: () => void;
}) {
  const { role } = useCmsAuth();
  const [direction, setDirection] = useState<"add" | "deduct">("add");
  const [amount, setAmount] = useState("25");
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  const adjust = useMutation({
    mutationFn: async () => {
      const numeric = Number(amount);
      if (!Number.isFinite(numeric) || numeric <= 0) {
        throw new Error("Enter a positive number");
      }
      if (!reason.trim()) {
        throw new Error("Reason is required");
      }
      const signed = direction === "add" ? numeric : -numeric;
      const res = await fetch(`/api/cms/members/${memberId}/point-adjust`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-cms-role": role,
        },
        body: JSON.stringify({ amount: signed, reason: reason.trim() }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? `Adjustment failed (HTTP ${res.status})`);
      }
      return (await res.json()) as {
        balanceAfter: number;
        balanceBefore: number;
      };
    },
    onSuccess: (result) => {
      setError(null);
      setFeedback(`Adjusted: ${result.balanceBefore} → ${result.balanceAfter}`);
      setReason("");
      onSuccess();
    },
    onError: (e: Error) => {
      setFeedback(null);
      setError(e.message);
    },
  });

  if (!canAdjust) {
    return (
      <div className="border border-line bg-paper p-[18px]">
        <div className="font-mono text-[10.5px] text-ink uppercase tracking-[0.22em]">
          Manual adjustment
          <span className="ml-2 font-display text-[12px] text-muted normal-case italic tracking-normal">
            手動調整
          </span>
        </div>
        <p className="mt-3 font-mono text-[11px] text-vermilion uppercase tracking-[0.14em]">
          Customer-service or admin role required.
        </p>
      </div>
    );
  }

  const numericAmount = Number(amount);
  const signed = direction === "add" ? numericAmount : -numericAmount;
  const projected = Number.isFinite(numericAmount) ? balance + signed : balance;

  return (
    <div className="border border-ink bg-paper p-[18px]">
      <div className="flex items-baseline gap-2 font-mono text-[10.5px] text-ink uppercase tracking-[0.22em]">
        Manual adjustment
        <span className="font-display text-[12px] text-muted normal-case italic tracking-normal">
          手動調整
        </span>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-[10px]">
        <button
          aria-pressed={direction === "add"}
          className={`border py-2 font-mono text-[11px] uppercase tracking-[0.14em] ${
            direction === "add"
              ? "border-vermilion bg-vermilion/10 text-vermilion"
              : "border-line bg-paper text-muted"
          }`}
          onClick={() => setDirection("add")}
          type="button"
        >
          + Add
        </button>
        <button
          aria-pressed={direction === "deduct"}
          className={`border py-2 font-mono text-[11px] uppercase tracking-[0.14em] ${
            direction === "deduct"
              ? "border-ink bg-ink text-cream"
              : "border-line bg-paper text-muted"
          }`}
          onClick={() => setDirection("deduct")}
          type="button"
        >
          − Deduct
        </button>
      </div>
      <div className="mt-[14px] flex items-baseline gap-2 border border-line bg-paper-alt px-3 py-[10px]">
        <label
          className="font-display font-medium text-[28px] text-vermilion"
          htmlFor="adjust-amount"
        >
          {direction === "add" ? "+" : "−"}
        </label>
        <input
          className="w-16 border-0 bg-transparent font-display font-medium text-[28px] text-vermilion outline-none"
          id="adjust-amount"
          inputMode="numeric"
          min="1"
          onChange={(e) => setAmount(e.target.value)}
          type="number"
          value={amount}
        />
        <span className="font-mono text-[10.5px] text-muted uppercase tracking-[0.12em]">
          nutrients · 滋養
        </span>
        <span className="ml-auto font-mono text-[10px] text-muted tracking-[0.1em]">
          NEW BAL: {projected}
        </span>
      </div>
      <div className="mt-[10px]">
        <label
          className="mb-1 block font-mono text-[9.5px] text-muted uppercase tracking-[0.18em]"
          htmlFor="adjust-reason"
        >
          Reason · 理由 (required)
        </label>
        <textarea
          className="w-full resize-none border border-ink bg-white px-[10px] py-2 font-sans text-[13px] text-ink"
          id="adjust-reason"
          onChange={(e) => setReason(e.target.value)}
          placeholder="Ticket #, customer notes, etc."
          rows={2}
          value={reason}
        />
      </div>
      {error && (
        <div className="mt-2 font-mono text-[10.5px] text-vermilion uppercase tracking-[0.14em]">
          {error}
        </div>
      )}
      {feedback && (
        <div className="mt-2 font-mono text-[10.5px] text-ink uppercase tracking-[0.14em]">
          {feedback}
        </div>
      )}
      <button
        className="mt-[14px] w-full bg-vermilion py-[10px] font-mono text-[11px] text-cream uppercase tracking-[0.18em] disabled:opacity-50"
        disabled={adjust.isPending}
        onClick={() => adjust.mutate()}
        type="button"
      >
        {adjust.isPending ? "Applying…" : "Apply & sign audit"}
      </button>
      <div className="mt-[10px] font-mono text-[9.5px] text-muted uppercase tracking-[0.06em]">
        Logged as ledger txn + audit row · cannot be deleted
      </div>
    </div>
  );
}

function RemoveMemberButton({
  canDelete,
  memberId,
  isDeleted,
  onSuccess,
}: {
  canDelete: boolean;
  memberId: string;
  isDeleted: boolean;
  onSuccess: () => void;
}) {
  const { role } = useCmsAuth();
  const [feedback, setFeedback] = useState<string | null>(null);

  const remove = useMutation({
    mutationFn: async () => {
      // biome-ignore lint/suspicious/noAlert: dev-only CMS tool
      const reason = window.prompt(
        "Reason for removal (required, recorded in audit log):"
      );
      if (!reason?.trim()) {
        throw new Error("Cancelled — a reason is required");
      }
      const res = await fetch(
        `/api/cms/members/${memberId}?reason=${encodeURIComponent(reason.trim())}`,
        {
          method: "DELETE",
          headers: { "x-cms-role": role },
        }
      );
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? `Delete failed (HTTP ${res.status})`);
      }
      return (await res.json()) as { deletedAt: string };
    },
    onSuccess: () => {
      setFeedback("Member soft-deleted");
      onSuccess();
    },
    onError: (e: Error) => setFeedback(e.message),
  });

  if (!canDelete) {
    return null;
  }
  if (isDeleted) {
    return (
      <span className="border border-line bg-paper px-3 py-2 font-mono text-[11px] text-muted uppercase tracking-[0.16em]">
        Already removed
      </span>
    );
  }

  return (
    <span className="flex flex-col items-end gap-1">
      <button
        className="border border-vermilion bg-paper px-3 py-2 font-mono text-[11px] text-vermilion uppercase tracking-[0.16em] disabled:opacity-50"
        disabled={remove.isPending}
        onClick={() => remove.mutate()}
        type="button"
      >
        {remove.isPending ? "Removing…" : "Remove member"}
      </button>
      {feedback && (
        <span className="font-mono text-[10px] text-muted uppercase tracking-[0.12em]">
          {feedback}
        </span>
      )}
    </span>
  );
}

export default function CmsMemberPage() {
  const { role } = useCmsAuth();
  const qc = useQueryClient();
  const routeParams = useParams<{ id: string }>();
  const memberId = routeParams.id;

  const { data, isLoading, error } = useQuery({
    queryKey: ["cms-member", memberId],
    queryFn: async () => {
      const res = await fetch(`/api/cms/members/${memberId}`);
      if (!res.ok) {
        if (res.status === 404) {
          throw new Error("Member not found");
        }
        throw new Error(`Failed to load member (HTTP ${res.status})`);
      }
      return (await res.json()) as MemberPayload;
    },
  });

  const refresh = () => {
    qc.invalidateQueries({ queryKey: ["cms-member", memberId] });
    qc.invalidateQueries({ queryKey: ["cms-members"] });
  };

  const canAdjust = can("point_adjust", role);
  const canDelete = can("member_delete", role);

  if (isLoading) {
    return (
      <CmsShell active="members" breadcrumb="Members · 会員">
        <p className="px-8 pt-7 font-mono text-[12px] text-muted uppercase tracking-[0.14em]">
          Loading…
        </p>
      </CmsShell>
    );
  }

  if (error || !data) {
    return (
      <CmsShell active="members" breadcrumb="Members · 会員">
        <div className="px-8 pt-7">
          <p className="font-mono text-[12px] text-vermilion uppercase tracking-[0.14em]">
            {error instanceof Error ? error.message : "Failed to load member"}
          </p>
          <Link
            className="mt-4 inline-block border border-line bg-paper px-3 py-2 font-mono text-[11px] text-ink uppercase tracking-[0.16em]"
            href="/cms/members"
          >
            ← Back to members
          </Link>
        </div>
      </CmsShell>
    );
  }

  const {
    member,
    balance,
    growth,
    ledger,
    behaviorLogs,
    collections,
    auditLog,
  } = data;
  const initial = member.name.charAt(0).toUpperCase();
  const isDeleted = !!member.deletedAt;

  return (
    <CmsShell
      actions={
        <RemoveMemberButton
          canDelete={canDelete}
          isDeleted={isDeleted}
          memberId={member.id}
          onSuccess={refresh}
        />
      }
      active="members"
      breadcrumb={`Members / ${member.name}`}
    >
      <section className="px-8 pt-6 max-[860px]:px-5">
        {/* Header */}
        <div className="grid grid-cols-[88px_1fr_auto] items-center gap-[22px] max-[700px]:grid-cols-1">
          <div className="flex size-[88px] items-center justify-center bg-ink font-display font-medium text-[38px] text-cream">
            {initial}
          </div>
          <div>
            <div className="font-mono text-[10px] text-muted uppercase tracking-[0.22em]">
              {member.id} · {member.joined}
            </div>
            <h1 className="mt-1 mb-0 font-display font-medium text-[36px] leading-none tracking-[-0.015em]">
              {member.name}
              <span className="text-vermilion">.</span>
            </h1>
            <div className="mt-2 flex flex-wrap items-center gap-[14px] font-mono text-[10.5px] text-muted uppercase tracking-[0.1em]">
              <span className="flex items-center gap-[6px]">
                <span
                  className={`size-[6px] ${isDeleted ? "bg-muted" : "bg-vermilion"}`}
                />
                {isDeleted ? "REMOVED" : "ACTIVE"}
              </span>
              <span>·</span>
              <span>{member.email}</span>
              <span>·</span>
              <span>
                Lv {String(growth.level).padStart(2, "0")} ·{" "}
                {growth.currentName}
              </span>
              {isDeleted && member.deletedAt && (
                <>
                  <span>·</span>
                  <span className="text-vermilion">
                    Removed {formatTime(member.deletedAt)}
                  </span>
                </>
              )}
            </div>
          </div>
          <Link
            className="border border-line bg-paper px-3 py-2 font-mono text-[11px] text-ink uppercase tracking-[0.14em] max-[700px]:justify-self-start"
            href="/cms/members"
          >
            ← Members
          </Link>
        </div>

        {/* Stats */}
        <div className="mt-6 grid grid-cols-5 border border-ink max-[700px]:grid-cols-2">
          <StatSlab accent en="Nutrients" jp="滋養" n={String(balance)} />
          <StatSlab
            divider
            en="Growth"
            jp={growth.currentJp}
            n={`Lv ${String(growth.level).padStart(2, "0")}`}
          />
          <StatSlab
            divider
            en="Saved"
            jp="保存"
            n={String(collections.length)}
          />
          <StatSlab
            divider
            en="Behaviour"
            jp="行動"
            n={String(behaviorLogs.length)}
          />
          <StatSlab
            divider
            en="Next"
            jp={growth.nextName ?? "—"}
            n={
              growth.nextThreshold == null ? "—" : String(growth.nextThreshold)
            }
          />
        </div>

        {/* Main grid */}
        <div className="mt-7 grid grid-cols-[1.4fr_1fr] gap-6 max-[1000px]:grid-cols-1">
          {/* Behaviour log + collection + ledger */}
          <div className="flex flex-col gap-7">
            {/* Behaviour log */}
            <div>
              <div className="flex items-baseline justify-between border-ink border-b pb-2">
                <div>
                  <div className="font-mono text-[10.5px] text-ink uppercase tracking-[0.22em]">
                    Behaviour log
                  </div>
                  <div className="mt-[2px] font-display text-[18px] text-muted italic">
                    行動の記録
                  </div>
                </div>
                <div className="font-mono text-[10px] text-muted uppercase tracking-[0.14em]">
                  {behaviorLogs.length} events
                </div>
              </div>
              {behaviorLogs.length === 0 && (
                <p className="py-6 font-mono text-[11px] text-muted uppercase tracking-[0.14em]">
                  No behaviour recorded yet.
                </p>
              )}
              <div className="overflow-x-auto">
                <div className="min-w-[480px]">
                  {behaviorLogs.map((b) => (
                    <div
                      className="grid grid-cols-[160px_1fr_140px] items-center gap-[14px] border-line border-b py-3 font-sans text-[13px]"
                      key={`${b.createdAt}-${b.action}-${b.articleId ?? ""}`}
                    >
                      <span className="font-mono text-[10px] text-ink uppercase tracking-[0.12em]">
                        {b.action}
                      </span>
                      <span className="text-ink-soft">
                        {b.articleId ?? "—"}
                      </span>
                      <span className="font-mono text-[10.5px] text-muted tracking-[0.04em]">
                        {formatTime(b.createdAt)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Saved collection */}
            <div>
              <div className="flex items-baseline justify-between border-ink border-b pb-2">
                <div>
                  <div className="font-mono text-[10.5px] text-ink uppercase tracking-[0.22em]">
                    Saved · 保存
                  </div>
                  <div className="mt-[2px] font-display text-[18px] text-muted italic">
                    コレクション
                  </div>
                </div>
                <div className="font-mono text-[10px] text-muted uppercase tracking-[0.14em]">
                  {collections.length} articles
                </div>
              </div>
              {collections.length === 0 && (
                <p className="py-6 font-mono text-[11px] text-muted uppercase tracking-[0.14em]">
                  No saved articles.
                </p>
              )}
              {collections.map((a) => (
                <div
                  className="grid grid-cols-[1fr_120px_80px] items-center gap-[14px] border-line border-b py-3 font-sans text-[13px]"
                  key={a.id}
                >
                  <span className="text-ink">{a.title}</span>
                  <span className="font-mono text-[10px] text-muted uppercase tracking-[0.1em]">
                    {a.cat}
                  </span>
                  <span className="font-mono text-[10.5px] text-muted tracking-[0.04em]">
                    {a.date}
                  </span>
                </div>
              ))}
            </div>

            {/* Point ledger */}
            <div>
              <div className="flex items-baseline justify-between border-ink border-b pb-2">
                <div>
                  <div className="font-mono text-[10.5px] text-ink uppercase tracking-[0.22em]">
                    Point ledger
                  </div>
                  <div className="mt-[2px] font-display text-[18px] text-muted italic">
                    ポイント記録
                  </div>
                </div>
                <div className="font-mono text-[10px] text-muted uppercase tracking-[0.14em]">
                  {ledger.length} entries
                </div>
              </div>
              {ledger.length === 0 && (
                <p className="py-6 font-mono text-[11px] text-muted uppercase tracking-[0.14em]">
                  No ledger entries yet.
                </p>
              )}
              {ledger.map((l) => (
                <div
                  className="grid grid-cols-[80px_1fr_80px_140px] items-center gap-[14px] border-line border-b py-3 font-sans text-[13px]"
                  key={`${l.createdAt}-${l.amount}-${l.id ?? ""}`}
                >
                  <span
                    className={`flex items-center gap-1 font-display font-medium text-[16px] ${l.amount >= 0 ? "text-vermilion" : "text-muted"}`}
                  >
                    {l.amount >= 0 && (
                      <span className="inline-flex text-vermilion">
                        <IconDrop />
                      </span>
                    )}
                    {l.amount >= 0 ? `+${l.amount}` : l.amount}
                  </span>
                  <span className="text-ink-soft">{l.reason}</span>
                  <span className="font-mono text-[10.5px] text-muted tracking-[0.04em]">
                    bal {l.balanceAfter}
                  </span>
                  <span className="font-mono text-[10.5px] text-muted tracking-[0.04em]">
                    {formatTime(l.createdAt)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Right column — adjust + audit */}
          <div className="flex flex-col gap-5">
            <PointAdjustForm
              balance={balance}
              canAdjust={canAdjust && !isDeleted}
              memberId={member.id}
              onSuccess={refresh}
            />

            <div>
              <div className="flex items-baseline justify-between border-ink border-b pb-2">
                <div className="font-mono text-[10.5px] text-ink uppercase tracking-[0.22em]">
                  Audit · 監査
                </div>
                <div className="font-mono text-[10px] text-muted uppercase tracking-[0.14em]">
                  {auditLog.length} entries
                </div>
              </div>
              {auditLog.length === 0 && (
                <p className="py-6 font-mono text-[11px] text-muted uppercase tracking-[0.14em]">
                  No audit entries yet.
                </p>
              )}
              {auditLog.map((a) => (
                <div
                  className="grid grid-cols-[60px_1fr_auto] gap-[10px] border-line border-b py-[10px]"
                  key={`${a.createdAt}-${a.id ?? a.action}`}
                >
                  <span
                    className={`font-display font-medium text-[16px] ${a.action === "member_delete" ? "text-muted" : "text-vermilion"}`}
                  >
                    {auditAmountLabel(a)}
                  </span>
                  <div>
                    <div className="font-sans text-[13px]">{a.reason}</div>
                    <div className="mt-[2px] font-mono text-[10px] text-muted tracking-[0.06em]">
                      by {a.adminId}
                      {a.action === "point_adjust" &&
                        a.balanceBefore != null &&
                        a.balanceAfter != null && (
                          <>
                            {" · "}bal {a.balanceBefore} → {a.balanceAfter}
                          </>
                        )}
                    </div>
                  </div>
                  <span className="font-mono text-[10px] text-muted tracking-[0.06em]">
                    {formatTime(a.createdAt)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="h-[60px]" />
      </section>
    </CmsShell>
  );
}
