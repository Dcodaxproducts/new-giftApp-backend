import { OpenAPIObject } from '@nestjs/swagger';

export interface SwaggerAccessRule {
  allowedRoles: string;
  description: string;
}

export const SWAGGER_ACCESS_RULES: Record<string, SwaggerAccessRule> = {
  'GET /api/v1/staff-roles': { allowedRoles: 'SUPER_ADMIN', description: 'SUPER_ADMIN only. Only SUPER_ADMIN can manage staff roles and permissions.' },
  'POST /api/v1/staff-roles': { allowedRoles: 'SUPER_ADMIN', description: 'SUPER_ADMIN only. STAFF users cannot create roles.' },
  'GET /api/v1/staff-roles/{id}': { allowedRoles: 'SUPER_ADMIN', description: 'SUPER_ADMIN only. STAFF users cannot view role details.' },
  'PATCH /api/v1/staff-roles/{id}': { allowedRoles: 'SUPER_ADMIN', description: 'SUPER_ADMIN only. STAFF users cannot update roles.' },
  'DELETE /api/v1/staff-roles/{id}': { allowedRoles: 'SUPER_ADMIN', description: 'SUPER_ADMIN only. STAFF users cannot delete roles.' },
  'PATCH /api/v1/staff-roles/{id}/permissions': { allowedRoles: 'SUPER_ADMIN', description: 'SUPER_ADMIN only. STAFF users cannot update role permissions.' },

  'GET /api/v1/staff': { allowedRoles: 'SUPER_ADMIN', description: 'SUPER_ADMIN only. Staff management is controlled by Super Admin only.' },
  'POST /api/v1/staff': { allowedRoles: 'SUPER_ADMIN', description: 'SUPER_ADMIN only. Creates STAFF users only.' },
  'GET /api/v1/staff/{id}': { allowedRoles: 'SUPER_ADMIN', description: 'SUPER_ADMIN only. Fetches STAFF details.' },
  'PATCH /api/v1/staff/{id}': { allowedRoles: 'SUPER_ADMIN', description: 'SUPER_ADMIN only. Updates STAFF account details.' },
  'DELETE /api/v1/staff/{id}': { allowedRoles: 'SUPER_ADMIN', description: 'SUPER_ADMIN only. Permanently deletes a STAFF account.' },
  'PATCH /api/v1/staff/{id}/password': { allowedRoles: 'SUPER_ADMIN', description: 'SUPER_ADMIN only. Changes STAFF password from dashboard.' },

  'GET /api/v1/users/export': { allowedRoles: 'SUPER_ADMIN or ADMIN with users.export', description: 'SUPER_ADMIN or ADMIN with users.export permission.' },
  'GET /api/v1/users': { allowedRoles: 'SUPER_ADMIN or ADMIN with users.read', description: 'SUPER_ADMIN or ADMIN with users.read permission.' },
  'GET /api/v1/users/{id}': { allowedRoles: 'SUPER_ADMIN or ADMIN with users.read', description: 'SUPER_ADMIN or ADMIN with users.read permission.' },
  'PATCH /api/v1/users/{id}': { allowedRoles: 'SUPER_ADMIN or ADMIN with users.update', description: 'SUPER_ADMIN or ADMIN with users.update permission.' },
  'DELETE /api/v1/users/{id}': { allowedRoles: 'SUPER_ADMIN', description: 'SUPER_ADMIN only. Permanent delete danger-zone endpoint.' },
  'PATCH /api/v1/users/{id}/status': { allowedRoles: 'SUPER_ADMIN or ADMIN with user lifecycle permission (UPDATE_STATUS/DISABLE/ENABLE=>users.status.update, SUSPEND=>users.suspend, UNSUSPEND=>users.unsuspend)', description: 'SUPER_ADMIN or ADMIN with action-specific user lifecycle permission. UPDATE_STATUS, DISABLE, and ENABLE require users.status.update; SUSPEND requires users.suspend; UNSUSPEND requires users.unsuspend.' },
  'POST /api/v1/users/{id}/reset-password': { allowedRoles: 'SUPER_ADMIN or ADMIN with users.resetPassword', description: 'SUPER_ADMIN or ADMIN with users.resetPassword permission.' },
  'GET /api/v1/users/{id}/activity': { allowedRoles: 'SUPER_ADMIN or ADMIN with users.read', description: 'SUPER_ADMIN or ADMIN with users.read permission.' },
  'GET /api/v1/users/{id}/stats': { allowedRoles: 'SUPER_ADMIN or ADMIN with users.read', description: 'SUPER_ADMIN or ADMIN with users.read permission.' },

  'GET /api/v1/providers/export': { allowedRoles: 'SUPER_ADMIN or ADMIN with providers.export', description: 'SUPER_ADMIN or ADMIN with providers.export permission.' },
  'GET /api/v1/providers/stats': { allowedRoles: 'SUPER_ADMIN or ADMIN with providers.read', description: 'SUPER_ADMIN or ADMIN with providers.read permission.' },
  'GET /api/v1/providers': { allowedRoles: 'SUPER_ADMIN or ADMIN with providers.read', description: 'SUPER_ADMIN or ADMIN with providers.read permission.' },
  'POST /api/v1/providers': { allowedRoles: 'SUPER_ADMIN or ADMIN with providers.create', description: 'SUPER_ADMIN or ADMIN with providers.create permission.' },
  'GET /api/v1/providers/lookup': { allowedRoles: 'SUPER_ADMIN or ADMIN with providers.read', description: 'SUPER_ADMIN or ADMIN with providers.read permission.' },
  'GET /api/v1/providers/{id}': { allowedRoles: 'SUPER_ADMIN or ADMIN with providers.read', description: 'SUPER_ADMIN or ADMIN with providers.read permission.' },
  'PATCH /api/v1/providers/{id}': { allowedRoles: 'SUPER_ADMIN or ADMIN with providers.update', description: 'SUPER_ADMIN or ADMIN with providers.update permission.' },
  'DELETE /api/v1/providers/{id}': { allowedRoles: 'SUPER_ADMIN', description: 'SUPER_ADMIN only. Permanent delete danger-zone endpoint.' },
  'PATCH /api/v1/providers/{id}/status': { allowedRoles: 'SUPER_ADMIN or ADMIN with provider lifecycle permission (APPROVE=>providers.approve, REJECT=>providers.reject, SUSPEND=>providers.suspend, UNSUSPEND=>providers.suspend, UPDATE_STATUS=>providers.updateStatus)', description: 'SUPER_ADMIN or ADMIN with lifecycle permission. APPROVE requires providers.approve; REJECT requires providers.reject; SUSPEND and UNSUSPEND require providers.suspend; UPDATE_STATUS requires providers.updateStatus.' },
  'GET /api/v1/providers/{id}/items': { allowedRoles: 'SUPER_ADMIN or ADMIN with providers.read', description: 'SUPER_ADMIN or ADMIN with providers.read permission.' },
  'GET /api/v1/providers/{id}/activity': { allowedRoles: 'SUPER_ADMIN or ADMIN with providers.read', description: 'SUPER_ADMIN or ADMIN with providers.read permission.' },
  'POST /api/v1/providers/{id}/message': { allowedRoles: 'SUPER_ADMIN or ADMIN with providers.message', description: 'SUPER_ADMIN or ADMIN with providers.message permission.' },


  'GET /api/v1/provider-business-categories': { allowedRoles: 'PUBLIC', description: 'PUBLIC. Lists provider business categories. By default returns all non-deleted categories. Use isActive=true or isActive=false to filter by active state.' },
  'GET /api/v1/provider-business-categories/lookup': { allowedRoles: 'PUBLIC', description: 'PUBLIC. Provider signup dropdown. Returns active provider business categories only.' },
  'POST /api/v1/provider-business-categories': { allowedRoles: 'SUPER_ADMIN or ADMIN with providerBusinessCategories.create', description: 'SUPER_ADMIN or ADMIN with providerBusinessCategories.create permission.' },
  'GET /api/v1/provider-business-categories/{id}': { allowedRoles: 'SUPER_ADMIN or ADMIN with providerBusinessCategories.read', description: 'SUPER_ADMIN or ADMIN with providerBusinessCategories.read permission.' },
  'PATCH /api/v1/provider-business-categories/{id}': { allowedRoles: 'SUPER_ADMIN or ADMIN with providerBusinessCategories.update', description: 'SUPER_ADMIN or ADMIN with providerBusinessCategories.update permission.' },
  'DELETE /api/v1/provider-business-categories/{id}': { allowedRoles: 'SUPER_ADMIN or ADMIN with providerBusinessCategories.delete', description: 'SUPER_ADMIN or ADMIN with providerBusinessCategories.delete permission.' },

  'POST /api/v1/gift-categories': { allowedRoles: 'SUPER_ADMIN or ADMIN with giftCategories.create', description: 'SUPER_ADMIN or ADMIN with giftCategories.create permission.' },
  'GET /api/v1/gift-categories': { allowedRoles: 'SUPER_ADMIN or ADMIN with giftCategories.read', description: 'SUPER_ADMIN or ADMIN with giftCategories.read permission.' },
  'GET /api/v1/gift-categories/stats': { allowedRoles: 'SUPER_ADMIN or ADMIN with giftCategories.read', description: 'SUPER_ADMIN or ADMIN with giftCategories.read permission.' },
  'GET /api/v1/gift-categories/{id}': { allowedRoles: 'SUPER_ADMIN or ADMIN with giftCategories.read', description: 'SUPER_ADMIN or ADMIN with giftCategories.read permission.' },
  'PATCH /api/v1/gift-categories/{id}': { allowedRoles: 'SUPER_ADMIN or ADMIN with giftCategories.update', description: 'SUPER_ADMIN or ADMIN with giftCategories.update permission.' },
  'DELETE /api/v1/gift-categories/{id}': { allowedRoles: 'SUPER_ADMIN or ADMIN with giftCategories.delete', description: 'SUPER_ADMIN or ADMIN with giftCategories.delete permission.' },
  'GET /api/v1/gift-categories/lookup': { allowedRoles: 'PUBLIC', description: 'PUBLIC. Active gift category lookup.' },

  'GET /api/v1/customer/home': { allowedRoles: 'REGISTERED_USER', description: 'REGISTERED_USER only. Returns personalized marketplace fields such as wishlist state, default address, and upcoming reminders where applicable.' },
  'GET /api/v1/customer/categories': { allowedRoles: 'REGISTERED_USER', description: 'REGISTERED_USER only. Lists customer-visible marketplace categories.' },
  'GET /api/v1/customer/gifts': { allowedRoles: 'REGISTERED_USER', description: 'REGISTERED_USER only. Gift cards include customer wishlist state.' },
  'GET /api/v1/customer/gifts/discounted': { allowedRoles: 'REGISTERED_USER', description: 'REGISTERED_USER only. Discounted gift cards include customer wishlist state.' },
  'GET /api/v1/customer/gifts/filter-options': { allowedRoles: 'REGISTERED_USER', description: 'REGISTERED_USER only. Returns available marketplace filters.' },
  'GET /api/v1/customer/gifts/{id}': { allowedRoles: 'REGISTERED_USER', description: 'REGISTERED_USER only. Gift details include customer wishlist state.' },

  'POST /api/v1/gifts': { allowedRoles: 'SUPER_ADMIN, PROVIDER, or ADMIN with gifts.create', description: 'SUPER_ADMIN and ADMIN with gifts.create create ACTIVE gifts. PROVIDER creates own gifts as INACTIVE.' },
  'GET /api/v1/gifts': { allowedRoles: 'SUPER_ADMIN or ADMIN with gifts.read', description: 'SUPER_ADMIN or ADMIN with gifts.read permission.' },
  'GET /api/v1/gifts/stats': { allowedRoles: 'SUPER_ADMIN or ADMIN with gifts.read', description: 'SUPER_ADMIN or ADMIN with gifts.read permission.' },
  'GET /api/v1/gifts/export': { allowedRoles: 'SUPER_ADMIN or ADMIN with gifts.export', description: 'SUPER_ADMIN or ADMIN with gifts.export permission.' },
  'GET /api/v1/gifts/{id}': { allowedRoles: 'SUPER_ADMIN or ADMIN with gifts.read', description: 'SUPER_ADMIN or ADMIN with gifts.read permission.' },
  'PATCH /api/v1/gifts/{id}': { allowedRoles: 'SUPER_ADMIN or ADMIN with gift-specific update permission', description: 'SUPER_ADMIN or ADMIN with gifts.update for standard gift fields and gifts.status.update for operational status changes.' },
  'DELETE /api/v1/gifts/{id}': { allowedRoles: 'SUPER_ADMIN or ADMIN with gifts.delete', description: 'SUPER_ADMIN or ADMIN with gifts.delete permission.' },


  'POST /api/v1/broadcasts': { allowedRoles: 'SUPER_ADMIN or ADMIN with broadcasts.create', description: 'SUPER_ADMIN or ADMIN with broadcasts.create permission.' },


  'GET /api/v1/promotional-offers/stats': { allowedRoles: 'SUPER_ADMIN or ADMIN with promotionalOffers.read', description: 'SUPER_ADMIN or ADMIN with promotionalOffers.read permission.' },
  'GET /api/v1/promotional-offers/export': { allowedRoles: 'SUPER_ADMIN or ADMIN with promotionalOffers.export', description: 'SUPER_ADMIN or ADMIN with promotionalOffers.export permission.' },
  'GET /api/v1/promotional-offers': { allowedRoles: 'SUPER_ADMIN or ADMIN with promotionalOffers.read', description: 'SUPER_ADMIN or ADMIN with promotionalOffers.read permission.' },
  'POST /api/v1/promotional-offers': { allowedRoles: 'SUPER_ADMIN or ADMIN with promotionalOffers.create', description: 'SUPER_ADMIN or ADMIN with promotionalOffers.create permission.' },
  'GET /api/v1/promotional-offers/{id}': { allowedRoles: 'SUPER_ADMIN or ADMIN with promotionalOffers.read', description: 'SUPER_ADMIN or ADMIN with promotionalOffers.read permission.' },
  'PATCH /api/v1/promotional-offers/{id}': { allowedRoles: 'SUPER_ADMIN or ADMIN with promotionalOffers.update', description: 'SUPER_ADMIN or ADMIN with promotionalOffers.update permission.' },
  'DELETE /api/v1/promotional-offers/{id}': { allowedRoles: 'SUPER_ADMIN or ADMIN with promotionalOffers.delete', description: 'SUPER_ADMIN or ADMIN with promotionalOffers.delete permission.' },
  'POST /api/v1/promotional-offers/{id}/action': { allowedRoles: 'SUPER_ADMIN or ADMIN with promotional offer action permission (APPROVE=>promotionalOffers.approve, REJECT=>promotionalOffers.reject, ACTIVATE/DEACTIVATE=>promotionalOffers.status.update)', description: 'SUPER_ADMIN or ADMIN with action-specific promotional offer permission. APPROVE requires promotionalOffers.approve; REJECT requires promotionalOffers.reject; ACTIVATE and DEACTIVATE require promotionalOffers.status.update.' },


  'GET /api/v1/admin/reviews': { allowedRoles: 'SUPER_ADMIN or ADMIN with reviews.read', description: 'SUPER_ADMIN or ADMIN with reviews.read permission.' },
  'GET /api/v1/admin/reviews/dashboard': { allowedRoles: 'SUPER_ADMIN or ADMIN with reviews.read', description: 'SUPER_ADMIN or ADMIN with reviews.read permission.' },
  'GET /api/v1/admin/reviews/stats': { allowedRoles: 'SUPER_ADMIN or ADMIN with reviews.read', description: 'SUPER_ADMIN or ADMIN with reviews.read permission.' },
  'GET /api/v1/admin/reviews/export': { allowedRoles: 'SUPER_ADMIN or ADMIN with reviews.export', description: 'SUPER_ADMIN or ADMIN with reviews.export permission.' },
  'GET /api/v1/admin/reviews/{id}': { allowedRoles: 'SUPER_ADMIN or ADMIN with reviews.read', description: 'SUPER_ADMIN or ADMIN with reviews.read permission.' },
  'GET /api/v1/admin/reviews/flagged-summary': { allowedRoles: 'SUPER_ADMIN or ADMIN with reviews.read', description: 'SUPER_ADMIN or ADMIN with reviews.read permission.' },
  'GET /api/v1/admin/reviews/moderation-queue': { allowedRoles: 'SUPER_ADMIN or ADMIN with reviews.moderate', description: 'SUPER_ADMIN or ADMIN with reviews.moderate permission.' },
  'POST /api/v1/admin/reviews/{id}/moderate': { allowedRoles: 'SUPER_ADMIN or ADMIN with reviews.moderate', description: 'SUPER_ADMIN or ADMIN with reviews.moderate permission.' },
  'GET /api/v1/admin/review-policies': { allowedRoles: 'SUPER_ADMIN or ADMIN with reviewPolicies.read', description: 'SUPER_ADMIN or ADMIN with reviewPolicies.read permission.' },
  'PATCH /api/v1/admin/review-policies': { allowedRoles: 'SUPER_ADMIN or ADMIN with reviewPolicies.update', description: 'SUPER_ADMIN or ADMIN with reviewPolicies.update permission.' },
  'POST /api/v1/admin/review-policies/test': { allowedRoles: 'SUPER_ADMIN or ADMIN with reviewPolicies.read', description: 'SUPER_ADMIN or ADMIN with reviewPolicies.read permission.' },

  'GET /api/v1/admin/message-moderation/conversations': { allowedRoles: 'SUPER_ADMIN or ADMIN with messageModeration.read', description: 'SUPER_ADMIN or ADMIN with messageModeration.read permission. Harmful message previews are redacted.' },
  'GET /api/v1/admin/message-moderation/conversations/{id}': { allowedRoles: 'SUPER_ADMIN or ADMIN with messageModeration.read', description: 'SUPER_ADMIN or ADMIN with messageModeration.read permission. Flagged body is null by default; redactedBody is returned.' },
  'GET /api/v1/admin/message-moderation/conversations/{id}/history': { allowedRoles: 'SUPER_ADMIN or ADMIN with messageModeration.read', description: 'SUPER_ADMIN or ADMIN with messageModeration.read permission.' },
  'GET /api/v1/admin/message-moderation/stats': { allowedRoles: 'SUPER_ADMIN or ADMIN with messageModeration.read', description: 'SUPER_ADMIN or ADMIN with messageModeration.read permission.' },
  'GET /api/v1/admin/message-moderation/filter-options': { allowedRoles: 'SUPER_ADMIN or ADMIN with messageModeration.read', description: 'SUPER_ADMIN or ADMIN with messageModeration.read permission.' },
  'GET /api/v1/admin/message-moderation/export': { allowedRoles: 'SUPER_ADMIN or ADMIN with messageModeration.export', description: 'SUPER_ADMIN or ADMIN with messageModeration.export permission. Export is redacted.' },
  'POST /api/v1/admin/message-moderation/messages/{messageId}/action': { allowedRoles: 'SUPER_ADMIN or ADMIN with message moderation action permission (HIDE_MESSAGE/RESTORE_MESSAGE/DISMISS_FLAG=>messageModeration.moderate, WARN_SENDER=>messageModeration.warn, SUSPEND_SENDER=>messageModeration.suspend, ADD_NOTE=>messageModeration.notes.create, REPROCESS=>messageModeration.reprocess, ESCALATE=>messageModeration.escalate)', description: 'SUPER_ADMIN or ADMIN with action-specific message moderation permission. HIDE_MESSAGE, RESTORE_MESSAGE, and DISMISS_FLAG require messageModeration.moderate; WARN_SENDER requires messageModeration.warn; SUSPEND_SENDER requires messageModeration.suspend; ADD_NOTE requires messageModeration.notes.create; REPROCESS requires messageModeration.reprocess; ESCALATE requires messageModeration.escalate.' },

  'GET /api/v1/admin/social-moderation/stats': { allowedRoles: 'SUPER_ADMIN or ADMIN with socialModeration.read', description: 'SUPER_ADMIN or ADMIN with socialModeration.read permission.' },
  'GET /api/v1/admin/social-moderation/export': { allowedRoles: 'SUPER_ADMIN or ADMIN with socialModeration.export', description: 'SUPER_ADMIN or ADMIN with socialModeration.export permission.' },
  'GET /api/v1/admin/social-moderation/reports': { allowedRoles: 'SUPER_ADMIN or ADMIN with socialModeration.read', description: 'SUPER_ADMIN or ADMIN with socialModeration.read permission.' },
  'GET /api/v1/admin/social-moderation/reports/{id}': { allowedRoles: 'SUPER_ADMIN or ADMIN with socialModeration.read', description: 'SUPER_ADMIN or ADMIN with socialModeration.read permission.' },
  'POST /api/v1/admin/social-moderation/reports/{id}/action': { allowedRoles: 'SUPER_ADMIN or ADMIN with socialModeration.moderate', description: 'SUPER_ADMIN or ADMIN with socialModeration.moderate permission.' },
  'GET /api/v1/admin/social-reporting-rules/stats': { allowedRoles: 'SUPER_ADMIN or ADMIN with socialReportingRules.read', description: 'SUPER_ADMIN or ADMIN with socialReportingRules.read permission.' },
  'GET /api/v1/admin/social-reporting-rules/export': { allowedRoles: 'SUPER_ADMIN or ADMIN with socialReportingRules.export', description: 'SUPER_ADMIN or ADMIN with socialReportingRules.export permission.' },
  'GET /api/v1/admin/social-reporting-rules': { allowedRoles: 'SUPER_ADMIN or ADMIN with socialReportingRules.read', description: 'SUPER_ADMIN or ADMIN with socialReportingRules.read permission.' },
  'POST /api/v1/admin/social-reporting-rules': { allowedRoles: 'SUPER_ADMIN or ADMIN with socialReportingRules.create', description: 'SUPER_ADMIN or ADMIN with socialReportingRules.create permission.' },
  'GET /api/v1/admin/social-reporting-rules/{id}': { allowedRoles: 'SUPER_ADMIN or ADMIN with socialReportingRules.read', description: 'SUPER_ADMIN or ADMIN with socialReportingRules.read permission.' },
  'PATCH /api/v1/admin/social-reporting-rules/{id}': { allowedRoles: 'SUPER_ADMIN or ADMIN with socialReportingRules.update', description: 'SUPER_ADMIN or ADMIN with socialReportingRules.update permission.' },
  'DELETE /api/v1/admin/social-reporting-rules/{id}': { allowedRoles: 'SUPER_ADMIN or ADMIN with socialReportingRules.delete', description: 'SUPER_ADMIN or ADMIN with socialReportingRules.delete permission.' },

  'GET /api/v1/admin/dashboard': { allowedRoles: 'SUPER_ADMIN or ADMIN with dashboard.read', description: 'SUPER_ADMIN or ADMIN with dashboard.read permission. Read-only merged dashboard overview, trends, gift/payment distribution, provider performance, and recent disputes.' },

  'GET /api/v1/admin/platform-analytics/stats': { allowedRoles: 'SUPER_ADMIN or ADMIN with analytics.read', description: 'SUPER_ADMIN or ADMIN with analytics.read permission. Uses real payment/subscription/user records.' },
  'GET /api/v1/admin/platform-analytics/revenue-transactions': { allowedRoles: 'SUPER_ADMIN or ADMIN with analytics.read', description: 'SUPER_ADMIN or ADMIN with analytics.read permission. Card/payment secrets are not returned.' },
  'GET /api/v1/admin/platform-analytics/report': { allowedRoles: 'SUPER_ADMIN or ADMIN with analytics.export', description: 'SUPER_ADMIN or ADMIN with analytics.export permission. Export excludes payment/card/bank secrets.' },

  'GET /api/v1/admin/system-health/stats': { allowedRoles: 'SUPER_ADMIN or ADMIN with systemHealth.read', description: 'SUPER_ADMIN or ADMIN with systemHealth.read permission. Runtime server resource and API reliability cards.' },
  'GET /api/v1/admin/system-health/latency-graph': { allowedRoles: 'SUPER_ADMIN or ADMIN with systemHealth.read', description: 'SUPER_ADMIN or ADMIN with systemHealth.read permission. Supports DAILY, WEEKLY, and MONTHLY graph ranges.' },

  'GET /api/v1/chats': { allowedRoles: 'REGISTERED_USER, PROVIDER, SUPER_ADMIN, or ADMIN with chat/support permission', description: 'Role-aware thread listing. Customers/providers see own order/support threads; SUPER_ADMIN sees support threads; ADMIN is scoped by supportChats.read/read.all or moderation chat permissions.' },
  'GET /api/v1/chats/quick-replies': { allowedRoles: 'REGISTERED_USER, PROVIDER, SUPER_ADMIN, or ADMIN', description: 'Role-aware quick replies.' },
  'POST /api/v1/chats/threads': { allowedRoles: 'REGISTERED_USER, PROVIDER, SUPER_ADMIN, or ADMIN with supportChats.reply/messageModeration permission', description: 'Create or get an order/support/moderation chat thread based on role and sourceType.' },
  'GET /api/v1/chats/threads/{threadId}': { allowedRoles: 'REGISTERED_USER, PROVIDER, SUPER_ADMIN, or ADMIN with chat/support permission', description: 'Fetch a thread only when the authenticated role can access it.' },
  'GET /api/v1/chats/threads/{threadId}/messages': { allowedRoles: 'REGISTERED_USER, PROVIDER, SUPER_ADMIN, or ADMIN with chat/support permission', description: 'Fetch messages only for accessible threads.' },
  'POST /api/v1/chats/threads/{threadId}/messages': { allowedRoles: 'REGISTERED_USER, PROVIDER, SUPER_ADMIN, or ADMIN with supportChats.reply', description: 'Send a message in an accessible order/support thread.' },
  'PATCH /api/v1/chats/threads/{threadId}/read': { allowedRoles: 'REGISTERED_USER, PROVIDER, SUPER_ADMIN, or ADMIN with supportChats.read', description: 'Mark an accessible thread as read for the authenticated participant/admin.' },
  'PATCH /api/v1/chats/threads/{threadId}/status': { allowedRoles: 'REGISTERED_USER, PROVIDER, SUPER_ADMIN, or ADMIN with status-specific chat permission', description: 'Unified chat thread lifecycle endpoint. Support thread RESOLVED/REOPENED requires supportChats.resolve; BLOCKED_BY_MODERATION requires messageModeration.moderate or chats.moderate.' },
  'GET /api/v1/chats/threads/{threadId}/audit-log': { allowedRoles: 'SUPER_ADMIN or ADMIN with supportChats.read', description: 'Fetch audit trail for an accessible support/moderation thread.' },

  'GET /api/v1/admin/system-settings': { allowedRoles: 'SUPER_ADMIN or ADMIN with systemSettings.read', description: 'SUPER_ADMIN or ADMIN with systemSettings.read permission. SMTP secrets are never returned.' },
  'PATCH /api/v1/admin/system-settings': { allowedRoles: 'SUPER_ADMIN or ADMIN with systemSettings.update', description: 'SUPER_ADMIN or ADMIN with systemSettings.update permission.' },
  'GET /api/v1/admin/messaging-settings': { allowedRoles: 'SUPER_ADMIN or ADMIN with messagingSettings.read', description: 'SUPER_ADMIN or ADMIN with messagingSettings.read permission.' },
  'PATCH /api/v1/admin/messaging-settings': { allowedRoles: 'SUPER_ADMIN or ADMIN with messagingSettings.update', description: 'SUPER_ADMIN or ADMIN with messagingSettings.update permission. Settings apply to future messages only.' },
  'GET /api/v1/admin/messaging-settings/audit-logs': { allowedRoles: 'SUPER_ADMIN or ADMIN with messagingSettings.read', description: 'SUPER_ADMIN or ADMIN with messagingSettings.read permission.' },

  'GET /api/v1/admin/provider-payouts/stats': { allowedRoles: 'SUPER_ADMIN or ADMIN with providerPayouts.read', description: 'SUPER_ADMIN or ADMIN with providerPayouts.read permission.' },
  'GET /api/v1/admin/provider-payouts/trends': { allowedRoles: 'SUPER_ADMIN or ADMIN with providerPayouts.read', description: 'SUPER_ADMIN or ADMIN with providerPayouts.read permission.' },
  'GET /api/v1/admin/provider-payouts/earning-distribution': { allowedRoles: 'SUPER_ADMIN or ADMIN with providerPayouts.read', description: 'SUPER_ADMIN or ADMIN with providerPayouts.read permission.' },
  'GET /api/v1/admin/provider-payouts/{id}/breakdown': { allowedRoles: 'SUPER_ADMIN or ADMIN with providerPayouts.read', description: 'SUPER_ADMIN or ADMIN with providerPayouts.read permission.' },
  'POST /api/v1/admin/provider-payouts/{id}/action': { allowedRoles: 'SUPER_ADMIN or ADMIN with action-specific providerPayouts permission', description: 'APPROVE requires providerPayouts.approve, HOLD requires providerPayouts.hold, REJECT requires providerPayouts.reject.' },
  'POST /api/v1/admin/provider-payouts/bulk-action': { allowedRoles: 'SUPER_ADMIN or ADMIN with providerPayouts.approve', description: 'SUPER_ADMIN or ADMIN with providerPayouts.approve permission. APPROVE is currently the only enabled bulk action and returns per-item idempotent results.' },
  'GET /api/v1/admin/provider-payouts/export': { allowedRoles: 'SUPER_ADMIN or ADMIN with providerPayouts.export', description: 'SUPER_ADMIN or ADMIN with providerPayouts.export permission. Uses list filters and excludes full bank account numbers.' },
  'GET /api/v1/admin/provider-payouts': { allowedRoles: 'SUPER_ADMIN or ADMIN with providerPayouts.read', description: 'SUPER_ADMIN or ADMIN with providerPayouts.read permission.' },
  'GET /api/v1/admin/provider-payouts/{id}': { allowedRoles: 'SUPER_ADMIN or ADMIN with providerPayouts.read', description: 'SUPER_ADMIN or ADMIN with providerPayouts.read permission. Payout destination is masked.' },

  'GET /api/v1/admin/payout-settings': { allowedRoles: 'SUPER_ADMIN or ADMIN with payoutSettings.read', description: 'SUPER_ADMIN or ADMIN with payoutSettings.read permission.' },
  'PATCH /api/v1/admin/payout-settings': { allowedRoles: 'SUPER_ADMIN or ADMIN with payoutSettings.update', description: 'SUPER_ADMIN or ADMIN with payoutSettings.update permission. Applies to future payout calculations only.' },
  'GET /api/v1/admin/payout-settings/commission-tiers': { allowedRoles: 'SUPER_ADMIN or ADMIN with payoutSettings.read', description: 'SUPER_ADMIN or ADMIN with payoutSettings.read permission.' },
  'POST /api/v1/admin/payout-settings/commission-tiers': { allowedRoles: 'SUPER_ADMIN or ADMIN with payoutSettings.update', description: 'SUPER_ADMIN or ADMIN with payoutSettings.update permission.' },
  'PATCH /api/v1/admin/payout-settings/commission-tiers/{id}': { allowedRoles: 'SUPER_ADMIN or ADMIN with payoutSettings.update', description: 'SUPER_ADMIN or ADMIN with payoutSettings.update permission. Applies next billing/payout cycle.' },
  'DELETE /api/v1/admin/payout-settings/commission-tiers/{id}': { allowedRoles: 'SUPER_ADMIN or ADMIN with payoutSettings.update', description: 'SUPER_ADMIN or ADMIN with payoutSettings.update permission. Permanently deletes the tier record.' },
  'GET /api/v1/admin/payout-settings/audit-logs': { allowedRoles: 'SUPER_ADMIN or ADMIN with payoutSettings.read', description: 'SUPER_ADMIN or ADMIN with payoutSettings.read permission.' },

  'GET /api/v1/admin/transactions/stats': { allowedRoles: 'SUPER_ADMIN or ADMIN with transactions.read', description: 'SUPER_ADMIN or ADMIN with transactions.read permission.' },
  'GET /api/v1/admin/transactions/export': { allowedRoles: 'SUPER_ADMIN or ADMIN with transactions.export', description: 'SUPER_ADMIN or ADMIN with transactions.export permission. Excludes card and payment secrets.' },
  'GET /api/v1/admin/transactions': { allowedRoles: 'SUPER_ADMIN or ADMIN with transactions.read', description: 'SUPER_ADMIN or ADMIN with transactions.read permission.' },
  'GET /api/v1/admin/transactions/{id}': { allowedRoles: 'SUPER_ADMIN or ADMIN with transactions.read', description: 'SUPER_ADMIN or ADMIN with transactions.read permission. Card/payment secrets are masked.' },
  'GET /api/v1/admin/transactions/{id}/timeline': { allowedRoles: 'SUPER_ADMIN or ADMIN with transactions.read', description: 'SUPER_ADMIN or ADMIN with transactions.read permission.' },
  'GET /api/v1/admin/transactions/{id}/receipt': { allowedRoles: 'SUPER_ADMIN or ADMIN with transactions.receipt.download', description: 'SUPER_ADMIN or ADMIN with transactions.receipt.download permission.' },
  'POST /api/v1/admin/transactions/{id}/action': { allowedRoles: 'SUPER_ADMIN or ADMIN with transaction action permission (REFUND=>transactions.refund, OPEN_DISPUTE=>transactions.openDispute, NOTIFY_USER=>transactions.notifyUser)', description: 'SUPER_ADMIN or ADMIN with action-specific transaction permission. Refund amount is server-validated, duplicate open disputes are blocked, and notifications use NotificationDispatchService.' },

  'GET /api/v1/subscription-plans': { allowedRoles: 'SUPER_ADMIN or ADMIN with subscriptionPlans.read', description: 'SUPER_ADMIN or ADMIN with subscriptionPlans.read permission.' },
  'POST /api/v1/subscription-plans': { allowedRoles: 'SUPER_ADMIN or ADMIN with subscriptionPlans.create', description: 'SUPER_ADMIN or ADMIN with subscriptionPlans.create permission.' },
  'GET /api/v1/subscription-plans/stats': { allowedRoles: 'SUPER_ADMIN or ADMIN with subscriptionPlans.analytics.read', description: 'SUPER_ADMIN or ADMIN with subscriptionPlans.analytics.read permission.' },
  'GET /api/v1/subscription-plans/{id}': { allowedRoles: 'SUPER_ADMIN or ADMIN with subscriptionPlans.read', description: 'SUPER_ADMIN or ADMIN with subscriptionPlans.read permission.' },
  'PATCH /api/v1/subscription-plans/{id}': { allowedRoles: 'SUPER_ADMIN or ADMIN with subscriptionPlans.update, subscriptionPlans.status.update, or subscriptionPlans.visibility.update depending on changed fields', description: 'Normal plan fields require subscriptionPlans.update; status requires subscriptionPlans.status.update or subscriptionPlans.update; visibility/isVisible requires subscriptionPlans.visibility.update or subscriptionPlans.update.' },
  'DELETE /api/v1/subscription-plans/{id}': { allowedRoles: 'SUPER_ADMIN or ADMIN with subscriptionPlans.delete', description: 'SUPER_ADMIN or ADMIN with subscriptionPlans.delete permission.' },
  'GET /api/v1/subscription-plans/{id}/analytics': { allowedRoles: 'SUPER_ADMIN or ADMIN with subscriptionPlans.analytics.read', description: 'SUPER_ADMIN or ADMIN with subscriptionPlans.analytics.read permission.' },

  'GET /api/v1/plan-features/catalog': { allowedRoles: 'SUPER_ADMIN or ADMIN with planFeatures.read', description: 'SUPER_ADMIN or ADMIN with planFeatures.read permission.' },
  'GET /api/v1/plan-features': { allowedRoles: 'SUPER_ADMIN or ADMIN with planFeatures.read', description: 'SUPER_ADMIN or ADMIN with planFeatures.read permission.' },
  'POST /api/v1/plan-features': { allowedRoles: 'SUPER_ADMIN or ADMIN with planFeatures.create', description: 'SUPER_ADMIN or ADMIN with planFeatures.create permission.' },
  'GET /api/v1/plan-features/{id}': { allowedRoles: 'SUPER_ADMIN or ADMIN with planFeatures.read', description: 'SUPER_ADMIN or ADMIN with planFeatures.read permission.' },
  'PATCH /api/v1/plan-features/{id}': { allowedRoles: 'SUPER_ADMIN or ADMIN with planFeatures.update', description: 'SUPER_ADMIN or ADMIN with planFeatures.update permission.' },
  'DELETE /api/v1/plan-features/{id}': { allowedRoles: 'SUPER_ADMIN or ADMIN with planFeatures.delete', description: 'SUPER_ADMIN or ADMIN with planFeatures.delete permission.' },

  'GET /api/v1/coupons': { allowedRoles: 'SUPER_ADMIN or ADMIN with coupons.read', description: 'SUPER_ADMIN or ADMIN with coupons.read permission.' },
  'POST /api/v1/coupons': { allowedRoles: 'SUPER_ADMIN or ADMIN with coupons.create', description: 'SUPER_ADMIN or ADMIN with coupons.create permission.' },
  'GET /api/v1/coupons/{id}': { allowedRoles: 'SUPER_ADMIN or ADMIN with coupons.read', description: 'SUPER_ADMIN or ADMIN with coupons.read permission.' },
  'PATCH /api/v1/coupons/{id}': { allowedRoles: 'SUPER_ADMIN or ADMIN with coupon-specific update permission', description: 'SUPER_ADMIN or ADMIN with coupon-specific permissions. Standard coupon fields require coupons.update; status or isActive changes require coupons.status.update; mixed payloads require both permissions.' },
  'DELETE /api/v1/coupons/{id}': { allowedRoles: 'SUPER_ADMIN or ADMIN with coupons.delete', description: 'SUPER_ADMIN or ADMIN with coupons.delete permission.' },


  'GET /api/v1/admin/disputes/stats': { allowedRoles: 'SUPER_ADMIN or ADMIN with disputes.read', description: 'SUPER_ADMIN or ADMIN with disputes.read permission.' },
  'GET /api/v1/admin/disputes': { allowedRoles: 'SUPER_ADMIN or ADMIN with disputes.read', description: 'SUPER_ADMIN or ADMIN with disputes.read permission.' },
  'POST /api/v1/admin/disputes': { allowedRoles: 'SUPER_ADMIN or ADMIN with disputes.create', description: 'SUPER_ADMIN or ADMIN with disputes.create permission.' },
  'GET /api/v1/admin/disputes/{id}': { allowedRoles: 'SUPER_ADMIN or ADMIN with disputes.read', description: 'SUPER_ADMIN or ADMIN with disputes.read permission.' },
  'PATCH /api/v1/admin/disputes/{id}/review': { allowedRoles: 'SUPER_ADMIN or ADMIN with disputes.review', description: 'SUPER_ADMIN or ADMIN with disputes.review permission.' },

  'GET /api/v1/provider/reviews/summary': { allowedRoles: 'PROVIDER', description: 'PROVIDER only. Provider can access only own reviews.' },
  'GET /api/v1/provider/reviews/filter-options': { allowedRoles: 'PROVIDER', description: 'PROVIDER only.' },
  'GET /api/v1/provider/reviews': { allowedRoles: 'PROVIDER', description: 'PROVIDER only. Provider can access only own reviews.' },
  'GET /api/v1/provider/reviews/{id}': { allowedRoles: 'PROVIDER', description: 'PROVIDER only. Provider can access only own reviews.' },
  'POST /api/v1/provider/reviews/{id}/response': { allowedRoles: 'PROVIDER', description: 'PROVIDER only. Provider can respond only to own reviews.' },
  'PATCH /api/v1/provider/reviews/{id}/response': { allowedRoles: 'PROVIDER', description: 'PROVIDER only. Provider can update only own review responses.' },
  'DELETE /api/v1/provider/reviews/{id}/response': { allowedRoles: 'PROVIDER', description: 'PROVIDER only. Provider can delete only own review responses.' },

  'GET /api/v1/uploads': { allowedRoles: 'SUPER_ADMIN, ADMIN, PROVIDER, or REGISTERED_USER', description: 'REGISTERED_USER/PROVIDER list only own uploads; ownerId is ignored. ADMIN lists own uploads by default and may use ownerId only for authorized managed access. SUPER_ADMIN may inspect by ownerId.' },
  'GET /api/v1/uploads/{id}': { allowedRoles: 'SUPER_ADMIN, ADMIN, PROVIDER, or REGISTERED_USER', description: 'REGISTERED_USER/PROVIDER can fetch only own uploads. ADMIN defaults to own uploads. SUPER_ADMIN may inspect uploads.' },
  'DELETE /api/v1/uploads/{id}': { allowedRoles: 'SUPER_ADMIN, ADMIN, PROVIDER, or REGISTERED_USER', description: 'REGISTERED_USER/PROVIDER can delete only own uploads. ADMIN defaults to own uploads. SUPER_ADMIN may delete inspected uploads.' },
  'POST /api/v1/uploads/presigned-url': { allowedRoles: 'SUPER_ADMIN, ADMIN, PROVIDER, or REGISTERED_USER', description: 'Backend derives ownerId/ownerRole from JWT. targetAccountId is forbidden for REGISTERED_USER and PROVIDER, admin-only when authorized, and allowed for SUPER_ADMIN.' },
  'POST /api/v1/uploads/complete': { allowedRoles: 'SUPER_ADMIN, ADMIN, PROVIDER, or REGISTERED_USER', description: 'Completes only uploads accessible to the authenticated account.' },

  'GET /api/v1/audit-logs/stats': { allowedRoles: 'SUPER_ADMIN', description: 'SUPER_ADMIN only. System log summary cards are restricted to Super Admin.' },
  'GET /api/v1/audit-logs': { allowedRoles: 'SUPER_ADMIN', description: 'SUPER_ADMIN only. Audit logs are restricted to Super Admin.' },
  'GET /api/v1/audit-logs/export': { allowedRoles: 'SUPER_ADMIN', description: 'SUPER_ADMIN only. Audit log export is restricted to Super Admin.' },
  'GET /api/v1/audit-logs/{id}': { allowedRoles: 'SUPER_ADMIN', description: 'SUPER_ADMIN only. Audit log details are restricted to Super Admin.' },

  'GET /api/v1/referral-settings': { allowedRoles: 'SUPER_ADMIN or ADMIN with referralSettings.read', description: 'SUPER_ADMIN or ADMIN with referralSettings.read permission.' },
  'GET /api/v1/referral-settings/stats': { allowedRoles: 'SUPER_ADMIN or ADMIN with referralSettings.read', description: 'SUPER_ADMIN or ADMIN with referralSettings.read permission.' },
  'PATCH /api/v1/referral-settings': { allowedRoles: 'SUPER_ADMIN', description: 'SUPER_ADMIN only. Changes apply to future referral snapshots.' },
  'PATCH /api/v1/referral-settings/status': { allowedRoles: 'SUPER_ADMIN', description: 'SUPER_ADMIN only. isActive=true activates the referral program; isActive=false deactivates it.' },
  'GET /api/v1/referral-settings/audit-logs': { allowedRoles: 'SUPER_ADMIN', description: 'SUPER_ADMIN only. Referral settings audit logs.' },
  'GET /api/v1/admin/refund-policy-settings': { allowedRoles: 'SUPER_ADMIN or ADMIN with refundPolicies.read', description: 'SUPER_ADMIN or ADMIN with refundPolicies.read permission. Settings feed refund eligibility, cancellation deduction tiers, dispute, and provider refund workflows.' },
  'PATCH /api/v1/admin/refund-policy-settings': { allowedRoles: 'SUPER_ADMIN', description: 'SUPER_ADMIN only. Updates global refund policy settings used by customer refund request eligibility, provider refund handling, cancellation deduction tiers, and admin/provider dispute workflows.' },

  'GET /api/v1/admin/seasonal-themes': { allowedRoles: 'SUPER_ADMIN or ADMIN with seasonalThemes.read', description: 'SUPER_ADMIN or ADMIN with seasonalThemes.read permission.' },
  'POST /api/v1/admin/seasonal-themes': { allowedRoles: 'SUPER_ADMIN or ADMIN with seasonalThemes.create', description: 'SUPER_ADMIN or ADMIN with seasonalThemes.create permission. imageUrl must reference a completed seasonal-theme-assets upload.' },
  'GET /api/v1/admin/seasonal-themes/{id}': { allowedRoles: 'SUPER_ADMIN or ADMIN with seasonalThemes.read', description: 'SUPER_ADMIN or ADMIN with seasonalThemes.read permission.' },
  'PATCH /api/v1/admin/seasonal-themes/{id}': { allowedRoles: 'SUPER_ADMIN or ADMIN with seasonalThemes.update', description: 'SUPER_ADMIN or ADMIN with seasonalThemes.update permission. Active date ranges cannot overlap.' },
  'DELETE /api/v1/admin/seasonal-themes/{id}': { allowedRoles: 'SUPER_ADMIN or ADMIN with seasonalThemes.delete', description: 'SUPER_ADMIN or ADMIN with seasonalThemes.delete permission.' },
  'GET /api/v1/seasonal-themes/active': { allowedRoles: 'PUBLIC', description: 'PUBLIC. Returns the single active seasonal theme for the current date or null.' },
};

const providerPrefixes = ['/api/v1/provider/business-info', '/api/v1/provider/earnings', '/api/v1/provider/inventory', '/api/v1/provider/offers', '/api/v1/provider/orders', '/api/v1/provider/payout-methods', '/api/v1/provider/payouts', '/api/v1/provider/refund-requests', '/api/v1/provider/reviews', '/api/v1/provider/support'];
const customerPrefixes = ['/api/v1/customer/'];
const allAccountPrefixes = ['/api/v1/notifications', '/api/v1/uploads'];

export function getSwaggerAccessRule(method: string, path: string): SwaggerAccessRule | undefined {
  const key = `${method.toUpperCase()} ${path}`;
  const explicit = SWAGGER_ACCESS_RULES[key];
  if (explicit) return explicit;

  if (providerPrefixes.some((prefix) => path === prefix || path.startsWith(`${prefix}/`))) {
    return {
      allowedRoles: 'PROVIDER',
      description: 'PROVIDER only. providerId is derived from JWT; provider can access only own inventory, offers, orders, analytics, and messages.',
    };
  }

  if (customerPrefixes.some((prefix) => path.startsWith(prefix))) {
    return {
      allowedRoles: 'REGISTERED_USER',
      description: 'REGISTERED_USER only. Endpoint is scoped to the authenticated customer account.',
    };
  }

  if (allAccountPrefixes.some((prefix) => path === prefix || path.startsWith(`${prefix}/`))) {
    return {
      allowedRoles: 'SUPER_ADMIN, ADMIN, PROVIDER, or REGISTERED_USER',
      description: 'SUPER_ADMIN, ADMIN, PROVIDER, or REGISTERED_USER. Access is scoped to the authenticated account.',
    };
  }

  return undefined;
}


export function applySwaggerAccessMetadata(document: OpenAPIObject): void {
  for (const [path, pathItem] of Object.entries(document.paths)) {
    for (const method of ['get', 'post', 'put', 'patch', 'delete'] as const) {
      const operation = pathItem?.[method];
      if (!operation) continue;

      const rule = getSwaggerAccessRule(method, path) ?? {
        allowedRoles: operation.security ? 'Authenticated' : 'PUBLIC',
        description: operation.security ? 'Authenticated JWT required.' : '',
      };

      const operationWithExtensions = operation as unknown as { 'x-allowed-roles'?: string; 'x-access'?: string; security?: unknown; description?: string };
      operationWithExtensions['x-allowed-roles'] = rule.allowedRoles;
      operationWithExtensions['x-access'] = rule.allowedRoles;

      if (rule.allowedRoles === 'PUBLIC') {
        delete operationWithExtensions.security;
      }

      const currentDescription = operationWithExtensions.description?.trim();
      const accessDescription = `Access: ${rule.allowedRoles}.`;
      const ruleDetail = deduplicateAccessText(rule.description, rule.allowedRoles);
      const currentDetail = currentDescription ? deduplicateAccessText(currentDescription, rule.allowedRoles) : undefined;
      const ruleDescription = ruleDetail ? `${accessDescription} ${ruleDetail}` : accessDescription;
      operationWithExtensions.description = currentDescription && currentDescription.includes(accessDescription)
        ? currentDescription
        : currentDetail
          ? `${ruleDescription} ${currentDetail}`
          : ruleDescription;
    }
  }
}

function deduplicateAccessText(description: string | undefined, allowedRoles: string): string {
  if (!description) return '';
  let result = description.trim();
  const prefixes = [
    `Access: ${allowedRoles}.`,
    `${allowedRoles}.`,
  ];
  for (const prefix of prefixes) {
    while (result.startsWith(prefix)) {
      result = result.slice(prefix.length).trim();
    }
  }
  return result;
}
