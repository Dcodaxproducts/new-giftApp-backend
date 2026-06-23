DROP TABLE IF EXISTS "broadcast_deliveries";

ALTER TABLE "broadcasts"
  ALTER COLUMN "status" SET DEFAULT 'SENT';

DROP TYPE IF EXISTS "BroadcastDeliveryStatus";
DROP TYPE IF EXISTS "BroadcastChannel";
