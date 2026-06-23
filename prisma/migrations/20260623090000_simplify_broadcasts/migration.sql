CREATE TYPE "BroadcastAudience" AS ENUM ('ALL_USERS', 'PROVIDER', 'USER');

ALTER TABLE "broadcasts"
  ADD COLUMN "audience" "BroadcastAudience" NOT NULL DEFAULT 'ALL_USERS';

UPDATE "broadcasts"
SET "audience" = CASE
  WHEN "targeting_json"->'roles' = '["PROVIDER"]'::jsonb THEN 'PROVIDER'::"BroadcastAudience"
  WHEN "targeting_json"->'roles' = '["REGISTERED_USER"]'::jsonb THEN 'USER'::"BroadcastAudience"
  ELSE 'ALL_USERS'::"BroadcastAudience"
END
WHERE "targeting_json" IS NOT NULL;

DROP INDEX IF EXISTS "broadcasts_scheduled_at_status_idx";

ALTER TABLE "broadcasts"
  ALTER COLUMN "status" SET DEFAULT 'PROCESSING',
  DROP COLUMN IF EXISTS "image_url",
  DROP COLUMN IF EXISTS "cta_label",
  DROP COLUMN IF EXISTS "cta_url",
  DROP COLUMN IF EXISTS "channels",
  DROP COLUMN IF EXISTS "priority",
  DROP COLUMN IF EXISTS "targeting_json",
  DROP COLUMN IF EXISTS "estimated_reach_json",
  DROP COLUMN IF EXISTS "send_mode",
  DROP COLUMN IF EXISTS "scheduled_at",
  DROP COLUMN IF EXISTS "timezone",
  DROP COLUMN IF EXISTS "is_recurring",
  DROP COLUMN IF EXISTS "recurrence_json",
  DROP COLUMN IF EXISTS "cancelled_at",
  DROP COLUMN IF EXISTS "cancelled_by",
  DROP COLUMN IF EXISTS "cancel_reason";

DROP TYPE IF EXISTS "BroadcastPriority";
DROP TYPE IF EXISTS "BroadcastSendMode";
