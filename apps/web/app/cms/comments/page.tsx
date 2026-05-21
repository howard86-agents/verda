"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { CmsShell } from "@/_components/cms-shell";
import { can, useCmsAuth } from "@/lib/cms-auth";

interface CmsComment {
  articleId: string;
  articleKind: string;
  articleSlug: string;
  articleTitle: string;
  createdAt: string;
  id: string;
  memberId: string;
  memberName: string;
  removedAt?: string;
  text: string;
}

interface ListResponse {
  items: CmsComment[];
  total: number;
}

export default function CmsCommentsPage() {
  const { role } = useCmsAuth();
  const canModerate = can("moderate_comments", role);
  const qc = useQueryClient();
  const [error, setError] = useState<string | null>(null);

  const commentsQuery = useQuery<ListResponse>({
    queryKey: ["cms-comments"],
    queryFn: async () => {
      const res = await fetch("/api/cms/comments?limit=50");
      if (!res.ok) {
        throw new Error("Failed to load comments");
      }
      return (await res.json()) as ListResponse;
    },
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/cms/comments/${encodeURIComponent(id)}`, {
        method: "DELETE",
        headers: { "x-cms-role": role },
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as {
          error?: string;
        };
        throw new Error(body.error ?? "Remove failed");
      }
      return id;
    },
    onSuccess: () => {
      setError(null);
      qc.invalidateQueries({ queryKey: ["cms-comments"] });
    },
    onError: (e: Error) => {
      setError(e.message);
    },
  });

  const items = commentsQuery.data?.items ?? [];

  return (
    <CmsShell>
      <section className="px-8 pt-7 max-[860px]:px-5">
        <div className="mb-7 flex items-end justify-between gap-4">
          <div>
            <div className="font-mono text-[10.5px] text-ink uppercase tracking-[0.22em]">
              Moderation · モデレーション
            </div>
            <h1 className="mt-1 font-display font-medium text-[36px] tracking-[-0.01em]">
              Comments
            </h1>
          </div>
          <span className="font-mono text-[10.5px] text-muted uppercase tracking-[0.18em]">
            {items.length} recent · {items.filter((c) => c.removedAt).length}{" "}
            removed
          </span>
        </div>

        {error && (
          <div
            className="mb-4 border border-vermilion bg-vermilion/5 px-3 py-2 font-mono text-[11px] text-vermilion"
            role="alert"
          >
            {error}
          </div>
        )}

        {commentsQuery.isLoading && (
          <p className="font-mono text-[11px] text-muted uppercase tracking-[0.16em]">
            Loading comments…
          </p>
        )}

        {!commentsQuery.isLoading && items.length === 0 && (
          <p className="font-mono text-[11px] text-muted uppercase tracking-[0.16em]">
            No comments yet.
          </p>
        )}

        {items.length > 0 && (
          <ul className="divide-y divide-line border border-line bg-paper">
            {items.map((c) => (
              <CommentRow
                canModerate={canModerate}
                comment={c}
                isRemoving={remove.isPending && remove.variables === c.id}
                key={c.id}
                onRemove={() => remove.mutate(c.id)}
              />
            ))}
          </ul>
        )}
      </section>
    </CmsShell>
  );
}

function CommentRow({
  canModerate,
  comment,
  isRemoving,
  onRemove,
}: {
  canModerate: boolean;
  comment: CmsComment;
  isRemoving: boolean;
  onRemove: () => void;
}) {
  const removed = !!comment.removedAt;
  const articleHref =
    comment.articleKind === "submission" ||
    comment.articleKind === "repost" ||
    comment.articleKind === "remix"
      ? `/readers/${encodeURIComponent(comment.articleSlug)}`
      : `/stories/${encodeURIComponent(comment.articleSlug)}`;
  return (
    <li className="grid grid-cols-[auto_1fr_auto] items-start gap-3 px-[18px] py-3">
      <div className="flex h-9 w-9 items-center justify-center bg-ink font-display text-[14px] text-cream">
        {comment.memberName.trim().charAt(0).toUpperCase() || "?"}
      </div>
      <div className="min-w-0">
        <div className="flex flex-wrap items-baseline gap-2">
          <span className="font-display font-medium text-[14px]">
            {comment.memberName}
          </span>
          <span className="font-mono text-[10px] text-muted tracking-[0.06em]">
            {new Date(comment.createdAt).toLocaleString([], {
              month: "short",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
          {removed && (
            <span className="font-mono text-[9px] text-vermilion uppercase tracking-[0.18em]">
              removed
            </span>
          )}
        </div>
        <p
          className={`mt-1 whitespace-pre-line font-display text-[14px] leading-[1.5] ${
            removed ? "text-muted line-through" : "text-ink"
          }`}
        >
          {comment.text}
        </p>
        <a
          className="mt-1 inline-block font-mono text-[10px] text-vermilion uppercase tracking-[0.16em]"
          href={articleHref}
          rel="noreferrer"
          target="_blank"
        >
          {comment.articleTitle} →
        </a>
      </div>
      <div className="flex items-center gap-3">
        {!removed && canModerate && (
          <button
            className="border border-vermilion px-[10px] py-[5px] font-mono text-[10px] text-vermilion uppercase tracking-[0.16em] disabled:opacity-50"
            disabled={isRemoving}
            onClick={onRemove}
            type="button"
          >
            {isRemoving ? "Removing…" : "Remove"}
          </button>
        )}
        {!(removed || canModerate) && (
          <span className="font-mono text-[10px] text-muted uppercase tracking-[0.16em]">
            View only
          </span>
        )}
      </div>
    </li>
  );
}
