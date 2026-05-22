"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useAuth } from "@/lib/auth";
import type { ReactionKind } from "@/lib/db";
import type { ReactionState } from "@/lib/reactions";

interface ButtonMeta {
  emoji: string;
  kind: ReactionKind;
  label: string;
  subtitle: string;
}

const BUTTONS: ButtonMeta[] = [
  { kind: "grew", emoji: "🌱", label: "grew me", subtitle: "育った" },
  { kind: "learned", emoji: "💡", label: "learned", subtitle: "学んだ" },
  { kind: "loved", emoji: "🤍", label: "loved", subtitle: "愛した" },
];

/**
 * Three themed reaction buttons for an article (issue #90).
 *
 * Logged-out readers see live counts and a sign-in CTA when they tap a
 * button. Signed-in members can toggle each kind on/off; their state
 * persists across reload via the storage layer's compound-unique
 * `[memberId+articleId+kind]` index.
 */
export function StoryReactions({ articleId }: { articleId: string }) {
  const { member, login } = useAuth();
  const queryClient = useQueryClient();
  const queryKey = ["reactions", articleId, member?.id ?? null];
  const [signInPrompt, setSignInPrompt] = useState(false);

  const stateQuery = useQuery<ReactionState>({
    queryKey,
    queryFn: async () => {
      const params = new URLSearchParams();
      if (member?.id) {
        params.set("memberId", member.id);
      }
      const url = `/api/articles/${encodeURIComponent(articleId)}/reactions${
        params.toString() ? `?${params}` : ""
      }`;
      const res = await fetch(url);
      if (!res.ok) {
        throw new Error("Failed to load reactions");
      }
      return (await res.json()) as ReactionState;
    },
  });

  const toggle = useMutation({
    mutationFn: async (kind: ReactionKind) => {
      if (!member) {
        throw new Error("Sign in to react");
      }
      const res = await fetch(
        `/api/articles/${encodeURIComponent(articleId)}/reactions`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ memberId: member.id, kind }),
        }
      );
      if (!res.ok) {
        throw new Error("Failed to toggle reaction");
      }
      return (await res.json()) as ReactionState & { active: boolean };
    },
    onSuccess: (next) => {
      // Skip a refetch round-trip and prime the cache from the response.
      queryClient.setQueryData<ReactionState>(queryKey, {
        counts: next.counts,
        mine: next.mine,
      });
    },
  });

  const counts = stateQuery.data?.counts ?? { grew: 0, learned: 0, loved: 0 };
  const mine = stateQuery.data?.mine ?? { grew: 0, learned: 0, loved: 0 };

  return (
    <section
      aria-label="Story reactions"
      className="mt-10 border-line border-t pt-6"
    >
      <div className="mb-4 font-mono text-[10px] text-muted uppercase tracking-[0.22em]">
        Reactions · リアクション
      </div>
      <fieldset className="flex flex-wrap gap-3 border-0 p-0">
        <legend className="sr-only">Tap a reaction to share what landed</legend>
        {BUTTONS.map((b) => {
          const active = mine[b.kind] > 0;
          const count = counts[b.kind];
          return (
            <button
              aria-label={`${b.label}, ${count} reactions${active ? ", you reacted" : ""}`}
              aria-pressed={active}
              className={`flex items-center gap-2 border px-3 py-2 font-mono text-[11px] uppercase tracking-[0.14em] transition-colors ${
                active
                  ? "border-vermilion bg-vermilion text-cream"
                  : "border-ink bg-paper text-ink hover:border-vermilion"
              }`}
              disabled={toggle.isPending}
              key={b.kind}
              onClick={() => {
                if (member) {
                  toggle.mutate(b.kind);
                  return;
                }
                setSignInPrompt(true);
              }}
              type="button"
            >
              <span aria-hidden className="text-[14px]">
                {b.emoji}
              </span>
              <span>{b.label}</span>
              <span
                className={`min-w-[1.5em] text-right tabular-nums ${
                  active ? "text-cream" : "text-muted"
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </fieldset>
      {signInPrompt && !member && (
        <div className="mt-3 flex items-center gap-3 border border-line bg-paper p-3">
          <p className="font-display text-[14px] text-ink-soft leading-[1.4]">
            Sign in to react.
          </p>
          <button
            className="ml-auto border border-ink bg-ink px-[14px] py-[6px] font-mono text-[10px] text-cream uppercase tracking-[0.18em]"
            onClick={() => {
              login();
              setSignInPrompt(false);
            }}
            type="button"
          >
            Sign in · ログイン
          </button>
        </div>
      )}
    </section>
  );
}
