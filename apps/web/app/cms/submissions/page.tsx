"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { CmsShell } from "@/_components/cms-shell";
import { can, useCmsAuth } from "@/lib/cms-auth";

interface PendingSubmission {
  id: string;
  kind: string;
  slug: string;
  submittedAt: string;
  submittedBy: string | null;
  submitterName: string;
  title: string;
}

interface ListResponse {
  items: PendingSubmission[];
  total: number;
}

export default function CmsSubmissionsPage() {
  const { role } = useCmsAuth();
  const canPublish = can("publish", role);
  const qc = useQueryClient();
  const [error, setError] = useState<string | null>(null);

  const submissionsQuery = useQuery<ListResponse>({
    queryKey: ["cms-submissions"],
    queryFn: async () => {
      const res = await fetch("/api/cms/submissions");
      if (!res.ok) {
        throw new Error("Failed to load submissions");
      }
      return (await res.json()) as ListResponse;
    },
  });

  const approve = useMutation({
    mutationFn: async (id: string) => doMutation(id, "approve", role),
    onSuccess: () => {
      setError(null);
      qc.invalidateQueries({ queryKey: ["cms-submissions"] });
    },
    onError: (e: Error) => setError(e.message),
  });
  const reject = useMutation({
    mutationFn: async (id: string) => doMutation(id, "reject", role),
    onSuccess: () => {
      setError(null);
      qc.invalidateQueries({ queryKey: ["cms-submissions"] });
    },
    onError: (e: Error) => setError(e.message),
  });

  const items = submissionsQuery.data?.items ?? [];

  return (
    <CmsShell>
      <section className="px-8 pt-7 max-[860px]:px-5">
        <div className="mb-7 flex items-end justify-between gap-4">
          <div>
            <div className="font-mono text-[10.5px] text-ink uppercase tracking-[0.22em]">
              Submissions · 投稿
            </div>
            <h1 className="mt-1 font-display font-medium text-[36px] tracking-[-0.01em]">
              Pending review
            </h1>
          </div>
          <span className="font-mono text-[10.5px] text-muted uppercase tracking-[0.18em]">
            {items.length} pending
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

        {submissionsQuery.isLoading && (
          <p className="font-mono text-[11px] text-muted uppercase tracking-[0.16em]">
            Loading submissions…
          </p>
        )}

        {!submissionsQuery.isLoading && items.length === 0 && (
          <p className="font-mono text-[11px] text-muted uppercase tracking-[0.16em]">
            No pending submissions.
          </p>
        )}

        {items.length > 0 && (
          <ul className="divide-y divide-line border border-line bg-paper">
            {items.map((it) => (
              <SubmissionRow
                canPublish={canPublish}
                isApproving={approve.isPending && approve.variables === it.id}
                isRejecting={reject.isPending && reject.variables === it.id}
                key={it.id}
                onApprove={() => approve.mutate(it.id)}
                onReject={() => reject.mutate(it.id)}
                submission={it}
              />
            ))}
          </ul>
        )}
      </section>
    </CmsShell>
  );
}

async function doMutation(
  id: string,
  action: "approve" | "reject",
  role: string
): Promise<unknown> {
  const res = await fetch(
    `/api/cms/submissions/${encodeURIComponent(id)}/${action}`,
    {
      method: "POST",
      headers: { "x-cms-role": role },
    }
  );
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(body.error ?? `Failed to ${action}`);
  }
  return res.json();
}

function SubmissionRow({
  canPublish,
  isApproving,
  isRejecting,
  onApprove,
  onReject,
  submission,
}: {
  canPublish: boolean;
  isApproving: boolean;
  isRejecting: boolean;
  onApprove: () => void;
  onReject: () => void;
  submission: PendingSubmission;
}) {
  return (
    <li className="grid grid-cols-[1fr_auto] items-start gap-4 px-[18px] py-3">
      <div className="min-w-0">
        <div className="font-mono text-[10px] text-muted uppercase tracking-[0.18em]">
          Submitted {submission.submittedAt} · by {submission.submitterName}
        </div>
        <div className="mt-[6px] truncate font-display font-medium text-[18px]">
          {submission.title}
        </div>
        <a
          className="mt-1 inline-block font-mono text-[10px] text-vermilion uppercase tracking-[0.16em]"
          href={`/cms/articles/${encodeURIComponent(submission.id)}/edit`}
        >
          Open in editor →
        </a>
      </div>
      <div className="flex items-center gap-2">
        {canPublish ? (
          <>
            <button
              className="border border-ink bg-ink px-[14px] py-[6px] font-mono text-[10px] text-cream uppercase tracking-[0.18em] disabled:opacity-50"
              disabled={isApproving || isRejecting}
              onClick={onApprove}
              type="button"
            >
              {isApproving ? "Approving…" : "Approve"}
            </button>
            <button
              className="border border-vermilion px-[14px] py-[6px] font-mono text-[10px] text-vermilion uppercase tracking-[0.18em] disabled:opacity-50"
              disabled={isApproving || isRejecting}
              onClick={onReject}
              type="button"
            >
              {isRejecting ? "Rejecting…" : "Reject"}
            </button>
          </>
        ) : (
          <span className="font-mono text-[10px] text-muted uppercase tracking-[0.16em]">
            View only
          </span>
        )}
      </div>
    </li>
  );
}
