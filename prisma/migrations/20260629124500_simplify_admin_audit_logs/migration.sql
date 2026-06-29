ALTER TABLE "admin_audit_logs" ADD COLUMN IF NOT EXISTS "actor_snapshot" JSONB;

UPDATE "admin_audit_logs"
SET "actor_snapshot" = jsonb_build_object(
  'name', "actor_name_snapshot",
  'role', "actor_type"
)
WHERE "actor_snapshot" IS NULL
  AND "actor_name_snapshot" IS NOT NULL;

ALTER TABLE "admin_audit_logs" DROP COLUMN IF EXISTS "event_id";
ALTER TABLE "admin_audit_logs" DROP COLUMN IF EXISTS "actor_name_snapshot";
ALTER TABLE "admin_audit_logs" DROP COLUMN IF EXISTS "environment";
ALTER TABLE "admin_audit_logs" DROP COLUMN IF EXISTS "request_payload_json";
ALTER TABLE "admin_audit_logs" DROP COLUMN IF EXISTS "response_payload_json";
ALTER TABLE "admin_audit_logs" DROP COLUMN IF EXISTS "duration_ms";
ALTER TABLE "admin_audit_logs" DROP COLUMN IF EXISTS "metadata_json";
ALTER TABLE "admin_audit_logs" DROP COLUMN IF EXISTS "user_agent";