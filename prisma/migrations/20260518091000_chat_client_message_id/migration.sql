ALTER TABLE "chat_messages" ADD COLUMN IF NOT EXISTS "client_message_id" TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS "chat_messages_thread_id_sender_id_client_message_id_key" ON "chat_messages"("thread_id", "sender_id", "client_message_id");

DO $$
BEGIN
  IF to_regclass('public.support_chat_messages') IS NOT NULL THEN
    ALTER TABLE "support_chat_messages" ADD COLUMN IF NOT EXISTS "client_message_id" TEXT;
    CREATE UNIQUE INDEX IF NOT EXISTS "support_chat_messages_support_chat_id_sender_id_client_message_id_key" ON "support_chat_messages"("support_chat_id", "sender_id", "client_message_id");
  END IF;
END $$;
