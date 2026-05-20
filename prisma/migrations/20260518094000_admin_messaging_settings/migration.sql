CREATE TABLE IF NOT EXISTS "messaging_settings" (
  "id" TEXT NOT NULL,
  "max_attachment_size_mb" INTEGER NOT NULL DEFAULT 10,
  "allowed_attachment_types" JSONB NOT NULL DEFAULT '[]',
  "retention_days" INTEGER NOT NULL DEFAULT 365,
  "updated_by_id" TEXT,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ NOT NULL,
  CONSTRAINT "messaging_settings_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "messaging_settings_updated_by_id_idx" ON "messaging_settings"("updated_by_id");
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'messaging_settings_updated_by_id_fkey') THEN
    ALTER TABLE "messaging_settings" ADD CONSTRAINT "messaging_settings_updated_by_id_fkey" FOREIGN KEY ("updated_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;
