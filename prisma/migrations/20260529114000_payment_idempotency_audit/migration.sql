ALTER TABLE "payments" ADD COLUMN IF NOT EXISTS "idempotency_key" TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS "payments_idempotency_key_key" ON "payments"("idempotency_key");
CREATE INDEX IF NOT EXISTS "payments_user_id_idempotency_key_idx" ON "payments"("user_id", "idempotency_key");

CREATE TABLE IF NOT EXISTS "stripe_webhook_events" (
  "id" TEXT NOT NULL,
  "event_id" TEXT NOT NULL,
  "event_type" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'PROCESSING',
  "processed_at" TIMESTAMPTZ,
  "error_message" TEXT,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ NOT NULL,
  CONSTRAINT "stripe_webhook_events_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "stripe_webhook_events_event_id_key" ON "stripe_webhook_events"("event_id");
CREATE INDEX IF NOT EXISTS "stripe_webhook_events_event_type_created_at_idx" ON "stripe_webhook_events"("event_type", "created_at");
CREATE INDEX IF NOT EXISTS "stripe_webhook_events_status_created_at_idx" ON "stripe_webhook_events"("status", "created_at");

CREATE TABLE IF NOT EXISTS "payment_audit_logs" (
  "id" TEXT NOT NULL,
  "payment_id" TEXT,
  "user_id" TEXT,
  "action" TEXT NOT NULL,
  "status" "PaymentStatus",
  "idempotency_key" TEXT,
  "metadata_json" JSONB NOT NULL DEFAULT '{}',
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "payment_audit_logs_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "payment_audit_logs_payment_id_created_at_idx" ON "payment_audit_logs"("payment_id", "created_at");
CREATE INDEX IF NOT EXISTS "payment_audit_logs_user_id_created_at_idx" ON "payment_audit_logs"("user_id", "created_at");
CREATE INDEX IF NOT EXISTS "payment_audit_logs_action_created_at_idx" ON "payment_audit_logs"("action", "created_at");
CREATE INDEX IF NOT EXISTS "payment_audit_logs_idempotency_key_idx" ON "payment_audit_logs"("idempotency_key");

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'payment_audit_logs_payment_id_fkey') THEN
    ALTER TABLE "payment_audit_logs" ADD CONSTRAINT "payment_audit_logs_payment_id_fkey" FOREIGN KEY ("payment_id") REFERENCES "payments"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'payment_audit_logs_user_id_fkey') THEN
    ALTER TABLE "payment_audit_logs" ADD CONSTRAINT "payment_audit_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;
