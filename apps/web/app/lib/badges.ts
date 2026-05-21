import { BADGE_CATALOG, type BadgeId } from "@verda/data";
import { db, type MemberBadge } from "./db";

/**
 * Badge evaluator for issue #93.
 *
 * Awards any earnable badges from `BADGE_CATALOG` that the member
 * has met the criteria for. Idempotent: the storage layer's compound
 * unique index on `[memberId+badgeId]` rejects duplicates, and we
 * additionally pre-check earned state so we only insert what's new.
 */

interface MemberSnapshot {
  /** Highest level reached on any growth item. */
  highestLevel: number;
  /** Number of distinct articles the member has read to completion. */
  reads: number;
}

async function snapshotMember(memberId: string): Promise<MemberSnapshot> {
  const reads = await db.behaviorLogs
    .where("[memberId+action+articleId]")
    .between(
      [memberId, "read_complete", ""],
      [memberId, "read_complete", "\uFFFF"]
    )
    .count();
  const items = await db.growthItems
    .where("memberId")
    .equals(memberId)
    .toArray();
  const highestLevel = items.reduce(
    (max, it) => (it.level > max ? it.level : max),
    0
  );
  return { reads, highestLevel };
}

/**
 * Decide which catalog badges the member has earned right now (whether
 * or not they're already in `memberBadges`).
 */
function earnedSet(snapshot: MemberSnapshot): Set<BadgeId> {
  const out = new Set<BadgeId>();
  if (snapshot.reads >= 1) {
    out.add("first_read");
  }
  if (snapshot.reads >= 10) {
    out.add("reader_10");
  }
  if (snapshot.reads >= 25) {
    out.add("reader_25");
  }
  // Bloom is level 3 in the seeded growth rules; the AC anchors on
  // "first bloom" so we trigger as soon as any growth item hits that
  // level.
  if (snapshot.highestLevel >= 3) {
    out.add("first_bloom");
  }
  return out;
}

/**
 * Evaluate the catalog for a member and persist any newly-earned
 * badges. Returns the list of badges awarded by this call (empty when
 * the member already had everything they qualified for).
 */
export async function evaluateBadges(memberId: string): Promise<MemberBadge[]> {
  const snapshot = await snapshotMember(memberId);
  const earned = earnedSet(snapshot);
  if (earned.size === 0) {
    return [];
  }
  const owned = await db.memberBadges
    .where("memberId")
    .equals(memberId)
    .toArray();
  const ownedIds = new Set(owned.map((b) => b.badgeId));
  const newRows: MemberBadge[] = [];
  const now = new Date().toISOString();
  for (const id of earned) {
    if (ownedIds.has(id)) {
      continue;
    }
    const row: MemberBadge = {
      memberId,
      badgeId: id,
      earnedAt: now,
    };
    try {
      await db.memberBadges.add(row);
      newRows.push(row);
    } catch {
      // Compound-unique index rejected a concurrent insert. Treat as
      // already-owned and move on so the catch path stays a no-op.
    }
  }
  return newRows;
}

/**
 * Read the member's current badge shelf — what they own + what's
 * still locked. Sorted by catalog order so the UI renders deterministic
 * placement.
 */
export async function readBadgeShelf(memberId: string): Promise<{
  earned: MemberBadge[];
  locked: BadgeId[];
}> {
  const owned = await db.memberBadges
    .where("memberId")
    .equals(memberId)
    .toArray();
  const ownedIds = new Set(owned.map((b) => b.badgeId));
  const earned = BADGE_CATALOG.filter((b) => ownedIds.has(b.id))
    .map((b) => owned.find((o) => o.badgeId === b.id))
    .filter(Boolean) as MemberBadge[];
  const locked = BADGE_CATALOG.filter((b) => !ownedIds.has(b.id)).map(
    (b) => b.id
  );
  return { earned, locked };
}
