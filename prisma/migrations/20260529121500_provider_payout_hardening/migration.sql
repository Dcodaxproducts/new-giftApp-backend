ALTER TABLE "provider_payout_methods" ADD COLUMN IF NOT EXISTS "fingerprint" TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS "provider_payout_methods_provider_id_fingerprint_key" ON "provider_payout_methods"("provider_id", "fingerprint");

CREATE TABLE IF NOT EXISTS "provider_payout_audit_logs" (
  "id" TEXT NOT NULL,
  "payout_id" TEXT,
  "provider_id" TEXT NOT NULL,
  "actor_id" TEXT,
  "action" TEXT NOT NULL,
  "status" "ProviderPayoutStatus",
  "metadata_json" JSONB NOT NULL DEFAULT '{}',
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "provider_payout_audit_logs_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "provider_payout_audit_logs_payout_id_created_at_idx" ON "provider_payout_audit_logs"("payout_id", "created_at");
CREATE INDEX IF NOT EXISTS "provider_payout_audit_logs_provider_id_created_at_idx" ON "provider_payout_audit_logs"("provider_id", "created_at");
CREATE INDEX IF NOT EXISTS "provider_payout_audit_logs_action_created_at_idx" ON "provider_payout_audit_logs"("action", "created_at");
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'provider_payout_audit_logs_payout_id_fkey') THEN
    ALTER TABLE "provider_payout_audit_logs" ADD CONSTRAINT "provider_payout_audit_logs_payout_id_fkey" FOREIGN KEY ("payout_id") REFERENCES "provider_payouts"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'provider_payout_audit_logs_provider_id_fkey') THEN
    ALTER TABLE "provider_payout_audit_logs" ADD CONSTRAINT "provider_payout_audit_logs_provider_id_fkey" FOREIGN KEY ("provider_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END $$;
