-- Refactor legacy user lifecycle booleans into a single status enum.
CREATE TYPE "UserStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'SUSPENDED', 'BLOCKED');

ALTER TABLE "users" ADD COLUMN "status" "UserStatus";

UPDATE "users"
SET "status" = CASE
  WHEN "suspended_at" IS NOT NULL THEN 'SUSPENDED'::"UserStatus"
  WHEN "is_active" = false THEN 'BLOCKED'::"UserStatus"
  WHEN "is_approved" = false THEN 'PENDING'::"UserStatus"
  WHEN "is_verified" = false THEN 'PENDING'::"UserStatus"
  ELSE 'APPROVED'::"UserStatus"
END;

ALTER TABLE "users" ALTER COLUMN "status" SET DEFAULT 'PENDING';
ALTER TABLE "users" ALTER COLUMN "status" SET NOT NULL;

DROP INDEX IF EXISTS "users_role_is_active_idx";
DROP INDEX IF EXISTS "users_role_suspended_at_idx";
CREATE INDEX "users_role_status_idx" ON "users"("role", "status");

ALTER TABLE "users" DROP COLUMN "is_verified";
ALTER TABLE "users" DROP COLUMN "is_active";
ALTER TABLE "users" DROP COLUMN "is_approved";
ALTER TABLE "users" DROP COLUMN "suspended_at";
ALTER TABLE "users" DROP COLUMN "suspended_by";
