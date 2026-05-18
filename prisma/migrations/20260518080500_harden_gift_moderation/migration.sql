ALTER TABLE "gifts" ADD COLUMN "requires_manual_review" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "gifts" ADD COLUMN "manual_review_reason" TEXT;
ALTER TABLE "gifts" ADD COLUMN "hidden_by_moderation" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "gifts" ADD COLUMN "moderation_resolved_at" TIMESTAMPTZ;
CREATE INDEX "gifts_requires_manual_review_deleted_at_idx" ON "gifts"("requires_manual_review", "deleted_at");
CREATE INDEX "gifts_hidden_by_moderation_deleted_at_idx" ON "gifts"("hidden_by_moderation", "deleted_at");
