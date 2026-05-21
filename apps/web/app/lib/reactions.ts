import type { Reaction, ReactionKind } from "./db";
import { db } from "./db";

/**
 * Reaction helpers for issue #90.
 *
 * The public reader uses these for tests and the runtime path goes
 * through the MSW handlers (`/api/articles/:articleId/reactions`).
 */

/** The full set of reaction kinds shown on the reader, in display order. */
export const REACTION_KINDS: ReactionKind[] = ["grew", "learned", "loved"];

export interface ReactionCounts {
  grew: number;
  learned: number;
  loved: number;
}

export interface ReactionState {
  /** Aggregated counts across all members. */
  counts: ReactionCounts;
  /** Which kinds the calling member has currently set, if any. */
  mine: ReactionCounts;
}

function emptyCounts(): ReactionCounts {
  return { grew: 0, learned: 0, loved: 0 };
}

/**
 * Read the per-kind counts for an article and the calling member's own
 * state. `memberId` is optional — when omitted (logged-out reader) the
 * `mine` counts come back as zero.
 */
export async function getReactionState(args: {
  articleId: string;
  memberId?: string | null;
}): Promise<ReactionState> {
  const all = await db.reactions
    .where("articleId")
    .equals(args.articleId)
    .toArray();
  const counts = emptyCounts();
  const mine = emptyCounts();
  for (const r of all) {
    counts[r.kind] += 1;
    if (args.memberId && r.memberId === args.memberId) {
      mine[r.kind] += 1;
    }
  }
  return { counts, mine };
}

/**
 * Toggle a reaction on or off for the calling member. Returns the
 * post-toggle state plus the resulting `mine` flag for that kind so the
 * UI doesn't need a follow-up read to update the button.
 */
export async function toggleReaction(args: {
  articleId: string;
  kind: ReactionKind;
  memberId: string;
}): Promise<ReactionState & { active: boolean }> {
  const existing = await db.reactions
    .where("[memberId+articleId+kind]")
    .equals([args.memberId, args.articleId, args.kind])
    .first();
  if (existing?.id == null) {
    const row: Reaction = {
      memberId: args.memberId,
      articleId: args.articleId,
      kind: args.kind,
      createdAt: new Date().toISOString(),
    };
    await db.reactions.add(row);
  } else {
    await db.reactions.delete(existing.id);
  }
  const state = await getReactionState(args);
  return { ...state, active: state.mine[args.kind] > 0 };
}
