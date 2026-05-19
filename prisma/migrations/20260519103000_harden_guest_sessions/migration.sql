DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'GuestCapability') THEN
    CREATE TYPE "GuestCapability" AS ENUM (
      'VIEW_ONBOARDING',
      'BROWSE_MARKETPLACE',
      'VIEW_MARKETPLACE_HOME',
      'VIEW_GIFT_DETAILS',
      'VIEW_MARKETPLACE_FILTERS',
      'VIEW_DISCOUNTED_GIFTS'
    );
  END IF;
END $$;

ALTER TYPE "GuestCapability" ADD VALUE IF NOT EXISTS 'VIEW_MARKETPLACE_HOME';

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'GuestSessionPlatform') THEN
    CREATE TYPE "GuestSessionPlatform" AS ENUM ('IOS', 'ANDROID', 'WEB', 'UNKNOWN');
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS "guest_sessions" (
  "id" TEXT NOT NULL,
  "guest_session_id" TEXT,
  "device_id" TEXT,
  "platform" "GuestSessionPlatform" NOT NULL DEFAULT 'UNKNOWN',
  "app_version" TEXT,
  "ip_address" TEXT,
  "user_agent" TEXT,
  "locale" TEXT,
  "timezone" TEXT,
  "referrer" TEXT,
  "capabilities_json" JSONB NOT NULL DEFAULT '[]',
  "expires_at" TIMESTAMPTZ NOT NULL,
  "last_seen_at" TIMESTAMPTZ,
  "revoked_at" TIMESTAMPTZ,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ NOT NULL,
  CONSTRAINT "guest_sessions_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "guest_sessions"
  ADD COLUMN IF NOT EXISTS "guest_session_id" TEXT,
  ADD COLUMN IF NOT EXISTS "device_id" TEXT,
  ADD COLUMN IF NOT EXISTS "platform" "GuestSessionPlatform" NOT NULL DEFAULT 'UNKNOWN',
  ADD COLUMN IF NOT EXISTS "app_version" TEXT,
  ADD COLUMN IF NOT EXISTS "locale" TEXT,
  ADD COLUMN IF NOT EXISTS "timezone" TEXT,
  ADD COLUMN IF NOT EXISTS "referrer" TEXT,
  ADD COLUMN IF NOT EXISTS "last_seen_at" TIMESTAMPTZ;

UPDATE "guest_sessions"
SET "guest_session_id" = "id"
WHERE "guest_session_id" IS NULL;

ALTER TABLE "guest_sessions"
  ALTER COLUMN "guest_session_id" SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS "guest_sessions_guest_session_id_key" ON "guest_sessions"("guest_session_id");
CREATE INDEX IF NOT EXISTS "guest_sessions_guest_session_id_idx" ON "guest_sessions"("guest_session_id");
CREATE INDEX IF NOT EXISTS "guest_sessions_expires_at_idx" ON "guest_sessions"("expires_at");
CREATE INDEX IF NOT EXISTS "guest_sessions_ip_address_last_seen_at_idx" ON "guest_sessions"("ip_address", "last_seen_at");
