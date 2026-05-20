-- CreateEnum
CREATE TYPE "NotificationDeliveryStatus" AS ENUM ('QUEUED', 'DELIVERED', 'FAILED', 'SKIPPED', 'RETRIED');

-- CreateTable
CREATE TABLE "notification_delivery_logs" (
    "id" TEXT NOT NULL,
    "notification_id" TEXT,
    "recipient_id" TEXT NOT NULL,
    "recipient_type" "NotificationRecipientType" NOT NULL,
    "notification_type" TEXT NOT NULL,
    "channels_json" JSONB NOT NULL DEFAULT '[]',
    "idempotency_key" TEXT,
    "in_app_status" "NotificationDeliveryStatus" NOT NULL DEFAULT 'QUEUED',
    "socket_status" "NotificationDeliveryStatus" NOT NULL DEFAULT 'SKIPPED',
    "push_status" "NotificationDeliveryStatus" NOT NULL DEFAULT 'SKIPPED',
    "email_status" "NotificationDeliveryStatus" NOT NULL DEFAULT 'SKIPPED',
    "last_error" TEXT,
    "retry_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "notification_delivery_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "notification_delivery_logs_idempotency_key_key" ON "notification_delivery_logs"("idempotency_key");
CREATE INDEX "notification_delivery_logs_recipient_id_recipient_type_created_at_idx" ON "notification_delivery_logs"("recipient_id", "recipient_type", "created_at");
CREATE INDEX "notification_delivery_logs_notification_type_created_at_idx" ON "notification_delivery_logs"("notification_type", "created_at");
CREATE INDEX "notification_delivery_logs_in_app_status_socket_status_push_status_email_status_idx" ON "notification_delivery_logs"("in_app_status", "socket_status", "push_status", "email_status");

-- AddForeignKey
ALTER TABLE "notification_delivery_logs" ADD CONSTRAINT "notification_delivery_logs_notification_id_fkey" FOREIGN KEY ("notification_id") REFERENCES "notifications"("id") ON DELETE SET NULL ON UPDATE CASCADE;
