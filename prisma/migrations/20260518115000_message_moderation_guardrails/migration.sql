-- Harden message moderation visibility and escalation metadata.
CREATE TYPE "MessageVisibilityStatus" AS ENUM ('VISIBLE', 'HIDDEN_BY_MODERATION');

ALTER TYPE "MessageModerationStatus" ADD VALUE IF NOT EXISTS 'PENDING_REVIEW';
ALTER TYPE "MessageModerationStatus" ADD VALUE IF NOT EXISTS 'ACTION_TAKEN';
ALTER TYPE "MessageModerationStatus" ADD VALUE IF NOT EXISTS 'ESCALATED';
ALTER TYPE "MessageModerationStatus" ADD VALUE IF NOT EXISTS 'RESOLVED';

ALTER TYPE "MessageModerationAction" ADD VALUE IF NOT EXISTS 'HIDE_MESSAGE';
ALTER TYPE "MessageModerationAction" ADD VALUE IF NOT EXISTS 'RESTORE_MESSAGE';
ALTER TYPE "MessageModerationAction" ADD VALUE IF NOT EXISTS 'ESCALATE_MESSAGE';

ALTER TABLE "chat_messages"
  ADD COLUMN "visibility_status" "MessageVisibilityStatus" NOT NULL DEFAULT 'VISIBLE',
  ADD COLUMN "hidden_by_moderation" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "hidden_at" TIMESTAMPTZ,
  ADD COLUMN "hidden_by_admin_id" TEXT;

ALTER TABLE "support_chat_messages"
  ADD COLUMN "visibility_status" "MessageVisibilityStatus" NOT NULL DEFAULT 'VISIBLE',
  ADD COLUMN "hidden_by_moderation" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "hidden_at" TIMESTAMPTZ,
  ADD COLUMN "hidden_by_admin_id" TEXT;

CREATE TABLE "message_moderation_escalations" (
  "id" TEXT NOT NULL,
  "case_id" TEXT NOT NULL,
  "message_id" TEXT NOT NULL,
  "conversation_id" TEXT NOT NULL,
  "escalation_type" TEXT NOT NULL,
  "priority" "MessageModerationSeverity" NOT NULL,
  "reason" TEXT NOT NULL,
  "assigned_to_admin_id" TEXT,
  "status" TEXT NOT NULL DEFAULT 'ESCALATED',
  "created_by_admin_id" TEXT NOT NULL,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "message_moderation_escalations_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "message_moderation_escalations_message_id_created_at_idx" ON "message_moderation_escalations"("message_id", "created_at");
CREATE INDEX "message_moderation_escalations_assigned_to_admin_id_status_idx" ON "message_moderation_escalations"("assigned_to_admin_id", "status");
ALTER TABLE "message_moderation_escalations" ADD CONSTRAINT "message_moderation_escalations_case_id_fkey" FOREIGN KEY ("case_id") REFERENCES "message_moderation_cases"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
