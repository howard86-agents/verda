export interface SubmissionDraft {
  bodyJson: string;
  coverUrl?: string;
  title: string;
}

const TITLE_MIN_LEN = 3;
const TITLE_MAX_LEN = 200;
const BODY_MIN_PLAIN_LEN = 8;

export type ValidationResult = { ok: true } | { ok: false; reason: string };

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
