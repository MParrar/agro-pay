-- Merge names that differ only in case into the oldest record, then make
-- catalog names case-insensitive and unique (same as workers.name).

-- Gardens: move entries to the kept garden, then drop the duplicates
WITH d AS (SELECT id, min(id) OVER (PARTITION BY lower(name)) AS keep_id FROM "gardens")
UPDATE "entries" e SET "gardenId" = d.keep_id FROM d WHERE e."gardenId" = d.id AND d.id <> d.keep_id;
WITH d AS (SELECT id, min(id) OVER (PARTITION BY lower(name)) AS keep_id FROM "gardens")
DELETE FROM "gardens" g USING d WHERE g.id = d.id AND d.id <> d.keep_id;

-- Fruit types
WITH d AS (SELECT id, min(id) OVER (PARTITION BY lower(name)) AS keep_id FROM "fruit_types")
UPDATE "entries" e SET "fruitTypeId" = d.keep_id FROM d WHERE e."fruitTypeId" = d.id AND d.id <> d.keep_id;
WITH d AS (SELECT id, min(id) OVER (PARTITION BY lower(name)) AS keep_id FROM "fruit_types")
DELETE FROM "fruit_types" f USING d WHERE f.id = d.id AND d.id <> d.keep_id;

-- Groups: move workers to the kept group
WITH d AS (SELECT id, min(id) OVER (PARTITION BY lower(name)) AS keep_id FROM "groups")
UPDATE "workers" w SET "groupId" = d.keep_id FROM d WHERE w."groupId" = d.id AND d.id <> d.keep_id;
WITH d AS (SELECT id, min(id) OVER (PARTITION BY lower(name)) AS keep_id FROM "groups")
DELETE FROM "groups" g USING d WHERE g.id = d.id AND d.id <> d.keep_id;

-- AlterTable
ALTER TABLE "gardens" ALTER COLUMN "name" SET DATA TYPE CITEXT;
ALTER TABLE "fruit_types" ALTER COLUMN "name" SET DATA TYPE CITEXT;
ALTER TABLE "groups" ALTER COLUMN "name" SET DATA TYPE CITEXT;

-- CreateIndex
CREATE UNIQUE INDEX "fruit_types_name_key" ON "fruit_types"("name");
CREATE UNIQUE INDEX "groups_name_key" ON "groups"("name");
