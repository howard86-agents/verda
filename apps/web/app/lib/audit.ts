// Audit-trail helpers for CMS member administration. Manual point adjustments
// and soft-deletes write both the operational record (pointLedger update,
// members.deletedAt) and an immutable auditLog entry tying the action to an
// admin. Used by MSW handlers; isolated here so unit tests can exercise the
// invariants directly.

import { db } from "./db";
import { balanceFromLedger, levelFor } from "./rewards";

export interface AdjustPointsInput {
  adminId: string;
  amount: number;
  memberId: string;
  reason: string;
}

export interface AdjustPointsResult {
  balanceAfter: number;
  balanceBefore: number;
  level: number;
}

/** Read the member's current point balance from the ledger. */
export async function currentBalance(memberId: string): Promise<number> {
  const entries = await db.pointLedger
    .where("memberId")
    .equals(memberId)
    .toArray();
  return balanceFromLedger(entries);
}

/**
 * Apply a manual point adjustment.
 *
 * Validates a non-empty reason and a non-zero amount, then writes a pointLedger
 * row and a paired auditLog row capturing before/after balance. Updates the
 * member's growth level so /grow stays consistent.
 *
 * Throws on validation failure so callers can surface a 400.
 */
export async function adjustPoints(
  input: AdjustPointsInput
): Promise<AdjustPointsResult> {
  const reason = input.reason.trim();
  if (!reason) {
    throw new Error("Reason is required for point adjustments");
  }
  if (!Number.isFinite(input.amount) || input.amount === 0) {
    throw new Error("Adjustment amount must be a non-zero number");
  }

  const balanceBefore = await currentBalance(input.memberId);
  const balanceAfter = balanceBefore + input.amount;
  const now = new Date().toISOString();

  await db.pointLedger.add({
    memberId: input.memberId,
    amount: input.amount,
    balanceAfter,
    reason,
    createdAt: now,
  });

  await db.auditLog.add({
    action: "point_adjust",
    memberId: input.memberId,
    adminId: input.adminId,
    amount: input.amount,
    balanceBefore,
    balanceAfter,
    reason,
    createdAt: now,
  });

  // Keep growthItem nutrients/level in sync with the new balance.
  const growthRules = await db.growthRules.toArray();
  const level = levelFor(balanceAfter, growthRules);
  const growthItem = await db.growthItems
    .where("memberId")
    .equals(input.memberId)
    .first();
  if (growthItem?.id) {
    await db.growthItems.update(growthItem.id, {
      nutrients: balanceAfter,
      level,
    });
  } else {
    await db.growthItems.add({
      memberId: input.memberId,
      nutrients: balanceAfter,
      level,
    });
  }

  return { balanceBefore, balanceAfter, level };
}

export interface SoftDeleteInput {
  adminId: string;
  memberId: string;
  reason: string;
}

/**
 * Soft-delete a member: stamps `deletedAt` and writes an audit row. Idempotent
 * — re-deleting a member updates `deletedAt` and logs another audit row so the
 * trail records every admin action.
 */
export async function softDeleteMember(
  input: SoftDeleteInput
): Promise<{ deletedAt: string }> {
  const reason = input.reason.trim();
  if (!reason) {
    throw new Error("Reason is required to remove a member");
  }
  const member = await db.members.get(input.memberId);
  if (!member) {
    throw new Error(`Member not found: ${input.memberId}`);
  }
  const deletedAt = new Date().toISOString();
  await db.members.update(input.memberId, { deletedAt });
  await db.auditLog.add({
    action: "member_delete",
    memberId: input.memberId,
    adminId: input.adminId,
    reason,
    createdAt: deletedAt,
  });
  return { deletedAt };
}
