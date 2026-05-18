CREATE TABLE "messaging_settings" (
  "id" TEXT NOT NULL,
  "buyer_provider_chat_enabled" BOOLEAN NOT NULL DEFAULT true,
  "support_chat_enabled" BOOLEAN NOT NULL DEFAULT true,
  "message_retention_days" INTEGER NOT NULL DEFAULT 365,
  "max_message_length" INTEGER NOT NULL DEFAULT 2000,
  "max_attachments_per_message" INTEGER NOT NULL DEFAULT 5,
  "allowed_attachment_types_json" JSONB NOT NULL DEFAULT '["jpg","jpeg","png","pdf","mp4"]',
  "profanity_filter_enabled" BOOLEAN NOT NULL DEFAULT true,
  "pii_filter_enabled" BOOLEAN NOT NULL DEFAULT true,
  "auto_flag_enabled" BOOLEAN NOT NULL DEFAULT true,
  "auto_flag_keywords_json" JSONB NOT NULL DEFAULT '["refund outside platform","bank account","whatsapp me"]',
  "offline_notification_delay_seconds" INTEGER NOT NULL DEFAULT 10,
  "message_edit_window_minutes" INTEGER NOT NULL DEFAULT 0,
  "updated_by_id" TEXT,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ NOT NULL,
  CONSTRAINT "messaging_settings_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "messaging_settings_updated_by_id_idx" ON "messaging_settings"("updated_by_id");
ALTER TABLE "messaging_settings" ADD CONSTRAINT "messaging_settings_updated_by_id_fkey" FOREIGN KEY ("updated_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
