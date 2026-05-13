import { OpenAPIObject } from '@nestjs/swagger';

export interface SwaggerAccessRule {
  allowedRoles: string;
  description: string;
}

export const SWAGGER_ACCESS_RULES: Record<string, SwaggerAccessRule> = {
  'GET /api/v1/admin-roles': { allowedRoles: 'SUPER_ADMIN', description: 'SUPER_ADMIN only. Only SUPER_ADMIN can manage staff roles and permissions.' },
  'POST /api/v1/admin-roles': { allowedRoles: 'SUPER_ADMIN', description: 'SUPER_ADMIN only. ADMIN staff cannot create roles.' },
  'GET /api/v1/admin-roles/{id}': { allowedRoles: 'SUPER_ADMIN', description: 'SUPER_ADMIN only. ADMIN staff cannot view role details.' },
  'PATCH /api/v1/admin-roles/{id}': { allowedRoles: 'SUPER_ADMIN', description: 'SUPER_ADMIN only. ADMIN staff cannot update roles.' },
  'DELETE /api/v1/admin-roles/{id}': { allowedRoles: 'SUPER_ADMIN', description: 'SUPER_ADMIN only. ADMIN staff cannot delete roles.' },
  'PATCH /api/v1/admin-roles/{id}/permissions': { allowedRoles: 'SUPER_ADMIN', description: 'SUPER_ADMIN only. ADMIN staff cannot update role permissions.' },
  'GET /api/v1/permissions/catalog': { allowedRoles: 'SUPER_ADMIN', description: 'SUPER_ADMIN only. Read-only backend permission catalog.' },

  'GET /api/v1/admins': { allowedRoles: 'SUPER_ADMIN', description: 'SUPER_ADMIN only. Admin staff management is controlled by Super Admin only.' },
  'POST /api/v1/admins': { allowedRoles: 'SUPER_ADMIN', description: 'SUPER_ADMIN only. Creates ADMIN staff users only.' },
  'GET /api/v1/admins/{id}': { allowedRoles: 'SUPER_ADMIN', description: 'SUPER_ADMIN only. Fetches ADMIN staff details.' },
  'PATCH /api/v1/admins/{id}': { allowedRoles: 'SUPER_ADMIN', description: 'SUPER_ADMIN only. Updates ADMIN staff account details.' },
  'DELETE /api/v1/admins/{id}': { allowedRoles: 'SUPER_ADMIN', description: 'SUPER_ADMIN only. Permanently deletes an ADMIN staff account.' },
  'PATCH /api/v1/admins/{id}/active-status': { allowedRoles: 'SUPER_ADMIN', description: 'SUPER_ADMIN only. Updates ADMIN staff active status.' },
  'PATCH /api/v1/admins/{id}/password': { allowedRoles: 'SUPER_ADMIN', description: 'SUPER_ADMIN only. Changes ADMIN staff password from dashboard.' },

  'GET /api/v1/users/export': { allowedRoles: 'SUPER_ADMIN or ADMIN with users.export', description: 'SUPER_ADMIN or ADMIN with users.export permission.' },
  'GET /api/v1/users': { allowedRoles: 'SUPER_ADMIN or ADMIN with users.read', description: 'SUPER_ADMIN or ADMIN with users.read permission.' },
  'GET /api/v1/users/{id}': { allowedRoles: 'SUPER_ADMIN or ADMIN with users.read', description: 'SUPER_ADMIN or ADMIN with users.read permission.' },
  'PATCH /api/v1/users/{id}': { allowedRoles: 'SUPER_ADMIN or ADMIN with users.update', description: 'SUPER_ADMIN or ADMIN with users.update permission.' },
  'DELETE /api/v1/users/{id}': { allowedRoles: 'SUPER_ADMIN', description: 'SUPER_ADMIN only. Permanent delete danger-zone endpoint.' },
  'PATCH /api/v1/users/{id}/status': { allowedRoles: 'SUPER_ADMIN or ADMIN with users.status.update', description: 'SUPER_ADMIN or ADMIN with users.status.update permission.' },
  'POST /api/v1/users/{id}/suspend': { allowedRoles: 'SUPER_ADMIN or ADMIN with users.suspend', description: 'SUPER_ADMIN or ADMIN with users.suspend permission.' },
  'POST /api/v1/users/{id}/unsuspend': { allowedRoles: 'SUPER_ADMIN or ADMIN with users.unsuspend', description: 'SUPER_ADMIN or ADMIN with users.unsuspend permission.' },
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


  'GET /api/v1/provider-business-categories': { allowedRoles: 'PUBLIC', description: 'PUBLIC. Active provider business category lookup for provider signup.' },
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

  'POST /api/v1/gifts': { allowedRoles: 'SUPER_ADMIN or ADMIN with gifts.create', description: 'SUPER_ADMIN or ADMIN with gifts.create permission.' },
  'GET /api/v1/gifts': { allowedRoles: 'SUPER_ADMIN or ADMIN with gifts.read', description: 'SUPER_ADMIN or ADMIN with gifts.read permission.' },
  'GET /api/v1/gifts/stats': { allowedRoles: 'SUPER_ADMIN or ADMIN with gifts.read', description: 'SUPER_ADMIN or ADMIN with gifts.read permission.' },
  'GET /api/v1/gifts/export': { allowedRoles: 'SUPER_ADMIN or ADMIN with gifts.export', description: 'SUPER_ADMIN or ADMIN with gifts.export permission.' },
  'GET /api/v1/gifts/{id}': { allowedRoles: 'SUPER_ADMIN or ADMIN with gifts.read', description: 'SUPER_ADMIN or ADMIN with gifts.read permission.' },
  'PATCH /api/v1/gifts/{id}': { allowedRoles: 'SUPER_ADMIN or ADMIN with gifts.update', description: 'SUPER_ADMIN or ADMIN with gifts.update permission.' },
  'DELETE /api/v1/gifts/{id}': { allowedRoles: 'SUPER_ADMIN or ADMIN with gifts.delete', description: 'SUPER_ADMIN or ADMIN with gifts.delete permission.' },
  'PATCH /api/v1/gifts/{id}/status': { allowedRoles: 'SUPER_ADMIN or ADMIN with gifts.status.update', description: 'SUPER_ADMIN or ADMIN with gifts.status.update permission.' },

  'GET /api/v1/gift-moderation': { allowedRoles: 'SUPER_ADMIN or ADMIN with giftModeration.read', description: 'SUPER_ADMIN or ADMIN with giftModeration.read permission.' },
  'PATCH /api/v1/gift-moderation/{id}/approve': { allowedRoles: 'SUPER_ADMIN or ADMIN with giftModeration.approve', description: 'SUPER_ADMIN or ADMIN with giftModeration.approve permission.' },
  'PATCH /api/v1/gift-moderation/{id}/reject': { allowedRoles: 'SUPER_ADMIN or ADMIN with giftModeration.reject', description: 'SUPER_ADMIN or ADMIN with giftModeration.reject permission.' },
  'PATCH /api/v1/gift-moderation/{id}/flag': { allowedRoles: 'SUPER_ADMIN or ADMIN with giftModeration.flag', description: 'SUPER_ADMIN or ADMIN with giftModeration.flag permission.' },

  'POST /api/v1/broadcasts': { allowedRoles: 'SUPER_ADMIN or ADMIN with broadcasts.create', description: 'SUPER_ADMIN or ADMIN with broadcasts.create permission.' },
  'GET /api/v1/broadcasts': { allowedRoles: 'SUPER_ADMIN or ADMIN with broadcasts.read', description: 'SUPER_ADMIN or ADMIN with broadcasts.read permission.' },
  'GET /api/v1/broadcasts/{id}': { allowedRoles: 'SUPER_ADMIN or ADMIN with broadcasts.read', description: 'SUPER_ADMIN or ADMIN with broadcasts.read permission.' },
  'PATCH /api/v1/broadcasts/{id}': { allowedRoles: 'SUPER_ADMIN or ADMIN with broadcasts.update', description: 'SUPER_ADMIN or ADMIN with broadcasts.update permission.' },
  'PATCH /api/v1/broadcasts/{id}/targeting': { allowedRoles: 'SUPER_ADMIN or ADMIN with broadcasts.update', description: 'SUPER_ADMIN or ADMIN with broadcasts.update permission.' },
  'POST /api/v1/broadcasts/estimate-reach': { allowedRoles: 'SUPER_ADMIN or ADMIN with broadcasts.read', description: 'SUPER_ADMIN or ADMIN with broadcasts.read permission.' },
  'PATCH /api/v1/broadcasts/{id}/schedule': { allowedRoles: 'SUPER_ADMIN or ADMIN with broadcasts.schedule', description: 'SUPER_ADMIN or ADMIN with broadcasts.schedule permission.' },
  'POST /api/v1/broadcasts/{id}/cancel': { allowedRoles: 'SUPER_ADMIN or ADMIN with broadcasts.cancel', description: 'SUPER_ADMIN or ADMIN with broadcasts.cancel permission.' },
  'GET /api/v1/broadcasts/{id}/report': { allowedRoles: 'SUPER_ADMIN or ADMIN with broadcasts.report.read', description: 'SUPER_ADMIN or ADMIN with broadcasts.report.read permission.' },
  'GET /api/v1/broadcasts/{id}/recipients': { allowedRoles: 'SUPER_ADMIN or ADMIN with broadcasts.report.read', description: 'SUPER_ADMIN or ADMIN with broadcasts.report.read permission.' },


  'GET /api/v1/promotional-offers/stats': { allowedRoles: 'SUPER_ADMIN or ADMIN with promotionalOffers.read', description: 'SUPER_ADMIN or ADMIN with promotionalOffers.read permission.' },
  'GET /api/v1/promotional-offers/export': { allowedRoles: 'SUPER_ADMIN or ADMIN with promotionalOffers.export', description: 'SUPER_ADMIN or ADMIN with promotionalOffers.export permission.' },
  'GET /api/v1/promotional-offers': { allowedRoles: 'SUPER_ADMIN or ADMIN with promotionalOffers.read', description: 'SUPER_ADMIN or ADMIN with promotionalOffers.read permission.' },
  'POST /api/v1/promotional-offers': { allowedRoles: 'SUPER_ADMIN or ADMIN with promotionalOffers.create', description: 'SUPER_ADMIN or ADMIN with promotionalOffers.create permission.' },
  'GET /api/v1/promotional-offers/{id}': { allowedRoles: 'SUPER_ADMIN or ADMIN with promotionalOffers.read', description: 'SUPER_ADMIN or ADMIN with promotionalOffers.read permission.' },
  'PATCH /api/v1/promotional-offers/{id}': { allowedRoles: 'SUPER_ADMIN or ADMIN with promotionalOffers.update', description: 'SUPER_ADMIN or ADMIN with promotionalOffers.update permission.' },
  'DELETE /api/v1/promotional-offers/{id}': { allowedRoles: 'SUPER_ADMIN or ADMIN with promotionalOffers.delete', description: 'SUPER_ADMIN or ADMIN with promotionalOffers.delete permission.' },
  'PATCH /api/v1/promotional-offers/{id}/approve': { allowedRoles: 'SUPER_ADMIN or ADMIN with promotionalOffers.approve', description: 'SUPER_ADMIN or ADMIN with promotionalOffers.approve permission.' },
  'PATCH /api/v1/promotional-offers/{id}/reject': { allowedRoles: 'SUPER_ADMIN or ADMIN with promotionalOffers.reject', description: 'SUPER_ADMIN or ADMIN with promotionalOffers.reject permission.' },
  'PATCH /api/v1/promotional-offers/{id}/status': { allowedRoles: 'SUPER_ADMIN or ADMIN with promotionalOffers.status.update', description: 'SUPER_ADMIN or ADMIN with promotionalOffers.status.update permission.' },

  'GET /api/v1/login-attempts/stats': { allowedRoles: 'SUPER_ADMIN or ADMIN with loginAttempts.read', description: 'SUPER_ADMIN or ADMIN with loginAttempts.read permission.' },
  'GET /api/v1/login-attempts/export': { allowedRoles: 'SUPER_ADMIN or ADMIN with loginAttempts.export', description: 'SUPER_ADMIN or ADMIN with loginAttempts.export permission.' },
  'GET /api/v1/login-attempts': { allowedRoles: 'SUPER_ADMIN or ADMIN with loginAttempts.read', description: 'SUPER_ADMIN or ADMIN with loginAttempts.read permission.' },

  'GET /api/v1/subscription-plans': { allowedRoles: 'SUPER_ADMIN or ADMIN with subscriptionPlans.read', description: 'SUPER_ADMIN or ADMIN with subscriptionPlans.read permission.' },
  'POST /api/v1/subscription-plans': { allowedRoles: 'SUPER_ADMIN or ADMIN with subscriptionPlans.create', description: 'SUPER_ADMIN or ADMIN with subscriptionPlans.create permission.' },
  'GET /api/v1/subscription-plans/stats': { allowedRoles: 'SUPER_ADMIN or ADMIN with subscriptionPlans.analytics.read', description: 'SUPER_ADMIN or ADMIN with subscriptionPlans.analytics.read permission.' },
  'GET /api/v1/subscription-plans/{id}': { allowedRoles: 'SUPER_ADMIN or ADMIN with subscriptionPlans.read', description: 'SUPER_ADMIN or ADMIN with subscriptionPlans.read permission.' },
  'PATCH /api/v1/subscription-plans/{id}': { allowedRoles: 'SUPER_ADMIN or ADMIN with subscriptionPlans.update', description: 'SUPER_ADMIN or ADMIN with subscriptionPlans.update permission.' },
  'DELETE /api/v1/subscription-plans/{id}': { allowedRoles: 'SUPER_ADMIN or ADMIN with subscriptionPlans.delete', description: 'SUPER_ADMIN or ADMIN with subscriptionPlans.delete permission.' },
  'PATCH /api/v1/subscription-plans/{id}/status': { allowedRoles: 'SUPER_ADMIN or ADMIN with subscriptionPlans.status.update', description: 'SUPER_ADMIN or ADMIN with subscriptionPlans.status.update permission.' },
  'PATCH /api/v1/subscription-plans/{id}/visibility': { allowedRoles: 'SUPER_ADMIN or ADMIN with subscriptionPlans.visibility.update', description: 'SUPER_ADMIN or ADMIN with subscriptionPlans.visibility.update permission.' },
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
  'PATCH /api/v1/coupons/{id}': { allowedRoles: 'SUPER_ADMIN or ADMIN with coupons.update', description: 'SUPER_ADMIN or ADMIN with coupons.update permission.' },
  'DELETE /api/v1/coupons/{id}': { allowedRoles: 'SUPER_ADMIN or ADMIN with coupons.delete', description: 'SUPER_ADMIN or ADMIN with coupons.delete permission.' },
  'PATCH /api/v1/coupons/{id}/status': { allowedRoles: 'SUPER_ADMIN or ADMIN with coupons.status.update', description: 'SUPER_ADMIN or ADMIN with coupons.status.update permission.' },


  'GET /api/v1/admin/disputes/stats': { allowedRoles: 'SUPER_ADMIN or ADMIN with disputes.read', description: 'SUPER_ADMIN or ADMIN with disputes.read permission.' },
  'GET /api/v1/admin/disputes': { allowedRoles: 'SUPER_ADMIN or ADMIN with disputes.read', description: 'SUPER_ADMIN or ADMIN with disputes.read permission.' },
  'GET /api/v1/admin/disputes/export': { allowedRoles: 'SUPER_ADMIN or ADMIN with disputes.export', description: 'SUPER_ADMIN or ADMIN with disputes.export permission.' },
  'GET /api/v1/admin/disputes/{id}': { allowedRoles: 'SUPER_ADMIN or ADMIN with disputes.read', description: 'SUPER_ADMIN or ADMIN with disputes.read permission.' },
  'GET /api/v1/admin/disputes/{id}/evidence': { allowedRoles: 'SUPER_ADMIN or ADMIN with disputes.read', description: 'SUPER_ADMIN or ADMIN with disputes.read permission.' },
  'GET /api/v1/admin/disputes/{id}/timeline': { allowedRoles: 'SUPER_ADMIN or ADMIN with disputes.read', description: 'SUPER_ADMIN or ADMIN with disputes.read permission.' },
  'GET /api/v1/admin/disputes/{id}/internal-data': { allowedRoles: 'SUPER_ADMIN or ADMIN with disputes.read', description: 'SUPER_ADMIN or ADMIN with disputes.read permission.' },
  'GET /api/v1/admin/disputes/{id}/notes': { allowedRoles: 'SUPER_ADMIN or ADMIN with disputes.read', description: 'SUPER_ADMIN or ADMIN with disputes.read permission.' },
  'POST /api/v1/admin/disputes/{id}/notes': { allowedRoles: 'SUPER_ADMIN or ADMIN with disputes.notes.create', description: 'SUPER_ADMIN or ADMIN with disputes.notes.create permission.' },
  'POST /api/v1/admin/disputes/{id}/follow-up-notes': { allowedRoles: 'SUPER_ADMIN or ADMIN with disputes.notes.create', description: 'SUPER_ADMIN or ADMIN with disputes.notes.create permission.' },
  'GET /api/v1/admin/disputes/{id}/linkage': { allowedRoles: 'SUPER_ADMIN or ADMIN with disputes.read', description: 'SUPER_ADMIN or ADMIN with disputes.read permission.' },
  'GET /api/v1/admin/disputes/{id}/transaction-search': { allowedRoles: 'SUPER_ADMIN or ADMIN with disputes.read', description: 'SUPER_ADMIN or ADMIN with disputes.read permission.' },
  'POST /api/v1/admin/disputes/{id}/link-transaction': { allowedRoles: 'SUPER_ADMIN or ADMIN with disputes.linkTransaction', description: 'SUPER_ADMIN or ADMIN with disputes.linkTransaction permission.' },
  'POST /api/v1/admin/disputes/{id}/refund-preview': { allowedRoles: 'SUPER_ADMIN or ADMIN with disputes.refund.evaluate', description: 'SUPER_ADMIN or ADMIN with disputes.refund.evaluate permission.' },
  'GET /api/v1/admin/disputes/{id}/decision-summary': { allowedRoles: 'SUPER_ADMIN or ADMIN with disputes.decide', description: 'SUPER_ADMIN or ADMIN with disputes.decide permission.' },
  'POST /api/v1/admin/disputes/{id}/decision': { allowedRoles: 'SUPER_ADMIN or ADMIN with disputes.decide plus action-specific permission (approve/reject/escalate)', description: 'SUPER_ADMIN or ADMIN with disputes.decide and the action-specific permission as applicable.' },
  'GET /api/v1/admin/disputes/{id}/confirmation': { allowedRoles: 'SUPER_ADMIN or ADMIN with disputes.decide', description: 'SUPER_ADMIN or ADMIN with disputes.decide permission.' },
  'GET /api/v1/admin/disputes/{id}/tracking-log': { allowedRoles: 'SUPER_ADMIN or ADMIN with disputes.tracking.read', description: 'SUPER_ADMIN or ADMIN with disputes.tracking.read permission.' },
  'GET /api/v1/admin/disputes/{id}/tracking-log/export': { allowedRoles: 'SUPER_ADMIN or ADMIN with disputes.tracking.export', description: 'SUPER_ADMIN or ADMIN with disputes.tracking.export permission.' },

  'GET /api/v1/admin/provider-disputes/stats': { allowedRoles: 'SUPER_ADMIN or ADMIN with providerDisputes.read', description: 'SUPER_ADMIN or ADMIN with providerDisputes.read permission.' },
  'GET /api/v1/admin/provider-disputes': { allowedRoles: 'SUPER_ADMIN or ADMIN with providerDisputes.read', description: 'SUPER_ADMIN or ADMIN with providerDisputes.read permission.' },
  'GET /api/v1/admin/provider-disputes/export': { allowedRoles: 'SUPER_ADMIN or ADMIN with providerDisputes.export', description: 'SUPER_ADMIN or ADMIN with providerDisputes.export permission.' },
  'GET /api/v1/admin/provider-disputes/{id}': { allowedRoles: 'SUPER_ADMIN or ADMIN with providerDisputes.read', description: 'SUPER_ADMIN or ADMIN with providerDisputes.read permission.' },
  'GET /api/v1/admin/provider-disputes/{id}/evidence': { allowedRoles: 'SUPER_ADMIN or ADMIN with providerDisputes.read', description: 'SUPER_ADMIN or ADMIN with providerDisputes.read permission.' },
  'POST /api/v1/admin/provider-disputes/{id}/evidence/request': { allowedRoles: 'SUPER_ADMIN or ADMIN with providerDisputes.evidence.request', description: 'SUPER_ADMIN or ADMIN with providerDisputes.evidence.request permission.' },
  'POST /api/v1/admin/provider-disputes/{id}/evidence/mark-reviewed': { allowedRoles: 'SUPER_ADMIN or ADMIN with providerDisputes.update', description: 'SUPER_ADMIN or ADMIN with providerDisputes.update permission.' },
  'GET /api/v1/admin/provider-disputes/{id}/timeline': { allowedRoles: 'SUPER_ADMIN or ADMIN with providerDisputes.read', description: 'SUPER_ADMIN or ADMIN with providerDisputes.read permission.' },
  'GET /api/v1/admin/provider-disputes/{id}/notes': { allowedRoles: 'SUPER_ADMIN or ADMIN with providerDisputes.read', description: 'SUPER_ADMIN or ADMIN with providerDisputes.read permission.' },
  'POST /api/v1/admin/provider-disputes/{id}/notes': { allowedRoles: 'SUPER_ADMIN or ADMIN with providerDisputes.notes.create', description: 'SUPER_ADMIN or ADMIN with providerDisputes.notes.create permission.' },
  'GET /api/v1/admin/provider-disputes/{id}/ruling-summary': { allowedRoles: 'SUPER_ADMIN or ADMIN with providerDisputes.ruling.read', description: 'SUPER_ADMIN or ADMIN with providerDisputes.ruling.read permission.' },
  'POST /api/v1/admin/provider-disputes/{id}/ruling': { allowedRoles: 'SUPER_ADMIN or ADMIN with providerDisputes.ruling.create', description: 'SUPER_ADMIN or ADMIN with providerDisputes.ruling.create permission.' },
  'GET /api/v1/admin/provider-disputes/{id}/financial-impact': { allowedRoles: 'SUPER_ADMIN or ADMIN with providerDisputes.financial.read', description: 'SUPER_ADMIN or ADMIN with providerDisputes.financial.read permission.' },
  'POST /api/v1/admin/provider-disputes/{id}/payout-penalty-linkage': { allowedRoles: 'SUPER_ADMIN or ADMIN with providerDisputes.financial.link', description: 'SUPER_ADMIN or ADMIN with providerDisputes.financial.link permission.' },
  'POST /api/v1/admin/provider-disputes/{id}/final-attestation': { allowedRoles: 'SUPER_ADMIN or ADMIN with providerDisputes.ruling.update', description: 'SUPER_ADMIN or ADMIN with providerDisputes.ruling.update permission.' },
  'POST /api/v1/admin/provider-disputes/{id}/finalize': { allowedRoles: 'SUPER_ADMIN or ADMIN with providerDisputes.resolve', description: 'SUPER_ADMIN or ADMIN with providerDisputes.resolve permission.' },
  'GET /api/v1/admin/provider-disputes/{id}/resolution': { allowedRoles: 'SUPER_ADMIN or ADMIN with providerDisputes.resolve', description: 'SUPER_ADMIN or ADMIN with providerDisputes.resolve permission.' },
  'GET /api/v1/admin/provider-disputes/{id}/resolution-log': { allowedRoles: 'SUPER_ADMIN or ADMIN with providerDisputes.logs.read', description: 'SUPER_ADMIN or ADMIN with providerDisputes.logs.read permission.' },
  'GET /api/v1/admin/provider-disputes/{id}/resolution-log/export': { allowedRoles: 'SUPER_ADMIN or ADMIN with providerDisputes.logs.export', description: 'SUPER_ADMIN or ADMIN with providerDisputes.logs.export permission.' },
  'POST /api/v1/admin/provider-disputes/{id}/notify-again': { allowedRoles: 'SUPER_ADMIN or ADMIN with providerDisputes.notify', description: 'SUPER_ADMIN or ADMIN with providerDisputes.notify permission.' },

  'GET /api/v1/provider/chats': { allowedRoles: 'PROVIDER', description: 'PROVIDER only. Provider can access only own chat threads.' },
  'GET /api/v1/provider/chats/quick-replies': { allowedRoles: 'PROVIDER', description: 'PROVIDER only.' },
  'GET /api/v1/provider/chats/{threadId}': { allowedRoles: 'PROVIDER', description: 'PROVIDER only. Provider can access only own chat threads.' },
  'POST /api/v1/provider/chats/{threadId}/messages': { allowedRoles: 'PROVIDER', description: 'PROVIDER only. Provider can send only in own thread.' },
  'PATCH /api/v1/provider/chats/{threadId}/read': { allowedRoles: 'PROVIDER', description: 'PROVIDER only. Provider can mark only own thread messages read.' },
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
  'GET /api/v1/audit-logs/action-types': { allowedRoles: 'SUPER_ADMIN', description: 'SUPER_ADMIN only. Audit log action filter options are restricted to Super Admin.' },
  'GET /api/v1/audit-logs/users': { allowedRoles: 'SUPER_ADMIN', description: 'SUPER_ADMIN only. Audit log actor selector options are restricted to Super Admin.' },
  'GET /api/v1/audit-logs': { allowedRoles: 'SUPER_ADMIN', description: 'SUPER_ADMIN only. Audit logs are restricted to Super Admin.' },
  'GET /api/v1/audit-logs/export': { allowedRoles: 'SUPER_ADMIN', description: 'SUPER_ADMIN only. Audit log export is restricted to Super Admin.' },
  'GET /api/v1/audit-logs/{id}': { allowedRoles: 'SUPER_ADMIN', description: 'SUPER_ADMIN only. Audit log details are restricted to Super Admin.' },

  'GET /api/v1/referral-settings': { allowedRoles: 'SUPER_ADMIN or ADMIN with referralSettings.read', description: 'SUPER_ADMIN or ADMIN with referralSettings.read permission.' },
  'GET /api/v1/referral-settings/stats': { allowedRoles: 'SUPER_ADMIN or ADMIN with referralSettings.read', description: 'SUPER_ADMIN or ADMIN with referralSettings.read permission.' },
  'PATCH /api/v1/referral-settings': { allowedRoles: 'SUPER_ADMIN', description: 'SUPER_ADMIN only. Changes apply to future referral snapshots.' },
  'POST /api/v1/referral-settings/activate': { allowedRoles: 'SUPER_ADMIN', description: 'SUPER_ADMIN only. Activates referral program.' },
  'POST /api/v1/referral-settings/deactivate': { allowedRoles: 'SUPER_ADMIN', description: 'SUPER_ADMIN only. Deactivates referral program.' },
  'GET /api/v1/referral-settings/audit-logs': { allowedRoles: 'SUPER_ADMIN', description: 'SUPER_ADMIN only. Referral settings audit logs.' },
  'GET /api/v1/media-upload-policy': { allowedRoles: 'SUPER_ADMIN or ADMIN with mediaPolicy.read', description: 'SUPER_ADMIN or ADMIN with mediaPolicy.read permission.' },
  'PATCH /api/v1/media-upload-policy': { allowedRoles: 'SUPER_ADMIN', description: 'SUPER_ADMIN only. Updates global media upload policy.' },
  'GET /api/v1/media-upload-policy/audit-logs': { allowedRoles: 'SUPER_ADMIN', description: 'SUPER_ADMIN only. Media upload policy audit logs.' },
};

const providerPrefixes = ['/api/v1/provider/business-info', '/api/v1/provider/inventory', '/api/v1/provider/offers', '/api/v1/provider/orders', '/api/v1/provider/refund-requests', '/api/v1/provider/chats', '/api/v1/provider/reviews', '/api/v1/provider/support'];
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
        description: operation.security ? 'Authenticated JWT required.' : 'PUBLIC.',
      };

      const operationWithExtensions = operation as unknown as { 'x-allowed-roles'?: string; 'x-access'?: string; security?: unknown; description?: string };
      operationWithExtensions['x-allowed-roles'] = rule.allowedRoles;
      operationWithExtensions['x-access'] = rule.allowedRoles;

      if (rule.allowedRoles === 'PUBLIC') {
        delete operationWithExtensions.security;
      }

      const currentDescription = operationWithExtensions.description?.trim();
      const accessDescription = `Access: ${rule.allowedRoles}.`;
      const ruleDescription = `${accessDescription} ${rule.description}`;
      operationWithExtensions.description = currentDescription && currentDescription.includes(accessDescription)
        ? currentDescription
        : currentDescription
          ? `${ruleDescription} ${currentDescription}`
          : ruleDescription;
    }
  }
}
