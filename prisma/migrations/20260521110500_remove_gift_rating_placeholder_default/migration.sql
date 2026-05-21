UPDATE "gifts"
SET "rating_placeholder" = 0
WHERE "rating_placeholder" = 4.8;

ALTER TABLE "gifts" ALTER COLUMN "rating_placeholder" SET DEFAULT 0;
