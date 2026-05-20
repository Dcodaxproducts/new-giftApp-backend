-- Duplicate-safe guard for message moderation objects. The prior
-- 20260518055500_add_message_moderation migration may already create these.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'MessageModerationSource') THEN
    CREATE TYPE "MessageModerationSource" AS ENUM ('CUSTOMER_PROVIDER_CHAT', 'PROVIDER_BUYER_CHAT', 'ADMIN_SUPPORT_CHAT', 'WHATSAPP_BUSINESS', 'ZENDESK', 'SMS_GATEWAY', 'IN_APP_CHAT');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'MessageModerationFlagType') THEN
    CREATE TYPE "MessageModerationFlagType" AS ENUM ('PROFANITY', 'HOSTILITY', 'SUSPICIOUS_LINK', 'HARASSMENT', 'HATE_SPEECH', 'SPAM', 'SCAM', 'OTHER');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'MessageModerationStatus') THEN
    CREATE TYPE "MessageModerationStatus" AS ENUM ('FLAGGED', 'UNDER_REVIEW', 'DISMISSED', 'BLOCKED', 'WARNED', 'SUSPENDED');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'MessageModerationSeverity') THEN
    CREATE TYPE "MessageModerationSeverity" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'MessageModerationAction') THEN
    CREATE TYPE "MessageModerationAction" AS ENUM ('FLAGGED', 'BLOCK_MESSAGE', 'WARN_USER', 'SUSPEND_ACCOUNT', 'DISMISS_FLAG', 'ADD_NOTE', 'REPROCESS');
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS "message_moderation_cases" (
    "id" TEXT NOT NULL,
    "conversation_id" TEXT NOT NULL,
    "message_id" TEXT NOT NULL,
    "source" "MessageModerationSource" NOT NULL,
    "participant_id" TEXT NOT NULL,
    "participant_role" TEXT NOT NULL,
    "participant_name" TEXT,
    "participant_avatar_url" TEXT,
    "external_reference" TEXT,
    "sender_id" TEXT NOT NULL,
    "sender_role" TEXT NOT NULL,
    "raw_body" TEXT,
    "redacted_body" TEXT NOT NULL,
    "flag_types_json" JSONB NOT NULL DEFAULT '[]',
    "keywords_json" JSONB NOT NULL DEFAULT '[]',
    "severity" "MessageModerationSeverity" NOT NULL,
    "confidence" DECIMAL(5,2) NOT NULL,
    "status" "MessageModerationStatus" NOT NULL DEFAULT 'FLAGGED',
    "assigned_to_id" TEXT,
    "last_message_at" TIMESTAMPTZ NOT NULL,
    "resolved_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,
    CONSTRAINT "message_moderation_cases_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "message_moderation_logs" (
    "id" TEXT NOT NULL,
    "case_id" TEXT NOT NULL,
    "message_id" TEXT NOT NULL,
    "action" "MessageModerationAction" NOT NULL,
    "reason" TEXT,
    "internal_note" TEXT,
    "actor_id" TEXT,
    "metadata_json" JSONB,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "message_moderation_logs_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "message_moderation_cases_message_id_key" ON "message_moderation_cases"("message_id");
CREATE INDEX IF NOT EXISTS "message_moderation_cases_source_status_severity_created_at_idx" ON "message_moderation_cases"("source", "status", "severity", "created_at");
CREATE INDEX IF NOT EXISTS "message_moderation_cases_participant_id_created_at_idx" ON "message_moderation_cases"("participant_id", "created_at");
CREATE INDEX IF NOT EXISTS "message_moderation_cases_assigned_to_id_status_idx" ON "message_moderation_cases"("assigned_to_id", "status");
CREATE INDEX IF NOT EXISTS "message_moderation_logs_case_id_created_at_idx" ON "message_moderation_logs"("case_id", "created_at");
CREATE INDEX IF NOT EXISTS "message_moderation_logs_message_id_created_at_idx" ON "message_moderation_logs"("message_id", "created_at");

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'message_moderation_logs_case_id_fkey') THEN
    ALTER TABLE "message_moderation_logs" ADD CONSTRAINT "message_moderation_logs_case_id_fkey" FOREIGN KEY ("case_id") REFERENCES "message_moderation_cases"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END $$;
