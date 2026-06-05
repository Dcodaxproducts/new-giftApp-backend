ALTER TABLE "refund_policy_settings"
  ADD COLUMN IF NOT EXISTS "allow_refund" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS "note_text" TEXT,
  ADD COLUMN IF NOT EXISTS "refund_for_all_categories" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "cancellation_tiers_json" JSONB NOT NULL DEFAULT '[]';
