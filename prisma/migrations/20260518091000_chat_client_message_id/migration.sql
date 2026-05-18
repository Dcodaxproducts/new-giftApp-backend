ALTER TABLE "chat_messages" ADD COLUMN "client_message_id" TEXT;
ALTER TABLE "support_chat_messages" ADD COLUMN "client_message_id" TEXT;
CREATE UNIQUE INDEX "chat_messages_thread_id_sender_id_client_message_id_key" ON "chat_messages"("thread_id", "sender_id", "client_message_id");
CREATE UNIQUE INDEX "support_chat_messages_support_chat_id_sender_id_client_message_id_key" ON "support_chat_messages"("support_chat_id", "sender_id", "client_message_id");
