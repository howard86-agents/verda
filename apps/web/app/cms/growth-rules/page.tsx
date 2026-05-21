"use client";

// CMS · Growth-rule settings (issue #30) — admin-only.
//
// Lets an admin edit per-level threshold + display names that drive
// `growthItem` level computation on /grow. Also exposes the growth-item
// quantity cap (養成物數量上限). Cap edits persist into `growthConfig`;
// enforcement is deferred to issue #67's multi-collectible model.

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { CmsShell } from "@/_components/cms-shell";
import { can, useCmsAuth } from "@/lib/cms-auth";

interface GrowthRuleDTO {
  jp: string;
  level: number;
  name: string;
  threshold: number;
}

interface GrowthConfigDTO {
  id: string;
  maxItemsPerMember: number;
}

interface GrowthSettingsDTO {
  config: GrowthConfigDTO;
  rules: GrowthRuleDTO[];
}

interface RuleRowProps {
  canEdit: boolean;
  onSave: (next: GrowthRuleDTO) => void;
  rule: GrowthRuleDTO;
  saving: boolean;
}

function RuleRow({ canEdit, onSave, rule, saving }: RuleRowProps) {
  const [name, setName] = useState<string>(rule.name);
  const [jp, setJp] = useState<string>(rule.jp);
  const [threshold, setThreshold] = useState<number>(rule.threshold);

  // Re-sync if upstream changes (after invalidation / external edits).
  useEffect(() => {
    setName(rule.name);
    setJp(rule.jp);
    setThreshold(rule.threshold);
  }, [rule.name, rule.jp, rule.threshold]);

  const dirty =
    name !== rule.name || jp !== rule.jp || threshold !== rule.threshold;
  const trimmedName = name.trim();
  const valid =
    trimmedName.length > 0 && Number.isFinite(threshold) && threshold >= 0;

  return (
    <div className="grid grid-cols-[80px_1fr_140px_140px_auto_auto] items-center gap-4 border-line border-b px-[18px] py-[14px] max-[860px]:grid-cols-1">
      <div>
        <div className="font-mono text-[10px] text-muted uppercase tracking-[0.18em]">
          LV {String(rule.level).padStart(2, "0")}
        </div>
        <div className="mt-[2px] font-mono text-[10px] text-muted tracking-[0.06em]">
          level {rule.level}
        </div>
      </div>

      <label className="flex flex-col gap-1">
        <span className="font-mono text-[9.5px] text-muted uppercase tracking-[0.14em] max-[860px]:hidden">
          Display name
        </span>
        <input
          aria-label={`Name for level ${rule.level}`}
          className="border border-line bg-paper px-2 py-1 font-sans text-[13px] disabled:opacity-50"
          disabled={!canEdit}
          onChange={(e) => setName(e.target.value)}
          type="text"
          value={name}
        />
      </label>

      <label className="flex flex-col gap-1">
        <span className="font-mono text-[9.5px] text-muted uppercase tracking-[0.14em] max-[860px]:hidden">
          日本語
        </span>
        <input
          aria-label={`Japanese name for level ${rule.level}`}
          className="border border-line bg-paper px-2 py-1 font-display text-[13px] italic disabled:opacity-50"
          disabled={!canEdit}
          onChange={(e) => setJp(e.target.value)}
          type="text"
          value={jp}
        />
      </label>

      <label className="flex flex-col gap-1">
        <span className="font-mono text-[9.5px] text-muted uppercase tracking-[0.14em] max-[860px]:hidden">
          Threshold (NUT)
        </span>
        <input
          aria-label={`Threshold for level ${rule.level}`}
          className="border border-line bg-paper px-2 py-1 font-mono text-[12px] disabled:opacity-50"
          disabled={!canEdit}
          min={0}
          onChange={(e) => setThreshold(Number(e.target.value) || 0)}
          type="number"
          value={threshold}
        />
      </label>

      <span className="font-mono text-[10px] text-muted uppercase tracking-[0.12em] max-[860px]:hidden">
        {dirty ? "Unsaved" : "Saved"}
      </span>

      <button
        className="bg-ink px-3 py-[6px] font-mono text-[10px] text-cream uppercase tracking-[0.14em] disabled:opacity-40"
        disabled={!(canEdit && dirty && valid) || saving}
        onClick={() =>
          onSave({
            ...rule,
            name: trimmedName,
            jp: jp.trim(),
            threshold: Math.max(0, Math.floor(threshold)),
          })
        }
        type="button"
      >
        {saving ? "Saving…" : "Save"}
      </button>
    </div>
  );
}

interface CapRowProps {
  canEdit: boolean;
  config: GrowthConfigDTO;
  onSave: (next: number) => void;
  saving: boolean;
}

function CapRow({ canEdit, config, onSave, saving }: CapRowProps) {
  const [cap, setCap] = useState<number>(config.maxItemsPerMember);

  useEffect(() => {
    setCap(config.maxItemsPerMember);
  }, [config.maxItemsPerMember]);

  const dirty = cap !== config.maxItemsPerMember;
  const valid = Number.isFinite(cap) && cap >= 0;

  return (
    <div className="grid grid-cols-[1fr_180px_auto_auto] items-end gap-4 px-[18px] py-[16px] max-[860px]:grid-cols-1">
      <div>
        <div className="font-medium font-sans text-[14px]">
          Max growth items per member
        </div>
        <div className="font-display text-[13px] text-muted italic">
          養成物數量上限
        </div>
        <p className="mt-[6px] max-w-[520px] font-display text-[12.5px] text-muted leading-[1.5]">
          Stored configuration only. Enforcement (acquisition rules,
          cap-blocks-new-items) is implemented as part of the multi-collectible
          model in issue #67.
        </p>
      </div>

      <label className="flex flex-col gap-1">
        <span className="font-mono text-[9.5px] text-muted uppercase tracking-[0.14em]">
          Cap (items)
        </span>
        <input
          aria-label="Max items per member"
          className="border border-line bg-paper px-2 py-1 font-mono text-[12px] disabled:opacity-50"
          disabled={!canEdit}
          min={0}
          onChange={(e) => setCap(Number(e.target.value) || 0)}
          type="number"
          value={cap}
        />
      </label>

      <span className="font-mono text-[10px] text-muted uppercase tracking-[0.12em] max-[860px]:hidden">
        {dirty ? "Unsaved" : "Saved"}
      </span>

      <button
        className="bg-ink px-3 py-[6px] font-mono text-[10px] text-cream uppercase tracking-[0.14em] disabled:opacity-40"
        disabled={!(canEdit && dirty && valid) || saving}
        onClick={() => onSave(Math.max(0, Math.floor(cap)))}
        type="button"
      >
        {saving ? "Saving…" : "Save"}
      </button>
    </div>
  );
}

export default function GrowthRulesPage() {
  const { role } = useCmsAuth();
  const qc = useQueryClient();
  const canEdit = can("manage_rules", role);

  const { data, isLoading } = useQuery<GrowthSettingsDTO>({
    queryKey: ["cms-growth-rules"],
    queryFn: async () => {
      const res = await fetch("/api/cms/rules/growth");
      return res.json();
    },
  });

  const [savingLevel, setSavingLevel] = useState<number | null>(null);
  const [savingConfig, setSavingConfig] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const updateRule = useMutation({
    mutationFn: async (next: GrowthRuleDTO) => {
      const res = await fetch(`/api/cms/rules/growth/${next.level}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "x-cms-role": role,
        },
        body: JSON.stringify({
          name: next.name,
          jp: next.jp,
          threshold: next.threshold,
        }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as {
          error?: string;
        };
        throw new Error(body.error || `Update failed (${res.status})`);
      }
      return (await res.json()) as GrowthRuleDTO;
    },
    onMutate: (next) => {
      setSavingLevel(next.level);
      setErrorMessage(null);
    },
    onSettled: () => {
      setSavingLevel(null);
      qc.invalidateQueries({ queryKey: ["cms-growth-rules"] });
      qc.invalidateQueries({ queryKey: ["growth-rules"] });
    },
    onError: (e: Error) => setErrorMessage(e.message),
  });

  const updateCap = useMutation({
    mutationFn: async (maxItemsPerMember: number) => {
      const res = await fetch("/api/cms/rules/growth/config", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "x-cms-role": role,
        },
        body: JSON.stringify({ maxItemsPerMember }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as {
          error?: string;
        };
        throw new Error(body.error || `Update failed (${res.status})`);
      }
      return (await res.json()) as GrowthConfigDTO;
    },
    onMutate: () => {
      setSavingConfig(true);
      setErrorMessage(null);
    },
    onSettled: () => {
      setSavingConfig(false);
      qc.invalidateQueries({ queryKey: ["cms-growth-rules"] });
    },
    onError: (e: Error) => setErrorMessage(e.message),
  });

  const rules = data?.rules ?? [];
  const config = data?.config;

  return (
    <CmsShell active="rules" breadcrumb="Gamification / Growth rules · 成長">
      <section className="px-8 pt-7 max-[860px]:px-5">
        <h1 className="m-0 font-display font-medium text-[36px] tracking-[-0.015em]">
          Growth rules<span className="text-vermilion">.</span>
          <span className="ml-[14px] font-display text-[16px] text-muted italic">
            成長ルール
          </span>
        </h1>
        <p className="mt-2 max-w-[680px] font-display text-[14px] text-muted leading-[1.5]">
          Edit level thresholds and display names. Updates apply live — the next
          time a member earns nutrients, their growth-item level recomputes
          against these thresholds, and the grow page renders the new names and
          next-level requirements.
        </p>

        {!canEdit && (
          <div className="mt-4 font-mono text-[11px] text-vermilion uppercase tracking-[0.14em]">
            Admin role required to edit growth rules.
          </div>
        )}

        {errorMessage && (
          <div className="mt-4 border border-vermilion bg-vermilion/5 px-4 py-2 font-mono text-[11px] text-vermilion">
            {errorMessage}
          </div>
        )}

        <div className="mt-6 border border-line bg-paper">
          <div className="border-line border-b bg-cream px-[18px] py-[10px] font-mono text-[10px] text-muted uppercase tracking-[0.14em]">
            Level thresholds · 段階
          </div>

          <div className="grid grid-cols-[80px_1fr_140px_140px_auto_auto] items-center gap-4 border-line border-b bg-cream px-[18px] py-[10px] font-mono text-[10px] text-muted uppercase tracking-[0.14em] max-[860px]:hidden">
            <span>Level</span>
            <span>Display name</span>
            <span>日本語</span>
            <span>Threshold</span>
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
              No growth rules configured.
            </div>
          )}

          {rules.map((rule) => (
            <RuleRow
              canEdit={canEdit}
              key={rule.level}
              onSave={(next) => updateRule.mutate(next)}
              rule={rule}
              saving={savingLevel === rule.level}
            />
          ))}
        </div>

        <div className="mt-6 border border-line bg-paper">
          <div className="border-line border-b bg-cream px-[18px] py-[10px] font-mono text-[10px] text-muted uppercase tracking-[0.14em]">
            Growth-item quantity cap · 養成物數量上限
          </div>
          {!config && (
            <div className="px-[18px] py-6 font-mono text-[11px] text-muted uppercase tracking-[0.14em]">
              Loading…
            </div>
          )}
          {config && (
            <CapRow
              canEdit={canEdit}
              config={config}
              onSave={(next) => updateCap.mutate(next)}
              saving={savingConfig}
            />
          )}
        </div>
      </section>
      <div className="h-10" />
    </CmsShell>
  );
}
