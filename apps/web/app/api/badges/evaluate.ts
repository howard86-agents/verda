import type { BadgeId } from "@verda/data";
import { prisma } from "@verda/database";

/**
 * Server-side badge evaluator (issue #138).
 *
 * Evaluates the badge catalog against the user's current state and
 * grants any newly-earned badges idempotently. Called after every
 * award transaction.
 */

interface UserSnapshot {
  approvedSubmissions: number;
  commentsPosted: number;
  highestLevel: number;
  reads: number;
}

async function snapshotUser(userId: string): Promise<UserSnapshot> {
  const reads = await prisma.behaviorLog.count({
    where: { userId, action: "read_complete" },
  });

  const items = await prisma.growthItem.findMany({
    where: { userId },
    select: { level: true },
  });
  const highestLevel = items.reduce(
    (max, it) => (it.level > max ? it.level : max),
    0
  );

  const approvedSubmissions = await prisma.article.count({
    where: {
      submittedBy: userId,
      status: "published",
      kind: { in: ["submission", "repost", "remix"] },
    },
  });

  const commentsPosted = await prisma.comment.count({
    where: { userId, removedAt: null },
  });

  return { reads, highestLevel, approvedSubmissions, commentsPosted };
}

function earnedSet(snapshot: UserSnapshot): Set<BadgeId> {
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
  if (snapshot.highestLevel >= 3) {
    out.add("first_bloom");
  }
  if (snapshot.approvedSubmissions >= 1) {
    out.add("first_submission");
  }
  if (snapshot.commentsPosted >= 1) {
    out.add("commenter");
  }
  return out;
}

/**
 * Evaluate badges for a user and persist any newly-earned ones.
 * Returns the list of badge IDs awarded by this call.
 */
export async function evaluateBadges(userId: string): Promise<string[]> {
  const snapshot = await snapshotUser(userId);
  const earned = earnedSet(snapshot);
  if (earned.size === 0) {
    return [];
  }

  const owned = await prisma.memberBadge.findMany({
    where: { userId },
    select: { badgeId: true },
  });
  const ownedIds = new Set(owned.map((b) => b.badgeId));

  const newBadges: string[] = [];
  for (const badgeId of earned) {
    if (ownedIds.has(badgeId)) {
      continue;
    }
    try {
      await prisma.memberBadge.create({ data: { userId, badgeId } });
      newBadges.push(badgeId);
    } catch (error: unknown) {
      // Unique constraint = already granted concurrently
      if (
        !(
          error &&
          typeof error === "object" &&
          "code" in error &&
          (error as { code: string }).code === "P2002"
        )
      ) {
        throw error;
      }
    }
  }
  return newBadges;
}
