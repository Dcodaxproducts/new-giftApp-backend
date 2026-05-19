-- Unify all chat runtime persistence behind ChatThread/ChatMessage.
CREATE TYPE "ChatThreadType" AS ENUM ('ORDER_CHAT', 'SUPPORT_CHAT', 'MODERATION_REVIEW');
CREATE TYPE "ChatSourceType" AS ENUM ('CUSTOMER_ORDER', 'PROVIDER_ORDER', 'SUPPORT', 'MESSAGE_MODERATION');
CREATE TYPE "ChatThreadStatus" AS ENUM ('OPEN', 'ACTIVE', 'RESOLVED', 'REOPENED', 'ARCHIVED', 'BLOCKED_BY_MODERATION');
CREATE TYPE "ChatParticipantRole" AS ENUM ('REGISTERED_USER', 'PROVIDER', 'ADMIN', 'SUPER_ADMIN', 'SYSTEM');

ALTER TYPE "ChatSenderType" ADD VALUE IF NOT EXISTS 'PARTICIPANT';
ALTER TYPE "ChatSenderType" ADD VALUE IF NOT EXISTS 'SYSTEM';

ALTER TABLE "chat_threads" ADD COLUMN IF NOT EXISTS "thread_type" "ChatThreadType" NOT NULL DEFAULT 'ORDER_CHAT';
ALTER TABLE "chat_threads" ADD COLUMN IF NOT EXISTS "source_type" "ChatSourceType" NOT NULL DEFAULT 'PROVIDER_ORDER';
ALTER TABLE "chat_threads" ADD COLUMN IF NOT EXISTS "source_id" TEXT;
ALTER TABLE "chat_threads" ADD COLUMN IF NOT EXISTS "subject" TEXT;
ALTER TABLE "chat_threads" ADD COLUMN IF NOT EXISTS "status" "ChatThreadStatus" NOT NULL DEFAULT 'ACTIVE';
ALTER TABLE "chat_threads" ADD COLUMN IF NOT EXISTS "assigned_admin_id" TEXT;
ALTER TABLE "chat_threads" ADD COLUMN IF NOT EXISTS "resolved_by_id" TEXT;
ALTER TABLE "chat_threads" ADD COLUMN IF NOT EXISTS "resolved_at" TIMESTAMPTZ;
ALTER TABLE "chat_threads" ADD COLUMN IF NOT EXISTS "last_message_at" TIMESTAMPTZ;
ALTER TABLE "chat_threads" ALTER COLUMN "order_id" DROP NOT NULL;
ALTER TABLE "chat_threads" ALTER COLUMN "provider_order_id" DROP NOT NULL;
ALTER TABLE "chat_threads" ALTER COLUMN "provider_id" DROP NOT NULL;
ALTER TABLE "chat_threads" ALTER COLUMN "customer_id" DROP NOT NULL;
UPDATE "chat_threads" SET "source_id" = COALESCE("source_id", "provider_order_id"), "last_message_at" = COALESCE("last_message_at", "updated_at") WHERE "thread_type" = 'ORDER_CHAT';

CREATE TABLE IF NOT EXISTS "chat_participants" (
  "id" TEXT NOT NULL,
  "thread_id" TEXT NOT NULL,
  "user_id" TEXT NOT NULL,
  "role" "ChatParticipantRole" NOT NULL,
  "joined_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "left_at" TIMESTAMPTZ,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ NOT NULL,
  CONSTRAINT "chat_participants_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "chat_message_read_receipts" (
  "id" TEXT NOT NULL,
  "thread_id" TEXT NOT NULL,
  "message_id" TEXT NOT NULL,
  "user_id" TEXT NOT NULL,
  "read_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "chat_message_read_receipts_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "chat_attachments" (
  "id" TEXT NOT NULL,
  "thread_id" TEXT NOT NULL,
  "message_id" TEXT,
  "file_url" TEXT NOT NULL,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "chat_attachments_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "chat_audit_logs" (
  "id" TEXT NOT NULL,
  "thread_id" TEXT NOT NULL,
  "message_id" TEXT,
  "actor_id" TEXT,
  "action" TEXT NOT NULL,
  "metadata_json" JSONB NOT NULL DEFAULT '{}',
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "chat_audit_logs_pkey" PRIMARY KEY ("id")
);

INSERT INTO "chat_participants" ("id", "thread_id", "user_id", "role", "updated_at")
SELECT gen_random_uuid()::text, "id", "customer_id", 'REGISTERED_USER', CURRENT_TIMESTAMP FROM "chat_threads" WHERE "customer_id" IS NOT NULL
ON CONFLICT DO NOTHING;
INSERT INTO "chat_participants" ("id", "thread_id", "user_id", "role", "updated_at")
SELECT gen_random_uuid()::text, "id", "provider_id", 'PROVIDER', CURRENT_TIMESTAMP FROM "chat_threads" WHERE "provider_id" IS NOT NULL
ON CONFLICT DO NOTHING;

INSERT INTO "chat_threads" ("id", "thread_type", "source_type", "source_id", "subject", "status", "provider_id", "customer_id", "assigned_admin_id", "resolved_by_id", "resolved_at", "last_message_at", "created_at", "updated_at", "last_message_id")
SELECT sc."id", 'SUPPORT_CHAT', 'SUPPORT', sc."id", sc."subject",
  CASE WHEN sc."status" = 'RESOLVED' THEN 'RESOLVED'::"ChatThreadStatus" WHEN sc."status" = 'OPEN' THEN 'OPEN'::"ChatThreadStatus" ELSE 'ACTIVE'::"ChatThreadStatus" END,
  CASE WHEN sc."participant_type" = 'PROVIDER' THEN sc."participant_id" ELSE NULL END,
  CASE WHEN sc."participant_type" = 'REGISTERED_USER' THEN sc."participant_id" ELSE NULL END,
  sc."assigned_admin_id", sc."resolved_by_id", sc."resolved_at", sc."last_message_at", sc."created_at", sc."updated_at", NULL
FROM "support_chats" sc
WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'support_chats')
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "chat_messages" ("id", "thread_id", "sender_id", "sender_type", "client_message_id", "message_type", "body", "attachment_urls_json", "visibility_status", "hidden_by_moderation", "hidden_at", "hidden_by_admin_id", "created_at")
SELECT scm."id", scm."support_chat_id", scm."sender_id",
  CASE WHEN scm."sender_type" = 'ADMIN' THEN 'ADMIN'::"ChatSenderType" ELSE 'PARTICIPANT'::"ChatSenderType" END,
  scm."client_message_id", scm."message_type", scm."body", scm."attachment_urls_json", scm."visibility_status", scm."hidden_by_moderation", scm."hidden_at", scm."hidden_by_admin_id", scm."created_at"
FROM "support_chat_messages" scm
WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'support_chat_messages')
ON CONFLICT DO NOTHING;

INSERT INTO "chat_participants" ("id", "thread_id", "user_id", "role", "updated_at")
SELECT gen_random_uuid()::text, sc."id", sc."participant_id", sc."participant_type"::text::"ChatParticipantRole", CURRENT_TIMESTAMP FROM "support_chats" sc
WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'support_chats')
ON CONFLICT DO NOTHING;
INSERT INTO "chat_participants" ("id", "thread_id", "user_id", "role", "updated_at")
SELECT gen_random_uuid()::text, sc."id", sc."assigned_admin_id", 'ADMIN', CURRENT_TIMESTAMP FROM "support_chats" sc WHERE sc."assigned_admin_id" IS NOT NULL
ON CONFLICT DO NOTHING;

UPDATE "chat_threads" ct SET "last_message_id" = sc."last_message_id" FROM "support_chats" sc WHERE ct."id" = sc."id" AND sc."last_message_id" IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS "chat_participants_thread_id_user_id_key" ON "chat_participants"("thread_id", "user_id");
CREATE INDEX IF NOT EXISTS "chat_participants_user_id_updated_at_idx" ON "chat_participants"("user_id", "updated_at");
CREATE UNIQUE INDEX IF NOT EXISTS "chat_message_read_receipts_message_id_user_id_key" ON "chat_message_read_receipts"("message_id", "user_id");
CREATE INDEX IF NOT EXISTS "chat_message_read_receipts_thread_id_user_id_read_at_idx" ON "chat_message_read_receipts"("thread_id", "user_id", "read_at");
CREATE INDEX IF NOT EXISTS "chat_attachments_thread_id_created_at_idx" ON "chat_attachments"("thread_id", "created_at");
CREATE INDEX IF NOT EXISTS "chat_attachments_message_id_idx" ON "chat_attachments"("message_id");
CREATE INDEX IF NOT EXISTS "chat_audit_logs_thread_id_created_at_idx" ON "chat_audit_logs"("thread_id", "created_at");
CREATE INDEX IF NOT EXISTS "chat_audit_logs_message_id_idx" ON "chat_audit_logs"("message_id");
CREATE INDEX IF NOT EXISTS "chat_audit_logs_actor_id_created_at_idx" ON "chat_audit_logs"("actor_id", "created_at");
CREATE INDEX IF NOT EXISTS "chat_threads_thread_type_status_updated_at_idx" ON "chat_threads"("thread_type", "status", "updated_at");
CREATE INDEX IF NOT EXISTS "chat_threads_source_type_source_id_idx" ON "chat_threads"("source_type", "source_id");
CREATE INDEX IF NOT EXISTS "chat_threads_assigned_admin_id_updated_at_idx" ON "chat_threads"("assigned_admin_id", "updated_at");

ALTER TABLE "chat_threads" ADD CONSTRAINT "chat_threads_assigned_admin_id_fkey" FOREIGN KEY ("assigned_admin_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "chat_threads" ADD CONSTRAINT "chat_threads_resolved_by_id_fkey" FOREIGN KEY ("resolved_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "chat_participants" ADD CONSTRAINT "chat_participants_thread_id_fkey" FOREIGN KEY ("thread_id") REFERENCES "chat_threads"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "chat_participants" ADD CONSTRAINT "chat_participants_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "chat_message_read_receipts" ADD CONSTRAINT "chat_message_read_receipts_thread_id_fkey" FOREIGN KEY ("thread_id") REFERENCES "chat_threads"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "chat_message_read_receipts" ADD CONSTRAINT "chat_message_read_receipts_message_id_fkey" FOREIGN KEY ("message_id") REFERENCES "chat_messages"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "chat_message_read_receipts" ADD CONSTRAINT "chat_message_read_receipts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "chat_attachments" ADD CONSTRAINT "chat_attachments_thread_id_fkey" FOREIGN KEY ("thread_id") REFERENCES "chat_threads"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "chat_attachments" ADD CONSTRAINT "chat_attachments_message_id_fkey" FOREIGN KEY ("message_id") REFERENCES "chat_messages"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "chat_audit_logs" ADD CONSTRAINT "chat_audit_logs_thread_id_fkey" FOREIGN KEY ("thread_id") REFERENCES "chat_threads"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "chat_audit_logs" ADD CONSTRAINT "chat_audit_logs_message_id_fkey" FOREIGN KEY ("message_id") REFERENCES "chat_messages"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "chat_audit_logs" ADD CONSTRAINT "chat_audit_logs_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

DROP TABLE IF EXISTS "support_chat_messages";
DROP TABLE IF EXISTS "support_chats";
DROP TYPE IF EXISTS "SupportChatSenderType";
DROP TYPE IF EXISTS "SupportChatStatus";
DROP TYPE IF EXISTS "SupportChatParticipantType";
