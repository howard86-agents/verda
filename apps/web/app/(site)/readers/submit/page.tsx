"use client";

import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import { AuthGate } from "@/_components/auth-gate";
import { Eyebrow } from "@/_components/eyebrow";
import { MediaPicker } from "@/_components/media-picker";
import { useAuth } from "@/lib/auth";
import {
  type SubmissionDraft,
  validateSubmission,
} from "@/lib/reader-submissions";
import { track } from "@/lib/track";

export default function ReaderSubmitPage() {
  return (
    <AuthGate>
      <ReaderSubmitForm />
    </AuthGate>
  );
}

function ReaderSubmitForm() {
  const { member } = useAuth();
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [coverUrl, setCoverUrl] = useState<string | null>(null);
  const [showMediaPicker, setShowMediaPicker] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: { levels: [2, 3] } }),
      Link.configure({ openOnClick: false }),
      Image,
      Placeholder.configure({
        placeholder: "Tell us a story, a recipe, a small practice…",
      }),
    ],
    content: "",
    editable: !submitting,
  });

  const submit = useCallback(async () => {
    if (!(editor && member)) {
      return;
    }
    setError(null);
    const bodyJson = JSON.stringify(editor.getJSON());
    const draft: SubmissionDraft = {
      title,
      bodyJson,
      coverUrl: coverUrl ?? undefined,
    };
    const validation = validateSubmission(draft);
    if (!validation.ok) {
      setError(validation.reason);
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/readers/submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          memberId: member.id,
          title: draft.title,
          bodyJson: draft.bodyJson,
          coverUrl: draft.coverUrl,
        }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as {
          error?: string;
        };
        throw new Error(body.error ?? "Submission failed");
      }
      const article = (await res.json()) as { id: string; slug: string };
      track("reader_submission_created", {
        memberId: member.id,
        articleId: article.id,
      });
      setDone(article.slug);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Submission failed");
    } finally {
      setSubmitting(false);
    }
  }, [editor, member, title, coverUrl]);

  if (done) {
    return (
      <SubmittedSuccess
        onAnotherSubmission={() => {
          setTitle("");
          setCoverUrl(null);
          editor?.commands.setContent("");
          setDone(null);
        }}
        onBackToReaders={() => router.push("/readers")}
      />
    );
  }

  return (
    <div className="bg-cream text-ink">
      <div className="shell">
        <section className="pt-10">
          <Eyebrow en="Submit · 投稿" jp="読者投稿フォーム" />
          <h1 className="mt-[14px] font-display font-medium text-[56px] leading-none tracking-[-0.02em] max-[640px]:text-[36px]">
            Share something quiet<span className="text-vermilion">.</span>
          </h1>
          <p className="mt-3 max-w-[640px] font-display text-[15.5px] text-ink-soft leading-[1.6]">
            Submissions are reviewed by the editorial desk. Approved pieces
            appear in the Readers section with your byline. We never publish
            without your sign-off.
          </p>
        </section>

        <section className="grid grid-cols-[1fr_320px] gap-10 pt-10 max-[900px]:grid-cols-1">
          <div className="grid gap-5">
            <label className="block">
              <span className="font-mono text-[10px] text-muted uppercase tracking-[0.18em]">
                Title · 題
              </span>
              <input
                className="mt-2 w-full border border-line bg-paper px-3 py-2 font-display text-[20px] text-ink"
                disabled={submitting}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="A walk after dinner"
                value={title}
              />
            </label>

            <div className="block">
              <span className="font-mono text-[10px] text-muted uppercase tracking-[0.18em]">
                Body · 本文
              </span>
              <div className="mt-2 min-h-[260px] border border-line bg-paper p-3">
                <EditorContent editor={editor} />
              </div>
            </div>

            {error && (
              <p
                className="font-mono text-[10.5px] text-vermilion uppercase tracking-[0.18em]"
                role="alert"
              >
                {error}
              </p>
            )}

            <div className="flex justify-end">
              <button
                className="border border-ink bg-ink px-[22px] py-3 font-mono text-[11px] text-cream uppercase tracking-[0.18em] disabled:opacity-50"
                disabled={submitting}
                onClick={submit}
                type="button"
              >
                {submitting ? "Submitting…" : "Submit for review"}
              </button>
            </div>
          </div>

          <aside className="grid content-start gap-5">
            <div className="border border-line bg-paper p-4">
              <div className="font-mono text-[10px] text-muted uppercase tracking-[0.18em]">
                Cover photo · 表紙写真
              </div>
              {coverUrl ? (
                <div className="mt-3">
                  {/* biome-ignore lint/performance/noImgElement: blob URL */}
                  {/* biome-ignore lint/correctness/useImageSize: dynamic preview */}
                  <img
                    alt="Cover preview"
                    className="aspect-[16/10] w-full border border-line object-cover"
                    src={coverUrl}
                  />
                  <button
                    className="mt-2 font-mono text-[10px] text-vermilion uppercase tracking-[0.18em]"
                    onClick={() => setCoverUrl(null)}
                    type="button"
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <button
                  className="mt-2 w-full border border-line border-dashed py-4 font-mono text-[10px] text-muted uppercase tracking-[0.16em]"
                  onClick={() => setShowMediaPicker(true)}
                  type="button"
                >
                  + Pick a cover (optional)
                </button>
              )}
            </div>

            <div className="border border-line bg-paper p-4 font-mono text-[10px] text-muted uppercase tracking-[0.16em]">
              <div className="text-ink">Editorial guidelines</div>
              <ul className="mt-3 grid list-disc gap-2 pl-5 normal-case tracking-[0.04em]">
                <li>Short, finishable pieces (300-1000 words).</li>
                <li>Original work or content you have rights to share.</li>
                <li>No advertising, no surveillance language.</li>
                <li>Photos must be yours or used with permission.</li>
              </ul>
            </div>
          </aside>
        </section>

        <div className="h-20" />
      </div>

      {showMediaPicker && (
        <MediaPicker
          onClose={() => setShowMediaPicker(false)}
          onSelect={(asset) => {
            setCoverUrl(asset.url);
            setShowMediaPicker(false);
          }}
        />
      )}
    </div>
  );
}

function SubmittedSuccess({
  onAnotherSubmission,
  onBackToReaders,
}: {
  onAnotherSubmission: () => void;
  onBackToReaders: () => void;
}) {
  return (
    <div className="bg-cream text-ink">
      <div className="shell pt-16 pb-20">
        <Eyebrow en="Received · 受付" jp="読者投稿フォーム" />
        <h1 className="mt-[14px] font-display font-medium text-[56px] leading-none tracking-[-0.02em] max-[640px]:text-[36px]">
          Thank you<span className="text-vermilion">.</span>
        </h1>
        <p className="mt-3 max-w-[640px] font-display text-[16px] text-ink-soft leading-[1.6]">
          Your submission is in our review queue. We aim to respond within a
          week. You'll see it appear in the Readers section once approved.
        </p>
        <div className="mt-7 flex flex-wrap items-center gap-4">
          <button
            className="border border-ink bg-ink px-[22px] py-3 font-mono text-[11px] text-cream uppercase tracking-[0.18em]"
            onClick={onBackToReaders}
            type="button"
          >
            Back to Readers
          </button>
          <button
            className="border border-ink bg-paper px-[22px] py-3 font-mono text-[11px] text-ink uppercase tracking-[0.18em]"
            onClick={onAnotherSubmission}
            type="button"
          >
            Submit another
          </button>
        </div>
      </div>
    </div>
  );
}
