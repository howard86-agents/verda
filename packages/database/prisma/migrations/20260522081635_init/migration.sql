-- CreateTable
CREATE TABLE "sections" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "sections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "articles" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "kind" TEXT NOT NULL DEFAULT 'brand',
    "cat" TEXT NOT NULL DEFAULT '',
    "tag" TEXT NOT NULL DEFAULT '',
    "title" TEXT NOT NULL,
    "jp" TEXT NOT NULL DEFAULT '',
    "sum" TEXT NOT NULL DEFAULT '',
    "img" TEXT NOT NULL DEFAULT '',
    "imagePrompt" TEXT NOT NULL DEFAULT '',
    "imageSeed" INTEGER NOT NULL DEFAULT 0,
    "read" INTEGER NOT NULL DEFAULT 0,
    "date" TEXT NOT NULL DEFAULT '',
    "author" TEXT NOT NULL DEFAULT '',
    "src" TEXT,
    "sourceUrl" TEXT,
    "license" TEXT,
    "submittedBy" TEXT,
    "contributors" JSONB,
    "series" JSONB,
    "bodyJson" TEXT,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "publishedAt" TIMESTAMP(3),
    "scheduledAt" TIMESTAMP(3),
    "section" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "articles_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "articles_slug_key" ON "articles"("slug");

-- CreateIndex
CREATE INDEX "articles_kind_status_idx" ON "articles"("kind", "status");

-- CreateIndex
CREATE INDEX "articles_section_idx" ON "articles"("section");

-- CreateIndex
CREATE INDEX "articles_tag_idx" ON "articles"("tag");

-- CreateIndex
CREATE INDEX "articles_submittedBy_idx" ON "articles"("submittedBy");

-- CreateIndex
CREATE INDEX "articles_status_idx" ON "articles"("status");
