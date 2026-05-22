"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useAuth } from "@/lib/auth";
import type { Comment } from "@/lib/db";

interface ListResponse {
  items: Comment[];
}

/**
 * Public, flat, newest-first comment thread for an article (issue #89).
 *
 * Reads stay public so logged-out users can still see the conversation.
 * Posting requires a signed-in member; logged-out users see a sign-in
 * CTA in place of the form. There is no editing or threading in this
 * slice; CMS moderation is wired up later (#101).
 */
export function ArticleComments({ articleId }: { articleId: string }) {
  const { member, login } = useAuth();
  const queryClient = useQueryClient();
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | null>(null);
  const queryKey = ["comments", articleId];

  const commentsQuery = useQuery<ListResponse>({
    queryKey,
    queryFn: async () => {
      const res = await fetch(
        `/api/articles/${encodeURIComponent(articleId)}/comments`
      );
      if (!res.ok) {
        throw new Error("Failed to load comments");
      }
      return (await res.json()) as ListResponse;
    },
  });

  const post = useMutation({
    mutationFn: async (text: string) => {
      if (!member) {
        throw new Error("Sign in to post a comment");
      }
      const res = await fetch(
        `/api/articles/${encodeURIComponent(articleId)}/comments`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            memberId: member.id,
            memberName: member.name,
            text,
          }),
        }
      );
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error ?? "Failed to post comment");
      }
      return (await res.json()) as Comment;
    },
    onSuccess: () => {
      setDraft("");
      setError(null);
      queryClient.invalidateQueries({ queryKey });
    },
    onError: (e: Error) => {
      setError(e.message);
    },
  });

  const items = commentsQuery.data?.items ?? [];

  return (
    <section aria-label="Comments" className="mt-12 border-line border-t pt-8">
      <header className="flex items-baseline justify-between border-ink border-b pb-3">
        <div>
          <div className="font-mono text-[10.5px] text-ink uppercase tracking-[0.22em]">
            Comments · コメント
          </div>
          <div className="mt-1 font-display font-medium text-[24px] tracking-[-0.005em]">
            {items.length === 0
              ? "No comments yet"
              : `${items.length} comment${items.length === 1 ? "" : "s"}`}
          </div>
        </div>
      </header>

      {member ? (
        <CommentForm
          disabled={post.isPending}
          draft={draft}
          error={error}
          onChange={(t) => setDraft(t)}
          onSubmit={() => {
            const trimmed = draft.trim();
            if (!trimmed) {
              setError("Comment cannot be empty");
              return;
            }
            post.mutate(trimmed);
          }}
        />
      ) : (
        <SignedOutPrompt onSignIn={login} />
      )}

      <CommentList
        isError={commentsQuery.isError}
        isLoading={commentsQuery.isLoading}
        items={items}
      />
    </section>
  );
}

function CommentForm({
  disabled,
  draft,
  error,
  onChange,
  onSubmit,
}: {
  disabled: boolean;
  draft: string;
  error: string | null;
  onChange: (next: string) => void;
  onSubmit: () => void;
}) {
  return (
    <form
      className="mt-6 flex flex-col gap-3"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit();
      }}
    >
      <label className="block">
        <span className="font-mono text-[10px] text-muted uppercase tracking-[0.18em]">
          Add a comment · コメントを書く
        </span>
        <textarea
          className="mt-2 w-full border border-line bg-paper p-3 font-display text-[15px] text-ink leading-[1.5]"
          disabled={disabled}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Share what landed for you."
          rows={3}
          value={draft}
        />
      </label>
      {error && (
        <p className="font-mono text-[10.5px] text-vermilion uppercase tracking-[0.16em]">
          {error}
        </p>
      )}
      <div className="flex justify-end">
        <button
          className="border border-ink bg-ink px-[20px] py-[10px] font-mono text-[10.5px] text-cream uppercase tracking-[0.18em] disabled:opacity-50"
          disabled={disabled || !draft.trim()}
          type="submit"
        >
          {disabled ? "Posting…" : "Post comment"}
        </button>
      </div>
    </form>
  );
}

function SignedOutPrompt({ onSignIn }: { onSignIn: () => void }) {
  return (
    <div className="mt-6 flex flex-col items-start gap-3 border border-line bg-paper p-4">
      <p className="font-display text-[15px] text-ink-soft leading-[1.5]">
        Sign in to leave a comment.
      </p>
      <button
        className="border border-ink bg-ink px-[18px] py-2 font-mono text-[10.5px] text-cream uppercase tracking-[0.18em]"
        onClick={onSignIn}
        type="button"
      >
        Sign in · ログイン
      </button>
    </div>
  );
}

function CommentList({
  isError,
  isLoading,
  items,
}: {
  isError: boolean;
  isLoading: boolean;
  items: Comment[];
}) {
  if (isLoading) {
    return (
      <p className="mt-6 font-mono text-[10.5px] text-muted uppercase tracking-[0.16em]">
        Loading comments…
      </p>
    );
  }
  if (isError) {
    return (
      <p className="mt-6 font-mono text-[10.5px] text-vermilion uppercase tracking-[0.16em]">
        Failed to load comments.
      </p>
    );
  }
  if (items.length === 0) {
    return (
      <p className="mt-6 font-mono text-[10.5px] text-muted uppercase tracking-[0.16em]">
        Be the first to share a thought.
      </p>
    );
  }
  return (
    <ul className="mt-6 flex flex-col">
      {items.map((c) => (
        <CommentRow comment={c} key={c.id} />
      ))}
    </ul>
  );
}

function CommentRow({ comment }: { comment: Comment }) {
  const initial = comment.memberName.trim().charAt(0).toUpperCase() || "?";
  return (
    <li className="grid grid-cols-[36px_1fr] gap-3 border-line border-b py-4 last:border-b-0">
      <div className="flex h-9 w-9 items-center justify-center bg-ink font-display text-[14px] text-cream">
        {initial}
      </div>
      <div className="min-w-0">
        <div className="flex flex-wrap items-baseline gap-2">
          <span className="font-display font-medium text-[14px]">
            {comment.memberName}
          </span>
          <time
            className="font-mono text-[10px] text-muted tracking-[0.06em]"
            dateTime={comment.createdAt}
          >
            {formatRelative(comment.createdAt)}
          </time>
        </div>
        <p className="mt-1 whitespace-pre-line font-display text-[15px] text-ink leading-[1.5]">
          {comment.text}
        </p>
      </div>
    </li>
  );
}

function formatRelative(iso: string): string {
  const then = new Date(iso).getTime();
  if (!Number.isFinite(then)) {
    return "";
  }
  const diff = Date.now() - then;
  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;
  if (diff < minute) {
    return "just now";
  }
  if (diff < hour) {
    return `${Math.floor(diff / minute)}m ago`;
  }
  if (diff < day) {
    return `${Math.floor(diff / hour)}h ago`;
  }
  if (diff < 7 * day) {
    return `${Math.floor(diff / day)}d ago`;
  }
  return new Date(iso).toLocaleDateString([], {
    month: "short",
    day: "numeric",
  });
}
