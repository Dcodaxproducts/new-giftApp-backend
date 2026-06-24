CREATE TABLE IF NOT EXISTS "refund_policy_settings" (
  "id" TEXT NOT NULL,
  "refund_window_days" INTEGER NOT NULL DEFAULT 30,
  "auto_refund_threshold_amount" DECIMAL(10,2) NOT NULL DEFAULT 50,
  "currency" TEXT NOT NULL DEFAULT 'PKR',
  "auto_approve_small_refunds" BOOLEAN NOT NULL DEFAULT true,
  "small_refund_auto_approve_amount" DECIMAL(10,2) NOT NULL DEFAULT 15,
  "eligible_category_ids_json" JSONB NOT NULL DEFAULT '[]',
  "updated_by_id" TEXT,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "refund_policy_settings_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "refund_policy_settings"
  ADD COLUMN IF NOT EXISTS "allow_refund" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS "note_text" TEXT,
  ADD COLUMN IF NOT EXISTS "refund_for_all_categories" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "cancellation_tiers_json" JSONB NOT NULL DEFAULT '[]';

CREATE INDEX IF NOT EXISTS "refund_policy_settings_updated_by_id_idx" ON "refund_policy_settings"("updated_by_id");

DO $$
BEGIN
  IF to_regclass('public.users') IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'refund_policy_settings_updated_by_id_fkey'
  ) THEN
    ALTER TABLE "refund_policy_settings"
      ADD CONSTRAINT "refund_policy_settings_updated_by_id_fkey"
      FOREIGN KEY ("updated_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;
