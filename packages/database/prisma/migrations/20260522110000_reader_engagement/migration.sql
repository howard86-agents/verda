-- Reader engagement models (issue #131)

-- Collections
CREATE TABLE "collections" (
    "id" SERIAL NOT NULL,
    "userId" TEXT NOT NULL,
    "articleId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "collections_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "collections_userId_articleId_key" ON "collections"("userId", "articleId");
CREATE INDEX "collections_userId_idx" ON "collections"("userId");

-- Comments
CREATE TABLE "comments" (
    "id" SERIAL NOT NULL,
    "userId" TEXT NOT NULL,
    "articleId" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "removedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "comments_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "comments_articleId_createdAt_idx" ON "comments"("articleId", "createdAt");
CREATE INDEX "comments_userId_idx" ON "comments"("userId");

-- Reactions
CREATE TABLE "reactions" (
    "id" SERIAL NOT NULL,
    "userId" TEXT NOT NULL,
    "articleId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reactions_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "reactions_userId_articleId_kind_key" ON "reactions"("userId", "articleId", "kind");
CREATE INDEX "reactions_articleId_idx" ON "reactions"("articleId");
