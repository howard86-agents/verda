import { type Article, db } from "./db";

/**
 * Helpers for the public reader-submission flow (issue #91).
 *
 * Reader-submitted articles share the same `articles` table the CMS
 * writes to, but with `kind=submission`, `status=pending`, and a
 * required `submittedBy` link to the authenticated member. The public
 * Readers listing already filters on `status === "published"` so a
 * pending row is invisible to the public until a CMS approval flow
 * (issue #102) flips it.
 */

const TITLE_MIN_LEN = 3;
const TITLE_MAX_LEN = 200;
const BODY_MIN_PLAIN_LEN = 8;

/**
 * Generate a slug from a title. The CMS approval surface (#102) can
 * still rewrite the slug at publish time; this just gives the row a
 * deterministic, URL-safe handle for the editorial review queue.
 */
export function slugForTitle(title: string): string {
  return (
    title
      .trim()
      .toLowerCase()
      .replace(/[^\p{L}\p{N}]+/gu, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 80) || "untitled"
  );
}

/**
 * Loosely measure how much plain text a Tiptap-style `bodyJson`
 * document carries. Used for validation only — the published renderer
 * still consumes `bodyJson` directly.
 */
export function plainTextLength(bodyJson: string): number {
  if (!bodyJson) {
    return 0;
  }
  try {
    const doc = JSON.parse(bodyJson) as { content?: unknown };
    return walk(doc).trim().length;
  } catch {
    return 0;
  }
}

function walk(node: unknown): string {
  if (!node || typeof node !== "object") {
    return "";
  }
  const n = node as Record<string, unknown>;
  if (typeof n.text === "string") {
    return n.text;
  }
  if (Array.isArray(n.content)) {
    return (n.content as unknown[]).map(walk).join(" ");
  }
  return "";
}

export interface SubmissionDraft {
  bodyJson: string;
  coverFocalPoint?: { x: number; y: number };
  coverUrl?: string;
  title: string;
}

export type ValidationResult = { ok: true } | { ok: false; reason: string };

/**
 * Validate a draft before it's persisted. Returns `{ ok: false, reason }`
 * with a short, user-facing message on failure.
 */
export function validateSubmission(draft: SubmissionDraft): ValidationResult {
  const title = draft.title.trim();
  if (title.length < TITLE_MIN_LEN) {
    return { ok: false, reason: "Title is too short" };
  }
  if (title.length > TITLE_MAX_LEN) {
    return { ok: false, reason: "Title is too long" };
  }
  if (plainTextLength(draft.bodyJson) < BODY_MIN_PLAIN_LEN) {
    return { ok: false, reason: "Tell us a little more — body is too short" };
  }
  return { ok: true };
}

/**
 * Persist a submission as a pending `kind=submission` article. The
 * caller (handler) is responsible for ensuring the request is
 * authenticated; this helper trusts the `memberId` it receives.
 */
export async function createSubmission(args: {
  draft: SubmissionDraft;
  memberId: string;
}): Promise<Article> {
  const validation = validateSubmission(args.draft);
  if (!validation.ok) {
    throw new Error(validation.reason);
  }
  const title = args.draft.title.trim();
  const id = `sub_${Date.now().toString(36)}_${Math.random()
    .toString(36)
    .slice(2, 6)}`;
  const article: Article = {
    id,
    slug: slugForTitle(title),
    kind: "submission",
    status: "pending",
    submittedBy: args.memberId,
    cat: "",
    tag: "reader",
    title,
    jp: "",
    sum: "",
    img: args.draft.coverUrl || "linear-gradient(135deg, #e9c4d0, #9a4a68)",
    imagePrompt: "",
    imageSeed: 0,
    read: 0,
    date: new Date().toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    }),
    author: "",
    bodyJson: args.draft.bodyJson,
  };
  await db.articles.put(article);
  return article;
}
