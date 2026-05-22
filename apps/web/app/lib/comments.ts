import type { Comment } from "./db";
import { db } from "./db";

/**
 * Comment helpers for issue #89.
 *
 * The public reader uses these directly in tests; the runtime path goes
 * through the MSW handlers (`/api/articles/:articleId/comments`) which
 * call the same helpers so behaviour matches across surfaces.
 */

const MAX_TEXT_LEN = 1000;

/**
 * Generate an opaque, time-ordered id for a comment row. Unique enough
 * for the in-browser store; collision risk is negligible at the volumes
 * the reader hits.
 */
function nextCommentId(): string {
  const rand = Math.random().toString(36).slice(2, 8);
  return `cmt_${Date.now().toString(36)}_${rand}`;
}

/**
 * List all comments on an article, newest-first. Soft-removed comments
 * (those with a `removedAt`) are filtered out so the public reader never
 * shows them; the future CMS moderation surface (#101) reads the raw
 * table to render its list.
 */
export async function listComments(articleId: string): Promise<Comment[]> {
  const all = await db.comments.where("articleId").equals(articleId).toArray();
  return all
    .filter((c) => !c.removedAt)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

/**
 * Persist a new comment. Trims the text, rejects empty strings, and
 * caps the length so a runaway paste doesn't blow the column. Returns
 * the stored row.
 */
export async function postComment(args: {
  articleId: string;
  memberId: string;
  memberName: string;
  text: string;
}): Promise<Comment> {
  const text = args.text.trim();
  if (!text) {
    throw new Error("Comment text cannot be empty");
  }
  const comment: Comment = {
    id: nextCommentId(),
    articleId: args.articleId,
    memberId: args.memberId,
    memberName: args.memberName.trim() || "Anonymous",
    text: text.slice(0, MAX_TEXT_LEN),
    createdAt: new Date().toISOString(),
  };
  await db.comments.put(comment);
  return comment;
}
