-- Gamification core models (issue #130)

-- Reward rules
CREATE TABLE "reward_rules" (
    "id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "points" INTEGER NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "limitType" TEXT NOT NULL DEFAULT 'per-article',

    CONSTRAINT "reward_rules_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "reward_rules_action_key" ON "reward_rules"("action");

-- Growth rules
CREATE TABLE "growth_rules" (
    "level" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "jp" TEXT NOT NULL DEFAULT '',
    "threshold" INTEGER NOT NULL,

    CONSTRAINT "growth_rules_pkey" PRIMARY KEY ("level")
);

-- Growth config
CREATE TABLE "growth_config" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "maxItemsPerMember" INTEGER NOT NULL DEFAULT 3,

    CONSTRAINT "growth_config_pkey" PRIMARY KEY ("id")
);

-- Behavior logs
CREATE TABLE "behavior_logs" (
    "id" SERIAL NOT NULL,
    "userId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "articleId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "behavior_logs_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "behavior_logs_userId_action_articleId_key" ON "behavior_logs"("userId", "action", "articleId");
CREATE INDEX "behavior_logs_userId_idx" ON "behavior_logs"("userId");

-- Point ledger
CREATE TABLE "point_ledger" (
    "id" SERIAL NOT NULL,
    "userId" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "balanceAfter" INTEGER NOT NULL,
    "reason" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "point_ledger_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "point_ledger_userId_idx" ON "point_ledger"("userId");

-- Growth items
CREATE TABLE "growth_items" (
    "id" SERIAL NOT NULL,
    "userId" TEXT NOT NULL,
    "nutrients" INTEGER NOT NULL DEFAULT 0,
    "level" INTEGER NOT NULL DEFAULT 1,
    "sequence" INTEGER NOT NULL DEFAULT 1,
    "completedAt" TIMESTAMP(3),
    "redeemedAt" TIMESTAMP(3),
    "redemptionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "growth_items_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "growth_items_userId_idx" ON "growth_items"("userId");

-- Foreign keys
ALTER TABLE "behavior_logs" ADD CONSTRAINT "behavior_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "point_ledger" ADD CONSTRAINT "point_ledger_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "growth_items" ADD CONSTRAINT "growth_items_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
