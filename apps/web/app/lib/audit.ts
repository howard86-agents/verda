// Audit-trail helpers for CMS member administration. Manual point adjustments
// and soft-deletes write both the operational record (pointLedger update,
// members.deletedAt) and an immutable auditLog entry tying the action to an
// admin. Used by MSW handlers; isolated here so unit tests can exercise the
// invariants directly.

import { db } from "./db";
import {
  allocateGrowthForMember,
  balanceFromLedger,
  levelFor,
} from "./rewards";

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
 * row and a paired auditLog row capturing before/after balance.
 *
 * Per issue #67 the multi-collectible growth model treats positive admin
 * adjustments like rewards (delta is allocated to the active growth item,
 * with overflow + cap rules), while negative adjustments are ledger/audit
 * only and never shrink growth items.
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

  // Positive admin adjustments allocate nutrients into the multi-item
  // growth collection. Negative adjustments leave the collection alone:
  // growth items never shrink (issue #67 product decision).
  if (input.amount > 0) {
    await allocateGrowthForMember(input.memberId, input.amount);
  }

  // Member-level summary for the response: derived from the ledger so
  // the existing CMS UI keeps working unchanged.
  const growthRules = await db.growthRules.toArray();
  const level = levelFor(balanceAfter, growthRules);

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
