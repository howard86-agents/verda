-- Achievement badges (issue #138)

CREATE TABLE "member_badges" (
    "id" SERIAL NOT NULL,
    "userId" TEXT NOT NULL,
    "badgeId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "member_badges_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "member_badges_userId_badgeId_key" ON "member_badges"("userId", "badgeId");
CREATE INDEX "member_badges_userId_idx" ON "member_badges"("userId");
