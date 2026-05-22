-- CMS media assets (issue #136).
--
-- Binary payloads are stored in Supabase Storage in production or
-- the local filesystem adapter for docker-compose runs; Postgres
-- keeps the public URL plus upload metadata consumed by the CMS UI
-- and story rendering. The unique `path` index is the de-dup guard
-- for the storage object.
CREATE TABLE "media_assets" (
    "id" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "alt" TEXT NOT NULL DEFAULT '',
    "path" TEXT NOT NULL,
    "provider" TEXT NOT NULL DEFAULT 'local',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "media_assets_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "media_assets_path_key" ON "media_assets"("path");
CREATE INDEX "media_assets_mimeType_idx" ON "media_assets"("mimeType");
