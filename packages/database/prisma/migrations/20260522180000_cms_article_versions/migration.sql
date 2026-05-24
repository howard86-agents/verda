-- CMS article version snapshots (issue #137).
--
-- One row per `Save version` action on a draft. The serialized
-- article body lives on the JSON `snapshot` column so a future
-- restore can reconstruct the row without per-field history. Indexed
-- on `(articleId, timestamp)` for the per-article timeline view.
CREATE TABLE "article_versions" (
    "id" TEXT NOT NULL,
    "articleId" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "snapshot" JSONB NOT NULL,

    CONSTRAINT "article_versions_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "article_versions_articleId_timestamp_idx" ON "article_versions"("articleId", "timestamp");

ALTER TABLE "article_versions" ADD CONSTRAINT "article_versions_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "articles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
