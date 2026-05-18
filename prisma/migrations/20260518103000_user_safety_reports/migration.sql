CREATE TYPE "UserSafetyReportReason" AS ENUM ('HARASSMENT','SPAM','INAPPROPRIATE_CONTENT','FRAUD_OR_SCAM','OFF_PLATFORM_PAYMENT','IMPERSONATION','OTHER');
CREATE TYPE "UserSafetySourceType" AS ENUM ('PROFILE','CHAT','FEED_ITEM','GROUP_GIFT','OTHER');
CREATE TYPE "UserSafetyReportStatus" AS ENUM ('SUBMITTED','UNDER_REVIEW','REVIEWED','WARNED','SUSPENDED','DISMISSED','ESCALATED');
CREATE TYPE "UserSafetyAdminAction" AS ENUM ('MARK_REVIEWED','WARN_REPORTED_USER','SUSPEND_REPORTED_USER','DISMISS_REPORT','ESCALATE');

CREATE TABLE "user_safety_reports" (
  "id" TEXT NOT NULL,
  "report_id" TEXT NOT NULL,
  "reporter_user_id" TEXT NOT NULL,
  "reported_user_id" TEXT NOT NULL,
  "reason" "UserSafetyReportReason" NOT NULL,
  "details" TEXT NOT NULL,
  "source_type" "UserSafetySourceType" NOT NULL,
  "source_id" TEXT,
  "evidence_urls_json" JSONB NOT NULL DEFAULT '[]',
  "status" "UserSafetyReportStatus" NOT NULL DEFAULT 'SUBMITTED',
  "admin_comment" TEXT,
  "reviewed_by_id" TEXT,
  "reviewed_at" TIMESTAMPTZ,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ NOT NULL,
  CONSTRAINT "user_safety_reports_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "user_blocks" (
  "id" TEXT NOT NULL,
  "blocker_user_id" TEXT NOT NULL,
  "blocked_user_id" TEXT NOT NULL,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "user_blocks_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "user_safety_moderation_logs" (
  "id" TEXT NOT NULL,
  "report_id" TEXT NOT NULL,
  "actor_id" TEXT NOT NULL,
  "action" "UserSafetyAdminAction" NOT NULL,
  "reason" TEXT,
  "comment" TEXT,
  "before_json" JSONB,
  "after_json" JSONB,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "user_safety_moderation_logs_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "user_safety_reports_report_id_key" ON "user_safety_reports"("report_id");
CREATE INDEX "user_safety_reports_reporter_user_id_created_at_idx" ON "user_safety_reports"("reporter_user_id", "created_at");
CREATE INDEX "user_safety_reports_reported_user_id_status_idx" ON "user_safety_reports"("reported_user_id", "status");
CREATE INDEX "user_safety_reports_source_type_source_id_idx" ON "user_safety_reports"("source_type", "source_id");
CREATE INDEX "user_safety_reports_reason_status_idx" ON "user_safety_reports"("reason", "status");
CREATE UNIQUE INDEX "user_blocks_blocker_user_id_blocked_user_id_key" ON "user_blocks"("blocker_user_id", "blocked_user_id");
CREATE INDEX "user_blocks_blocked_user_id_idx" ON "user_blocks"("blocked_user_id");
CREATE INDEX "user_safety_moderation_logs_report_id_created_at_idx" ON "user_safety_moderation_logs"("report_id", "created_at");
CREATE INDEX "user_safety_moderation_logs_actor_id_created_at_idx" ON "user_safety_moderation_logs"("actor_id", "created_at");

ALTER TABLE "user_safety_reports" ADD CONSTRAINT "user_safety_reports_reporter_user_id_fkey" FOREIGN KEY ("reporter_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "user_safety_reports" ADD CONSTRAINT "user_safety_reports_reported_user_id_fkey" FOREIGN KEY ("reported_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "user_safety_reports" ADD CONSTRAINT "user_safety_reports_reviewed_by_id_fkey" FOREIGN KEY ("reviewed_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "user_blocks" ADD CONSTRAINT "user_blocks_blocker_user_id_fkey" FOREIGN KEY ("blocker_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "user_blocks" ADD CONSTRAINT "user_blocks_blocked_user_id_fkey" FOREIGN KEY ("blocked_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "user_safety_moderation_logs" ADD CONSTRAINT "user_safety_moderation_logs_report_id_fkey" FOREIGN KEY ("report_id") REFERENCES "user_safety_reports"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "user_safety_moderation_logs" ADD CONSTRAINT "user_safety_moderation_logs_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
