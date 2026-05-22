-- CMS members admin (issue #134).
--
-- Adds:
--   * `member_profiles.deletedAt` — soft-delete sentinel, used by the
--     CMS members list to hide deleted readers unless `includeDeleted`
--     is set.
--   * `audit_log` — append-only trail of admin-initiated mutations
--     (point adjustments + soft-deletes). Indexed on `(memberId,
--     createdAt)` for the member detail panel and on `action` for
--     global filtering.
ALTER TABLE "member_profiles" ADD COLUMN "deletedAt" TIMESTAMP(3);

CREATE TABLE "audit_log" (
    "id" SERIAL NOT NULL,
    "memberId" TEXT NOT NULL,
    "adminId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "amount" INTEGER,
    "balanceBefore" INTEGER,
    "balanceAfter" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_log_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "audit_log_memberId_createdAt_idx" ON "audit_log"("memberId", "createdAt");
CREATE INDEX "audit_log_action_idx" ON "audit_log"("action");

ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
