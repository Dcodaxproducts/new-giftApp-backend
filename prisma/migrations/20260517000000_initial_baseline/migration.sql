-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('SUPER_ADMIN', 'ADMIN', 'REGISTERED_USER', 'PROVIDER', 'GUEST_USER');

-- CreateEnum
CREATE TYPE "GuestCapability" AS ENUM ('VIEW_ONBOARDING', 'BROWSE_MARKETPLACE', 'VIEW_MARKETPLACE_HOME', 'VIEW_GIFT_DETAILS', 'VIEW_MARKETPLACE_FILTERS', 'VIEW_DISCOUNTED_GIFTS');

-- CreateEnum
CREATE TYPE "GuestSessionPlatform" AS ENUM ('IOS', 'ANDROID', 'WEB', 'UNKNOWN');

-- CreateEnum
CREATE TYPE "ProviderApprovalStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "LoginAttemptStatus" AS ENUM ('SUCCESS', 'FAILED', 'BLOCKED');

-- CreateEnum
CREATE TYPE "AccountType" AS ENUM ('REGISTERED_USER', 'PROVIDER', 'ADMIN');

-- CreateEnum
CREATE TYPE "GiftStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'OUT_OF_STOCK');

-- CreateEnum
CREATE TYPE "GiftModerationStatus" AS ENUM ('NOT_REQUIRED', 'PENDING', 'APPROVED', 'REJECTED', 'FLAGGED');

-- CreateEnum
CREATE TYPE "BroadcastChannel" AS ENUM ('EMAIL', 'PUSH', 'IN_APP');

-- CreateEnum
CREATE TYPE "BroadcastPriority" AS ENUM ('LOW', 'NORMAL', 'HIGH', 'URGENT');

-- CreateEnum
CREATE TYPE "BroadcastStatus" AS ENUM ('DRAFT', 'SCHEDULED', 'PROCESSING', 'SENT', 'CANCELLED', 'FAILED');

-- CreateEnum
CREATE TYPE "BroadcastSendMode" AS ENUM ('NOW', 'SCHEDULED');

-- CreateEnum
CREATE TYPE "NotificationRecipientType" AS ENUM ('ADMIN', 'PROVIDER', 'REGISTERED_USER');

-- CreateEnum
CREATE TYPE "BroadcastDeliveryStatus" AS ENUM ('QUEUED', 'SENT', 'DELIVERED', 'FAILED', 'OPENED', 'CLICKED');

-- CreateEnum
CREATE TYPE "NotificationDevicePlatform" AS ENUM ('IOS', 'ANDROID', 'WEB');

-- CreateEnum
CREATE TYPE "NotificationDeliveryStatus" AS ENUM ('QUEUED', 'DELIVERED', 'FAILED', 'SKIPPED', 'RETRIED');

-- CreateEnum
CREATE TYPE "AuditLogStatus" AS ENUM ('SUCCESS', 'FAILED', 'PENDING', 'WARNING');

-- CreateEnum
CREATE TYPE "AuditLogSeverity" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "SubscriptionPlanStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "SubscriptionPlanVisibility" AS ENUM ('PUBLIC', 'PRIVATE', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "BillingCycle" AS ENUM ('MONTHLY', 'YEARLY');

-- CreateEnum
CREATE TYPE "CouponDiscountType" AS ENUM ('PERCENTAGE', 'FIXED_AMOUNT');

-- CreateEnum
CREATE TYPE "PromotionalOfferDiscountType" AS ENUM ('PERCENTAGE', 'FIXED_AMOUNT');

-- CreateEnum
CREATE TYPE "PromotionalOfferStatus" AS ENUM ('ACTIVE', 'SCHEDULED', 'EXPIRED', 'INACTIVE', 'PENDING', 'REJECTED');

-- CreateEnum
CREATE TYPE "PromotionalOfferApprovalStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "PromotionalOfferRejectionReason" AS ENUM ('INVALID_DISCOUNT', 'INVALID_DATES', 'POLICY_VIOLATION', 'ITEM_NOT_ELIGIBLE', 'INCOMPLETE_INFORMATION', 'OTHER');

-- CreateEnum
CREATE TYPE "UploadedFileStatus" AS ENUM ('PENDING', 'COMPLETED', 'FAILED', 'DELETED');

-- CreateEnum
CREATE TYPE "CustomerReminderEventType" AS ENUM ('BIRTHDAY', 'ANNIVERSARY', 'HOLIDAY', 'CUSTOM');

-- CreateEnum
CREATE TYPE "CustomerDeliveryOption" AS ENUM ('SAME_DAY', 'NEXT_DAY', 'SCHEDULED');

-- CreateEnum
CREATE TYPE "CustomerEventType" AS ENUM ('BIRTHDAY', 'ANNIVERSARY', 'HOLIDAY', 'WORK_MILESTONE', 'CUSTOM');

-- CreateEnum
CREATE TYPE "CustomerEventReminderTiming" AS ENUM ('ONE_DAY_BEFORE', 'THREE_DAYS_BEFORE', 'ONE_WEEK_BEFORE', 'ON_THE_DAY', 'CUSTOM');

-- CreateEnum
CREATE TYPE "CustomerEventReminderFrequency" AS ENUM ('ONE_TIME', 'MONTHLY', 'YEARLY');

-- CreateEnum
CREATE TYPE "CustomerEventReminderChannel" AS ENUM ('PUSH', 'EMAIL', 'SMS');

-- CreateEnum
CREATE TYPE "CustomerEventReminderJobStatus" AS ENUM ('PENDING', 'SENT', 'FAILED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "CartStatus" AS ENUM ('ACTIVE', 'CHECKED_OUT', 'ABANDONED');

-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('PENDING', 'CONFIRMED', 'PROCESSING', 'PARTIALLY_PROCESSING', 'PARTIALLY_SHIPPED', 'SHIPPED', 'PARTIALLY_COMPLETED', 'NEEDS_REVIEW', 'READY_FOR_PICKUP', 'OUT_FOR_DELIVERY', 'DELIVERED', 'COMPLETED', 'CANCELLED', 'FAILED');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'PROCESSING', 'SUCCEEDED', 'FAILED', 'CANCELLED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "ProviderOrderStatus" AS ENUM ('PENDING', 'ACCEPTED', 'PROCESSING', 'PACKED', 'READY_FOR_PICKUP', 'SHIPPED', 'OUT_FOR_DELIVERY', 'DELIVERED', 'COMPLETED', 'CANCELLED', 'REJECTED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "ProviderOrderMessageChannel" AS ENUM ('IN_APP', 'EMAIL', 'SMS_PLACEHOLDER');

-- CreateEnum
CREATE TYPE "ProviderOrderRejectReason" AS ENUM ('OUT_OF_STOCK', 'BUSINESS_CLOSED', 'CANNOT_DELIVER_TO_AREA', 'PRICING_ERROR', 'OTHER');

-- CreateEnum
CREATE TYPE "RefundRequestStatus" AS ENUM ('REQUESTED', 'APPROVED', 'REJECTED', 'REFUND_PROCESSING', 'REFUNDED', 'FAILED');

-- CreateEnum
CREATE TYPE "RefundRejectReason" AS ENUM ('ITEM_DELIVERED_AS_DESCRIBED', 'NO_DAMAGE_EVIDENCE', 'REFUND_WINDOW_EXPIRED', 'NOT_COVERED_BY_POLICY', 'OTHER');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('STRIPE_CARD', 'E_WALLET', 'BANK_TRANSFER', 'COD', 'PLACEHOLDER');

-- CreateEnum
CREATE TYPE "PaymentProvider" AS ENUM ('STRIPE', 'MANUAL');

-- CreateEnum
CREATE TYPE "MoneyGiftStatus" AS ENUM ('DRAFT', 'PAYMENT_PENDING', 'PAID', 'SCHEDULED', 'SENT', 'FAILED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "CustomerRecurringPaymentFrequency" AS ENUM ('DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY');

-- CreateEnum
CREATE TYPE "CustomerRecurringPaymentStatus" AS ENUM ('ACTIVE', 'PAUSED', 'CANCELLED', 'EXPIRED', 'FAILED');

-- CreateEnum
CREATE TYPE "CustomerRecurringPaymentOccurrenceStatus" AS ENUM ('PENDING', 'SUCCESS', 'FAILED', 'SKIPPED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "CustomerRecurringPaymentCancelMode" AS ENUM ('IMMEDIATELY', 'AFTER_CURRENT_BILLING_CYCLE');

-- CreateEnum
CREATE TYPE "ReferralStatus" AS ENUM ('PENDING', 'JOINED', 'QUALIFIED', 'REWARDED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "RewardLedgerType" AS ENUM ('EARNED', 'REDEEMED', 'EXPIRED', 'ADJUSTED');

-- CreateEnum
CREATE TYPE "RewardLedgerSource" AS ENUM ('REFERRAL', 'ADMIN_ADJUSTMENT', 'PROMOTION');

-- CreateEnum
CREATE TYPE "ReferralExpirationUnit" AS ENUM ('DAYS', 'WEEKS', 'MONTHS');

-- CreateEnum
CREATE TYPE "ReferralQualificationRule" AS ENUM ('FIRST_SUCCESSFUL_PURCHASE');

-- CreateEnum
CREATE TYPE "CustomerWalletLedgerType" AS ENUM ('TOP_UP', 'GIFT_SENT', 'MONEY_GIFT_SENT', 'REWARD_CREDIT', 'REFUND', 'ADJUSTMENT');

-- CreateEnum
CREATE TYPE "CustomerWalletLedgerDirection" AS ENUM ('CREDIT', 'DEBIT');

-- CreateEnum
CREATE TYPE "CustomerWalletLedgerStatus" AS ENUM ('PENDING', 'SUCCESS', 'FAILED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "CustomerSubscriptionStatus" AS ENUM ('INCOMPLETE', 'ACTIVE', 'TRIALING', 'PAST_DUE', 'CANCELLED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "CustomerSubscriptionInvoiceStatus" AS ENUM ('PAID', 'OPEN', 'FAILED', 'VOID');

-- CreateEnum
CREATE TYPE "CustomerSubscriptionCancelMode" AS ENUM ('IMMEDIATELY', 'AFTER_CURRENT_PERIOD');

-- CreateEnum
CREATE TYPE "ProviderFulfillmentMethod" AS ENUM ('PICKUP', 'DELIVERY');

-- CreateEnum
CREATE TYPE "SocialPostVisibility" AS ENUM ('PUBLIC', 'HIDDEN');

-- CreateEnum
CREATE TYPE "SocialPostStatus" AS ENUM ('ACTIVE', 'REMOVED');

-- CreateEnum
CREATE TYPE "SocialReportReason" AS ENUM ('SPAM', 'HARASSMENT', 'HATE_SPEECH', 'FALSE_INFORMATION', 'INAPPROPRIATE', 'INAPPROPRIATE_BEHAVIOR', 'INAPPROPRIATE_CONTENT', 'DECEPTIVE_LINK', 'POLICY_VIOLATION', 'OTHER');

-- CreateEnum
CREATE TYPE "SocialReportSeverity" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "SocialReportStatus" AS ENUM ('PENDING', 'REVIEWED', 'HIDDEN', 'REMOVED', 'WARNED', 'DISMISSED');

-- CreateEnum
CREATE TYPE "SocialModerationAction" AS ENUM ('HIDE', 'REMOVE', 'WARN_USER', 'MARK_REVIEWED', 'DISMISS_REPORT', 'RESTORE');

-- CreateEnum
CREATE TYPE "SocialReportingEscalationRule" AS ENUM ('AUTO_HIDE_CONTENT', 'SEND_TO_SENIOR_MODERATOR', 'IMMEDIATE_REVIEW', 'FACT_CHECK_QUEUE', 'MANUAL_REVIEW');

-- CreateEnum
CREATE TYPE "ReviewStatus" AS ENUM ('PUBLISHED', 'PENDING', 'FLAGGED', 'HIDDEN', 'REMOVED', 'PENALIZED');

-- CreateEnum
CREATE TYPE "ReviewSource" AS ENUM ('GOOGLE', 'TRUSTPILOT', 'APP_STORE', 'IN_APP');

-- CreateEnum
CREATE TYPE "ReviewSeverity" AS ENUM ('CRITICAL', 'HIGH', 'MEDIUM', 'LOW');

-- CreateEnum
CREATE TYPE "ReviewFlagReason" AS ENUM ('SPAM', 'ABUSE', 'FAKE_REVIEW', 'POLICY_VIOLATION', 'FALSE_POSITIVE', 'OFF_TOPIC', 'OTHER');

-- CreateEnum
CREATE TYPE "ReviewModerationActorType" AS ENUM ('ADMIN', 'SUPER_ADMIN', 'SYSTEM');

-- CreateEnum
CREATE TYPE "ReviewModerationAction" AS ENUM ('APPROVE', 'HIDE', 'REMOVE', 'PENALIZE', 'RESTORE', 'MARK_SPAM', 'MARK_FAKE', 'AUTO_HIDDEN', 'AUTO_APPROVED', 'AUTO_FLAGGED');

-- CreateEnum
CREATE TYPE "ChatSenderType" AS ENUM ('CUSTOMER', 'PROVIDER', 'ADMIN', 'PARTICIPANT', 'SYSTEM');

-- CreateEnum
CREATE TYPE "ChatMessageType" AS ENUM ('TEXT', 'IMAGE', 'AUDIO', 'VIDEO', 'FILE');

-- CreateEnum
CREATE TYPE "MessageVisibilityStatus" AS ENUM ('VISIBLE', 'HIDDEN_BY_MODERATION');

-- CreateEnum
CREATE TYPE "ChatThreadType" AS ENUM ('ORDER_CHAT', 'SUPPORT_CHAT', 'MODERATION_REVIEW');

-- CreateEnum
CREATE TYPE "ChatSourceType" AS ENUM ('CUSTOMER_ORDER', 'PROVIDER_ORDER', 'SUPPORT', 'MESSAGE_MODERATION');

-- CreateEnum
CREATE TYPE "ChatThreadStatus" AS ENUM ('OPEN', 'ACTIVE', 'RESOLVED', 'REOPENED', 'ARCHIVED', 'BLOCKED_BY_MODERATION');

-- CreateEnum
CREATE TYPE "ChatParticipantRole" AS ENUM ('REGISTERED_USER', 'PROVIDER', 'ADMIN', 'SUPER_ADMIN', 'SYSTEM');

-- CreateEnum
CREATE TYPE "MessageModerationSource" AS ENUM ('CUSTOMER_PROVIDER_CHAT', 'PROVIDER_BUYER_CHAT', 'ADMIN_SUPPORT_CHAT', 'WHATSAPP_BUSINESS', 'ZENDESK', 'SMS_GATEWAY', 'IN_APP_CHAT');

-- CreateEnum
CREATE TYPE "MessageModerationFlagType" AS ENUM ('PROFANITY', 'HOSTILITY', 'SUSPICIOUS_LINK', 'HARASSMENT', 'HATE_SPEECH', 'SPAM', 'SCAM', 'OTHER');

-- CreateEnum
CREATE TYPE "MessageModerationStatus" AS ENUM ('FLAGGED', 'PENDING_REVIEW', 'UNDER_REVIEW', 'ACTION_TAKEN', 'DISMISSED', 'BLOCKED', 'WARNED', 'SUSPENDED', 'ESCALATED', 'RESOLVED');

-- CreateEnum
CREATE TYPE "MessageModerationSeverity" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "MessageModerationAction" AS ENUM ('FLAGGED', 'HIDE_MESSAGE', 'RESTORE_MESSAGE', 'BLOCK_MESSAGE', 'WARN_USER', 'SUSPEND_ACCOUNT', 'DISMISS_FLAG', 'ADD_NOTE', 'REPROCESS', 'ESCALATE_MESSAGE');

-- CreateEnum
CREATE TYPE "ProviderReportReason" AS ENUM ('FRAUDULENT_ACTIVITY', 'INAPPROPRIATE_CONTENT', 'FAKE_REVIEWS', 'POOR_SERVICE_QUALITY', 'NOT_RESPONSIVE', 'OTHER');

-- CreateEnum
CREATE TYPE "ProviderReportStatus" AS ENUM ('SUBMITTED', 'UNDER_REVIEW', 'RESOLVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "UserSafetyReportReason" AS ENUM ('HARASSMENT', 'SPAM', 'INAPPROPRIATE_CONTENT', 'FRAUD_OR_SCAM', 'OFF_PLATFORM_PAYMENT', 'IMPERSONATION', 'OTHER');

-- CreateEnum
CREATE TYPE "UserSafetySourceType" AS ENUM ('PROFILE', 'CHAT', 'FEED_ITEM', 'GROUP_GIFT', 'OTHER');

-- CreateEnum
CREATE TYPE "UserSafetyReportStatus" AS ENUM ('SUBMITTED', 'UNDER_REVIEW', 'REVIEWED', 'WARNED', 'SUSPENDED', 'DISMISSED', 'ESCALATED');

-- CreateEnum
CREATE TYPE "UserSafetyAdminAction" AS ENUM ('MARK_REVIEWED', 'WARN_REPORTED_USER', 'SUSPEND_REPORTED_USER', 'DISMISS_REPORT', 'ESCALATE');

-- CreateEnum
CREATE TYPE "DisputeStatus" AS ENUM ('OPEN', 'IN_REVIEW', 'ESCALATED', 'RESOLVED', 'REJECTED', 'APPROVED');

-- CreateEnum
CREATE TYPE "DisputePriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "DisputeReason" AS ENUM ('PRODUCT_NOT_RECEIVED', 'PRODUCT_DAMAGED', 'WRONG_ITEM', 'DUPLICATE_CHARGE', 'REFUND_NOT_RECEIVED', 'PROVIDER_ISSUE', 'OTHER');

-- CreateEnum
CREATE TYPE "DisputeActorType" AS ENUM ('CUSTOMER', 'ADMIN', 'PROVIDER', 'SYSTEM');

-- CreateEnum
CREATE TYPE "DisputeEvidenceUploadedByType" AS ENUM ('CUSTOMER', 'ADMIN');

-- CreateEnum
CREATE TYPE "DisputeNoteVisibility" AS ENUM ('INTERNAL');

-- CreateEnum
CREATE TYPE "DisputeRefundType" AS ENUM ('FULL', 'PARTIAL', 'NONE');

-- CreateEnum
CREATE TYPE "DisputeDecision" AS ENUM ('APPROVE', 'REJECT', 'ESCALATE');

-- CreateEnum
CREATE TYPE "DisputeRejectReason" AS ENUM ('INSUFFICIENT_EVIDENCE', 'REFUND_WINDOW_EXPIRED', 'CUSTOMER_WITHDREW', 'NOT_COVERED_BY_POLICY', 'TRANSACTION_NOT_ELIGIBLE', 'OTHER');

-- CreateEnum
CREATE TYPE "DisputeResolutionStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'ESCALATED');

-- CreateEnum
CREATE TYPE "DisputeCustomerNotificationStatus" AS ENUM ('NOT_SENT', 'SENT', 'FAILED');

-- CreateEnum
CREATE TYPE "ProviderDisputeCategory" AS ENUM ('NON_DELIVERY', 'QUALITY_ISSUE', 'REFUND_CONFLICT', 'LATE_DELIVERY', 'OTHER');

-- CreateEnum
CREATE TYPE "ProviderDisputeSeverity" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "ProviderDisputeStatus" AS ENUM ('OPEN', 'EVIDENCE_PHASE', 'UNDER_REVIEW', 'RULING_PENDING', 'ESCALATED', 'RESOLVED', 'DENIED');

-- CreateEnum
CREATE TYPE "ProviderDisputeSubmittedByType" AS ENUM ('CUSTOMER', 'PROVIDER', 'ADMIN');

-- CreateEnum
CREATE TYPE "ProviderDisputeEvidenceStatus" AS ENUM ('RECEIVED', 'RECEIVED_LATE', 'REQUESTED');

-- CreateEnum
CREATE TYPE "ProviderDisputeEvidenceRequestTarget" AS ENUM ('CUSTOMER', 'PROVIDER', 'BOTH');

-- CreateEnum
CREATE TYPE "ProviderDisputeRuling" AS ENUM ('CUSTOMER_WINS_FULL_REFUND', 'PROVIDER_WINS_NO_REFUND', 'SPLIT_LIABILITY');

-- CreateEnum
CREATE TYPE "ProviderDisputeAdjustmentType" AS ENUM ('DEDUCT_FROM_NEXT_PAYOUT', 'DEDUCT_IMMEDIATELY', 'LEDGER_ONLY', 'WAIVE_DEDUCTION');

-- CreateEnum
CREATE TYPE "ProviderFinancialAdjustmentType" AS ENUM ('CUSTOMER_REFUND', 'PROVIDER_LOST_EARNINGS', 'PLATFORM_FEE_REVERSAL', 'PENALTY', 'ADJUSTMENT');

-- CreateEnum
CREATE TYPE "ProviderFinancialAdjustmentDirection" AS ENUM ('CREDIT', 'DEBIT');

-- CreateEnum
CREATE TYPE "ProviderFinancialAdjustmentStatus" AS ENUM ('PENDING', 'APPLIED', 'WAIVED', 'FAILED');

-- CreateEnum
CREATE TYPE "ProviderPayoutMethodType" AS ENUM ('BANK_ACCOUNT');

-- CreateEnum
CREATE TYPE "ProviderPayoutAccountType" AS ENUM ('CHECKING', 'SAVINGS', 'CURRENT', 'OTHER');

-- CreateEnum
CREATE TYPE "ProviderPayoutExternalProvider" AS ENUM ('STRIPE_CONNECT', 'PLAID', 'MANUAL');

-- CreateEnum
CREATE TYPE "ProviderPayoutVerificationStatus" AS ENUM ('PENDING', 'VERIFIED', 'FAILED');

-- CreateEnum
CREATE TYPE "ProviderEarningsLedgerType" AS ENUM ('ORDER_EARNING', 'REFUND_DEDUCTION', 'PENALTY', 'PAYOUT', 'ADJUSTMENT');

-- CreateEnum
CREATE TYPE "ProviderEarningsLedgerDirection" AS ENUM ('CREDIT', 'DEBIT');

-- CreateEnum
CREATE TYPE "ProviderEarningsLedgerStatus" AS ENUM ('PENDING', 'AVAILABLE', 'PAYOUT_PENDING', 'PAID', 'FAILED');

-- CreateEnum
CREATE TYPE "ProviderPayoutStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'CANCELLED', 'ON_HOLD', 'REJECTED');

-- CreateEnum
CREATE TYPE "AdminPayoutSchedule" AS ENUM ('WEEKLY_MONDAY', 'BIWEEKLY_FRIDAY', 'MONTHLY_LAST_DAY', 'MANUAL');

-- CreateEnum
CREATE TYPE "ProviderDisputeFinalRuling" AS ENUM ('CUSTOMER_WINS', 'PROVIDER_WINS', 'SPLIT_LIABILITY');

-- CreateEnum
CREATE TYPE "ProviderDisputeResolutionStatus" AS ENUM ('RESOLVED', 'DENIED');

-- CreateEnum
CREATE TYPE "ProviderDisputeCommunicationTargetType" AS ENUM ('CUSTOMER', 'PROVIDER', 'BOTH');

-- CreateEnum
CREATE TYPE "ProviderDisputeCommunicationChannel" AS ENUM ('EMAIL', 'IN_APP');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'REGISTERED_USER',
    "first_name" TEXT NOT NULL,
    "last_name" TEXT NOT NULL,
    "phone" TEXT,
    "avatar_url" TEXT,
    "location" TEXT,
    "admin_role_id" TEXT,
    "is_verified" BOOLEAN NOT NULL DEFAULT false,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "is_approved" BOOLEAN NOT NULL DEFAULT true,
    "must_change_password" BOOLEAN NOT NULL DEFAULT false,
    "last_login_at" TIMESTAMPTZ,
    "admin_title" TEXT,
    "admin_permissions" JSONB,
    "provider_business_name" TEXT,
    "provider_legal_name" TEXT,
    "provider_business_category_id" TEXT,
    "provider_tax_id" TEXT,
    "provider_business_email" TEXT,
    "provider_business_phone" TEXT,
    "provider_business_address" TEXT,
    "provider_store_address" JSONB,
    "provider_business_hours" JSONB,
    "provider_service_area" TEXT,
    "provider_website" TEXT,
    "provider_fulfillment_methods" JSONB,
    "provider_auto_accept_orders" BOOLEAN NOT NULL DEFAULT false,
    "provider_documents" JSONB,
    "provider_approval_status" "ProviderApprovalStatus",
    "provider_approved_at" TIMESTAMPTZ,
    "provider_approved_by" TEXT,
    "provider_rejected_at" TIMESTAMPTZ,
    "provider_rejected_by" TEXT,
    "provider_rejection_reason" TEXT,
    "provider_rejection_comment" TEXT,
    "verification_otp" TEXT,
    "verification_otp_expires_at" TIMESTAMPTZ,
    "verification_otp_attempts" INTEGER NOT NULL DEFAULT 0,
    "reset_password_otp" TEXT,
    "reset_password_otp_expires_at" TIMESTAMPTZ,
    "reset_password_otp_attempts" INTEGER NOT NULL DEFAULT 0,
    "suspension_reason" TEXT,
    "suspension_comment" TEXT,
    "suspended_at" TIMESTAMPTZ,
    "suspended_by" TEXT,
    "refresh_token_hash" TEXT,
    "referral_code" TEXT,
    "deleted_at" TIMESTAMPTZ,
    "delete_after" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "referrals" (
    "id" TEXT NOT NULL,
    "referrer_user_id" TEXT NOT NULL,
    "referred_user_id" TEXT NOT NULL,
    "referral_code" TEXT NOT NULL,
    "status" "ReferralStatus" NOT NULL DEFAULT 'JOINED',
    "reward_amount" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "referrer_reward_amount_snapshot" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "new_user_reward_amount_snapshot" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "reward_currency_snapshot" TEXT NOT NULL DEFAULT 'USD',
    "minimum_transaction_amount_snapshot" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "expires_at" TIMESTAMPTZ,
    "joined_at" TIMESTAMPTZ,
    "qualified_at" TIMESTAMPTZ,
    "rewarded_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "referrals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "referral_settings" (
    "id" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "referrer_reward_amount" DECIMAL(10,2) NOT NULL DEFAULT 10,
    "new_user_reward_amount" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "reward_currency" TEXT NOT NULL DEFAULT 'USD',
    "minimum_transaction_amount" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "referral_expiration_value" INTEGER NOT NULL DEFAULT 30,
    "referral_expiration_unit" "ReferralExpirationUnit" NOT NULL DEFAULT 'DAYS',
    "allow_self_referrals" BOOLEAN NOT NULL DEFAULT false,
    "qualification_rule" "ReferralQualificationRule" NOT NULL DEFAULT 'FIRST_SUCCESSFUL_PURCHASE',
    "updated_by_id" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "referral_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "refund_policy_settings" (
    "id" TEXT NOT NULL,
    "refund_window_days" INTEGER NOT NULL DEFAULT 30,
    "auto_refund_threshold_amount" DECIMAL(10,2) NOT NULL DEFAULT 50,
    "currency" TEXT NOT NULL DEFAULT 'PKR',
    "auto_approve_small_refunds" BOOLEAN NOT NULL DEFAULT true,
    "small_refund_auto_approve_amount" DECIMAL(10,2) NOT NULL DEFAULT 15,
    "eligible_category_ids_json" JSONB NOT NULL DEFAULT '[]',
    "updated_by_id" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "refund_policy_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reward_ledgers" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "type" "RewardLedgerType" NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "source" "RewardLedgerSource" NOT NULL,
    "source_id" TEXT,
    "description" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reward_ledgers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "customer_wallets" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "cash_balance" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "gift_credits" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "customer_wallets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "customer_wallet_ledgers" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "wallet_id" TEXT NOT NULL,
    "type" "CustomerWalletLedgerType" NOT NULL,
    "direction" "CustomerWalletLedgerDirection" NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "status" "CustomerWalletLedgerStatus" NOT NULL DEFAULT 'PENDING',
    "payment_id" TEXT,
    "order_id" TEXT,
    "money_gift_id" TEXT,
    "reward_ledger_id" TEXT,
    "transaction_id" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "customer_wallet_ledgers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "customer_bank_accounts" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "account_holder_name" TEXT NOT NULL,
    "bank_name" TEXT NOT NULL,
    "masked_account" TEXT NOT NULL,
    "last4" TEXT NOT NULL,
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,
    "deleted_at" TIMESTAMPTZ,

    CONSTRAINT "customer_bank_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "provider_business_categories" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "icon_key" TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "deleted_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "provider_business_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "gift_categories" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "icon_key" TEXT,
    "color" TEXT,
    "background_color" TEXT DEFAULT '#F3E8FF',
    "image_url" TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,
    "deleted_at" TIMESTAMPTZ,

    CONSTRAINT "gift_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "customer_wishlists" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "gift_id" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "customer_wishlists_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "customer_addresses" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "full_name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "line1" TEXT NOT NULL,
    "line2" TEXT,
    "city" TEXT NOT NULL,
    "state" TEXT,
    "country" TEXT NOT NULL,
    "postal_code" TEXT,
    "latitude" DECIMAL(10,7),
    "longitude" DECIMAL(10,7),
    "delivery_instructions" TEXT,
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,
    "deleted_at" TIMESTAMPTZ,

    CONSTRAINT "customer_addresses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "customer_reminders" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "recipient_name" TEXT NOT NULL,
    "event_type" "CustomerReminderEventType" NOT NULL,
    "reminder_date" TIMESTAMPTZ NOT NULL,
    "notes" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,
    "deleted_at" TIMESTAMPTZ,

    CONSTRAINT "customer_reminders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "customer_contacts" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "relationship" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "address" TEXT,
    "likes" TEXT,
    "avatar_url" TEXT,
    "birthday" DATE,
    "notes" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,
    "deleted_at" TIMESTAMPTZ,

    CONSTRAINT "customer_contacts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "customer_events" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "recipient_id" TEXT,
    "event_type" "CustomerEventType" NOT NULL,
    "title" TEXT NOT NULL,
    "event_date" TIMESTAMPTZ NOT NULL,
    "reminder_timing" "CustomerEventReminderTiming" NOT NULL DEFAULT 'ON_THE_DAY',
    "reminder_frequency" "CustomerEventReminderFrequency" NOT NULL DEFAULT 'ONE_TIME',
    "custom_alert_time" TEXT,
    "channels_json" JSONB NOT NULL DEFAULT '["PUSH"]',
    "notes" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "last_reminder_sent_at" TIMESTAMPTZ,
    "next_reminder_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,
    "deleted_at" TIMESTAMPTZ,

    CONSTRAINT "customer_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "customer_event_reminder_jobs" (
    "id" TEXT NOT NULL,
    "event_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "scheduled_for" TIMESTAMPTZ NOT NULL,
    "channel" "CustomerEventReminderChannel" NOT NULL,
    "status" "CustomerEventReminderJobStatus" NOT NULL DEFAULT 'PENDING',
    "failure_reason" TEXT,
    "sent_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "customer_event_reminder_jobs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "carts" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "status" "CartStatus" NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "carts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cart_items" (
    "id" TEXT NOT NULL,
    "cart_id" TEXT NOT NULL,
    "gift_id" TEXT NOT NULL,
    "variant_id" TEXT,
    "provider_id" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unit_price_snapshot" DECIMAL(10,2) NOT NULL,
    "discount_amount_snapshot" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "final_unit_price_snapshot" DECIMAL(10,2) NOT NULL,
    "promotional_offer_id" TEXT,
    "delivery_option" "CustomerDeliveryOption" NOT NULL,
    "recipient_contact_id" TEXT,
    "recipient_name" TEXT NOT NULL,
    "recipient_phone" TEXT NOT NULL,
    "recipient_address_id" TEXT NOT NULL,
    "event_id" TEXT,
    "gift_message" TEXT,
    "message_media_urls_json" JSONB NOT NULL DEFAULT '[]',
    "scheduled_delivery_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "cart_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payments" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "order_id" TEXT,
    "money_gift_id" TEXT,
    "customer_subscription_id" TEXT,
    "provider" "PaymentProvider" NOT NULL,
    "provider_payment_intent_id" TEXT,
    "amount" DECIMAL(10,2) NOT NULL,
    "currency" TEXT NOT NULL,
    "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "payment_method" "PaymentMethod" NOT NULL,
    "failure_reason" TEXT,
    "metadata_json" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "customer_subscriptions" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "plan_id" TEXT NOT NULL,
    "billing_cycle" "BillingCycle" NOT NULL,
    "status" "CustomerSubscriptionStatus" NOT NULL DEFAULT 'INCOMPLETE',
    "is_premium" BOOLEAN NOT NULL DEFAULT false,
    "stripe_customer_id" TEXT,
    "stripe_subscription_id" TEXT,
    "stripe_price_id" TEXT,
    "current_period_start" TIMESTAMPTZ,
    "current_period_end" TIMESTAMPTZ,
    "cancel_at_period_end" BOOLEAN NOT NULL DEFAULT false,
    "cancelled_at" TIMESTAMPTZ,
    "coupon_id" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "customer_subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "customer_subscription_invoices" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "customer_subscription_id" TEXT NOT NULL,
    "stripe_invoice_id" TEXT NOT NULL,
    "stripe_payment_intent_id" TEXT,
    "amount_due" DECIMAL(10,2) NOT NULL,
    "amount_paid" DECIMAL(10,2) NOT NULL,
    "currency" TEXT NOT NULL,
    "status" "CustomerSubscriptionInvoiceStatus" NOT NULL,
    "invoice_pdf_url" TEXT,
    "hosted_invoice_url" TEXT,
    "billing_reason" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "customer_subscription_invoices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "orders" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "order_number" TEXT NOT NULL,
    "status" "OrderStatus" NOT NULL DEFAULT 'PENDING',
    "payment_status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "payment_method" "PaymentMethod" NOT NULL DEFAULT 'COD',
    "payment_id" TEXT,
    "subtotal" DECIMAL(10,2) NOT NULL,
    "discount_total" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "delivery_fee" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "tax" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "total" DECIMAL(10,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'PKR',
    "delivery_address_id" TEXT NOT NULL,
    "recipient_name" TEXT NOT NULL,
    "recipient_phone" TEXT NOT NULL,
    "gift_message" TEXT,
    "scheduled_delivery_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "order_items" (
    "id" TEXT NOT NULL,
    "order_id" TEXT NOT NULL,
    "gift_id" TEXT NOT NULL,
    "variant_id" TEXT,
    "provider_id" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unit_price" DECIMAL(10,2) NOT NULL,
    "discount_amount" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "final_unit_price" DECIMAL(10,2) NOT NULL,
    "total" DECIMAL(10,2) NOT NULL,
    "promotional_offer_id" TEXT,
    "status" "OrderStatus" NOT NULL DEFAULT 'PENDING',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "order_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "provider_orders" (
    "id" TEXT NOT NULL,
    "order_id" TEXT NOT NULL,
    "provider_id" TEXT NOT NULL,
    "order_number" TEXT,
    "status" "ProviderOrderStatus" NOT NULL DEFAULT 'PENDING',
    "subtotal" DECIMAL(10,2) NOT NULL,
    "discount_total" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "delivery_fee" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "tax" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "platform_fee" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "total_payout" DECIMAL(10,2),
    "total" DECIMAL(10,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'PKR',
    "accepted_at" TIMESTAMPTZ,
    "rejected_at" TIMESTAMPTZ,
    "rejection_reason" "ProviderOrderRejectReason",
    "rejection_comment" TEXT,
    "dispatch_at" TIMESTAMPTZ,
    "fulfilled_at" TIMESTAMPTZ,
    "tracking_number" TEXT,
    "carrier" TEXT,
    "estimated_delivery_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "provider_orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "provider_order_items" (
    "id" TEXT NOT NULL,
    "provider_order_id" TEXT NOT NULL,
    "order_item_id" TEXT NOT NULL,
    "gift_id" TEXT NOT NULL,
    "variant_id" TEXT,
    "name_snapshot" TEXT NOT NULL,
    "variant_name_snapshot" TEXT,
    "quantity" INTEGER NOT NULL,
    "unit_price" DECIMAL(10,2) NOT NULL,
    "total" DECIMAL(10,2) NOT NULL,
    "image_url" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "provider_order_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "provider_order_timelines" (
    "id" TEXT NOT NULL,
    "provider_order_id" TEXT NOT NULL,
    "status" "ProviderOrderStatus" NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "metadata_json" JSONB,
    "created_by_id" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "provider_order_timelines_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "provider_order_checklists" (
    "id" TEXT NOT NULL,
    "provider_order_id" TEXT NOT NULL,
    "items_packed" BOOLEAN NOT NULL DEFAULT false,
    "gift_message_attached" BOOLEAN NOT NULL DEFAULT false,
    "address_verified" BOOLEAN NOT NULL DEFAULT false,
    "customer_contact_checked" BOOLEAN NOT NULL DEFAULT false,
    "ready_for_courier" BOOLEAN NOT NULL DEFAULT false,
    "custom_items_json" JSONB NOT NULL DEFAULT '[]',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "provider_order_checklists_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "refund_requests" (
    "id" TEXT NOT NULL,
    "order_id" TEXT NOT NULL,
    "provider_order_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "provider_id" TEXT NOT NULL,
    "payment_id" TEXT,
    "requested_amount" DECIMAL(10,2) NOT NULL,
    "approved_amount" DECIMAL(10,2),
    "currency" TEXT NOT NULL DEFAULT 'PKR',
    "customer_reason" TEXT NOT NULL,
    "evidence_urls_json" JSONB NOT NULL DEFAULT '[]',
    "status" "RefundRequestStatus" NOT NULL DEFAULT 'REQUESTED',
    "rejection_reason" "RefundRejectReason",
    "provider_comment" TEXT,
    "stripe_refund_id" TEXT,
    "transaction_id" TEXT,
    "requested_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "approved_at" TIMESTAMPTZ,
    "rejected_at" TIMESTAMPTZ,
    "refunded_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "refund_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "order_messages" (
    "id" TEXT NOT NULL,
    "order_id" TEXT NOT NULL,
    "provider_order_id" TEXT NOT NULL,
    "sender_id" TEXT NOT NULL,
    "sender_role" "UserRole" NOT NULL,
    "recipient_id" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "channel" "ProviderOrderMessageChannel" NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "order_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "money_gifts" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "recipient_contact_id" TEXT NOT NULL,
    "payment_id" TEXT,
    "amount" DECIMAL(10,2) NOT NULL,
    "currency" TEXT NOT NULL,
    "message" TEXT,
    "message_media_urls_json" JSONB NOT NULL DEFAULT '[]',
    "delivery_date" TIMESTAMPTZ NOT NULL,
    "repeat_annually" BOOLEAN NOT NULL DEFAULT false,
    "status" "MoneyGiftStatus" NOT NULL DEFAULT 'DRAFT',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "money_gifts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "customer_recurring_payments" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "recipient_contact_id" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "currency" TEXT NOT NULL,
    "frequency" "CustomerRecurringPaymentFrequency" NOT NULL,
    "schedule_json" JSONB NOT NULL,
    "message" TEXT,
    "message_media_urls_json" JSONB NOT NULL DEFAULT '[]',
    "payment_method" "PaymentMethod" NOT NULL,
    "stripe_payment_method_id" TEXT,
    "status" "CustomerRecurringPaymentStatus" NOT NULL DEFAULT 'ACTIVE',
    "next_billing_at" TIMESTAMPTZ NOT NULL,
    "start_date" TIMESTAMPTZ NOT NULL,
    "end_date" TIMESTAMPTZ,
    "cancel_at" TIMESTAMPTZ,
    "cancel_at_period_end" BOOLEAN NOT NULL DEFAULT false,
    "cancelled_at" TIMESTAMPTZ,
    "cancel_reason" TEXT,
    "failure_count" INTEGER NOT NULL DEFAULT 0,
    "deleted_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "customer_recurring_payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "customer_recurring_payment_occurrences" (
    "id" TEXT NOT NULL,
    "recurring_payment_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "payment_id" TEXT,
    "money_gift_id" TEXT,
    "amount" DECIMAL(10,2) NOT NULL,
    "currency" TEXT NOT NULL,
    "scheduled_for" TIMESTAMPTZ NOT NULL,
    "processed_at" TIMESTAMPTZ,
    "status" "CustomerRecurringPaymentOccurrenceStatus" NOT NULL DEFAULT 'PENDING',
    "failure_reason" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "customer_recurring_payment_occurrences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "customer_payment_methods" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "stripe_customer_id" TEXT NOT NULL,
    "stripe_payment_method_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "brand" TEXT,
    "last4" TEXT,
    "expiry_month" INTEGER,
    "expiry_year" INTEGER,
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,
    "deleted_at" TIMESTAMPTZ,

    CONSTRAINT "customer_payment_methods_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "promotional_offers" (
    "id" TEXT NOT NULL,
    "provider_id" TEXT NOT NULL,
    "item_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "discount_type" "PromotionalOfferDiscountType" NOT NULL,
    "discount_value" DECIMAL(10,2) NOT NULL,
    "start_date" TIMESTAMPTZ NOT NULL,
    "end_date" TIMESTAMPTZ,
    "eligibility_rules" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "status" "PromotionalOfferStatus" NOT NULL DEFAULT 'PENDING',
    "approval_status" "PromotionalOfferApprovalStatus" NOT NULL DEFAULT 'PENDING',
    "approved_at" TIMESTAMPTZ,
    "approved_by" TEXT,
    "rejected_at" TIMESTAMPTZ,
    "rejected_by" TEXT,
    "rejection_reason" "PromotionalOfferRejectionReason",
    "rejection_comment" TEXT,
    "created_by" TEXT,
    "updated_by" TEXT,
    "deleted_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "promotional_offers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "gifts" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "short_description" TEXT,
    "category_id" TEXT NOT NULL,
    "provider_id" TEXT NOT NULL,
    "price" DECIMAL(10,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "stock_quantity" INTEGER NOT NULL DEFAULT 0,
    "sku" TEXT,
    "image_urls" JSONB NOT NULL DEFAULT '[]',
    "status" "GiftStatus" NOT NULL DEFAULT 'INACTIVE',
    "moderation_status" "GiftModerationStatus" NOT NULL DEFAULT 'PENDING',
    "is_published" BOOLEAN NOT NULL DEFAULT false,
    "requires_manual_review" BOOLEAN NOT NULL DEFAULT false,
    "manual_review_reason" TEXT,
    "hidden_by_moderation" BOOLEAN NOT NULL DEFAULT false,
    "moderation_resolved_at" TIMESTAMPTZ,
    "is_featured" BOOLEAN NOT NULL DEFAULT false,
    "tags" JSONB NOT NULL DEFAULT '[]',
    "rating_placeholder" DECIMAL(3,2) NOT NULL DEFAULT 4.8,
    "approved_at" TIMESTAMPTZ,
    "approved_by" TEXT,
    "rejected_at" TIMESTAMPTZ,
    "rejected_by" TEXT,
    "rejection_reason" TEXT,
    "rejection_comment" TEXT,
    "flagged_at" TIMESTAMPTZ,
    "flagged_by" TEXT,
    "flag_reason" TEXT,
    "flag_comment" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,
    "deleted_at" TIMESTAMPTZ,

    CONSTRAINT "gifts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "gift_variants" (
    "id" TEXT NOT NULL,
    "gift_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "price" DECIMAL(10,2) NOT NULL,
    "original_price" DECIMAL(10,2),
    "stock_quantity" INTEGER NOT NULL DEFAULT 0,
    "sku" TEXT,
    "is_popular" BOOLEAN NOT NULL DEFAULT false,
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,
    "deleted_at" TIMESTAMPTZ,

    CONSTRAINT "gift_variants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "broadcasts" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "image_url" TEXT,
    "cta_label" TEXT,
    "cta_url" TEXT,
    "channels" JSONB NOT NULL,
    "priority" "BroadcastPriority" NOT NULL DEFAULT 'NORMAL',
    "status" "BroadcastStatus" NOT NULL DEFAULT 'DRAFT',
    "targeting_json" JSONB,
    "estimated_reach_json" JSONB,
    "send_mode" "BroadcastSendMode",
    "scheduled_at" TIMESTAMPTZ,
    "timezone" TEXT DEFAULT 'UTC',
    "is_recurring" BOOLEAN NOT NULL DEFAULT false,
    "recurrence_json" JSONB,
    "created_by" TEXT NOT NULL,
    "updated_by" TEXT,
    "cancelled_at" TIMESTAMPTZ,
    "cancelled_by" TEXT,
    "cancel_reason" TEXT,
    "started_at" TIMESTAMPTZ,
    "completed_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "broadcasts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "broadcast_deliveries" (
    "id" TEXT NOT NULL,
    "broadcast_id" TEXT NOT NULL,
    "recipient_id" TEXT NOT NULL,
    "recipient_type" "NotificationRecipientType" NOT NULL,
    "channel" "BroadcastChannel" NOT NULL,
    "status" "BroadcastDeliveryStatus" NOT NULL DEFAULT 'QUEUED',
    "email" TEXT,
    "device_token_id" TEXT,
    "failure_reason" TEXT,
    "provider_message_id" TEXT,
    "queued_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sent_at" TIMESTAMPTZ,
    "delivered_at" TIMESTAMPTZ,
    "opened_at" TIMESTAMPTZ,
    "clicked_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "broadcast_deliveries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "recipient_id" TEXT NOT NULL,
    "recipient_type" "NotificationRecipientType" NOT NULL,
    "broadcast_id" TEXT,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "image_url" TEXT,
    "icon_key" TEXT,
    "cta_url" TEXT,
    "metadata_json" JSONB,
    "actions_json" JSONB,
    "type" TEXT NOT NULL DEFAULT 'BROADCAST',
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "read_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMPTZ,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

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

-- CreateTable
CREATE TABLE "notification_device_tokens" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "platform" "NotificationDevicePlatform" NOT NULL,
    "device_id" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "last_used_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "notification_device_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notification_preferences" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "email_enabled" BOOLEAN NOT NULL DEFAULT true,
    "push_enabled" BOOLEAN NOT NULL DEFAULT true,
    "sms_enabled" BOOLEAN NOT NULL DEFAULT false,
    "in_app_enabled" BOOLEAN NOT NULL DEFAULT true,
    "marketing_enabled" BOOLEAN NOT NULL DEFAULT true,
    "deal_updates_enabled" BOOLEAN NOT NULL DEFAULT true,
    "birthday_reminders_enabled" BOOLEAN NOT NULL DEFAULT true,
    "delivery_updates_enabled" BOOLEAN NOT NULL DEFAULT true,
    "new_contact_alerts_enabled" BOOLEAN NOT NULL DEFAULT true,
    "system_enabled" BOOLEAN NOT NULL DEFAULT true,
    "provider_order_alerts_json" JSONB NOT NULL DEFAULT '{}',
    "provider_account_activity_json" JSONB NOT NULL DEFAULT '{}',
    "provider_marketing_updates_json" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "notification_preferences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reviews" (
    "id" TEXT NOT NULL,
    "review_code" TEXT NOT NULL,
    "order_id" TEXT NOT NULL,
    "provider_order_id" TEXT,
    "provider_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "comment" TEXT NOT NULL,
    "source" "ReviewSource" NOT NULL DEFAULT 'IN_APP',
    "external_profile_url" TEXT,
    "status" "ReviewStatus" NOT NULL DEFAULT 'PENDING',
    "severity" "ReviewSeverity" NOT NULL DEFAULT 'LOW',
    "flag_reason" "ReviewFlagReason",
    "report_count" INTEGER NOT NULL DEFAULT 0,
    "flag_reasons_json" JSONB NOT NULL DEFAULT '[]',
    "auto_moderated" BOOLEAN NOT NULL DEFAULT false,
    "moderation_confidence" INTEGER,
    "detected_categories_json" JSONB NOT NULL DEFAULT '[]',
    "likes_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,
    "deleted_at" TIMESTAMPTZ,

    CONSTRAINT "reviews_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "review_responses" (
    "id" TEXT NOT NULL,
    "review_id" TEXT NOT NULL,
    "provider_id" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,
    "deleted_at" TIMESTAMPTZ,

    CONSTRAINT "review_responses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "review_moderation_logs" (
    "id" TEXT NOT NULL,
    "review_id" TEXT NOT NULL,
    "actor_id" TEXT,
    "actor_type" "ReviewModerationActorType" NOT NULL,
    "action" "ReviewModerationAction" NOT NULL,
    "outcome" "ReviewStatus" NOT NULL,
    "reason" "ReviewFlagReason",
    "comment" TEXT,
    "auto_moderated" BOOLEAN NOT NULL DEFAULT false,
    "confidence" INTEGER,
    "before_json" JSONB,
    "after_json" JSONB,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "review_moderation_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "review_policies" (
    "id" TEXT NOT NULL,
    "auto_approval_rules_json" JSONB NOT NULL DEFAULT '{}',
    "spam_detection_json" JSONB NOT NULL DEFAULT '{}',
    "abuse_thresholds_json" JSONB NOT NULL DEFAULT '{}',
    "visibility_rules_json" JSONB NOT NULL DEFAULT '{}',
    "auto_moderation_json" JSONB NOT NULL DEFAULT '{}',
    "updated_by_id" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "review_policies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chat_threads" (
    "id" TEXT NOT NULL,
    "thread_type" "ChatThreadType" NOT NULL DEFAULT 'ORDER_CHAT',
    "source_type" "ChatSourceType" NOT NULL DEFAULT 'PROVIDER_ORDER',
    "source_id" TEXT,
    "subject" TEXT,
    "status" "ChatThreadStatus" NOT NULL DEFAULT 'ACTIVE',
    "order_id" TEXT,
    "provider_order_id" TEXT,
    "provider_id" TEXT,
    "customer_id" TEXT,
    "assigned_admin_id" TEXT,
    "resolved_by_id" TEXT,
    "resolved_at" TIMESTAMPTZ,
    "last_message_id" TEXT,
    "last_message_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "chat_threads_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chat_messages" (
    "id" TEXT NOT NULL,
    "thread_id" TEXT NOT NULL,
    "sender_id" TEXT NOT NULL,
    "sender_type" "ChatSenderType" NOT NULL,
    "client_message_id" TEXT,
    "message_type" "ChatMessageType" NOT NULL DEFAULT 'TEXT',
    "body" TEXT,
    "attachment_urls_json" JSONB NOT NULL DEFAULT '[]',
    "is_read_by_customer" BOOLEAN NOT NULL DEFAULT false,
    "is_read_by_provider" BOOLEAN NOT NULL DEFAULT false,
    "visibility_status" "MessageVisibilityStatus" NOT NULL DEFAULT 'VISIBLE',
    "hidden_by_moderation" BOOLEAN NOT NULL DEFAULT false,
    "hidden_at" TIMESTAMPTZ,
    "hidden_by_admin_id" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "chat_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chat_participants" (
    "id" TEXT NOT NULL,
    "thread_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "role" "ChatParticipantRole" NOT NULL,
    "joined_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "left_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "chat_participants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chat_message_read_receipts" (
    "id" TEXT NOT NULL,
    "thread_id" TEXT NOT NULL,
    "message_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "read_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "chat_message_read_receipts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chat_attachments" (
    "id" TEXT NOT NULL,
    "thread_id" TEXT NOT NULL,
    "message_id" TEXT,
    "file_url" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "chat_attachments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chat_audit_logs" (
    "id" TEXT NOT NULL,
    "thread_id" TEXT NOT NULL,
    "message_id" TEXT,
    "actor_id" TEXT,
    "action" TEXT NOT NULL,
    "metadata_json" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "chat_audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "message_moderation_cases" (
    "id" TEXT NOT NULL,
    "conversation_id" TEXT NOT NULL,
    "message_id" TEXT NOT NULL,
    "source" "MessageModerationSource" NOT NULL,
    "participant_id" TEXT NOT NULL,
    "participant_role" TEXT NOT NULL,
    "participant_name" TEXT,
    "participant_avatar_url" TEXT,
    "external_reference" TEXT,
    "sender_id" TEXT NOT NULL,
    "sender_role" TEXT NOT NULL,
    "raw_body" TEXT,
    "redacted_body" TEXT NOT NULL,
    "flag_types_json" JSONB NOT NULL DEFAULT '[]',
    "keywords_json" JSONB NOT NULL DEFAULT '[]',
    "severity" "MessageModerationSeverity" NOT NULL,
    "confidence" DECIMAL(5,2) NOT NULL,
    "status" "MessageModerationStatus" NOT NULL DEFAULT 'FLAGGED',
    "assigned_to_id" TEXT,
    "last_message_at" TIMESTAMPTZ NOT NULL,
    "resolved_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "message_moderation_cases_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "message_moderation_escalations" (
    "id" TEXT NOT NULL,
    "case_id" TEXT NOT NULL,
    "message_id" TEXT NOT NULL,
    "conversation_id" TEXT NOT NULL,
    "escalation_type" TEXT NOT NULL,
    "priority" "MessageModerationSeverity" NOT NULL,
    "reason" TEXT NOT NULL,
    "assigned_to_admin_id" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ESCALATED',
    "created_by_admin_id" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "message_moderation_escalations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "message_moderation_logs" (
    "id" TEXT NOT NULL,
    "case_id" TEXT NOT NULL,
    "message_id" TEXT NOT NULL,
    "action" "MessageModerationAction" NOT NULL,
    "reason" TEXT,
    "internal_note" TEXT,
    "actor_id" TEXT,
    "metadata_json" JSONB,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "message_moderation_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "provider_reports" (
    "id" TEXT NOT NULL,
    "reporter_user_id" TEXT NOT NULL,
    "provider_id" TEXT NOT NULL,
    "order_id" TEXT,
    "reason" "ProviderReportReason" NOT NULL,
    "details" TEXT NOT NULL,
    "evidence_urls_json" JSONB NOT NULL DEFAULT '[]',
    "status" "ProviderReportStatus" NOT NULL DEFAULT 'SUBMITTED',
    "admin_notes" TEXT,
    "reviewed_by_id" TEXT,
    "reviewed_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "provider_reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
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

-- CreateTable
CREATE TABLE "user_blocks" (
    "id" TEXT NOT NULL,
    "blocker_user_id" TEXT NOT NULL,
    "blocked_user_id" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_blocks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
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

-- CreateTable
CREATE TABLE "social_posts" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "media_urls_json" JSONB NOT NULL DEFAULT '[]',
    "visibility" "SocialPostVisibility" NOT NULL DEFAULT 'PUBLIC',
    "status" "SocialPostStatus" NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "social_posts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "social_reports" (
    "id" TEXT NOT NULL,
    "report_id" TEXT NOT NULL,
    "post_id" TEXT NOT NULL,
    "reported_by_id" TEXT NOT NULL,
    "reason" "SocialReportReason" NOT NULL,
    "comment" TEXT,
    "severity" "SocialReportSeverity" NOT NULL DEFAULT 'LOW',
    "status" "SocialReportStatus" NOT NULL DEFAULT 'PENDING',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "social_reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "social_moderation_logs" (
    "id" TEXT NOT NULL,
    "social_report_id" TEXT NOT NULL,
    "post_id" TEXT NOT NULL,
    "actor_id" TEXT NOT NULL,
    "action" "SocialModerationAction" NOT NULL,
    "reason" "SocialReportReason",
    "comment" TEXT,
    "before_json" JSONB,
    "after_json" JSONB,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "social_moderation_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "social_reporting_rules" (
    "id" TEXT NOT NULL,
    "report_category" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "description" TEXT,
    "icon_key" TEXT,
    "auto_flag_threshold" INTEGER NOT NULL DEFAULT 10,
    "escalation_rule" "SocialReportingEscalationRule" NOT NULL DEFAULT 'MANUAL_REVIEW',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,
    "deleted_at" TIMESTAMPTZ,

    CONSTRAINT "social_reporting_rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_warnings" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "social_report_id" TEXT NOT NULL,
    "post_id" TEXT NOT NULL,
    "reason" "SocialReportReason" NOT NULL,
    "message" TEXT NOT NULL,
    "issued_by_id" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_warnings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dispute_cases" (
    "id" TEXT NOT NULL,
    "case_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "order_id" TEXT NOT NULL,
    "transaction_id" TEXT,
    "payment_id" TEXT,
    "provider_id" TEXT,
    "linked_transaction_id" TEXT,
    "linked_payment_id" TEXT,
    "linked_order_id" TEXT,
    "refund_type" "DisputeRefundType",
    "refund_amount" DECIMAL(10,2),
    "linked_by_id" TEXT,
    "decision" "DisputeDecision",
    "decision_reason" "DisputeRejectReason",
    "decision_comment" TEXT,
    "resolution_status" "DisputeResolutionStatus" NOT NULL DEFAULT 'PENDING',
    "escalated_at" TIMESTAMPTZ,
    "estimated_resolution_at" TIMESTAMPTZ,
    "refund_id" TEXT,
    "customer_notification_status" "DisputeCustomerNotificationStatus" NOT NULL DEFAULT 'NOT_SENT',
    "amount" DECIMAL(10,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'PKR',
    "reason" "DisputeReason" NOT NULL,
    "claim_details" TEXT NOT NULL,
    "priority" "DisputePriority" NOT NULL DEFAULT 'MEDIUM',
    "status" "DisputeStatus" NOT NULL DEFAULT 'OPEN',
    "sla_deadline_at" TIMESTAMPTZ NOT NULL,
    "assigned_to_id" TEXT,
    "linked_refund_id" TEXT,
    "linked_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,
    "resolved_at" TIMESTAMPTZ,

    CONSTRAINT "dispute_cases_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dispute_evidence" (
    "id" TEXT NOT NULL,
    "dispute_id" TEXT NOT NULL,
    "uploaded_by_id" TEXT NOT NULL,
    "uploaded_by_type" "DisputeEvidenceUploadedByType" NOT NULL,
    "file_name" TEXT NOT NULL,
    "file_url" TEXT NOT NULL,
    "content_type" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "dispute_evidence_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dispute_notes" (
    "id" TEXT NOT NULL,
    "dispute_id" TEXT NOT NULL,
    "author_id" TEXT NOT NULL,
    "note" TEXT NOT NULL,
    "visibility" "DisputeNoteVisibility" NOT NULL DEFAULT 'INTERNAL',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "dispute_notes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dispute_timelines" (
    "id" TEXT NOT NULL,
    "dispute_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "actor_id" TEXT,
    "actor_type" "DisputeActorType" NOT NULL,
    "metadata_json" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "dispute_timelines_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "provider_dispute_cases" (
    "id" TEXT NOT NULL,
    "case_id" TEXT NOT NULL,
    "provider_id" TEXT NOT NULL,
    "customer_id" TEXT NOT NULL,
    "order_id" TEXT NOT NULL,
    "provider_order_id" TEXT NOT NULL,
    "transaction_id" TEXT,
    "payment_id" TEXT,
    "amount" DECIMAL(10,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'PKR',
    "category" "ProviderDisputeCategory" NOT NULL,
    "reason" TEXT NOT NULL,
    "claim_type" TEXT NOT NULL,
    "customer_statement" TEXT NOT NULL,
    "priority" "ProviderDisputeSeverity" NOT NULL DEFAULT 'MEDIUM',
    "status" "ProviderDisputeStatus" NOT NULL DEFAULT 'OPEN',
    "risk_score" INTEGER NOT NULL DEFAULT 0,
    "sla_deadline_at" TIMESTAMPTZ NOT NULL,
    "assigned_to_id" TEXT,
    "evidence_review_started_at" TIMESTAMPTZ,
    "evidence_review_completed_at" TIMESTAMPTZ,
    "ruling" "ProviderDisputeRuling",
    "ruling_reason" TEXT,
    "refund_amount" DECIMAL(10,2),
    "apply_penalty" BOOLEAN NOT NULL DEFAULT false,
    "penalty_amount" DECIMAL(10,2),
    "penalty_reason" TEXT,
    "financial_impact_json" JSONB,
    "adjustment_type" "ProviderDisputeAdjustmentType",
    "total_provider_deduction" DECIMAL(10,2),
    "final_attested_at" TIMESTAMPTZ,
    "final_attested_by_id" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,
    "resolved_at" TIMESTAMPTZ,

    CONSTRAINT "provider_dispute_cases_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "provider_dispute_evidence" (
    "id" TEXT NOT NULL,
    "dispute_id" TEXT NOT NULL,
    "submitted_by_id" TEXT NOT NULL,
    "submitted_by_type" "ProviderDisputeSubmittedByType" NOT NULL,
    "narrative" TEXT NOT NULL,
    "status" "ProviderDisputeEvidenceStatus" NOT NULL,
    "submitted_at" TIMESTAMPTZ NOT NULL,
    "is_late" BOOLEAN NOT NULL DEFAULT false,
    "files_json" JSONB NOT NULL DEFAULT '[]',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "provider_dispute_evidence_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "provider_dispute_notes" (
    "id" TEXT NOT NULL,
    "dispute_id" TEXT NOT NULL,
    "author_id" TEXT NOT NULL,
    "note" TEXT NOT NULL,
    "visibility" "DisputeNoteVisibility" NOT NULL DEFAULT 'INTERNAL',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "provider_dispute_notes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "provider_dispute_timelines" (
    "id" TEXT NOT NULL,
    "dispute_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "actor_id" TEXT,
    "actor_type" "DisputeActorType" NOT NULL,
    "metadata_json" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "provider_dispute_timelines_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "provider_financial_adjustments" (
    "id" TEXT NOT NULL,
    "provider_id" TEXT NOT NULL,
    "dispute_id" TEXT NOT NULL,
    "provider_order_id" TEXT NOT NULL,
    "type" "ProviderFinancialAdjustmentType" NOT NULL,
    "direction" "ProviderFinancialAdjustmentDirection" NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'PKR',
    "status" "ProviderFinancialAdjustmentStatus" NOT NULL DEFAULT 'PENDING',
    "transaction_id" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "orderId" TEXT,

    CONSTRAINT "provider_financial_adjustments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "system_settings" (
    "id" TEXT NOT NULL,
    "application_name" TEXT NOT NULL DEFAULT 'Gift App',
    "support_email" TEXT NOT NULL DEFAULT 'support@giftapp.com',
    "platform_logo_url" TEXT,
    "session_timeout_minutes" INTEGER NOT NULL DEFAULT 30,
    "admin_mfa_required" BOOLEAN NOT NULL DEFAULT true,
    "password_policy_json" JSONB NOT NULL DEFAULT '{"minLength":8,"requireUppercase":true,"requireLowercase":true,"requireNumber":true,"requireSymbol":true}',
    "default_currency" TEXT NOT NULL DEFAULT 'USD',
    "transaction_fee_percent" DECIMAL(5,2) NOT NULL DEFAULT 2.5,
    "push_notifications_enabled" BOOLEAN NOT NULL DEFAULT true,
    "email_notifications_enabled" BOOLEAN NOT NULL DEFAULT true,
    "updated_by_id" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "system_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "guest_access_settings" (
    "id" TEXT NOT NULL,
    "guest_access_enabled" BOOLEAN NOT NULL DEFAULT true,
    "allow_marketplace_browsing" BOOLEAN NOT NULL DEFAULT true,
    "allow_marketplace_home" BOOLEAN NOT NULL DEFAULT true,
    "allow_gift_details" BOOLEAN NOT NULL DEFAULT true,
    "allow_discounted_gifts" BOOLEAN NOT NULL DEFAULT true,
    "allow_filter_options" BOOLEAN NOT NULL DEFAULT true,
    "allow_provider_preview" BOOLEAN NOT NULL DEFAULT true,
    "allow_wishlist" BOOLEAN NOT NULL DEFAULT false,
    "allow_cart" BOOLEAN NOT NULL DEFAULT false,
    "allow_checkout" BOOLEAN NOT NULL DEFAULT false,
    "session_ttl_minutes" INTEGER NOT NULL DEFAULT 120,
    "max_requests_per_minute" INTEGER NOT NULL DEFAULT 60,
    "show_exact_stock_to_guests" BOOLEAN NOT NULL DEFAULT false,
    "show_sku_to_guests" BOOLEAN NOT NULL DEFAULT false,
    "updated_by_id" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "guest_access_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "messaging_settings" (
    "id" TEXT NOT NULL,
    "buyer_provider_chat_enabled" BOOLEAN NOT NULL DEFAULT true,
    "support_chat_enabled" BOOLEAN NOT NULL DEFAULT true,
    "message_retention_days" INTEGER NOT NULL DEFAULT 365,
    "max_message_length" INTEGER NOT NULL DEFAULT 2000,
    "max_attachments_per_message" INTEGER NOT NULL DEFAULT 5,
    "allowed_attachment_types_json" JSONB NOT NULL DEFAULT '["jpg","jpeg","png","pdf","mp4"]',
    "profanity_filter_enabled" BOOLEAN NOT NULL DEFAULT true,
    "pii_filter_enabled" BOOLEAN NOT NULL DEFAULT true,
    "auto_flag_enabled" BOOLEAN NOT NULL DEFAULT true,
    "auto_flag_keywords_json" JSONB NOT NULL DEFAULT '["refund outside platform","bank account","whatsapp me"]',
    "offline_notification_delay_seconds" INTEGER NOT NULL DEFAULT 10,
    "message_edit_window_minutes" INTEGER NOT NULL DEFAULT 0,
    "updated_by_id" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "messaging_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "guest_sessions" (
    "id" TEXT NOT NULL,
    "guest_session_id" TEXT NOT NULL,
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

-- CreateTable
CREATE TABLE "admin_payout_settings" (
    "id" TEXT NOT NULL,
    "platform_rate_percent" DECIMAL(5,2) NOT NULL DEFAULT 5,
    "minimum_payout_threshold" DECIMAL(10,2) NOT NULL DEFAULT 100,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "payout_schedule" "AdminPayoutSchedule" NOT NULL DEFAULT 'MONTHLY_LAST_DAY',
    "payout_time_utc" TEXT NOT NULL DEFAULT '00:00',
    "auto_payout_enabled" BOOLEAN NOT NULL DEFAULT true,
    "updated_by_id" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "admin_payout_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "commission_tiers" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "commission_rate_percent" DECIMAL(5,2) NOT NULL,
    "order_volume_threshold" DECIMAL(10,2) NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 1,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "updated_by_id" TEXT,
    "deleted_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "commission_tiers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "provider_payout_methods" (
    "id" TEXT NOT NULL,
    "provider_id" TEXT NOT NULL,
    "type" "ProviderPayoutMethodType" NOT NULL DEFAULT 'BANK_ACCOUNT',
    "account_holder_name" TEXT NOT NULL,
    "bank_name" TEXT NOT NULL,
    "account_type" "ProviderPayoutAccountType" NOT NULL,
    "country" TEXT NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "masked_account" TEXT NOT NULL,
    "last4" TEXT NOT NULL,
    "payer_id" TEXT NOT NULL,
    "external_provider" "ProviderPayoutExternalProvider" NOT NULL DEFAULT 'MANUAL',
    "external_account_id" TEXT,
    "verification_status" "ProviderPayoutVerificationStatus" NOT NULL DEFAULT 'PENDING',
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "deleted_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "provider_payout_methods_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "provider_earnings_ledger" (
    "id" TEXT NOT NULL,
    "provider_id" TEXT NOT NULL,
    "provider_order_id" TEXT,
    "payout_id" TEXT,
    "type" "ProviderEarningsLedgerType" NOT NULL,
    "direction" "ProviderEarningsLedgerDirection" NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "status" "ProviderEarningsLedgerStatus" NOT NULL DEFAULT 'PENDING',
    "description" TEXT NOT NULL,
    "metadata_json" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "provider_earnings_ledger_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "provider_payouts" (
    "id" TEXT NOT NULL,
    "provider_id" TEXT NOT NULL,
    "payout_method_id" TEXT NOT NULL,
    "transaction_id" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "processing_fee" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "total_to_receive" DECIMAL(10,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "status" "ProviderPayoutStatus" NOT NULL DEFAULT 'PENDING',
    "external_payout_id" TEXT,
    "failure_reason" TEXT,
    "expected_arrival_at" TIMESTAMPTZ,
    "completed_at" TIMESTAMPTZ,
    "idempotency_key" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "provider_payouts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "provider_dispute_resolutions" (
    "id" TEXT NOT NULL,
    "dispute_id" TEXT NOT NULL,
    "final_ruling" "ProviderDisputeFinalRuling" NOT NULL,
    "status" "ProviderDisputeResolutionStatus" NOT NULL,
    "refund_processed" BOOLEAN NOT NULL DEFAULT false,
    "refund_amount" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "provider_deduction" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "penalty_applied" BOOLEAN NOT NULL DEFAULT false,
    "penalty_amount" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "notification_status_json" JSONB NOT NULL DEFAULT '{}',
    "performance_impact_json" JSONB,
    "finalized_by_id" TEXT NOT NULL,
    "finalized_at" TIMESTAMPTZ NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "provider_dispute_resolutions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "provider_dispute_financial_logs" (
    "id" TEXT NOT NULL,
    "dispute_id" TEXT NOT NULL,
    "transaction_id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'PKR',
    "status" "ProviderFinancialAdjustmentStatus" NOT NULL,
    "metadata_json" JSONB,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "provider_dispute_financial_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "provider_dispute_communication_logs" (
    "id" TEXT NOT NULL,
    "dispute_id" TEXT NOT NULL,
    "target_type" "ProviderDisputeCommunicationTargetType" NOT NULL,
    "channel" "ProviderDisputeCommunicationChannel" NOT NULL,
    "title" TEXT NOT NULL,
    "body_preview" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "sent_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "provider_dispute_communication_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "auth_sessions" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "refresh_token_hash" TEXT NOT NULL,
    "device_name" TEXT,
    "ip_address" TEXT,
    "location" TEXT,
    "user_agent" TEXT,
    "last_active_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revoked_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "auth_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subscription_plans" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "monthly_price" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "yearly_price" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "status" "SubscriptionPlanStatus" NOT NULL DEFAULT 'ACTIVE',
    "visibility" "SubscriptionPlanVisibility" NOT NULL DEFAULT 'PUBLIC',
    "is_popular" BOOLEAN NOT NULL DEFAULT false,
    "features_json" JSONB NOT NULL DEFAULT '{}',
    "limits_json" JSONB NOT NULL DEFAULT '{}',
    "active_subscribers_placeholder" INTEGER NOT NULL DEFAULT 0,
    "stripe_product_id" TEXT,
    "stripe_monthly_price_id" TEXT,
    "stripe_yearly_price_id" TEXT,
    "created_by" TEXT,
    "updated_by" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,
    "deleted_at" TIMESTAMPTZ,

    CONSTRAINT "subscription_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "plan_feature_catalog" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "description" TEXT,
    "type" TEXT NOT NULL DEFAULT 'BOOLEAN',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "deleted_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "plan_feature_catalog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "uploaded_files" (
    "id" TEXT NOT NULL,
    "owner_id" TEXT NOT NULL,
    "owner_role" "UserRole" NOT NULL,
    "target_account_id" TEXT,
    "folder" TEXT NOT NULL,
    "file_name" TEXT NOT NULL,
    "content_type" TEXT NOT NULL,
    "size_bytes" INTEGER,
    "file_url" TEXT NOT NULL,
    "storage_key" TEXT NOT NULL,
    "status" "UploadedFileStatus" NOT NULL DEFAULT 'PENDING',
    "gift_id" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,
    "completed_at" TIMESTAMPTZ,
    "deleted_at" TIMESTAMPTZ,

    CONSTRAINT "uploaded_files_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "media_upload_policies" (
    "id" TEXT NOT NULL,
    "allowed_file_types_json" JSONB NOT NULL DEFAULT '{}',
    "max_image_size_mb" INTEGER NOT NULL DEFAULT 10,
    "max_video_size_mb" INTEGER NOT NULL DEFAULT 500,
    "max_audio_size_mb" INTEGER NOT NULL DEFAULT 50,
    "scan_uploads" BOOLEAN NOT NULL DEFAULT true,
    "block_svg_uploads" BOOLEAN NOT NULL DEFAULT true,
    "updated_by_id" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "media_upload_policies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "coupons" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT,
    "discount_type" "CouponDiscountType" NOT NULL,
    "discount_value" DECIMAL(10,2) NOT NULL,
    "plan_ids_json" JSONB NOT NULL DEFAULT '[]',
    "starts_at" TIMESTAMPTZ,
    "expires_at" TIMESTAMPTZ,
    "max_redemptions" INTEGER,
    "redemption_count" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_by" TEXT,
    "updated_by" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,
    "deleted_at" TIMESTAMPTZ,

    CONSTRAINT "coupons_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "admin_roles" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "permissions_json" JSONB NOT NULL,
    "is_system" BOOLEAN NOT NULL DEFAULT false,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "deleted_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "admin_roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "admin_audit_logs" (
    "id" TEXT NOT NULL,
    "log_reference" TEXT,
    "event_id" TEXT,
    "actor_id" TEXT,
    "actor_type" TEXT,
    "actor_name_snapshot" TEXT,
    "target_id" TEXT,
    "target_type" TEXT,
    "action" TEXT NOT NULL,
    "action_label" TEXT,
    "module" TEXT,
    "environment" TEXT,
    "status" "AuditLogStatus" NOT NULL DEFAULT 'SUCCESS',
    "severity" "AuditLogSeverity" NOT NULL DEFAULT 'LOW',
    "before_json" JSONB,
    "after_json" JSONB,
    "request_payload_json" JSONB,
    "response_payload_json" JSONB,
    "metadata_json" JSONB,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "duration_ms" INTEGER,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "admin_audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "account_suspensions" (
    "id" TEXT NOT NULL,
    "account_id" TEXT NOT NULL,
    "account_type" "AccountType" NOT NULL,
    "reason" TEXT NOT NULL,
    "comment" TEXT,
    "suspended_by" TEXT NOT NULL,
    "suspended_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "unsuspended_by" TEXT,
    "unsuspended_at" TIMESTAMPTZ,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "account_suspensions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "login_attempts" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "status" "LoginAttemptStatus" NOT NULL,
    "reason" TEXT,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "user_id" TEXT,
    "role" "UserRole",
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "login_attempts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_referral_code_key" ON "users"("referral_code");

-- CreateIndex
CREATE INDEX "users_role_is_active_idx" ON "users"("role", "is_active");

-- CreateIndex
CREATE INDEX "users_role_suspended_at_idx" ON "users"("role", "suspended_at");

-- CreateIndex
CREATE INDEX "users_admin_role_id_idx" ON "users"("admin_role_id");

-- CreateIndex
CREATE INDEX "users_provider_approval_status_idx" ON "users"("provider_approval_status");

-- CreateIndex
CREATE INDEX "users_provider_business_category_id_idx" ON "users"("provider_business_category_id");

-- CreateIndex
CREATE INDEX "users_referral_code_idx" ON "users"("referral_code");

-- CreateIndex
CREATE UNIQUE INDEX "referrals_referred_user_id_key" ON "referrals"("referred_user_id");

-- CreateIndex
CREATE INDEX "referrals_referrer_user_id_status_idx" ON "referrals"("referrer_user_id", "status");

-- CreateIndex
CREATE INDEX "referrals_referral_code_idx" ON "referrals"("referral_code");

-- CreateIndex
CREATE INDEX "referral_settings_updated_by_id_idx" ON "referral_settings"("updated_by_id");

-- CreateIndex
CREATE INDEX "refund_policy_settings_updated_by_id_idx" ON "refund_policy_settings"("updated_by_id");

-- CreateIndex
CREATE INDEX "reward_ledgers_user_id_type_created_at_idx" ON "reward_ledgers"("user_id", "type", "created_at");

-- CreateIndex
CREATE INDEX "reward_ledgers_source_source_id_idx" ON "reward_ledgers"("source", "source_id");

-- CreateIndex
CREATE UNIQUE INDEX "reward_ledgers_user_id_type_source_source_id_key" ON "reward_ledgers"("user_id", "type", "source", "source_id");

-- CreateIndex
CREATE UNIQUE INDEX "customer_wallets_user_id_key" ON "customer_wallets"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "customer_wallet_ledgers_transaction_id_key" ON "customer_wallet_ledgers"("transaction_id");

-- CreateIndex
CREATE INDEX "customer_wallet_ledgers_user_id_type_status_created_at_idx" ON "customer_wallet_ledgers"("user_id", "type", "status", "created_at");

-- CreateIndex
CREATE INDEX "customer_wallet_ledgers_wallet_id_created_at_idx" ON "customer_wallet_ledgers"("wallet_id", "created_at");

-- CreateIndex
CREATE INDEX "customer_wallet_ledgers_payment_id_idx" ON "customer_wallet_ledgers"("payment_id");

-- CreateIndex
CREATE INDEX "customer_wallet_ledgers_reward_ledger_id_idx" ON "customer_wallet_ledgers"("reward_ledger_id");

-- CreateIndex
CREATE INDEX "customer_bank_accounts_user_id_deleted_at_idx" ON "customer_bank_accounts"("user_id", "deleted_at");

-- CreateIndex
CREATE INDEX "customer_bank_accounts_user_id_is_default_idx" ON "customer_bank_accounts"("user_id", "is_default");

-- CreateIndex
CREATE UNIQUE INDEX "provider_business_categories_name_key" ON "provider_business_categories"("name");

-- CreateIndex
CREATE UNIQUE INDEX "provider_business_categories_slug_key" ON "provider_business_categories"("slug");

-- CreateIndex
CREATE INDEX "provider_business_categories_is_active_sort_order_idx" ON "provider_business_categories"("is_active", "sort_order");

-- CreateIndex
CREATE INDEX "provider_business_categories_deleted_at_idx" ON "provider_business_categories"("deleted_at");

-- CreateIndex
CREATE UNIQUE INDEX "gift_categories_slug_key" ON "gift_categories"("slug");

-- CreateIndex
CREATE INDEX "gift_categories_is_active_sort_order_idx" ON "gift_categories"("is_active", "sort_order");

-- CreateIndex
CREATE INDEX "gift_categories_deleted_at_idx" ON "gift_categories"("deleted_at");

-- CreateIndex
CREATE INDEX "customer_wishlists_user_id_idx" ON "customer_wishlists"("user_id");

-- CreateIndex
CREATE INDEX "customer_wishlists_gift_id_idx" ON "customer_wishlists"("gift_id");

-- CreateIndex
CREATE UNIQUE INDEX "customer_wishlists_user_id_gift_id_key" ON "customer_wishlists"("user_id", "gift_id");

-- CreateIndex
CREATE INDEX "customer_addresses_user_id_deleted_at_idx" ON "customer_addresses"("user_id", "deleted_at");

-- CreateIndex
CREATE INDEX "customer_addresses_user_id_is_default_idx" ON "customer_addresses"("user_id", "is_default");

-- CreateIndex
CREATE INDEX "customer_reminders_user_id_deleted_at_idx" ON "customer_reminders"("user_id", "deleted_at");

-- CreateIndex
CREATE INDEX "customer_reminders_reminder_date_is_active_idx" ON "customer_reminders"("reminder_date", "is_active");

-- CreateIndex
CREATE INDEX "customer_contacts_user_id_idx" ON "customer_contacts"("user_id");

-- CreateIndex
CREATE INDEX "customer_contacts_user_id_name_idx" ON "customer_contacts"("user_id", "name");

-- CreateIndex
CREATE INDEX "customer_contacts_user_id_relationship_idx" ON "customer_contacts"("user_id", "relationship");

-- CreateIndex
CREATE INDEX "customer_contacts_user_id_deleted_at_idx" ON "customer_contacts"("user_id", "deleted_at");

-- CreateIndex
CREATE INDEX "customer_events_user_id_deleted_at_idx" ON "customer_events"("user_id", "deleted_at");

-- CreateIndex
CREATE INDEX "customer_events_user_id_event_date_idx" ON "customer_events"("user_id", "event_date");

-- CreateIndex
CREATE INDEX "customer_events_user_id_event_type_idx" ON "customer_events"("user_id", "event_type");

-- CreateIndex
CREATE INDEX "customer_events_recipient_id_idx" ON "customer_events"("recipient_id");

-- CreateIndex
CREATE INDEX "customer_event_reminder_jobs_event_id_status_idx" ON "customer_event_reminder_jobs"("event_id", "status");

-- CreateIndex
CREATE INDEX "customer_event_reminder_jobs_user_id_scheduled_for_idx" ON "customer_event_reminder_jobs"("user_id", "scheduled_for");

-- CreateIndex
CREATE INDEX "carts_user_id_status_idx" ON "carts"("user_id", "status");

-- CreateIndex
CREATE INDEX "cart_items_cart_id_idx" ON "cart_items"("cart_id");

-- CreateIndex
CREATE INDEX "cart_items_gift_id_idx" ON "cart_items"("gift_id");

-- CreateIndex
CREATE INDEX "cart_items_variant_id_idx" ON "cart_items"("variant_id");

-- CreateIndex
CREATE INDEX "cart_items_recipient_contact_id_idx" ON "cart_items"("recipient_contact_id");

-- CreateIndex
CREATE INDEX "cart_items_event_id_idx" ON "cart_items"("event_id");

-- CreateIndex
CREATE UNIQUE INDEX "payments_order_id_key" ON "payments"("order_id");

-- CreateIndex
CREATE UNIQUE INDEX "payments_money_gift_id_key" ON "payments"("money_gift_id");

-- CreateIndex
CREATE UNIQUE INDEX "payments_provider_payment_intent_id_key" ON "payments"("provider_payment_intent_id");

-- CreateIndex
CREATE INDEX "payments_user_id_status_idx" ON "payments"("user_id", "status");

-- CreateIndex
CREATE INDEX "payments_status_created_at_idx" ON "payments"("status", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "customer_subscriptions_stripe_subscription_id_key" ON "customer_subscriptions"("stripe_subscription_id");

-- CreateIndex
CREATE INDEX "customer_subscriptions_user_id_status_idx" ON "customer_subscriptions"("user_id", "status");

-- CreateIndex
CREATE INDEX "customer_subscriptions_plan_id_idx" ON "customer_subscriptions"("plan_id");

-- CreateIndex
CREATE INDEX "customer_subscriptions_coupon_id_idx" ON "customer_subscriptions"("coupon_id");

-- CreateIndex
CREATE UNIQUE INDEX "customer_subscription_invoices_stripe_invoice_id_key" ON "customer_subscription_invoices"("stripe_invoice_id");

-- CreateIndex
CREATE INDEX "customer_subscription_invoices_user_id_created_at_idx" ON "customer_subscription_invoices"("user_id", "created_at");

-- CreateIndex
CREATE INDEX "customer_subscription_invoices_customer_subscription_id_idx" ON "customer_subscription_invoices"("customer_subscription_id");

-- CreateIndex
CREATE UNIQUE INDEX "orders_order_number_key" ON "orders"("order_number");

-- CreateIndex
CREATE UNIQUE INDEX "orders_payment_id_key" ON "orders"("payment_id");

-- CreateIndex
CREATE INDEX "orders_user_id_created_at_idx" ON "orders"("user_id", "created_at");

-- CreateIndex
CREATE INDEX "orders_status_idx" ON "orders"("status");

-- CreateIndex
CREATE INDEX "order_items_order_id_idx" ON "order_items"("order_id");

-- CreateIndex
CREATE INDEX "order_items_gift_id_idx" ON "order_items"("gift_id");

-- CreateIndex
CREATE INDEX "order_items_variant_id_idx" ON "order_items"("variant_id");

-- CreateIndex
CREATE INDEX "order_items_provider_id_status_idx" ON "order_items"("provider_id", "status");

-- CreateIndex
CREATE INDEX "provider_orders_order_id_idx" ON "provider_orders"("order_id");

-- CreateIndex
CREATE INDEX "provider_orders_provider_id_status_idx" ON "provider_orders"("provider_id", "status");

-- CreateIndex
CREATE INDEX "provider_order_items_provider_order_id_idx" ON "provider_order_items"("provider_order_id");

-- CreateIndex
CREATE INDEX "provider_order_items_order_item_id_idx" ON "provider_order_items"("order_item_id");

-- CreateIndex
CREATE INDEX "provider_order_timelines_provider_order_id_created_at_idx" ON "provider_order_timelines"("provider_order_id", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "provider_order_checklists_provider_order_id_key" ON "provider_order_checklists"("provider_order_id");

-- CreateIndex
CREATE UNIQUE INDEX "refund_requests_transaction_id_key" ON "refund_requests"("transaction_id");

-- CreateIndex
CREATE INDEX "refund_requests_provider_id_status_created_at_idx" ON "refund_requests"("provider_id", "status", "created_at");

-- CreateIndex
CREATE INDEX "refund_requests_provider_order_id_idx" ON "refund_requests"("provider_order_id");

-- CreateIndex
CREATE INDEX "refund_requests_order_id_idx" ON "refund_requests"("order_id");

-- CreateIndex
CREATE INDEX "refund_requests_user_id_idx" ON "refund_requests"("user_id");

-- CreateIndex
CREATE INDEX "order_messages_order_id_created_at_idx" ON "order_messages"("order_id", "created_at");

-- CreateIndex
CREATE INDEX "order_messages_provider_order_id_created_at_idx" ON "order_messages"("provider_order_id", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "money_gifts_payment_id_key" ON "money_gifts"("payment_id");

-- CreateIndex
CREATE INDEX "money_gifts_user_id_status_created_at_idx" ON "money_gifts"("user_id", "status", "created_at");

-- CreateIndex
CREATE INDEX "money_gifts_recipient_contact_id_idx" ON "money_gifts"("recipient_contact_id");

-- CreateIndex
CREATE INDEX "customer_recurring_payments_user_id_status_next_billing_at_idx" ON "customer_recurring_payments"("user_id", "status", "next_billing_at");

-- CreateIndex
CREATE INDEX "customer_recurring_payments_recipient_contact_id_idx" ON "customer_recurring_payments"("recipient_contact_id");

-- CreateIndex
CREATE INDEX "customer_recurring_payments_status_next_billing_at_idx" ON "customer_recurring_payments"("status", "next_billing_at");

-- CreateIndex
CREATE INDEX "customer_recurring_payments_deleted_at_idx" ON "customer_recurring_payments"("deleted_at");

-- CreateIndex
CREATE INDEX "customer_recurring_payment_occurrences_recurring_payment_id_idx" ON "customer_recurring_payment_occurrences"("recurring_payment_id", "status");

-- CreateIndex
CREATE INDEX "customer_recurring_payment_occurrences_user_id_scheduled_fo_idx" ON "customer_recurring_payment_occurrences"("user_id", "scheduled_for");

-- CreateIndex
CREATE INDEX "customer_recurring_payment_occurrences_status_scheduled_for_idx" ON "customer_recurring_payment_occurrences"("status", "scheduled_for");

-- CreateIndex
CREATE UNIQUE INDEX "customer_payment_methods_stripe_payment_method_id_key" ON "customer_payment_methods"("stripe_payment_method_id");

-- CreateIndex
CREATE INDEX "customer_payment_methods_user_id_deleted_at_idx" ON "customer_payment_methods"("user_id", "deleted_at");

-- CreateIndex
CREATE INDEX "customer_payment_methods_user_id_is_default_idx" ON "customer_payment_methods"("user_id", "is_default");

-- CreateIndex
CREATE INDEX "promotional_offers_provider_id_status_idx" ON "promotional_offers"("provider_id", "status");

-- CreateIndex
CREATE INDEX "promotional_offers_item_id_status_idx" ON "promotional_offers"("item_id", "status");

-- CreateIndex
CREATE INDEX "promotional_offers_approval_status_status_idx" ON "promotional_offers"("approval_status", "status");

-- CreateIndex
CREATE INDEX "promotional_offers_start_date_end_date_idx" ON "promotional_offers"("start_date", "end_date");

-- CreateIndex
CREATE INDEX "promotional_offers_deleted_at_idx" ON "promotional_offers"("deleted_at");

-- CreateIndex
CREATE UNIQUE INDEX "gifts_slug_key" ON "gifts"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "gifts_sku_key" ON "gifts"("sku");

-- CreateIndex
CREATE INDEX "gifts_category_id_deleted_at_idx" ON "gifts"("category_id", "deleted_at");

-- CreateIndex
CREATE INDEX "gifts_provider_id_deleted_at_idx" ON "gifts"("provider_id", "deleted_at");

-- CreateIndex
CREATE INDEX "gifts_status_deleted_at_idx" ON "gifts"("status", "deleted_at");

-- CreateIndex
CREATE INDEX "gifts_moderation_status_deleted_at_idx" ON "gifts"("moderation_status", "deleted_at");

-- CreateIndex
CREATE INDEX "gifts_is_published_deleted_at_idx" ON "gifts"("is_published", "deleted_at");

-- CreateIndex
CREATE UNIQUE INDEX "gift_variants_sku_key" ON "gift_variants"("sku");

-- CreateIndex
CREATE INDEX "gift_variants_gift_id_is_active_sort_order_idx" ON "gift_variants"("gift_id", "is_active", "sort_order");

-- CreateIndex
CREATE INDEX "gift_variants_deleted_at_idx" ON "gift_variants"("deleted_at");

-- CreateIndex
CREATE INDEX "broadcasts_status_created_at_idx" ON "broadcasts"("status", "created_at");

-- CreateIndex
CREATE INDEX "broadcasts_scheduled_at_status_idx" ON "broadcasts"("scheduled_at", "status");

-- CreateIndex
CREATE INDEX "broadcast_deliveries_broadcast_id_status_idx" ON "broadcast_deliveries"("broadcast_id", "status");

-- CreateIndex
CREATE INDEX "broadcast_deliveries_recipient_id_recipient_type_idx" ON "broadcast_deliveries"("recipient_id", "recipient_type");

-- CreateIndex
CREATE INDEX "notifications_recipient_id_is_read_created_at_idx" ON "notifications"("recipient_id", "is_read", "created_at");

-- CreateIndex
CREATE INDEX "notifications_recipient_id_type_created_at_idx" ON "notifications"("recipient_id", "type", "created_at");

-- CreateIndex
CREATE INDEX "notifications_deleted_at_idx" ON "notifications"("deleted_at");

-- CreateIndex
CREATE INDEX "notifications_broadcast_id_idx" ON "notifications"("broadcast_id");

-- CreateIndex
CREATE UNIQUE INDEX "notification_delivery_logs_idempotency_key_key" ON "notification_delivery_logs"("idempotency_key");

-- CreateIndex
CREATE INDEX "notification_delivery_logs_recipient_id_recipient_type_crea_idx" ON "notification_delivery_logs"("recipient_id", "recipient_type", "created_at");

-- CreateIndex
CREATE INDEX "notification_delivery_logs_notification_type_created_at_idx" ON "notification_delivery_logs"("notification_type", "created_at");

-- CreateIndex
CREATE INDEX "notification_delivery_logs_in_app_status_socket_status_push_idx" ON "notification_delivery_logs"("in_app_status", "socket_status", "push_status", "email_status");

-- CreateIndex
CREATE INDEX "notification_device_tokens_user_id_is_active_idx" ON "notification_device_tokens"("user_id", "is_active");

-- CreateIndex
CREATE UNIQUE INDEX "notification_device_tokens_user_id_device_id_key" ON "notification_device_tokens"("user_id", "device_id");

-- CreateIndex
CREATE UNIQUE INDEX "notification_preferences_user_id_key" ON "notification_preferences"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "reviews_review_code_key" ON "reviews"("review_code");

-- CreateIndex
CREATE INDEX "reviews_status_created_at_idx" ON "reviews"("status", "created_at");

-- CreateIndex
CREATE INDEX "reviews_source_created_at_idx" ON "reviews"("source", "created_at");

-- CreateIndex
CREATE INDEX "reviews_report_count_idx" ON "reviews"("report_count");

-- CreateIndex
CREATE INDEX "reviews_severity_status_idx" ON "reviews"("severity", "status");

-- CreateIndex
CREATE INDEX "reviews_provider_id_created_at_idx" ON "reviews"("provider_id", "created_at");

-- CreateIndex
CREATE INDEX "reviews_user_id_created_at_idx" ON "reviews"("user_id", "created_at");

-- CreateIndex
CREATE INDEX "reviews_order_id_idx" ON "reviews"("order_id");

-- CreateIndex
CREATE INDEX "reviews_provider_order_id_idx" ON "reviews"("provider_order_id");

-- CreateIndex
CREATE INDEX "reviews_deleted_at_idx" ON "reviews"("deleted_at");

-- CreateIndex
CREATE UNIQUE INDEX "review_responses_review_id_key" ON "review_responses"("review_id");

-- CreateIndex
CREATE INDEX "review_responses_provider_id_created_at_idx" ON "review_responses"("provider_id", "created_at");

-- CreateIndex
CREATE INDEX "review_responses_deleted_at_idx" ON "review_responses"("deleted_at");

-- CreateIndex
CREATE INDEX "review_moderation_logs_review_id_created_at_idx" ON "review_moderation_logs"("review_id", "created_at");

-- CreateIndex
CREATE INDEX "review_moderation_logs_actor_id_created_at_idx" ON "review_moderation_logs"("actor_id", "created_at");

-- CreateIndex
CREATE INDEX "review_moderation_logs_action_created_at_idx" ON "review_moderation_logs"("action", "created_at");

-- CreateIndex
CREATE INDEX "review_policies_updated_by_id_idx" ON "review_policies"("updated_by_id");

-- CreateIndex
CREATE UNIQUE INDEX "chat_threads_provider_order_id_key" ON "chat_threads"("provider_order_id");

-- CreateIndex
CREATE UNIQUE INDEX "chat_threads_last_message_id_key" ON "chat_threads"("last_message_id");

-- CreateIndex
CREATE INDEX "chat_threads_thread_type_status_updated_at_idx" ON "chat_threads"("thread_type", "status", "updated_at");

-- CreateIndex
CREATE INDEX "chat_threads_source_type_source_id_idx" ON "chat_threads"("source_type", "source_id");

-- CreateIndex
CREATE INDEX "chat_threads_customer_id_updated_at_idx" ON "chat_threads"("customer_id", "updated_at");

-- CreateIndex
CREATE INDEX "chat_threads_provider_id_updated_at_idx" ON "chat_threads"("provider_id", "updated_at");

-- CreateIndex
CREATE INDEX "chat_threads_assigned_admin_id_updated_at_idx" ON "chat_threads"("assigned_admin_id", "updated_at");

-- CreateIndex
CREATE INDEX "chat_threads_order_id_idx" ON "chat_threads"("order_id");

-- CreateIndex
CREATE INDEX "chat_messages_thread_id_created_at_idx" ON "chat_messages"("thread_id", "created_at");

-- CreateIndex
CREATE INDEX "chat_messages_sender_id_created_at_idx" ON "chat_messages"("sender_id", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "chat_messages_thread_id_sender_id_client_message_id_key" ON "chat_messages"("thread_id", "sender_id", "client_message_id");

-- CreateIndex
CREATE INDEX "chat_participants_user_id_updated_at_idx" ON "chat_participants"("user_id", "updated_at");

-- CreateIndex
CREATE UNIQUE INDEX "chat_participants_thread_id_user_id_key" ON "chat_participants"("thread_id", "user_id");

-- CreateIndex
CREATE INDEX "chat_message_read_receipts_thread_id_user_id_read_at_idx" ON "chat_message_read_receipts"("thread_id", "user_id", "read_at");

-- CreateIndex
CREATE UNIQUE INDEX "chat_message_read_receipts_message_id_user_id_key" ON "chat_message_read_receipts"("message_id", "user_id");

-- CreateIndex
CREATE INDEX "chat_attachments_thread_id_created_at_idx" ON "chat_attachments"("thread_id", "created_at");

-- CreateIndex
CREATE INDEX "chat_attachments_message_id_idx" ON "chat_attachments"("message_id");

-- CreateIndex
CREATE INDEX "chat_audit_logs_thread_id_created_at_idx" ON "chat_audit_logs"("thread_id", "created_at");

-- CreateIndex
CREATE INDEX "chat_audit_logs_message_id_idx" ON "chat_audit_logs"("message_id");

-- CreateIndex
CREATE INDEX "chat_audit_logs_actor_id_created_at_idx" ON "chat_audit_logs"("actor_id", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "message_moderation_cases_message_id_key" ON "message_moderation_cases"("message_id");

-- CreateIndex
CREATE INDEX "message_moderation_cases_source_status_severity_created_at_idx" ON "message_moderation_cases"("source", "status", "severity", "created_at");

-- CreateIndex
CREATE INDEX "message_moderation_cases_participant_id_created_at_idx" ON "message_moderation_cases"("participant_id", "created_at");

-- CreateIndex
CREATE INDEX "message_moderation_cases_assigned_to_id_status_idx" ON "message_moderation_cases"("assigned_to_id", "status");

-- CreateIndex
CREATE INDEX "message_moderation_escalations_message_id_created_at_idx" ON "message_moderation_escalations"("message_id", "created_at");

-- CreateIndex
CREATE INDEX "message_moderation_escalations_assigned_to_admin_id_status_idx" ON "message_moderation_escalations"("assigned_to_admin_id", "status");

-- CreateIndex
CREATE INDEX "message_moderation_logs_case_id_created_at_idx" ON "message_moderation_logs"("case_id", "created_at");

-- CreateIndex
CREATE INDEX "message_moderation_logs_message_id_created_at_idx" ON "message_moderation_logs"("message_id", "created_at");

-- CreateIndex
CREATE INDEX "provider_reports_reporter_user_id_created_at_idx" ON "provider_reports"("reporter_user_id", "created_at");

-- CreateIndex
CREATE INDEX "provider_reports_provider_id_status_idx" ON "provider_reports"("provider_id", "status");

-- CreateIndex
CREATE INDEX "provider_reports_order_id_idx" ON "provider_reports"("order_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_safety_reports_report_id_key" ON "user_safety_reports"("report_id");

-- CreateIndex
CREATE INDEX "user_safety_reports_reporter_user_id_created_at_idx" ON "user_safety_reports"("reporter_user_id", "created_at");

-- CreateIndex
CREATE INDEX "user_safety_reports_reported_user_id_status_idx" ON "user_safety_reports"("reported_user_id", "status");

-- CreateIndex
CREATE INDEX "user_safety_reports_source_type_source_id_idx" ON "user_safety_reports"("source_type", "source_id");

-- CreateIndex
CREATE INDEX "user_safety_reports_reason_status_idx" ON "user_safety_reports"("reason", "status");

-- CreateIndex
CREATE INDEX "user_blocks_blocked_user_id_idx" ON "user_blocks"("blocked_user_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_blocks_blocker_user_id_blocked_user_id_key" ON "user_blocks"("blocker_user_id", "blocked_user_id");

-- CreateIndex
CREATE INDEX "user_safety_moderation_logs_report_id_created_at_idx" ON "user_safety_moderation_logs"("report_id", "created_at");

-- CreateIndex
CREATE INDEX "user_safety_moderation_logs_actor_id_created_at_idx" ON "user_safety_moderation_logs"("actor_id", "created_at");

-- CreateIndex
CREATE INDEX "social_posts_user_id_created_at_idx" ON "social_posts"("user_id", "created_at");

-- CreateIndex
CREATE INDEX "social_posts_visibility_status_idx" ON "social_posts"("visibility", "status");

-- CreateIndex
CREATE UNIQUE INDEX "social_reports_report_id_key" ON "social_reports"("report_id");

-- CreateIndex
CREATE INDEX "social_reports_post_id_status_created_at_idx" ON "social_reports"("post_id", "status", "created_at");

-- CreateIndex
CREATE INDEX "social_reports_reported_by_id_created_at_idx" ON "social_reports"("reported_by_id", "created_at");

-- CreateIndex
CREATE INDEX "social_reports_reason_status_idx" ON "social_reports"("reason", "status");

-- CreateIndex
CREATE INDEX "social_reports_severity_status_idx" ON "social_reports"("severity", "status");

-- CreateIndex
CREATE INDEX "social_moderation_logs_social_report_id_created_at_idx" ON "social_moderation_logs"("social_report_id", "created_at");

-- CreateIndex
CREATE INDEX "social_moderation_logs_post_id_created_at_idx" ON "social_moderation_logs"("post_id", "created_at");

-- CreateIndex
CREATE INDEX "social_moderation_logs_actor_id_created_at_idx" ON "social_moderation_logs"("actor_id", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "social_reporting_rules_report_category_key" ON "social_reporting_rules"("report_category");

-- CreateIndex
CREATE INDEX "social_reporting_rules_is_active_deleted_at_idx" ON "social_reporting_rules"("is_active", "deleted_at");

-- CreateIndex
CREATE INDEX "social_reporting_rules_auto_flag_threshold_idx" ON "social_reporting_rules"("auto_flag_threshold");

-- CreateIndex
CREATE INDEX "user_warnings_user_id_created_at_idx" ON "user_warnings"("user_id", "created_at");

-- CreateIndex
CREATE INDEX "user_warnings_social_report_id_idx" ON "user_warnings"("social_report_id");

-- CreateIndex
CREATE UNIQUE INDEX "dispute_cases_case_id_key" ON "dispute_cases"("case_id");

-- CreateIndex
CREATE INDEX "dispute_cases_status_priority_created_at_idx" ON "dispute_cases"("status", "priority", "created_at");

-- CreateIndex
CREATE INDEX "dispute_cases_user_id_created_at_idx" ON "dispute_cases"("user_id", "created_at");

-- CreateIndex
CREATE INDEX "dispute_cases_order_id_idx" ON "dispute_cases"("order_id");

-- CreateIndex
CREATE INDEX "dispute_cases_payment_id_idx" ON "dispute_cases"("payment_id");

-- CreateIndex
CREATE INDEX "dispute_evidence_dispute_id_created_at_idx" ON "dispute_evidence"("dispute_id", "created_at");

-- CreateIndex
CREATE INDEX "dispute_notes_dispute_id_created_at_idx" ON "dispute_notes"("dispute_id", "created_at");

-- CreateIndex
CREATE INDEX "dispute_timelines_dispute_id_created_at_idx" ON "dispute_timelines"("dispute_id", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "provider_dispute_cases_case_id_key" ON "provider_dispute_cases"("case_id");

-- CreateIndex
CREATE INDEX "provider_dispute_cases_status_priority_created_at_idx" ON "provider_dispute_cases"("status", "priority", "created_at");

-- CreateIndex
CREATE INDEX "provider_dispute_cases_provider_id_created_at_idx" ON "provider_dispute_cases"("provider_id", "created_at");

-- CreateIndex
CREATE INDEX "provider_dispute_cases_customer_id_created_at_idx" ON "provider_dispute_cases"("customer_id", "created_at");

-- CreateIndex
CREATE INDEX "provider_dispute_cases_order_id_idx" ON "provider_dispute_cases"("order_id");

-- CreateIndex
CREATE INDEX "provider_dispute_cases_provider_order_id_idx" ON "provider_dispute_cases"("provider_order_id");

-- CreateIndex
CREATE INDEX "provider_dispute_evidence_dispute_id_created_at_idx" ON "provider_dispute_evidence"("dispute_id", "created_at");

-- CreateIndex
CREATE INDEX "provider_dispute_notes_dispute_id_created_at_idx" ON "provider_dispute_notes"("dispute_id", "created_at");

-- CreateIndex
CREATE INDEX "provider_dispute_timelines_dispute_id_created_at_idx" ON "provider_dispute_timelines"("dispute_id", "created_at");

-- CreateIndex
CREATE INDEX "provider_financial_adjustments_provider_id_created_at_idx" ON "provider_financial_adjustments"("provider_id", "created_at");

-- CreateIndex
CREATE INDEX "provider_financial_adjustments_dispute_id_created_at_idx" ON "provider_financial_adjustments"("dispute_id", "created_at");

-- CreateIndex
CREATE INDEX "messaging_settings_updated_by_id_idx" ON "messaging_settings"("updated_by_id");

-- CreateIndex
CREATE UNIQUE INDEX "guest_sessions_guest_session_id_key" ON "guest_sessions"("guest_session_id");

-- CreateIndex
CREATE INDEX "guest_sessions_expires_at_idx" ON "guest_sessions"("expires_at");

-- CreateIndex
CREATE INDEX "guest_sessions_guest_session_id_idx" ON "guest_sessions"("guest_session_id");

-- CreateIndex
CREATE INDEX "guest_sessions_ip_address_last_seen_at_idx" ON "guest_sessions"("ip_address", "last_seen_at");

-- CreateIndex
CREATE INDEX "commission_tiers_deleted_at_is_active_sort_order_idx" ON "commission_tiers"("deleted_at", "is_active", "sort_order");

-- CreateIndex
CREATE INDEX "commission_tiers_order_volume_threshold_deleted_at_idx" ON "commission_tiers"("order_volume_threshold", "deleted_at");

-- CreateIndex
CREATE INDEX "provider_payout_methods_provider_id_deleted_at_idx" ON "provider_payout_methods"("provider_id", "deleted_at");

-- CreateIndex
CREATE INDEX "provider_payout_methods_provider_id_is_default_idx" ON "provider_payout_methods"("provider_id", "is_default");

-- CreateIndex
CREATE INDEX "provider_payout_methods_provider_id_verification_status_idx" ON "provider_payout_methods"("provider_id", "verification_status");

-- CreateIndex
CREATE INDEX "provider_earnings_ledger_provider_id_status_created_at_idx" ON "provider_earnings_ledger"("provider_id", "status", "created_at");

-- CreateIndex
CREATE INDEX "provider_earnings_ledger_provider_id_type_created_at_idx" ON "provider_earnings_ledger"("provider_id", "type", "created_at");

-- CreateIndex
CREATE INDEX "provider_earnings_ledger_payout_id_idx" ON "provider_earnings_ledger"("payout_id");

-- CreateIndex
CREATE UNIQUE INDEX "provider_earnings_ledger_provider_order_id_type_key" ON "provider_earnings_ledger"("provider_order_id", "type");

-- CreateIndex
CREATE UNIQUE INDEX "provider_payouts_transaction_id_key" ON "provider_payouts"("transaction_id");

-- CreateIndex
CREATE UNIQUE INDEX "provider_payouts_idempotency_key_key" ON "provider_payouts"("idempotency_key");

-- CreateIndex
CREATE INDEX "provider_payouts_provider_id_status_created_at_idx" ON "provider_payouts"("provider_id", "status", "created_at");

-- CreateIndex
CREATE INDEX "provider_payouts_payout_method_id_idx" ON "provider_payouts"("payout_method_id");

-- CreateIndex
CREATE UNIQUE INDEX "provider_dispute_resolutions_dispute_id_key" ON "provider_dispute_resolutions"("dispute_id");

-- CreateIndex
CREATE INDEX "provider_dispute_resolutions_finalized_by_id_finalized_at_idx" ON "provider_dispute_resolutions"("finalized_by_id", "finalized_at");

-- CreateIndex
CREATE INDEX "provider_dispute_financial_logs_dispute_id_created_at_idx" ON "provider_dispute_financial_logs"("dispute_id", "created_at");

-- CreateIndex
CREATE INDEX "provider_dispute_communication_logs_dispute_id_created_at_idx" ON "provider_dispute_communication_logs"("dispute_id", "created_at");

-- CreateIndex
CREATE INDEX "auth_sessions_user_id_revoked_at_idx" ON "auth_sessions"("user_id", "revoked_at");

-- CreateIndex
CREATE UNIQUE INDEX "subscription_plans_slug_key" ON "subscription_plans"("slug");

-- CreateIndex
CREATE INDEX "subscription_plans_status_visibility_idx" ON "subscription_plans"("status", "visibility");

-- CreateIndex
CREATE INDEX "subscription_plans_deleted_at_idx" ON "subscription_plans"("deleted_at");

-- CreateIndex
CREATE UNIQUE INDEX "plan_feature_catalog_key_key" ON "plan_feature_catalog"("key");

-- CreateIndex
CREATE INDEX "plan_feature_catalog_is_active_sort_order_idx" ON "plan_feature_catalog"("is_active", "sort_order");

-- CreateIndex
CREATE INDEX "plan_feature_catalog_deleted_at_idx" ON "plan_feature_catalog"("deleted_at");

-- CreateIndex
CREATE UNIQUE INDEX "uploaded_files_storage_key_key" ON "uploaded_files"("storage_key");

-- CreateIndex
CREATE INDEX "uploaded_files_owner_id_status_idx" ON "uploaded_files"("owner_id", "status");

-- CreateIndex
CREATE INDEX "uploaded_files_target_account_id_idx" ON "uploaded_files"("target_account_id");

-- CreateIndex
CREATE INDEX "uploaded_files_gift_id_idx" ON "uploaded_files"("gift_id");

-- CreateIndex
CREATE INDEX "uploaded_files_folder_created_at_idx" ON "uploaded_files"("folder", "created_at");

-- CreateIndex
CREATE INDEX "uploaded_files_deleted_at_idx" ON "uploaded_files"("deleted_at");

-- CreateIndex
CREATE INDEX "media_upload_policies_updated_by_id_idx" ON "media_upload_policies"("updated_by_id");

-- CreateIndex
CREATE UNIQUE INDEX "coupons_code_key" ON "coupons"("code");

-- CreateIndex
CREATE INDEX "coupons_is_active_expires_at_idx" ON "coupons"("is_active", "expires_at");

-- CreateIndex
CREATE INDEX "coupons_deleted_at_idx" ON "coupons"("deleted_at");

-- CreateIndex
CREATE UNIQUE INDEX "admin_roles_slug_key" ON "admin_roles"("slug");

-- CreateIndex
CREATE INDEX "admin_roles_is_active_is_system_idx" ON "admin_roles"("is_active", "is_system");

-- CreateIndex
CREATE UNIQUE INDEX "admin_audit_logs_log_reference_key" ON "admin_audit_logs"("log_reference");

-- CreateIndex
CREATE INDEX "admin_audit_logs_actor_id_created_at_idx" ON "admin_audit_logs"("actor_id", "created_at");

-- CreateIndex
CREATE INDEX "admin_audit_logs_target_id_created_at_idx" ON "admin_audit_logs"("target_id", "created_at");

-- CreateIndex
CREATE INDEX "admin_audit_logs_target_type_created_at_idx" ON "admin_audit_logs"("target_type", "created_at");

-- CreateIndex
CREATE INDEX "admin_audit_logs_action_created_at_idx" ON "admin_audit_logs"("action", "created_at");

-- CreateIndex
CREATE INDEX "admin_audit_logs_status_created_at_idx" ON "admin_audit_logs"("status", "created_at");

-- CreateIndex
CREATE INDEX "admin_audit_logs_module_created_at_idx" ON "admin_audit_logs"("module", "created_at");

-- CreateIndex
CREATE INDEX "account_suspensions_account_id_is_active_idx" ON "account_suspensions"("account_id", "is_active");

-- CreateIndex
CREATE INDEX "account_suspensions_account_type_is_active_idx" ON "account_suspensions"("account_type", "is_active");

-- CreateIndex
CREATE INDEX "account_suspensions_suspended_by_suspended_at_idx" ON "account_suspensions"("suspended_by", "suspended_at");

-- CreateIndex
CREATE INDEX "login_attempts_email_created_at_idx" ON "login_attempts"("email", "created_at");

-- CreateIndex
CREATE INDEX "login_attempts_status_created_at_idx" ON "login_attempts"("status", "created_at");

-- CreateIndex
CREATE INDEX "login_attempts_user_id_created_at_idx" ON "login_attempts"("user_id", "created_at");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_admin_role_id_fkey" FOREIGN KEY ("admin_role_id") REFERENCES "admin_roles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_provider_business_category_id_fkey" FOREIGN KEY ("provider_business_category_id") REFERENCES "provider_business_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "referrals" ADD CONSTRAINT "referrals_referrer_user_id_fkey" FOREIGN KEY ("referrer_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "referrals" ADD CONSTRAINT "referrals_referred_user_id_fkey" FOREIGN KEY ("referred_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "referral_settings" ADD CONSTRAINT "referral_settings_updated_by_id_fkey" FOREIGN KEY ("updated_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "refund_policy_settings" ADD CONSTRAINT "refund_policy_settings_updated_by_id_fkey" FOREIGN KEY ("updated_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reward_ledgers" ADD CONSTRAINT "reward_ledgers_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customer_wallets" ADD CONSTRAINT "customer_wallets_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customer_wallet_ledgers" ADD CONSTRAINT "customer_wallet_ledgers_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customer_wallet_ledgers" ADD CONSTRAINT "customer_wallet_ledgers_wallet_id_fkey" FOREIGN KEY ("wallet_id") REFERENCES "customer_wallets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customer_bank_accounts" ADD CONSTRAINT "customer_bank_accounts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customer_events" ADD CONSTRAINT "customer_events_recipient_id_fkey" FOREIGN KEY ("recipient_id") REFERENCES "customer_contacts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customer_event_reminder_jobs" ADD CONSTRAINT "customer_event_reminder_jobs_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "customer_events"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cart_items" ADD CONSTRAINT "cart_items_cart_id_fkey" FOREIGN KEY ("cart_id") REFERENCES "carts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cart_items" ADD CONSTRAINT "cart_items_gift_id_fkey" FOREIGN KEY ("gift_id") REFERENCES "gifts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cart_items" ADD CONSTRAINT "cart_items_variant_id_fkey" FOREIGN KEY ("variant_id") REFERENCES "gift_variants"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_money_gift_id_fkey" FOREIGN KEY ("money_gift_id") REFERENCES "money_gifts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_customer_subscription_id_fkey" FOREIGN KEY ("customer_subscription_id") REFERENCES "customer_subscriptions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customer_subscriptions" ADD CONSTRAINT "customer_subscriptions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customer_subscriptions" ADD CONSTRAINT "customer_subscriptions_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "subscription_plans"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customer_subscriptions" ADD CONSTRAINT "customer_subscriptions_coupon_id_fkey" FOREIGN KEY ("coupon_id") REFERENCES "coupons"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customer_subscription_invoices" ADD CONSTRAINT "customer_subscription_invoices_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customer_subscription_invoices" ADD CONSTRAINT "customer_subscription_invoices_customer_subscription_id_fkey" FOREIGN KEY ("customer_subscription_id") REFERENCES "customer_subscriptions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_gift_id_fkey" FOREIGN KEY ("gift_id") REFERENCES "gifts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_variant_id_fkey" FOREIGN KEY ("variant_id") REFERENCES "gift_variants"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "provider_orders" ADD CONSTRAINT "provider_orders_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "provider_orders" ADD CONSTRAINT "provider_orders_provider_id_fkey" FOREIGN KEY ("provider_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "provider_order_items" ADD CONSTRAINT "provider_order_items_provider_order_id_fkey" FOREIGN KEY ("provider_order_id") REFERENCES "provider_orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "provider_order_items" ADD CONSTRAINT "provider_order_items_order_item_id_fkey" FOREIGN KEY ("order_item_id") REFERENCES "order_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "provider_order_timelines" ADD CONSTRAINT "provider_order_timelines_provider_order_id_fkey" FOREIGN KEY ("provider_order_id") REFERENCES "provider_orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "provider_order_timelines" ADD CONSTRAINT "provider_order_timelines_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "provider_order_checklists" ADD CONSTRAINT "provider_order_checklists_provider_order_id_fkey" FOREIGN KEY ("provider_order_id") REFERENCES "provider_orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "refund_requests" ADD CONSTRAINT "refund_requests_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "refund_requests" ADD CONSTRAINT "refund_requests_provider_order_id_fkey" FOREIGN KEY ("provider_order_id") REFERENCES "provider_orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "refund_requests" ADD CONSTRAINT "refund_requests_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "refund_requests" ADD CONSTRAINT "refund_requests_provider_id_fkey" FOREIGN KEY ("provider_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "refund_requests" ADD CONSTRAINT "refund_requests_payment_id_fkey" FOREIGN KEY ("payment_id") REFERENCES "payments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_messages" ADD CONSTRAINT "order_messages_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_messages" ADD CONSTRAINT "order_messages_provider_order_id_fkey" FOREIGN KEY ("provider_order_id") REFERENCES "provider_orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_messages" ADD CONSTRAINT "order_messages_sender_id_fkey" FOREIGN KEY ("sender_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_messages" ADD CONSTRAINT "order_messages_recipient_id_fkey" FOREIGN KEY ("recipient_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "money_gifts" ADD CONSTRAINT "money_gifts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "money_gifts" ADD CONSTRAINT "money_gifts_recipient_contact_id_fkey" FOREIGN KEY ("recipient_contact_id") REFERENCES "customer_contacts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customer_recurring_payments" ADD CONSTRAINT "customer_recurring_payments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customer_recurring_payments" ADD CONSTRAINT "customer_recurring_payments_recipient_contact_id_fkey" FOREIGN KEY ("recipient_contact_id") REFERENCES "customer_contacts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customer_recurring_payment_occurrences" ADD CONSTRAINT "customer_recurring_payment_occurrences_recurring_payment_i_fkey" FOREIGN KEY ("recurring_payment_id") REFERENCES "customer_recurring_payments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customer_recurring_payment_occurrences" ADD CONSTRAINT "customer_recurring_payment_occurrences_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customer_recurring_payment_occurrences" ADD CONSTRAINT "customer_recurring_payment_occurrences_payment_id_fkey" FOREIGN KEY ("payment_id") REFERENCES "payments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customer_recurring_payment_occurrences" ADD CONSTRAINT "customer_recurring_payment_occurrences_money_gift_id_fkey" FOREIGN KEY ("money_gift_id") REFERENCES "money_gifts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customer_payment_methods" ADD CONSTRAINT "customer_payment_methods_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "promotional_offers" ADD CONSTRAINT "promotional_offers_provider_id_fkey" FOREIGN KEY ("provider_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "promotional_offers" ADD CONSTRAINT "promotional_offers_item_id_fkey" FOREIGN KEY ("item_id") REFERENCES "gifts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "promotional_offers" ADD CONSTRAINT "promotional_offers_approved_by_fkey" FOREIGN KEY ("approved_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "promotional_offers" ADD CONSTRAINT "promotional_offers_rejected_by_fkey" FOREIGN KEY ("rejected_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gifts" ADD CONSTRAINT "gifts_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "gift_categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gifts" ADD CONSTRAINT "gifts_provider_id_fkey" FOREIGN KEY ("provider_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gifts" ADD CONSTRAINT "gifts_approved_by_fkey" FOREIGN KEY ("approved_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gifts" ADD CONSTRAINT "gifts_rejected_by_fkey" FOREIGN KEY ("rejected_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gifts" ADD CONSTRAINT "gifts_flagged_by_fkey" FOREIGN KEY ("flagged_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gift_variants" ADD CONSTRAINT "gift_variants_gift_id_fkey" FOREIGN KEY ("gift_id") REFERENCES "gifts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "broadcasts" ADD CONSTRAINT "broadcasts_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "broadcasts" ADD CONSTRAINT "broadcasts_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "broadcasts" ADD CONSTRAINT "broadcasts_cancelled_by_fkey" FOREIGN KEY ("cancelled_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "broadcast_deliveries" ADD CONSTRAINT "broadcast_deliveries_broadcast_id_fkey" FOREIGN KEY ("broadcast_id") REFERENCES "broadcasts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_recipient_id_fkey" FOREIGN KEY ("recipient_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_broadcast_id_fkey" FOREIGN KEY ("broadcast_id") REFERENCES "broadcasts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification_delivery_logs" ADD CONSTRAINT "notification_delivery_logs_notification_id_fkey" FOREIGN KEY ("notification_id") REFERENCES "notifications"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification_device_tokens" ADD CONSTRAINT "notification_device_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification_preferences" ADD CONSTRAINT "notification_preferences_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_provider_order_id_fkey" FOREIGN KEY ("provider_order_id") REFERENCES "provider_orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_provider_id_fkey" FOREIGN KEY ("provider_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "review_responses" ADD CONSTRAINT "review_responses_review_id_fkey" FOREIGN KEY ("review_id") REFERENCES "reviews"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "review_responses" ADD CONSTRAINT "review_responses_provider_id_fkey" FOREIGN KEY ("provider_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "review_moderation_logs" ADD CONSTRAINT "review_moderation_logs_review_id_fkey" FOREIGN KEY ("review_id") REFERENCES "reviews"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "review_moderation_logs" ADD CONSTRAINT "review_moderation_logs_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "review_policies" ADD CONSTRAINT "review_policies_updated_by_id_fkey" FOREIGN KEY ("updated_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_threads" ADD CONSTRAINT "chat_threads_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_threads" ADD CONSTRAINT "chat_threads_provider_order_id_fkey" FOREIGN KEY ("provider_order_id") REFERENCES "provider_orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_threads" ADD CONSTRAINT "chat_threads_provider_id_fkey" FOREIGN KEY ("provider_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_threads" ADD CONSTRAINT "chat_threads_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_threads" ADD CONSTRAINT "chat_threads_assigned_admin_id_fkey" FOREIGN KEY ("assigned_admin_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_threads" ADD CONSTRAINT "chat_threads_resolved_by_id_fkey" FOREIGN KEY ("resolved_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_threads" ADD CONSTRAINT "chat_threads_last_message_id_fkey" FOREIGN KEY ("last_message_id") REFERENCES "chat_messages"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_thread_id_fkey" FOREIGN KEY ("thread_id") REFERENCES "chat_threads"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_sender_id_fkey" FOREIGN KEY ("sender_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_participants" ADD CONSTRAINT "chat_participants_thread_id_fkey" FOREIGN KEY ("thread_id") REFERENCES "chat_threads"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_participants" ADD CONSTRAINT "chat_participants_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_message_read_receipts" ADD CONSTRAINT "chat_message_read_receipts_thread_id_fkey" FOREIGN KEY ("thread_id") REFERENCES "chat_threads"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_message_read_receipts" ADD CONSTRAINT "chat_message_read_receipts_message_id_fkey" FOREIGN KEY ("message_id") REFERENCES "chat_messages"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_message_read_receipts" ADD CONSTRAINT "chat_message_read_receipts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_attachments" ADD CONSTRAINT "chat_attachments_thread_id_fkey" FOREIGN KEY ("thread_id") REFERENCES "chat_threads"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_attachments" ADD CONSTRAINT "chat_attachments_message_id_fkey" FOREIGN KEY ("message_id") REFERENCES "chat_messages"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_audit_logs" ADD CONSTRAINT "chat_audit_logs_thread_id_fkey" FOREIGN KEY ("thread_id") REFERENCES "chat_threads"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_audit_logs" ADD CONSTRAINT "chat_audit_logs_message_id_fkey" FOREIGN KEY ("message_id") REFERENCES "chat_messages"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_audit_logs" ADD CONSTRAINT "chat_audit_logs_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "message_moderation_escalations" ADD CONSTRAINT "message_moderation_escalations_case_id_fkey" FOREIGN KEY ("case_id") REFERENCES "message_moderation_cases"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "message_moderation_logs" ADD CONSTRAINT "message_moderation_logs_case_id_fkey" FOREIGN KEY ("case_id") REFERENCES "message_moderation_cases"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "provider_reports" ADD CONSTRAINT "provider_reports_reporter_user_id_fkey" FOREIGN KEY ("reporter_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "provider_reports" ADD CONSTRAINT "provider_reports_provider_id_fkey" FOREIGN KEY ("provider_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "provider_reports" ADD CONSTRAINT "provider_reports_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "provider_reports" ADD CONSTRAINT "provider_reports_reviewed_by_id_fkey" FOREIGN KEY ("reviewed_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_safety_reports" ADD CONSTRAINT "user_safety_reports_reporter_user_id_fkey" FOREIGN KEY ("reporter_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_safety_reports" ADD CONSTRAINT "user_safety_reports_reported_user_id_fkey" FOREIGN KEY ("reported_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_safety_reports" ADD CONSTRAINT "user_safety_reports_reviewed_by_id_fkey" FOREIGN KEY ("reviewed_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_blocks" ADD CONSTRAINT "user_blocks_blocker_user_id_fkey" FOREIGN KEY ("blocker_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_blocks" ADD CONSTRAINT "user_blocks_blocked_user_id_fkey" FOREIGN KEY ("blocked_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_safety_moderation_logs" ADD CONSTRAINT "user_safety_moderation_logs_report_id_fkey" FOREIGN KEY ("report_id") REFERENCES "user_safety_reports"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_safety_moderation_logs" ADD CONSTRAINT "user_safety_moderation_logs_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "social_posts" ADD CONSTRAINT "social_posts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "social_reports" ADD CONSTRAINT "social_reports_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "social_posts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "social_reports" ADD CONSTRAINT "social_reports_reported_by_id_fkey" FOREIGN KEY ("reported_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "social_moderation_logs" ADD CONSTRAINT "social_moderation_logs_social_report_id_fkey" FOREIGN KEY ("social_report_id") REFERENCES "social_reports"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "social_moderation_logs" ADD CONSTRAINT "social_moderation_logs_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "social_posts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "social_moderation_logs" ADD CONSTRAINT "social_moderation_logs_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_warnings" ADD CONSTRAINT "user_warnings_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_warnings" ADD CONSTRAINT "user_warnings_social_report_id_fkey" FOREIGN KEY ("social_report_id") REFERENCES "social_reports"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_warnings" ADD CONSTRAINT "user_warnings_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "social_posts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_warnings" ADD CONSTRAINT "user_warnings_issued_by_id_fkey" FOREIGN KEY ("issued_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dispute_cases" ADD CONSTRAINT "dispute_cases_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dispute_cases" ADD CONSTRAINT "dispute_cases_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dispute_cases" ADD CONSTRAINT "dispute_cases_payment_id_fkey" FOREIGN KEY ("payment_id") REFERENCES "payments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dispute_cases" ADD CONSTRAINT "dispute_cases_provider_id_fkey" FOREIGN KEY ("provider_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dispute_cases" ADD CONSTRAINT "dispute_cases_assigned_to_id_fkey" FOREIGN KEY ("assigned_to_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dispute_cases" ADD CONSTRAINT "dispute_cases_linked_by_id_fkey" FOREIGN KEY ("linked_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dispute_evidence" ADD CONSTRAINT "dispute_evidence_dispute_id_fkey" FOREIGN KEY ("dispute_id") REFERENCES "dispute_cases"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dispute_evidence" ADD CONSTRAINT "dispute_evidence_uploaded_by_id_fkey" FOREIGN KEY ("uploaded_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dispute_notes" ADD CONSTRAINT "dispute_notes_dispute_id_fkey" FOREIGN KEY ("dispute_id") REFERENCES "dispute_cases"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dispute_notes" ADD CONSTRAINT "dispute_notes_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dispute_timelines" ADD CONSTRAINT "dispute_timelines_dispute_id_fkey" FOREIGN KEY ("dispute_id") REFERENCES "dispute_cases"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dispute_timelines" ADD CONSTRAINT "dispute_timelines_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "provider_dispute_cases" ADD CONSTRAINT "provider_dispute_cases_provider_id_fkey" FOREIGN KEY ("provider_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "provider_dispute_cases" ADD CONSTRAINT "provider_dispute_cases_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "provider_dispute_cases" ADD CONSTRAINT "provider_dispute_cases_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "provider_dispute_cases" ADD CONSTRAINT "provider_dispute_cases_provider_order_id_fkey" FOREIGN KEY ("provider_order_id") REFERENCES "provider_orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "provider_dispute_cases" ADD CONSTRAINT "provider_dispute_cases_payment_id_fkey" FOREIGN KEY ("payment_id") REFERENCES "payments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "provider_dispute_cases" ADD CONSTRAINT "provider_dispute_cases_assigned_to_id_fkey" FOREIGN KEY ("assigned_to_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "provider_dispute_cases" ADD CONSTRAINT "provider_dispute_cases_final_attested_by_id_fkey" FOREIGN KEY ("final_attested_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "provider_dispute_evidence" ADD CONSTRAINT "provider_dispute_evidence_dispute_id_fkey" FOREIGN KEY ("dispute_id") REFERENCES "provider_dispute_cases"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "provider_dispute_evidence" ADD CONSTRAINT "provider_dispute_evidence_submitted_by_id_fkey" FOREIGN KEY ("submitted_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "provider_dispute_notes" ADD CONSTRAINT "provider_dispute_notes_dispute_id_fkey" FOREIGN KEY ("dispute_id") REFERENCES "provider_dispute_cases"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "provider_dispute_notes" ADD CONSTRAINT "provider_dispute_notes_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "provider_dispute_timelines" ADD CONSTRAINT "provider_dispute_timelines_dispute_id_fkey" FOREIGN KEY ("dispute_id") REFERENCES "provider_dispute_cases"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "provider_dispute_timelines" ADD CONSTRAINT "provider_dispute_timelines_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "provider_financial_adjustments" ADD CONSTRAINT "provider_financial_adjustments_provider_id_fkey" FOREIGN KEY ("provider_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "provider_financial_adjustments" ADD CONSTRAINT "provider_financial_adjustments_dispute_id_fkey" FOREIGN KEY ("dispute_id") REFERENCES "provider_dispute_cases"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "provider_financial_adjustments" ADD CONSTRAINT "provider_financial_adjustments_provider_order_id_fkey" FOREIGN KEY ("provider_order_id") REFERENCES "provider_orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "provider_financial_adjustments" ADD CONSTRAINT "provider_financial_adjustments_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "system_settings" ADD CONSTRAINT "system_settings_updated_by_id_fkey" FOREIGN KEY ("updated_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "guest_access_settings" ADD CONSTRAINT "guest_access_settings_updated_by_id_fkey" FOREIGN KEY ("updated_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messaging_settings" ADD CONSTRAINT "messaging_settings_updated_by_id_fkey" FOREIGN KEY ("updated_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "admin_payout_settings" ADD CONSTRAINT "admin_payout_settings_updated_by_id_fkey" FOREIGN KEY ("updated_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "commission_tiers" ADD CONSTRAINT "commission_tiers_updated_by_id_fkey" FOREIGN KEY ("updated_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "provider_payout_methods" ADD CONSTRAINT "provider_payout_methods_provider_id_fkey" FOREIGN KEY ("provider_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "provider_earnings_ledger" ADD CONSTRAINT "provider_earnings_ledger_provider_id_fkey" FOREIGN KEY ("provider_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "provider_earnings_ledger" ADD CONSTRAINT "provider_earnings_ledger_provider_order_id_fkey" FOREIGN KEY ("provider_order_id") REFERENCES "provider_orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "provider_earnings_ledger" ADD CONSTRAINT "provider_earnings_ledger_payout_id_fkey" FOREIGN KEY ("payout_id") REFERENCES "provider_payouts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "provider_payouts" ADD CONSTRAINT "provider_payouts_provider_id_fkey" FOREIGN KEY ("provider_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "provider_payouts" ADD CONSTRAINT "provider_payouts_payout_method_id_fkey" FOREIGN KEY ("payout_method_id") REFERENCES "provider_payout_methods"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "provider_dispute_resolutions" ADD CONSTRAINT "provider_dispute_resolutions_dispute_id_fkey" FOREIGN KEY ("dispute_id") REFERENCES "provider_dispute_cases"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "provider_dispute_resolutions" ADD CONSTRAINT "provider_dispute_resolutions_finalized_by_id_fkey" FOREIGN KEY ("finalized_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "provider_dispute_financial_logs" ADD CONSTRAINT "provider_dispute_financial_logs_dispute_id_fkey" FOREIGN KEY ("dispute_id") REFERENCES "provider_dispute_cases"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "provider_dispute_communication_logs" ADD CONSTRAINT "provider_dispute_communication_logs_dispute_id_fkey" FOREIGN KEY ("dispute_id") REFERENCES "provider_dispute_cases"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "auth_sessions" ADD CONSTRAINT "auth_sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscription_plans" ADD CONSTRAINT "subscription_plans_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscription_plans" ADD CONSTRAINT "subscription_plans_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "uploaded_files" ADD CONSTRAINT "uploaded_files_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "media_upload_policies" ADD CONSTRAINT "media_upload_policies_updated_by_id_fkey" FOREIGN KEY ("updated_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "coupons" ADD CONSTRAINT "coupons_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "coupons" ADD CONSTRAINT "coupons_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "admin_audit_logs" ADD CONSTRAINT "admin_audit_logs_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "account_suspensions" ADD CONSTRAINT "account_suspensions_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "account_suspensions" ADD CONSTRAINT "account_suspensions_suspended_by_fkey" FOREIGN KEY ("suspended_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "account_suspensions" ADD CONSTRAINT "account_suspensions_unsuspended_by_fkey" FOREIGN KEY ("unsuspended_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "login_attempts" ADD CONSTRAINT "login_attempts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

