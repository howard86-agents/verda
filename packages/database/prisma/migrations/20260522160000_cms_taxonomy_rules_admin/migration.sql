-- CMS taxonomy administration (issue #135).
--
-- Adds CMS-managed category + tag tables. Article rows still store
-- the public label in `Article.cat`/`Article.tag`, so referential
-- integrity is enforced at the admin delete route by counting
-- articles by name; the unique index on `name` keeps the canonical
-- list deduplicated.
CREATE TABLE "categories" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "tags" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "tags_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "categories_name_key" ON "categories"("name");
CREATE UNIQUE INDEX "tags_name_key" ON "tags"("name");
