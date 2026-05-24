"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { CmsShell } from "@/_components/cms-shell";
import { can, useCmsAuth } from "@/lib/cms-auth";
import { COMMUNITY_REWARD_RULE_LABELS } from "@/lib/community-rewards";

interface RewardRuleDTO {
  action: string;
  enabled: boolean;
  id: string;
  limitType: string;
  points: number;
}

const LIMIT_TYPES = [
  { value: "per-article", label: "Per article" },
  { value: "per-day", label: "Per day" },
  { value: "total", label: "Total (once)" },
  { value: "campaign", label: "Per campaign" },
] as const;

const ACTION_LABELS: Record<string, { en: string; jp: string }> = {
  read_complete: { en: "Read complete", jp: "読了" },
  daily_check_in: { en: "Daily check-in", jp: "日次サイン" },
  collect: { en: "Collect", jp: "保存" },
  // Community rules (issue #104). Source-of-truth for the labels lives
  // in `lib/community-rewards.ts` so the CMS rules editor and the
  // runtime handlers stay in sync.
  ...COMMUNITY_REWARD_RULE_LABELS,
};

function actionLabel(action: string) {
  return ACTION_LABELS[action] ?? { en: action.replace(/_/g, " "), jp: "" };
}

interface RuleRowProps {
  canEdit: boolean;
  onSave: (next: RewardRuleDTO) => void;
  rule: RewardRuleDTO;
  saving: boolean;
}

function RuleRow({ canEdit, onSave, rule, saving }: RuleRowProps) {
  const [points, setPoints] = useState<number>(rule.points);
  const [enabled, setEnabled] = useState<boolean>(rule.enabled);
  const [limitType, setLimitType] = useState<string>(rule.limitType);

  // Re-sync if upstream rule changes (e.g., after invalidation)
  useEffect(() => {
    setPoints(rule.points);
    setEnabled(rule.enabled);
    setLimitType(rule.limitType);
  }, [rule.points, rule.enabled, rule.limitType]);

  const dirty =
    points !== rule.points ||
    enabled !== rule.enabled ||
    limitType !== rule.limitType;

  const label = actionLabel(rule.action);

  return (
    <div className="grid grid-cols-[200px_120px_140px_180px_auto_auto] items-center gap-4 border-line border-b px-[18px] py-[14px] max-[860px]:grid-cols-1">
      <div>
        <div className="font-medium font-sans text-[13px]">{label.en}</div>
        {label.jp && (
          <div className="font-display text-[12px] text-muted italic">
            {label.jp}
          </div>
        )}
        <div className="mt-[2px] font-mono text-[10px] text-muted tracking-[0.06em]">
          {rule.action}
        </div>
      </div>

      <label className="flex items-center gap-2 font-mono text-[10.5px] text-ink uppercase tracking-[0.14em]">
        <input
          checked={enabled}
          disabled={!canEdit}
          onChange={(e) => setEnabled(e.target.checked)}
          type="checkbox"
        />
        {enabled ? "Enabled" : "Disabled"}
      </label>

      <label className="flex items-center gap-2">
        <input
          aria-label={`Points for ${rule.action}`}
          className="w-[90px] border border-line bg-paper px-2 py-1 font-mono text-[12px] disabled:opacity-50"
          disabled={!canEdit}
          min={0}
          onChange={(e) => setPoints(Number(e.target.value) || 0)}
          type="number"
          value={points}
        />
        <span className="font-mono text-[10px] text-muted uppercase tracking-[0.12em]">
          pts
        </span>
      </label>

      <select
        aria-label={`Limit type for ${rule.action}`}
        className="border border-line bg-paper px-2 py-1 font-sans text-[12px] disabled:opacity-50"
        disabled={!canEdit}
        onChange={(e) => setLimitType(e.target.value)}
        value={limitType}
      >
        {LIMIT_TYPES.map((lt) => (
          <option key={lt.value} value={lt.value}>
            {lt.label}
          </option>
        ))}
      </select>

      <span className="font-mono text-[10px] text-muted uppercase tracking-[0.12em] max-[860px]:hidden">
        {dirty ? "Unsaved" : "Saved"}
      </span>

      <button
        className="bg-ink px-3 py-[6px] font-mono text-[10px] text-cream uppercase tracking-[0.14em] disabled:opacity-40"
        disabled={!(canEdit && dirty) || saving}
        onClick={() =>
          onSave({
            ...rule,
            points,
            enabled,
            limitType,
          })
        }
        type="button"
      >
        {saving ? "Saving…" : "Save"}
      </button>
    </div>
  );
}

export default function RewardRulesPage() {
  const { role } = useCmsAuth();
  const qc = useQueryClient();
  const canEdit = can("manage_rules", role);

  const { data: rules = [], isLoading } = useQuery<RewardRuleDTO[]>({
    queryKey: ["cms-reward-rules"],
    queryFn: async () => {
      const res = await fetch("/api/cms/rules/rewards", {
        headers: { "x-cms-role": role },
      });
      return res.json();
    },
  });

  const [savingId, setSavingId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const updateRule = useMutation({
    mutationFn: async (next: RewardRuleDTO) => {
      const res = await fetch(`/api/cms/rules/rewards/${next.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "x-cms-role": role,
        },
        body: JSON.stringify({
          points: next.points,
          enabled: next.enabled,
          limitType: next.limitType,
        }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as {
          error?: string;
        };
        throw new Error(data.error || `Update failed (${res.status})`);
      }
      return (await res.json()) as RewardRuleDTO;
    },
    onMutate: (next) => {
      setSavingId(next.id);
      setErrorMessage(null);
    },
    onSettled: () => {
      setSavingId(null);
      qc.invalidateQueries({ queryKey: ["cms-reward-rules"] });
    },
    onError: (e: Error) => setErrorMessage(e.message),
  });

  return (
    <CmsShell active="rules" breadcrumb="Gamification / Reward rules · 報酬">
      <section className="px-8 pt-7 max-[860px]:px-5">
        <h1 className="m-0 font-display font-medium text-[36px] tracking-[-0.015em]">
          Reward rules<span className="text-vermilion">.</span>
          <span className="ml-[14px] font-display text-[16px] text-muted italic">
            行動報酬ルール
          </span>
        </h1>
        <p className="mt-2 max-w-[680px] font-display text-[14px] text-muted leading-[1.5]">
          Configure point values, enable/disable, and limit type per behavior
          rule. The reward pipeline reads these live — a disabled rule awards
          nothing.
        </p>

        {!canEdit && (
          <div className="mt-4 font-mono text-[11px] text-vermilion uppercase tracking-[0.14em]">
            Admin role required to edit reward rules.
          </div>
        )}

        {errorMessage && (
          <div className="mt-4 border border-vermilion bg-vermilion/5 px-4 py-2 font-mono text-[11px] text-vermilion">
            {errorMessage}
          </div>
        )}

        <div className="mt-6 border border-line bg-paper">
          <div className="grid grid-cols-[200px_120px_140px_180px_auto_auto] items-center gap-4 border-line border-b bg-cream px-[18px] py-[10px] font-mono text-[10px] text-muted uppercase tracking-[0.14em] max-[860px]:hidden">
            <span>Action</span>
            <span>Status</span>
            <span>Points</span>
            <span>Limit</span>
            <span />
            <span />
          </div>

          {isLoading && (
            <div className="px-[18px] py-6 font-mono text-[11px] text-muted uppercase tracking-[0.14em]">
              Loading…
            </div>
          )}

          {!isLoading && rules.length === 0 && (
            <div className="px-[18px] py-6 font-mono text-[11px] text-muted uppercase tracking-[0.14em]">
              No reward rules configured.
            </div>
          )}

          {rules.map((rule) => (
            <RuleRow
              canEdit={canEdit}
              key={rule.id}
              onSave={(next) => updateRule.mutate(next)}
              rule={rule}
              saving={savingId === rule.id}
            />
          ))}
        </div>
      </section>
      <div className="h-10" />
    </CmsShell>
  );
}
