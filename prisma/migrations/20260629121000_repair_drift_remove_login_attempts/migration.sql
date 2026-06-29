ALTER TABLE "refund_policy_settings" DROP COLUMN IF EXISTS "auto_approve_small_refunds";
ALTER TABLE "refund_policy_settings" DROP COLUMN IF EXISTS "eligible_category_ids_json";
ALTER TABLE "refund_policy_settings" DROP COLUMN IF EXISTS "refund_for_all_categories";
ALTER TABLE "refund_policy_settings" DROP COLUMN IF EXISTS "small_refund_auto_approve_amount";

DROP TABLE IF EXISTS "login_attempts";
DROP TYPE IF EXISTS "LoginAttemptStatus";