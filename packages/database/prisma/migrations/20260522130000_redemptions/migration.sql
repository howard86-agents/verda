-- Redemptions (issue #132).
--
-- A completed growth item can be redeemed exactly once. The unique
-- `growthItemId` constraint is the storage-level double-redeem guard;
-- the route layer also checks `redeemedAt` so callers get a clear
-- 409 reason without relying on the database error path.
CREATE TABLE "redemptions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "growthItemId" INTEGER NOT NULL,
    "growthItemSequence" INTEGER NOT NULL,
    "provider" TEXT NOT NULL DEFAULT 'mock',
    "rewardCode" TEXT NOT NULL,
    "displayName" TEXT,
    "expiresAt" TIMESTAMP(3),
    "fulfillmentRef" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "redemptions_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "redemptions_growthItemId_key" ON "redemptions"("growthItemId");
CREATE INDEX "redemptions_userId_idx" ON "redemptions"("userId");

ALTER TABLE "redemptions" ADD CONSTRAINT "redemptions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "redemptions" ADD CONSTRAINT "redemptions_growthItemId_fkey" FOREIGN KEY ("growthItemId") REFERENCES "growth_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;
