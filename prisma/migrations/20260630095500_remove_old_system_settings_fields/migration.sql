ALTER TABLE "system_settings"
  DROP COLUMN IF EXISTS "session_timeout_minutes",
  DROP COLUMN IF EXISTS "admin_mfa_required",
  DROP COLUMN IF EXISTS "password_policy_json",
  DROP COLUMN IF EXISTS "default_currency",
  DROP COLUMN IF EXISTS "transaction_fee_percent",
  DROP COLUMN IF EXISTS "push_notifications_enabled",
  DROP COLUMN IF EXISTS "email_notifications_enabled";
