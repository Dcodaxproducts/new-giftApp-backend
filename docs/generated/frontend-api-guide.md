Generated from docs/generated/openapi.json
Generated at: 2026-05-21 11:22 UTC
Do not edit manually.
Run: npm run docs:generate

# Gift App Backend — Frontend Developer API Guide

Generated from `docs/generated/openapi.json` on 2026-05-21 11:22 UTC.

## Frontend Integration Flows

- **Auth flows:** login/register, token refresh, sessions, profile, password reset, and guest session creation.
- **Guest flows:** use guest session + guest marketplace APIs under `05 Customer / Guest - Marketplace`; guest users can browse configured marketplace surfaces only.
- **Registered customer flows:** marketplace, wishlist, addresses, contacts, events, cart, orders, provider chat, reviews, reports, recurring payments, transactions, referrals, subscriptions, wallet, and payment methods.
- **Provider flows:** dashboard, business info, buyer chat, reviews, inventory, promotional offers, orders, payouts, payout methods, refunds, and analytics. Provider inventory visibility does not require gift moderation approval; approved active non-suspended providers remain the visibility gate.
- **Super Admin/Admin flows:** staff, roles, users, providers, moderation, support chat, payments/payouts, disputes/refunds, settings, audit logs, notifications, and storage policy.
- **Storage upload flow:** create/complete uploads using storage endpoints before attaching media URLs to profile, chat, support, gift, review, or dispute payloads.
- **Payment/order flow:** cart/order checkout, payment methods, payment records, transactions, recurring payments/subscriptions, and order history.
- **Payout flow:** provider payout methods, earnings, payout requests, and admin payout approvals/settings.
- **Dispute/refund flow:** customer/provider disputes, evidence, decisions, financial adjustments, tracking logs, provider refund requests, and refund policy settings.

## Superadmin / Admin APIs

### Admin - Commission & Payout Settings (7 APIs)

| Method | Endpoint | Purpose | Access |
|---|---|---|---|
| GET | `/api/v1/admin/payout-settings` | Fetch commission and payout settings | SUPER_ADMIN or ADMIN with payoutSettings.read |
| PATCH | `/api/v1/admin/payout-settings` | Update commission and payout settings | SUPER_ADMIN or ADMIN with payoutSettings.update |
| GET | `/api/v1/admin/payout-settings/audit-logs` | List payout settings audit logs | SUPER_ADMIN or ADMIN with payoutSettings.read |
| GET | `/api/v1/admin/payout-settings/commission-tiers` | List commission tiers | SUPER_ADMIN or ADMIN with payoutSettings.read |
| POST | `/api/v1/admin/payout-settings/commission-tiers` | Create commission tier | SUPER_ADMIN or ADMIN with payoutSettings.update |
| PATCH | `/api/v1/admin/payout-settings/commission-tiers/{id}` | Update commission tier | SUPER_ADMIN or ADMIN with payoutSettings.update |
| DELETE | `/api/v1/admin/payout-settings/commission-tiers/{id}` | Delete commission tier | SUPER_ADMIN or ADMIN with payoutSettings.update |

### Admin - Dashboard Overview (5 APIs)

| Method | Endpoint | Purpose | Access |
|---|---|---|---|
| GET | `/api/v1/admin/dashboard/gift-vs-payment` | Fetch gift vs direct payment distribution | SUPER_ADMIN or ADMIN with dashboard.read |
| GET | `/api/v1/admin/dashboard/overview` | Fetch Super Admin dashboard overview metrics | SUPER_ADMIN or ADMIN with dashboard.read |
| GET | `/api/v1/admin/dashboard/provider-performance` | Fetch provider performance table | SUPER_ADMIN or ADMIN with dashboard.read |
| GET | `/api/v1/admin/dashboard/recent-disputes` | Fetch recent disputes table | SUPER_ADMIN or ADMIN with dashboard.read |
| GET | `/api/v1/admin/dashboard/revenue-trends` | Fetch monthly revenue trends | SUPER_ADMIN or ADMIN with dashboard.read |

### Admin - Dispute Decisions (3 APIs)

| Method | Endpoint | Purpose | Access |
|---|---|---|---|
| GET | `/api/v1/admin/disputes/{id}/confirmation` | Fetch decision confirmation | SUPER_ADMIN or ADMIN with disputes.decide |
| POST | `/api/v1/admin/disputes/{id}/decision` | Submit final dispute decision | SUPER_ADMIN or ADMIN with disputes.decide plus action-specific permission (approve/reject/escalate) |
| GET | `/api/v1/admin/disputes/{id}/decision-summary` | Fetch dispute decision summary | SUPER_ADMIN or ADMIN with disputes.decide |

### Admin - Dispute Evidence (1 APIs)

| Method | Endpoint | Purpose | Access |
|---|---|---|---|
| GET | `/api/v1/admin/disputes/{id}/evidence` | Fetch dispute evidence | SUPER_ADMIN or ADMIN with disputes.read |

### Admin - Dispute Linkage (4 APIs)

| Method | Endpoint | Purpose | Access |
|---|---|---|---|
| POST | `/api/v1/admin/disputes/{id}/link-transaction` | Confirm dispute transaction linkage | SUPER_ADMIN or ADMIN with disputes.linkTransaction |
| GET | `/api/v1/admin/disputes/{id}/linkage` | Fetch current dispute transaction linkage state | SUPER_ADMIN or ADMIN with disputes.read |
| POST | `/api/v1/admin/disputes/{id}/refund-preview` | Preview dispute refund selection | SUPER_ADMIN or ADMIN with disputes.refund.evaluate |
| GET | `/api/v1/admin/disputes/{id}/transaction-search` | Search original transaction for a dispute | SUPER_ADMIN or ADMIN with disputes.read |

### Admin - Dispute Manager (8 APIs)

| Method | Endpoint | Purpose | Access |
|---|---|---|---|
| GET | `/api/v1/admin/disputes` | List dispute queue | SUPER_ADMIN or ADMIN with disputes.read |
| GET | `/api/v1/admin/disputes/export` | Export dispute cases | SUPER_ADMIN or ADMIN with disputes.export |
| GET | `/api/v1/admin/disputes/stats` | Fetch dispute dashboard stats | SUPER_ADMIN or ADMIN with disputes.read |
| GET | `/api/v1/admin/disputes/{id}` | Fetch dispute details and evidence review summary | SUPER_ADMIN or ADMIN with disputes.read |
| GET | `/api/v1/admin/disputes/{id}/internal-data` | Fetch internal transaction data | SUPER_ADMIN or ADMIN with disputes.read |
| GET | `/api/v1/admin/disputes/{id}/notes` | Fetch internal dispute notes | SUPER_ADMIN or ADMIN with disputes.read |
| POST | `/api/v1/admin/disputes/{id}/notes` | Add internal dispute note | SUPER_ADMIN or ADMIN with disputes.notes.create |
| GET | `/api/v1/admin/disputes/{id}/timeline` | Fetch dispute timeline | SUPER_ADMIN or ADMIN with disputes.read |

### Admin - Dispute Tracking (3 APIs)

| Method | Endpoint | Purpose | Access |
|---|---|---|---|
| POST | `/api/v1/admin/disputes/{id}/follow-up-notes` | Add dispute follow-up note | SUPER_ADMIN or ADMIN with disputes.notes.create |
| GET | `/api/v1/admin/disputes/{id}/tracking-log` | Fetch full dispute tracking log | SUPER_ADMIN or ADMIN with disputes.tracking.read |
| GET | `/api/v1/admin/disputes/{id}/tracking-log/export` | Export full dispute tracking log | SUPER_ADMIN or ADMIN with disputes.tracking.export |

### Admin - Guest Access Settings (3 APIs)

| Method | Endpoint | Purpose | Access |
|---|---|---|---|
| GET | `/api/v1/admin/guest-access-settings` | Fetch guest access settings | SUPER_ADMIN or ADMIN with guestAccessSettings.read |
| PATCH | `/api/v1/admin/guest-access-settings` | Update guest access settings | SUPER_ADMIN or ADMIN with guestAccessSettings.update |
| GET | `/api/v1/admin/guest-access-settings/audit-logs` | List guest access settings audit logs | SUPER_ADMIN or ADMIN with guestAccessSettings.read |

### Admin - In-App Messaging Settings (3 APIs)

| Method | Endpoint | Purpose | Access |
|---|---|---|---|
| GET | `/api/v1/admin/messaging-settings` | Fetch in-app messaging settings | SUPER_ADMIN or ADMIN with messagingSettings.read |
| PATCH | `/api/v1/admin/messaging-settings` | Update in-app messaging settings | SUPER_ADMIN or ADMIN with messagingSettings.update |
| GET | `/api/v1/admin/messaging-settings/audit-logs` | List in-app messaging settings audit logs | SUPER_ADMIN or ADMIN with messagingSettings.read |

### Admin - Media Upload Policy (3 APIs)

| Method | Endpoint | Purpose | Access |
|---|---|---|---|
| GET | `/api/v1/media-upload-policy` | Fetch global media upload policy | SUPER_ADMIN or ADMIN with mediaPolicy.read |
| PATCH | `/api/v1/media-upload-policy` | Update global media upload policy | SUPER_ADMIN |
| GET | `/api/v1/media-upload-policy/audit-logs` | List media upload policy audit logs | SUPER_ADMIN |

### Admin - Message Moderation (15 APIs)

| Method | Endpoint | Purpose | Access |
|---|---|---|---|
| GET | `/api/v1/admin/message-moderation/audit-logs` | Fetch message moderation audit logs | SUPER_ADMIN or ADMIN with messageModeration.auditLogs.read |
| GET | `/api/v1/admin/message-moderation/conversations` | List flagged message moderation conversations | SUPER_ADMIN or ADMIN with messageModeration.read |
| GET | `/api/v1/admin/message-moderation/conversations/{id}` | Fetch message moderation conversation detail | SUPER_ADMIN or ADMIN with messageModeration.read |
| GET | `/api/v1/admin/message-moderation/conversations/{id}/history` | Fetch paginated message moderation conversation history | SUPER_ADMIN or ADMIN with messageModeration.read |
| GET | `/api/v1/admin/message-moderation/export` | Export message moderation rows | SUPER_ADMIN or ADMIN with messageModeration.export |
| GET | `/api/v1/admin/message-moderation/filter-options` | Fetch message moderation filter options | SUPER_ADMIN or ADMIN with messageModeration.read |
| POST | `/api/v1/admin/message-moderation/messages/{messageId}/block` | Hide a flagged message from chat participants | SUPER_ADMIN or ADMIN with messageModeration.moderate |
| POST | `/api/v1/admin/message-moderation/messages/{messageId}/dismiss-flag` | Dismiss a moderation flag | SUPER_ADMIN or ADMIN with messageModeration.moderate |
| POST | `/api/v1/admin/message-moderation/messages/{messageId}/escalate` | Escalate a flagged message | SUPER_ADMIN or ADMIN with messageModeration.escalate |
| POST | `/api/v1/admin/message-moderation/messages/{messageId}/note` | Add internal private moderation note | SUPER_ADMIN or ADMIN with messageModeration.notes.create |
| POST | `/api/v1/admin/message-moderation/messages/{messageId}/reprocess` | Reprocess a message through scanner | SUPER_ADMIN or ADMIN with messageModeration.reprocess |
| POST | `/api/v1/admin/message-moderation/messages/{messageId}/restore` | Restore a hidden moderated message | SUPER_ADMIN or ADMIN with messageModeration.moderate |
| POST | `/api/v1/admin/message-moderation/messages/{messageId}/suspend-account` | Suspend message sender account | SUPER_ADMIN or ADMIN with messageModeration.suspend |
| POST | `/api/v1/admin/message-moderation/messages/{messageId}/warn-user` | Warn message sender | SUPER_ADMIN or ADMIN with messageModeration.warn |
| GET | `/api/v1/admin/message-moderation/stats` | Fetch message moderation stats | SUPER_ADMIN or ADMIN with messageModeration.read |

**Message moderation frontend notes**

- Use the conversation list for the moderation queue and conversation detail for the flagged message preview / AI moderation alert.
- Actions: block message, warn user, suspend account, dismiss flag, add internal private note, and reprocess. Use the next list item as the `Next Incident` source after an action.
- Permissions: SUPER_ADMIN can perform all actions. ADMIN needs `messageModeration.read` for queue/detail, `messageModeration.export` for export, `messageModeration.block`, `messageModeration.warn`, `messageModeration.suspend`, `messageModeration.dismiss`, `messageModeration.notes.create`, and `messageModeration.moderate` for reprocess.
- Redaction: flagged harmful content returns `body: null` by default and always includes `redactedBody`. Do not render raw harmful content unless a future explicit unmask permission is implemented.
- Internal notes are admin-only and must never be rendered in customer/provider chat screens.

### Admin - Notification Delivery Monitoring (4 APIs)

| Method | Endpoint | Purpose | Access |
|---|---|---|---|
| GET | `/api/v1/admin/notification-delivery/logs` | List notification delivery logs | Authenticated |
| GET | `/api/v1/admin/notification-delivery/logs/{id}` | Fetch notification delivery log detail | Authenticated |
| POST | `/api/v1/admin/notification-delivery/logs/{id}/retry` | Retry notification delivery | Authenticated |
| GET | `/api/v1/admin/notification-delivery/stats` | Fetch notification delivery stats | Authenticated |

### Admin - Promotional Offers Management (10 APIs)

| Method | Endpoint | Purpose | Access |
|---|---|---|---|
| GET | `/api/v1/promotional-offers` | List Promotional Offers | SUPER_ADMIN or ADMIN with promotionalOffers.read |
| POST | `/api/v1/promotional-offers` | Create Promotional Offers | SUPER_ADMIN or ADMIN with promotionalOffers.create |
| GET | `/api/v1/promotional-offers/export` | List Promotional Offers Export | SUPER_ADMIN or ADMIN with promotionalOffers.export |
| GET | `/api/v1/promotional-offers/stats` | List Promotional Offers Stats | SUPER_ADMIN or ADMIN with promotionalOffers.read |
| GET | `/api/v1/promotional-offers/{id}` | Fetch Promotional Offers details | SUPER_ADMIN or ADMIN with promotionalOffers.read |
| PATCH | `/api/v1/promotional-offers/{id}` | Update Promotional Offers | SUPER_ADMIN or ADMIN with promotionalOffers.update |
| DELETE | `/api/v1/promotional-offers/{id}` | Delete Promotional Offers | SUPER_ADMIN or ADMIN with promotionalOffers.delete |
| PATCH | `/api/v1/promotional-offers/{id}/approve` | Update Promotional Offers Approve | SUPER_ADMIN or ADMIN with promotionalOffers.approve |
| PATCH | `/api/v1/promotional-offers/{id}/reject` | Update Promotional Offers Reject | SUPER_ADMIN or ADMIN with promotionalOffers.reject |
| PATCH | `/api/v1/promotional-offers/{id}/status` | Update Promotional Offers Status | SUPER_ADMIN or ADMIN with promotionalOffers.status.update |

### Admin - Provider Business Categories (5 APIs)

| Method | Endpoint | Purpose | Access |
|---|---|---|---|
| GET | `/api/v1/provider-business-categories` | List provider business categories | PUBLIC |
| POST | `/api/v1/provider-business-categories` | Create provider business category | SUPER_ADMIN or ADMIN with providerBusinessCategories.create |
| GET | `/api/v1/provider-business-categories/{id}` | Fetch provider business category details | SUPER_ADMIN or ADMIN with providerBusinessCategories.read |
| PATCH | `/api/v1/provider-business-categories/{id}` | Update provider business category | SUPER_ADMIN or ADMIN with providerBusinessCategories.update |
| DELETE | `/api/v1/provider-business-categories/{id}` | Delete provider business category | SUPER_ADMIN or ADMIN with providerBusinessCategories.delete |

### Admin - Provider Dispute Evidence (3 APIs)

| Method | Endpoint | Purpose | Access |
|---|---|---|---|
| GET | `/api/v1/admin/provider-disputes/{id}/evidence` | Fetch provider dispute evidence exchange | SUPER_ADMIN or ADMIN with providerDisputes.read |
| POST | `/api/v1/admin/provider-disputes/{id}/evidence/mark-reviewed` | Mark provider dispute evidence review complete | SUPER_ADMIN or ADMIN with providerDisputes.update |
| POST | `/api/v1/admin/provider-disputes/{id}/evidence/request` | Request additional provider dispute evidence | SUPER_ADMIN or ADMIN with providerDisputes.evidence.request |

### Admin - Provider Dispute Logs (2 APIs)

| Method | Endpoint | Purpose | Access |
|---|---|---|---|
| GET | `/api/v1/admin/provider-disputes/{id}/resolution-log` | Fetch provider dispute resolution log | SUPER_ADMIN or ADMIN with providerDisputes.logs.read |
| GET | `/api/v1/admin/provider-disputes/{id}/resolution-log/export` | Export provider dispute resolution log | SUPER_ADMIN or ADMIN with providerDisputes.logs.export |

### Admin - Provider Dispute Manager (7 APIs)

| Method | Endpoint | Purpose | Access |
|---|---|---|---|
| GET | `/api/v1/admin/provider-disputes` | List provider dispute queue | SUPER_ADMIN or ADMIN with providerDisputes.read |
| GET | `/api/v1/admin/provider-disputes/export` | Export provider dispute queue | SUPER_ADMIN or ADMIN with providerDisputes.export |
| GET | `/api/v1/admin/provider-disputes/stats` | Fetch provider dispute dashboard stats | SUPER_ADMIN or ADMIN with providerDisputes.read |
| GET | `/api/v1/admin/provider-disputes/{id}` | Fetch provider dispute details | SUPER_ADMIN or ADMIN with providerDisputes.read |
| GET | `/api/v1/admin/provider-disputes/{id}/notes` | Fetch provider dispute internal notes | SUPER_ADMIN or ADMIN with providerDisputes.read |
| POST | `/api/v1/admin/provider-disputes/{id}/notes` | Add provider dispute internal note | SUPER_ADMIN or ADMIN with providerDisputes.notes.create |
| GET | `/api/v1/admin/provider-disputes/{id}/timeline` | Fetch provider dispute timeline | SUPER_ADMIN or ADMIN with providerDisputes.read |

### Admin - Provider Dispute Resolution (3 APIs)

| Method | Endpoint | Purpose | Access |
|---|---|---|---|
| POST | `/api/v1/admin/provider-disputes/{id}/finalize` | Finalize provider dispute | SUPER_ADMIN or ADMIN with providerDisputes.resolve |
| POST | `/api/v1/admin/provider-disputes/{id}/notify-again` | Resend provider dispute notifications | SUPER_ADMIN or ADMIN with providerDisputes.notify |
| GET | `/api/v1/admin/provider-disputes/{id}/resolution` | Fetch provider dispute resolution summary | SUPER_ADMIN or ADMIN with providerDisputes.resolve |

### Admin - Provider Dispute Rulings (2 APIs)

| Method | Endpoint | Purpose | Access |
|---|---|---|---|
| POST | `/api/v1/admin/provider-disputes/{id}/ruling` | Save provider dispute ruling | SUPER_ADMIN or ADMIN with providerDisputes.ruling.create |
| GET | `/api/v1/admin/provider-disputes/{id}/ruling-summary` | Fetch provider dispute ruling summary | SUPER_ADMIN or ADMIN with providerDisputes.ruling.read |

### Admin - Provider Financial Adjustments (3 APIs)

| Method | Endpoint | Purpose | Access |
|---|---|---|---|
| POST | `/api/v1/admin/provider-disputes/{id}/final-attestation` | Complete final financial attestation | SUPER_ADMIN or ADMIN with providerDisputes.ruling.update |
| GET | `/api/v1/admin/provider-disputes/{id}/financial-impact` | Fetch provider dispute financial impact | SUPER_ADMIN or ADMIN with providerDisputes.financial.read |
| POST | `/api/v1/admin/provider-disputes/{id}/payout-penalty-linkage` | Link payout and penalty adjustments | SUPER_ADMIN or ADMIN with providerDisputes.financial.link |

### Admin - Provider Management (12 APIs)

| Method | Endpoint | Purpose | Access |
|---|---|---|---|
| GET | `/api/v1/providers` | List providers | SUPER_ADMIN or ADMIN with providers.read |
| POST | `/api/v1/providers` | Create provider from admin dashboard | SUPER_ADMIN or ADMIN with providers.create |
| GET | `/api/v1/providers/export` | List Providers Export | SUPER_ADMIN or ADMIN with providers.export |
| GET | `/api/v1/providers/lookup` | List Providers Lookup | SUPER_ADMIN or ADMIN with providers.read |
| GET | `/api/v1/providers/stats` | List Providers Stats | SUPER_ADMIN or ADMIN with providers.read |
| GET | `/api/v1/providers/{id}` | Fetch Providers details | SUPER_ADMIN or ADMIN with providers.read |
| PATCH | `/api/v1/providers/{id}` | Update Providers | SUPER_ADMIN or ADMIN with providers.update |
| DELETE | `/api/v1/providers/{id}` | Permanently delete provider | SUPER_ADMIN |
| GET | `/api/v1/providers/{id}/activity` | Fetch Providers Activity details | SUPER_ADMIN or ADMIN with providers.read |
| GET | `/api/v1/providers/{id}/items` | Fetch Providers Items details | SUPER_ADMIN or ADMIN with providers.read |
| POST | `/api/v1/providers/{id}/message` | Create Providers Message | SUPER_ADMIN or ADMIN with providers.message |
| PATCH | `/api/v1/providers/{id}/status` | Update provider lifecycle status | SUPER_ADMIN or ADMIN with provider lifecycle permission (APPROVE=>providers.approve, REJECT=>providers.reject, SUSPEND=>providers.suspend, UNSUSPEND=>providers.suspend, UPDATE_STATUS=>providers.updateStatus) |

### Admin - Provider Payouts (9 APIs)

| Method | Endpoint | Purpose | Access |
|---|---|---|---|
| GET | `/api/v1/admin/provider-payouts` | List provider payouts | SUPER_ADMIN or ADMIN with providerPayouts.read |
| POST | `/api/v1/admin/provider-payouts/bulk-approve` | Bulk approve provider payouts | SUPER_ADMIN or ADMIN with providerPayouts.approve |
| GET | `/api/v1/admin/provider-payouts/earning-distribution` | Fetch earning distribution by provider tier | SUPER_ADMIN or ADMIN with providerPayouts.read |
| GET | `/api/v1/admin/provider-payouts/export` | Export provider payouts | SUPER_ADMIN or ADMIN with providerPayouts.export |
| GET | `/api/v1/admin/provider-payouts/stats` | Fetch provider payout dashboard stats | SUPER_ADMIN or ADMIN with providerPayouts.read |
| GET | `/api/v1/admin/provider-payouts/trends` | Fetch monthly provider payout trend | SUPER_ADMIN or ADMIN with providerPayouts.read |
| GET | `/api/v1/admin/provider-payouts/{id}` | Fetch provider payout details | SUPER_ADMIN or ADMIN with providerPayouts.read |
| POST | `/api/v1/admin/provider-payouts/{id}/action` | Run provider payout action | SUPER_ADMIN or ADMIN with action-specific providerPayouts permission |
| GET | `/api/v1/admin/provider-payouts/{id}/breakdown` | Fetch pending payout transaction breakdown | SUPER_ADMIN or ADMIN with providerPayouts.read |

### Admin - Referral Settings (6 APIs)

| Method | Endpoint | Purpose | Access |
|---|---|---|---|
| GET | `/api/v1/referral-settings` | Fetch referral settings | SUPER_ADMIN or ADMIN with referralSettings.read |
| PATCH | `/api/v1/referral-settings` | Update referral settings | SUPER_ADMIN |
| POST | `/api/v1/referral-settings/activate` | Activate referral program | SUPER_ADMIN |
| GET | `/api/v1/referral-settings/audit-logs` | List referral settings audit logs | SUPER_ADMIN |
| POST | `/api/v1/referral-settings/deactivate` | Deactivate referral program | SUPER_ADMIN |
| GET | `/api/v1/referral-settings/stats` | Fetch referral stats | SUPER_ADMIN or ADMIN with referralSettings.read |

### Admin - Refund Policy Settings (3 APIs)

| Method | Endpoint | Purpose | Access |
|---|---|---|---|
| GET | `/api/v1/admin/refund-policy-settings` | Fetch refund policy settings | SUPER_ADMIN or ADMIN with refundPolicies.read |
| PATCH | `/api/v1/admin/refund-policy-settings` | Update refund policy settings | SUPER_ADMIN |
| GET | `/api/v1/admin/refund-policy-settings/logs` | List refund policy audit logs | SUPER_ADMIN |

### Admin - Review Moderation (4 APIs)

| Method | Endpoint | Purpose | Access |
|---|---|---|---|
| GET | `/api/v1/admin/reviews/flagged-summary` | List Admin Reviews Flagged Summary | SUPER_ADMIN or ADMIN with reviews.read |
| GET | `/api/v1/admin/reviews/moderation-logs` | List Admin Reviews Moderation Logs | SUPER_ADMIN or ADMIN with reviewModerationLogs.read |
| GET | `/api/v1/admin/reviews/moderation-queue` | List Admin Reviews Moderation Queue | SUPER_ADMIN or ADMIN with reviews.moderate |
| POST | `/api/v1/admin/reviews/{id}/moderate` | Moderate a review | SUPER_ADMIN or ADMIN with reviews.moderate |

### Admin - Review Policies (3 APIs)

| Method | Endpoint | Purpose | Access |
|---|---|---|---|
| GET | `/api/v1/admin/review-policies` | Fetch review moderation policies | SUPER_ADMIN or ADMIN with reviewPolicies.read |
| PATCH | `/api/v1/admin/review-policies` | Update review moderation policies | SUPER_ADMIN or ADMIN with reviewPolicies.update |
| POST | `/api/v1/admin/review-policies/test` | Test review policy result | SUPER_ADMIN or ADMIN with reviewPolicies.read |

### Admin - Reviews Management (5 APIs)

| Method | Endpoint | Purpose | Access |
|---|---|---|---|
| GET | `/api/v1/admin/reviews` | List reviews for moderation dashboard | SUPER_ADMIN or ADMIN with reviews.read |
| GET | `/api/v1/admin/reviews/dashboard` | Fetch platform review dashboard | SUPER_ADMIN or ADMIN with reviews.read |
| GET | `/api/v1/admin/reviews/export` | Export reviews with moderation filters | SUPER_ADMIN or ADMIN with reviews.export |
| GET | `/api/v1/admin/reviews/stats` | List Admin Reviews Stats | SUPER_ADMIN or ADMIN with reviews.read |
| GET | `/api/v1/admin/reviews/{id}` | Fetch review moderation details | SUPER_ADMIN or ADMIN with reviews.read |

### Admin - Roles & Permissions (7 APIs)

| Method | Endpoint | Purpose | Access |
|---|---|---|---|
| GET | `/api/v1/admin-roles` | List Admin Roles | SUPER_ADMIN |
| POST | `/api/v1/admin-roles` | Create Admin Roles | SUPER_ADMIN |
| GET | `/api/v1/admin-roles/{id}` | Fetch Admin Roles details | SUPER_ADMIN |
| PATCH | `/api/v1/admin-roles/{id}` | Update Admin Roles | SUPER_ADMIN |
| DELETE | `/api/v1/admin-roles/{id}` | Delete Admin Roles | SUPER_ADMIN |
| PATCH | `/api/v1/admin-roles/{id}/permissions` | Update Admin Roles Permissions | SUPER_ADMIN |
| GET | `/api/v1/permissions/catalog` | List Permissions Catalog | SUPER_ADMIN |

### Admin - Social Moderation (5 APIs)

| Method | Endpoint | Purpose | Access |
|---|---|---|---|
| GET | `/api/v1/admin/social-moderation/export` | Export social moderation log | SUPER_ADMIN or ADMIN with socialModeration.export |
| GET | `/api/v1/admin/social-moderation/reports` | List social moderation reports | SUPER_ADMIN or ADMIN with socialModeration.read |
| GET | `/api/v1/admin/social-moderation/reports/{id}` | Fetch social report inspection details | SUPER_ADMIN or ADMIN with socialModeration.read |
| POST | `/api/v1/admin/social-moderation/reports/{id}/action` | Run social moderation action | SUPER_ADMIN or ADMIN with socialModeration.moderate |
| GET | `/api/v1/admin/social-moderation/stats` | Fetch social moderation stats | SUPER_ADMIN or ADMIN with socialModeration.read |

### Admin - Social Reporting Rules (8 APIs)

| Method | Endpoint | Purpose | Access |
|---|---|---|---|
| GET | `/api/v1/admin/social-reporting-rules` | List social reporting rules | SUPER_ADMIN or ADMIN with socialReportingRules.read |
| POST | `/api/v1/admin/social-reporting-rules` | Create social reporting rule | SUPER_ADMIN or ADMIN with socialReportingRules.create |
| GET | `/api/v1/admin/social-reporting-rules/export` | Export social reporting rules | SUPER_ADMIN or ADMIN with socialReportingRules.export |
| GET | `/api/v1/admin/social-reporting-rules/stats` | Fetch social reporting rule stats | SUPER_ADMIN or ADMIN with socialReportingRules.read |
| GET | `/api/v1/admin/social-reporting-rules/{id}` | Fetch social reporting rule details | SUPER_ADMIN or ADMIN with socialReportingRules.read |
| PATCH | `/api/v1/admin/social-reporting-rules/{id}` | Update social reporting rule | SUPER_ADMIN or ADMIN with socialReportingRules.update |
| DELETE | `/api/v1/admin/social-reporting-rules/{id}` | Delete social reporting rule | SUPER_ADMIN or ADMIN with socialReportingRules.delete |
| PATCH | `/api/v1/admin/social-reporting-rules/{id}/status` | Update social reporting rule status | SUPER_ADMIN or ADMIN with socialReportingRules.update |

### Admin - Staff Management (7 APIs)

| Method | Endpoint | Purpose | Access |
|---|---|---|---|
| GET | `/api/v1/admins` | List admin staff users | SUPER_ADMIN |
| POST | `/api/v1/admins` | Create admin staff user | SUPER_ADMIN |
| GET | `/api/v1/admins/{id}` | Fetch Admins details | SUPER_ADMIN |
| PATCH | `/api/v1/admins/{id}` | Update Admins | SUPER_ADMIN |
| DELETE | `/api/v1/admins/{id}` | Permanently delete admin staff user | SUPER_ADMIN |
| PATCH | `/api/v1/admins/{id}/active-status` | Update Admins Active Status | SUPER_ADMIN |
| PATCH | `/api/v1/admins/{id}/password` | Update Admins Password | SUPER_ADMIN |

### Admin - System Logs & Audit Trail (6 APIs)

| Method | Endpoint | Purpose | Access |
|---|---|---|---|
| GET | `/api/v1/audit-logs` | List audit logs | SUPER_ADMIN |
| GET | `/api/v1/audit-logs/action-types` | Fetch audit log action types | SUPER_ADMIN |
| GET | `/api/v1/audit-logs/export` | Export audit logs CSV | SUPER_ADMIN |
| GET | `/api/v1/audit-logs/stats` | Fetch audit log stats | SUPER_ADMIN |
| GET | `/api/v1/audit-logs/users` | Fetch audit log user selector options | SUPER_ADMIN |
| GET | `/api/v1/audit-logs/{id}` | Fetch audit log detail | SUPER_ADMIN |

### Admin - System Settings (5 APIs)

| Method | Endpoint | Purpose | Access |
|---|---|---|---|
| GET | `/api/v1/admin/system-settings` | Fetch system settings | SUPER_ADMIN or ADMIN with systemSettings.read |
| PATCH | `/api/v1/admin/system-settings` | Update system settings | SUPER_ADMIN or ADMIN with systemSettings.update |
| GET | `/api/v1/admin/system-settings/audit-logs` | List system settings audit logs | SUPER_ADMIN or ADMIN with systemSettings.read |
| POST | `/api/v1/admin/system-settings/logo` | Update system logo URL/reference | SUPER_ADMIN or ADMIN with systemSettings.update |
| POST | `/api/v1/admin/system-settings/smtp/test` | Send SMTP test email | SUPER_ADMIN or ADMIN with systemSettings.update |

### Admin - Transaction Monitoring (9 APIs)

| Method | Endpoint | Purpose | Access |
|---|---|---|---|
| GET | `/api/v1/admin/transactions` | List admin transactions | SUPER_ADMIN or ADMIN with transactions.read |
| GET | `/api/v1/admin/transactions/export` | Export admin transactions | SUPER_ADMIN or ADMIN with transactions.export |
| GET | `/api/v1/admin/transactions/stats` | Fetch transaction monitoring stats | SUPER_ADMIN or ADMIN with transactions.read |
| GET | `/api/v1/admin/transactions/{id}` | Fetch transaction details | SUPER_ADMIN or ADMIN with transactions.read |
| POST | `/api/v1/admin/transactions/{id}/notify-user` | Send transaction notification to user | SUPER_ADMIN or ADMIN with transactions.notifyUser |
| POST | `/api/v1/admin/transactions/{id}/open-dispute` | Open dispute from transaction | SUPER_ADMIN or ADMIN with transactions.openDispute |
| GET | `/api/v1/admin/transactions/{id}/receipt` | Download transaction receipt | SUPER_ADMIN or ADMIN with transactions.receipt.download |
| POST | `/api/v1/admin/transactions/{id}/refund` | Refund transaction | SUPER_ADMIN or ADMIN with transactions.refund |
| GET | `/api/v1/admin/transactions/{id}/timeline` | Fetch transaction timeline | SUPER_ADMIN or ADMIN with transactions.read |

### Admin - User Management (11 APIs)

| Method | Endpoint | Purpose | Access |
|---|---|---|---|
| GET | `/api/v1/users` | List registered users | SUPER_ADMIN or ADMIN with users.read |
| GET | `/api/v1/users/export` | List Users Export | SUPER_ADMIN or ADMIN with users.export |
| GET | `/api/v1/users/{id}` | Fetch Users details | SUPER_ADMIN or ADMIN with users.read |
| PATCH | `/api/v1/users/{id}` | Update Users | SUPER_ADMIN or ADMIN with users.update |
| DELETE | `/api/v1/users/{id}` | Permanently delete registered user | SUPER_ADMIN |
| GET | `/api/v1/users/{id}/activity` | Fetch Users Activity details | SUPER_ADMIN or ADMIN with users.read |
| POST | `/api/v1/users/{id}/reset-password` | Change registered user password | SUPER_ADMIN or ADMIN with users.resetPassword |
| GET | `/api/v1/users/{id}/stats` | Fetch Users Stats details | SUPER_ADMIN or ADMIN with users.read |
| PATCH | `/api/v1/users/{id}/status` | Update Users Status | SUPER_ADMIN or ADMIN with users.status.update |
| POST | `/api/v1/users/{id}/suspend` | Create Users Suspend | SUPER_ADMIN or ADMIN with users.suspend |
| POST | `/api/v1/users/{id}/unsuspend` | Create Users Unsuspend | SUPER_ADMIN or ADMIN with users.unsuspend |

### Admin - User Safety Moderation (4 APIs)

| Method | Endpoint | Purpose | Access |
|---|---|---|---|
| GET | `/api/v1/admin/user-safety/reports` | List user safety reports | Authenticated |
| GET | `/api/v1/admin/user-safety/reports/export` | Export user safety reports | Authenticated |
| GET | `/api/v1/admin/user-safety/reports/{id}` | Fetch user safety report detail | Authenticated |
| POST | `/api/v1/admin/user-safety/reports/{id}/action` | Moderate user safety report | Authenticated |

### Admin - Workflow Metadata (3 APIs)

| Method | Endpoint | Purpose | Access |
|---|---|---|---|
| GET | `/api/v1/admin/workflows/app-flow` | Fetch whole-system workflow app flow metadata | Authenticated |
| GET | `/api/v1/admin/workflows/state-machines` | Fetch declared system state machines | Authenticated |
| GET | `/api/v1/admin/workflows/transition-rules` | Fetch workflow transition guardrails and aliases | Authenticated |

### Auth (17 APIs)

| Method | Endpoint | Purpose | Access |
|---|---|---|---|
| DELETE | `/api/v1/auth/account` | Delete Auth Account | Authenticated |
| POST | `/api/v1/auth/cancel-deletion` | Create Auth Cancel Deletion | Authenticated |
| PATCH | `/api/v1/auth/change-password` | Update Auth Change Password | Authenticated |
| POST | `/api/v1/auth/forgot-password` | Create Auth Forgot Password | PUBLIC |
| POST | `/api/v1/auth/login` | Create Auth Login | PUBLIC |
| POST | `/api/v1/auth/logout` | Create Auth Logout | Authenticated |
| GET | `/api/v1/auth/me` | List Auth Me | Authenticated |
| PATCH | `/api/v1/auth/me` | Update Auth Me | Authenticated |
| POST | `/api/v1/auth/refresh` | Create Auth Refresh | PUBLIC |
| POST | `/api/v1/auth/resend-otp` | Create Auth Resend Otp | Authenticated |
| POST | `/api/v1/auth/resend-verification-email` | Resend verification email for unverified login | PUBLIC |
| POST | `/api/v1/auth/reset-password` | Create Auth Reset Password | PUBLIC |
| GET | `/api/v1/auth/sessions` | List Auth Sessions | Authenticated |
| POST | `/api/v1/auth/sessions/logout-all` | Create Auth Sessions Logout All | Authenticated |
| DELETE | `/api/v1/auth/sessions/{id}` | Delete Auth Sessions | Authenticated |
| POST | `/api/v1/auth/verify-email` | Create Auth Verify Email | Authenticated |
| POST | `/api/v1/auth/verify-reset-otp` | Verify public OTP for password reset or unverified email flow | PUBLIC |

### Auth - Login Attempts (3 APIs)

| Method | Endpoint | Purpose | Access |
|---|---|---|---|
| GET | `/api/v1/login-attempts` | List Login Attempts | SUPER_ADMIN or ADMIN with loginAttempts.read |
| GET | `/api/v1/login-attempts/export` | List Login Attempts Export | SUPER_ADMIN or ADMIN with loginAttempts.export |
| GET | `/api/v1/login-attempts/stats` | List Login Attempts Stats | SUPER_ADMIN or ADMIN with loginAttempts.read |

### Broadcast Notifications (10 APIs)

| Method | Endpoint | Purpose | Access |
|---|---|---|---|
| GET | `/api/v1/broadcasts` | List Broadcasts | SUPER_ADMIN or ADMIN with broadcasts.read |
| POST | `/api/v1/broadcasts` | Create Broadcasts | SUPER_ADMIN or ADMIN with broadcasts.create |
| POST | `/api/v1/broadcasts/estimate-reach` | Create Broadcasts Estimate Reach | SUPER_ADMIN or ADMIN with broadcasts.read |
| GET | `/api/v1/broadcasts/{id}` | Fetch Broadcasts details | SUPER_ADMIN or ADMIN with broadcasts.read |
| PATCH | `/api/v1/broadcasts/{id}` | Update Broadcasts | SUPER_ADMIN or ADMIN with broadcasts.update |
| POST | `/api/v1/broadcasts/{id}/cancel` | Create Broadcasts Cancel | SUPER_ADMIN or ADMIN with broadcasts.cancel |
| GET | `/api/v1/broadcasts/{id}/recipients` | Fetch Broadcasts Recipients details | SUPER_ADMIN or ADMIN with broadcasts.report.read |
| GET | `/api/v1/broadcasts/{id}/report` | Fetch Broadcasts Report details | SUPER_ADMIN or ADMIN with broadcasts.report.read |
| PATCH | `/api/v1/broadcasts/{id}/schedule` | Update Broadcasts Schedule | SUPER_ADMIN or ADMIN with broadcasts.schedule |
| PATCH | `/api/v1/broadcasts/{id}/targeting` | Update Broadcasts Targeting | SUPER_ADMIN or ADMIN with broadcasts.update |

### Gifts - Categories (6 APIs)

| Method | Endpoint | Purpose | Access |
|---|---|---|---|
| GET | `/api/v1/gift-categories` | List gift categories | SUPER_ADMIN or ADMIN with giftCategories.read |
| POST | `/api/v1/gift-categories` | Create gift category | SUPER_ADMIN or ADMIN with giftCategories.create |
| GET | `/api/v1/gift-categories/stats` | Fetch gift category stats | SUPER_ADMIN or ADMIN with giftCategories.read |
| GET | `/api/v1/gift-categories/{id}` | Fetch gift category details | SUPER_ADMIN or ADMIN with giftCategories.read |
| PATCH | `/api/v1/gift-categories/{id}` | Update gift category | SUPER_ADMIN or ADMIN with giftCategories.update |
| DELETE | `/api/v1/gift-categories/{id}` | Delete gift category | SUPER_ADMIN or ADMIN with giftCategories.delete |

### Gifts - Management (8 APIs)

| Method | Endpoint | Purpose | Access |
|---|---|---|---|
| GET | `/api/v1/gifts` | List admin gifts | SUPER_ADMIN or ADMIN with gifts.read |
| POST | `/api/v1/gifts` | Create admin gift with optional nested variants | SUPER_ADMIN or ADMIN with gifts.create |
| GET | `/api/v1/gifts/export` | Export gift inventory | SUPER_ADMIN or ADMIN with gifts.export |
| GET | `/api/v1/gifts/stats` | Fetch gift inventory stats | SUPER_ADMIN or ADMIN with gifts.read |
| GET | `/api/v1/gifts/{id}` | Fetch admin gift details with variants | SUPER_ADMIN or ADMIN with gifts.read |
| PATCH | `/api/v1/gifts/{id}` | Update admin gift and upsert nested variants | SUPER_ADMIN or ADMIN with gifts.update |
| DELETE | `/api/v1/gifts/{id}` | Delete gift | SUPER_ADMIN or ADMIN with gifts.delete |
| PATCH | `/api/v1/gifts/{id}/status` | Update gift status | SUPER_ADMIN or ADMIN with gifts.status.update |

### Gifts - Moderation (4 APIs)

| Method | Endpoint | Purpose | Access |
|---|---|---|---|
| GET | `/api/v1/gift-moderation` | List optional gift moderation queue | SUPER_ADMIN or ADMIN with giftModeration.read |
| PATCH | `/api/v1/gift-moderation/{id}/approve` | Approve gift in optional moderation workflow | SUPER_ADMIN or ADMIN with giftModeration.approve |
| PATCH | `/api/v1/gift-moderation/{id}/flag` | Flag gift for manual review | SUPER_ADMIN or ADMIN with giftModeration.flag |
| PATCH | `/api/v1/gift-moderation/{id}/reject` | Reject gift in optional moderation workflow | SUPER_ADMIN or ADMIN with giftModeration.reject |

### Notifications (9 APIs)

| Method | Endpoint | Purpose | Access |
|---|---|---|---|
| GET | `/api/v1/notifications` | List notifications | SUPER_ADMIN, ADMIN, PROVIDER, or REGISTERED_USER |
| POST | `/api/v1/notifications/device-tokens` | Save device token | SUPER_ADMIN, ADMIN, PROVIDER, or REGISTERED_USER |
| DELETE | `/api/v1/notifications/device-tokens/{id}` | Disable device token | SUPER_ADMIN, ADMIN, PROVIDER, or REGISTERED_USER |
| GET | `/api/v1/notifications/preferences` | Fetch notification preferences | SUPER_ADMIN, ADMIN, PROVIDER, or REGISTERED_USER |
| PATCH | `/api/v1/notifications/preferences` | Update notification preferences | SUPER_ADMIN, ADMIN, PROVIDER, or REGISTERED_USER |
| PATCH | `/api/v1/notifications/read-all` | Mark all own notifications as read | SUPER_ADMIN, ADMIN, PROVIDER, or REGISTERED_USER |
| GET | `/api/v1/notifications/summary` | Fetch notification summary | SUPER_ADMIN, ADMIN, PROVIDER, or REGISTERED_USER |
| POST | `/api/v1/notifications/{id}/action` | Process notification action | SUPER_ADMIN, ADMIN, PROVIDER, or REGISTERED_USER |
| PATCH | `/api/v1/notifications/{id}/read` | Mark notification as read | SUPER_ADMIN, ADMIN, PROVIDER, or REGISTERED_USER |

### Plans & Coupons (21 APIs)

| Method | Endpoint | Purpose | Access |
|---|---|---|---|
| GET | `/api/v1/coupons` | List Coupons | SUPER_ADMIN or ADMIN with coupons.read |
| POST | `/api/v1/coupons` | Create Coupons | SUPER_ADMIN or ADMIN with coupons.create |
| GET | `/api/v1/coupons/{id}` | Fetch Coupons details | SUPER_ADMIN or ADMIN with coupons.read |
| PATCH | `/api/v1/coupons/{id}` | Update Coupons | SUPER_ADMIN or ADMIN with coupons.update |
| DELETE | `/api/v1/coupons/{id}` | Delete Coupons | SUPER_ADMIN or ADMIN with coupons.delete |
| PATCH | `/api/v1/coupons/{id}/status` | Update Coupons Status | SUPER_ADMIN or ADMIN with coupons.status.update |
| GET | `/api/v1/plan-features` | List Plan Features | SUPER_ADMIN or ADMIN with planFeatures.read |
| POST | `/api/v1/plan-features` | Create Plan Features | SUPER_ADMIN or ADMIN with planFeatures.create |
| GET | `/api/v1/plan-features/catalog` | List Plan Features Catalog | SUPER_ADMIN or ADMIN with planFeatures.read |
| GET | `/api/v1/plan-features/{id}` | Fetch Plan Features details | SUPER_ADMIN or ADMIN with planFeatures.read |
| PATCH | `/api/v1/plan-features/{id}` | Update Plan Features | SUPER_ADMIN or ADMIN with planFeatures.update |
| DELETE | `/api/v1/plan-features/{id}` | Delete Plan Features | SUPER_ADMIN or ADMIN with planFeatures.delete |
| GET | `/api/v1/subscription-plans` | List Subscription Plans | SUPER_ADMIN or ADMIN with subscriptionPlans.read |
| POST | `/api/v1/subscription-plans` | Create Subscription Plans | SUPER_ADMIN or ADMIN with subscriptionPlans.create |
| GET | `/api/v1/subscription-plans/stats` | List Subscription Plans Stats | SUPER_ADMIN or ADMIN with subscriptionPlans.analytics.read |
| GET | `/api/v1/subscription-plans/{id}` | Fetch Subscription Plans details | SUPER_ADMIN or ADMIN with subscriptionPlans.read |
| PATCH | `/api/v1/subscription-plans/{id}` | Update Subscription Plans | SUPER_ADMIN or ADMIN with subscriptionPlans.update |
| DELETE | `/api/v1/subscription-plans/{id}` | Delete Subscription Plans | SUPER_ADMIN or ADMIN with subscriptionPlans.delete |
| GET | `/api/v1/subscription-plans/{id}/analytics` | Fetch Subscription Plans Analytics details | SUPER_ADMIN or ADMIN with subscriptionPlans.analytics.read |
| PATCH | `/api/v1/subscription-plans/{id}/status` | Update Subscription Plans Status | SUPER_ADMIN or ADMIN with subscriptionPlans.status.update |
| PATCH | `/api/v1/subscription-plans/{id}/visibility` | Update Subscription Plans Visibility | SUPER_ADMIN or ADMIN with subscriptionPlans.visibility.update |

### Storage (5 APIs)

| Method | Endpoint | Purpose | Access |
|---|---|---|---|
| GET | `/api/v1/uploads` | List uploads | SUPER_ADMIN, ADMIN, PROVIDER, or REGISTERED_USER |
| POST | `/api/v1/uploads/complete` | Complete upload | SUPER_ADMIN, ADMIN, PROVIDER, or REGISTERED_USER |
| POST | `/api/v1/uploads/presigned-url` | Create presigned upload URL | SUPER_ADMIN, ADMIN, PROVIDER, or REGISTERED_USER |
| GET | `/api/v1/uploads/{id}` | Fetch upload details | SUPER_ADMIN, ADMIN, PROVIDER, or REGISTERED_USER |
| DELETE | `/api/v1/uploads/{id}` | Delete upload | SUPER_ADMIN, ADMIN, PROVIDER, or REGISTERED_USER |

## Registered User APIs

### Auth (19 APIs)

| Method | Endpoint | Purpose | Access |
|---|---|---|---|
| DELETE | `/api/v1/auth/account` | Delete Auth Account | Authenticated |
| POST | `/api/v1/auth/cancel-deletion` | Create Auth Cancel Deletion | Authenticated |
| PATCH | `/api/v1/auth/change-password` | Update Auth Change Password | Authenticated |
| POST | `/api/v1/auth/forgot-password` | Create Auth Forgot Password | PUBLIC |
| POST | `/api/v1/auth/guest/session` | Create guest browsing session | PUBLIC |
| POST | `/api/v1/auth/login` | Create Auth Login | PUBLIC |
| POST | `/api/v1/auth/logout` | Create Auth Logout | Authenticated |
| GET | `/api/v1/auth/me` | List Auth Me | Authenticated |
| PATCH | `/api/v1/auth/me` | Update Auth Me | Authenticated |
| POST | `/api/v1/auth/refresh` | Create Auth Refresh | PUBLIC |
| POST | `/api/v1/auth/resend-otp` | Create Auth Resend Otp | Authenticated |
| POST | `/api/v1/auth/resend-verification-email` | Resend verification email for unverified login | PUBLIC |
| POST | `/api/v1/auth/reset-password` | Create Auth Reset Password | PUBLIC |
| GET | `/api/v1/auth/sessions` | List Auth Sessions | Authenticated |
| POST | `/api/v1/auth/sessions/logout-all` | Create Auth Sessions Logout All | Authenticated |
| DELETE | `/api/v1/auth/sessions/{id}` | Delete Auth Sessions | Authenticated |
| POST | `/api/v1/auth/users/register` | Create Auth Users Register | PUBLIC |
| POST | `/api/v1/auth/verify-email` | Create Auth Verify Email | Authenticated |
| POST | `/api/v1/auth/verify-reset-otp` | Verify public OTP for password reset or unverified email flow | PUBLIC |

### Chat - Threads (11 APIs)

| Method | Endpoint | Purpose | Access |
|---|---|---|---|
| GET | `/api/v1/chats` | List chat threads | REGISTERED_USER, PROVIDER, SUPER_ADMIN, or ADMIN with chat/support permission |
| GET | `/api/v1/chats/quick-replies` | Fetch role-aware chat quick replies | REGISTERED_USER, PROVIDER, SUPER_ADMIN, or ADMIN |
| POST | `/api/v1/chats/threads` | Create or get a chat thread | REGISTERED_USER, PROVIDER, SUPER_ADMIN, or ADMIN with supportChats.reply/messageModeration permission |
| GET | `/api/v1/chats/threads/{threadId}` | Fetch chat thread details | REGISTERED_USER, PROVIDER, SUPER_ADMIN, or ADMIN with chat/support permission |
| GET | `/api/v1/chats/threads/{threadId}/audit-log` | Fetch chat thread audit log | SUPER_ADMIN or ADMIN with supportChats.read |
| GET | `/api/v1/chats/threads/{threadId}/messages` | Fetch chat thread messages | REGISTERED_USER, PROVIDER, SUPER_ADMIN, or ADMIN with chat/support permission |
| POST | `/api/v1/chats/threads/{threadId}/messages` | Send a chat message | REGISTERED_USER, PROVIDER, SUPER_ADMIN, or ADMIN with supportChats.reply |
| PATCH | `/api/v1/chats/threads/{threadId}/read` | Mark a chat thread as read | REGISTERED_USER, PROVIDER, SUPER_ADMIN, or ADMIN with supportChats.read |
| POST | `/api/v1/chats/threads/{threadId}/reopen` | Reopen a support chat thread | SUPER_ADMIN or ADMIN with supportChats.resolve |
| POST | `/api/v1/chats/threads/{threadId}/resolve` | Resolve a support chat thread | SUPER_ADMIN or ADMIN with supportChats.resolve |
| PATCH | `/api/v1/chats/threads/{threadId}/status` | Update chat thread status | SUPER_ADMIN or ADMIN with supportChats.resolve |

### Customer - Addresses (6 APIs)

| Method | Endpoint | Purpose | Access |
|---|---|---|---|
| GET | `/api/v1/customer/addresses` | List customer addresses | REGISTERED_USER |
| POST | `/api/v1/customer/addresses` | Create customer address | REGISTERED_USER |
| GET | `/api/v1/customer/addresses/{id}` | Fetch customer address | REGISTERED_USER |
| PATCH | `/api/v1/customer/addresses/{id}` | Update customer address | REGISTERED_USER |
| DELETE | `/api/v1/customer/addresses/{id}` | Delete customer address | REGISTERED_USER |
| PATCH | `/api/v1/customer/addresses/{id}/default` | Set default customer address | REGISTERED_USER |

### Customer - Cart (5 APIs)

| Method | Endpoint | Purpose | Access |
|---|---|---|---|
| GET | `/api/v1/customer/cart` | Fetch active cart | REGISTERED_USER |
| DELETE | `/api/v1/customer/cart` | Clear active cart | REGISTERED_USER |
| POST | `/api/v1/customer/cart/items` | Add item to cart | REGISTERED_USER |
| PATCH | `/api/v1/customer/cart/items/{id}` | Update cart item | REGISTERED_USER |
| DELETE | `/api/v1/customer/cart/items/{id}` | Delete cart item | REGISTERED_USER |

### Customer - Contacts (5 APIs)

| Method | Endpoint | Purpose | Access |
|---|---|---|---|
| GET | `/api/v1/customer/contacts` | List customer contacts | REGISTERED_USER |
| POST | `/api/v1/customer/contacts` | Create customer contact | REGISTERED_USER |
| GET | `/api/v1/customer/contacts/{id}` | Fetch customer contact | REGISTERED_USER |
| PATCH | `/api/v1/customer/contacts/{id}` | Update customer contact | REGISTERED_USER |
| DELETE | `/api/v1/customer/contacts/{id}` | Delete customer contact | REGISTERED_USER |

### Customer - Events (9 APIs)

| Method | Endpoint | Purpose | Access |
|---|---|---|---|
| GET | `/api/v1/customer/events` | List customer events | REGISTERED_USER |
| POST | `/api/v1/customer/events` | Create customer event | REGISTERED_USER |
| GET | `/api/v1/customer/events/calendar` | Fetch monthly calendar events | REGISTERED_USER |
| GET | `/api/v1/customer/events/upcoming` | Fetch upcoming customer events | REGISTERED_USER |
| GET | `/api/v1/customer/events/{id}` | Fetch customer event details | REGISTERED_USER |
| PATCH | `/api/v1/customer/events/{id}` | Update customer event | REGISTERED_USER |
| DELETE | `/api/v1/customer/events/{id}` | Delete customer event | REGISTERED_USER |
| GET | `/api/v1/customer/events/{id}/reminder-settings` | Fetch event reminder settings | REGISTERED_USER |
| PATCH | `/api/v1/customer/events/{id}/reminder-settings` | Update event reminder settings | REGISTERED_USER |

### Customer - Orders (3 APIs)

| Method | Endpoint | Purpose | Access |
|---|---|---|---|
| GET | `/api/v1/customer/orders` | List customer orders | REGISTERED_USER |
| POST | `/api/v1/customer/orders` | Create order from active cart | REGISTERED_USER |
| GET | `/api/v1/customer/orders/{id}` | Fetch customer order | REGISTERED_USER |

### Customer - Payment Methods (9 APIs)

| Method | Endpoint | Purpose | Access |
|---|---|---|---|
| GET | `/api/v1/customer/bank-accounts` | List own bank accounts | REGISTERED_USER |
| POST | `/api/v1/customer/bank-accounts` | Link placeholder bank account | REGISTERED_USER |
| DELETE | `/api/v1/customer/bank-accounts/{id}` | Delete own bank account | REGISTERED_USER |
| PATCH | `/api/v1/customer/bank-accounts/{id}/default` | Set own default bank account | REGISTERED_USER |
| GET | `/api/v1/customer/payment-methods` | List supported customer payment methods | REGISTERED_USER |
| GET | `/api/v1/customer/payment-methods/saved` | List own saved payment methods | REGISTERED_USER |
| POST | `/api/v1/customer/payment-methods/setup-intent` | Create Stripe SetupIntent for saving card | REGISTERED_USER |
| DELETE | `/api/v1/customer/payment-methods/{id}` | Delete own saved payment method | REGISTERED_USER |
| PATCH | `/api/v1/customer/payment-methods/{id}/default` | Set own default payment method | REGISTERED_USER |

### Customer - Recurring Payments (9 APIs)

| Method | Endpoint | Purpose | Access |
|---|---|---|---|
| GET | `/api/v1/customer/recurring-payments` | List own recurring payments | REGISTERED_USER |
| POST | `/api/v1/customer/recurring-payments` | Create recurring payment | REGISTERED_USER |
| GET | `/api/v1/customer/recurring-payments/summary` | Fetch recurring payment summary counts | REGISTERED_USER |
| GET | `/api/v1/customer/recurring-payments/{id}` | Fetch own recurring payment details | REGISTERED_USER |
| PATCH | `/api/v1/customer/recurring-payments/{id}` | Update own recurring payment | REGISTERED_USER |
| POST | `/api/v1/customer/recurring-payments/{id}/cancel` | Cancel own recurring payment | REGISTERED_USER |
| GET | `/api/v1/customer/recurring-payments/{id}/history` | List own recurring payment billing history | REGISTERED_USER |
| POST | `/api/v1/customer/recurring-payments/{id}/pause` | Pause own active recurring payment | REGISTERED_USER |
| POST | `/api/v1/customer/recurring-payments/{id}/resume` | Resume own paused recurring payment | REGISTERED_USER |

### Customer - Referrals & Rewards (7 APIs)

| Method | Endpoint | Purpose | Access |
|---|---|---|---|
| GET | `/api/v1/customer/referrals/history` | List own referral history | REGISTERED_USER |
| GET | `/api/v1/customer/referrals/link` | Fetch own referral link | REGISTERED_USER |
| POST | `/api/v1/customer/referrals/redeem` | Redeem own available reward credit | REGISTERED_USER |
| GET | `/api/v1/customer/referrals/summary` | Fetch own referral reward summary | REGISTERED_USER |
| GET | `/api/v1/customer/referrals/terms` | Fetch referral terms | REGISTERED_USER |
| GET | `/api/v1/customer/rewards/balance` | Fetch own reward balance | REGISTERED_USER |
| GET | `/api/v1/customer/rewards/ledger` | List own reward ledger | REGISTERED_USER |

### Customer - Reviews (5 APIs)

| Method | Endpoint | Purpose | Access |
|---|---|---|---|
| POST | `/api/v1/customer/orders/{id}/reviews` | Submit provider review for an order | REGISTERED_USER |
| GET | `/api/v1/customer/reviews` | List own provider reviews | REGISTERED_USER |
| GET | `/api/v1/customer/reviews/{id}` | Fetch Customer Reviews details | REGISTERED_USER |
| PATCH | `/api/v1/customer/reviews/{id}` | Update own review | REGISTERED_USER |
| DELETE | `/api/v1/customer/reviews/{id}` | Delete own review | REGISTERED_USER |

### Customer - Subscriptions (9 APIs)

| Method | Endpoint | Purpose | Access |
|---|---|---|---|
| POST | `/api/v1/customer/subscription/apply-coupon` | Preview subscription coupon | REGISTERED_USER |
| POST | `/api/v1/customer/subscription/cancel` | Cancel own subscription | REGISTERED_USER |
| POST | `/api/v1/customer/subscription/checkout` | Create Stripe subscription checkout | REGISTERED_USER |
| POST | `/api/v1/customer/subscription/confirm` | Confirm Stripe subscription activation | REGISTERED_USER |
| GET | `/api/v1/customer/subscription/current` | Fetch own current subscription | REGISTERED_USER |
| GET | `/api/v1/customer/subscription/invoices` | List own subscription invoices | REGISTERED_USER |
| GET | `/api/v1/customer/subscription/invoices/{id}` | Fetch own subscription invoice details | REGISTERED_USER |
| GET | `/api/v1/customer/subscription/plans` | List public active subscription plans | REGISTERED_USER |
| POST | `/api/v1/customer/subscription/reactivate` | Reactivate scheduled cancellation | REGISTERED_USER |

### Customer - Transactions (5 APIs)

| Method | Endpoint | Purpose | Access |
|---|---|---|---|
| GET | `/api/v1/customer/transactions` | List own customer transactions | REGISTERED_USER |
| GET | `/api/v1/customer/transactions/export` | Export own transactions | REGISTERED_USER |
| GET | `/api/v1/customer/transactions/summary` | Fetch own transaction summary | REGISTERED_USER |
| GET | `/api/v1/customer/transactions/{id}` | Fetch own transaction details | REGISTERED_USER |
| GET | `/api/v1/customer/transactions/{id}/receipt` | Download own transaction receipt | REGISTERED_USER |

### Customer - User Safety (7 APIs)

| Method | Endpoint | Purpose | Access |
|---|---|---|---|
| GET | `/api/v1/customer/blocked-users` | List blocked users | REGISTERED_USER |
| POST | `/api/v1/customer/blocked-users/{userId}` | Block another user | REGISTERED_USER |
| DELETE | `/api/v1/customer/blocked-users/{userId}` | Unblock user | REGISTERED_USER |
| GET | `/api/v1/customer/user-report-reasons` | Fetch generic user report reasons | REGISTERED_USER |
| GET | `/api/v1/customer/user-reports` | List own user safety reports | REGISTERED_USER |
| GET | `/api/v1/customer/user-reports/{id}` | Fetch own user safety report detail | REGISTERED_USER |
| POST | `/api/v1/customer/users/{userId}/reports` | Report another user | REGISTERED_USER |

### Customer - Wallet (3 APIs)

| Method | Endpoint | Purpose | Access |
|---|---|---|---|
| GET | `/api/v1/customer/wallet` | Fetch own wallet | REGISTERED_USER |
| POST | `/api/v1/customer/wallet/add-funds` | Create wallet top-up payment | REGISTERED_USER |
| GET | `/api/v1/customer/wallet/history` | List own wallet history | REGISTERED_USER |

### Customer - Wishlist (3 APIs)

| Method | Endpoint | Purpose | Access |
|---|---|---|---|
| GET | `/api/v1/customer/wishlist` | List wishlist gifts | REGISTERED_USER |
| POST | `/api/v1/customer/wishlist/{giftId}` | Add gift to wishlist | REGISTERED_USER |
| DELETE | `/api/v1/customer/wishlist/{giftId}` | Remove gift from wishlist | REGISTERED_USER |

### Customer / Guest - Marketplace (6 APIs)

| Method | Endpoint | Purpose | Access |
|---|---|---|---|
| GET | `/api/v1/customer/categories` | List customer marketplace categories | REGISTERED_USER or GUEST_USER |
| GET | `/api/v1/customer/gifts` | List customer marketplace gifts | REGISTERED_USER or GUEST_USER |
| GET | `/api/v1/customer/gifts/discounted` | List discounted customer gifts | REGISTERED_USER or GUEST_USER |
| GET | `/api/v1/customer/gifts/filter-options` | Fetch marketplace gift filter options | REGISTERED_USER or GUEST_USER |
| GET | `/api/v1/customer/gifts/{id}` | Fetch customer-safe gift details | REGISTERED_USER or GUEST_USER |
| GET | `/api/v1/customer/home` | Fetch customer app home | REGISTERED_USER or GUEST_USER |

### Gifts - Categories (1 APIs)

| Method | Endpoint | Purpose | Access |
|---|---|---|---|
| GET | `/api/v1/gift-categories/lookup` | Lookup active gift categories | PUBLIC |

### Notifications (9 APIs)

| Method | Endpoint | Purpose | Access |
|---|---|---|---|
| GET | `/api/v1/notifications` | List notifications | SUPER_ADMIN, ADMIN, PROVIDER, or REGISTERED_USER |
| POST | `/api/v1/notifications/device-tokens` | Save device token | SUPER_ADMIN, ADMIN, PROVIDER, or REGISTERED_USER |
| DELETE | `/api/v1/notifications/device-tokens/{id}` | Disable device token | SUPER_ADMIN, ADMIN, PROVIDER, or REGISTERED_USER |
| GET | `/api/v1/notifications/preferences` | Fetch notification preferences | SUPER_ADMIN, ADMIN, PROVIDER, or REGISTERED_USER |
| PATCH | `/api/v1/notifications/preferences` | Update notification preferences | SUPER_ADMIN, ADMIN, PROVIDER, or REGISTERED_USER |
| PATCH | `/api/v1/notifications/read-all` | Mark all own notifications as read | SUPER_ADMIN, ADMIN, PROVIDER, or REGISTERED_USER |
| GET | `/api/v1/notifications/summary` | Fetch notification summary | SUPER_ADMIN, ADMIN, PROVIDER, or REGISTERED_USER |
| POST | `/api/v1/notifications/{id}/action` | Process notification action | SUPER_ADMIN, ADMIN, PROVIDER, or REGISTERED_USER |
| PATCH | `/api/v1/notifications/{id}/read` | Mark notification as read | SUPER_ADMIN, ADMIN, PROVIDER, or REGISTERED_USER |

### Payments (7 APIs)

| Method | Endpoint | Purpose | Access |
|---|---|---|---|
| GET | `/api/v1/customer/money-gifts` | List own money gifts | REGISTERED_USER |
| POST | `/api/v1/customer/money-gifts` | Send payment as gift | REGISTERED_USER |
| GET | `/api/v1/customer/money-gifts/{id}` | Fetch own money gift details | REGISTERED_USER |
| POST | `/api/v1/customer/payments/confirm` | Confirm Stripe payment | REGISTERED_USER |
| POST | `/api/v1/customer/payments/create-intent` | Create payment intent from active cart | REGISTERED_USER |
| GET | `/api/v1/customer/payments/{id}` | Fetch own payment details | REGISTERED_USER |
| POST | `/api/v1/payments/stripe/webhook` | Stripe webhook endpoint | PUBLIC |

### Storage (5 APIs)

| Method | Endpoint | Purpose | Access |
|---|---|---|---|
| GET | `/api/v1/uploads` | List uploads | SUPER_ADMIN, ADMIN, PROVIDER, or REGISTERED_USER |
| POST | `/api/v1/uploads/complete` | Complete upload | SUPER_ADMIN, ADMIN, PROVIDER, or REGISTERED_USER |
| POST | `/api/v1/uploads/presigned-url` | Create presigned upload URL | SUPER_ADMIN, ADMIN, PROVIDER, or REGISTERED_USER |
| GET | `/api/v1/uploads/{id}` | Fetch upload details | SUPER_ADMIN, ADMIN, PROVIDER, or REGISTERED_USER |
| DELETE | `/api/v1/uploads/{id}` | Delete upload | SUPER_ADMIN, ADMIN, PROVIDER, or REGISTERED_USER |

## Provider APIs

### Auth (18 APIs)

| Method | Endpoint | Purpose | Access |
|---|---|---|---|
| DELETE | `/api/v1/auth/account` | Delete Auth Account | Authenticated |
| POST | `/api/v1/auth/cancel-deletion` | Create Auth Cancel Deletion | Authenticated |
| PATCH | `/api/v1/auth/change-password` | Update Auth Change Password | Authenticated |
| POST | `/api/v1/auth/forgot-password` | Create Auth Forgot Password | PUBLIC |
| POST | `/api/v1/auth/login` | Create Auth Login | PUBLIC |
| POST | `/api/v1/auth/logout` | Create Auth Logout | Authenticated |
| GET | `/api/v1/auth/me` | List Auth Me | Authenticated |
| PATCH | `/api/v1/auth/me` | Update Auth Me | Authenticated |
| POST | `/api/v1/auth/providers/register` | Create Auth Providers Register | PUBLIC |
| POST | `/api/v1/auth/refresh` | Create Auth Refresh | PUBLIC |
| POST | `/api/v1/auth/resend-otp` | Create Auth Resend Otp | Authenticated |
| POST | `/api/v1/auth/resend-verification-email` | Resend verification email for unverified login | PUBLIC |
| POST | `/api/v1/auth/reset-password` | Create Auth Reset Password | PUBLIC |
| GET | `/api/v1/auth/sessions` | List Auth Sessions | Authenticated |
| POST | `/api/v1/auth/sessions/logout-all` | Create Auth Sessions Logout All | Authenticated |
| DELETE | `/api/v1/auth/sessions/{id}` | Delete Auth Sessions | Authenticated |
| POST | `/api/v1/auth/verify-email` | Create Auth Verify Email | Authenticated |
| POST | `/api/v1/auth/verify-reset-otp` | Verify public OTP for password reset or unverified email flow | PUBLIC |

### Customer - Provider Reports (4 APIs)

| Method | Endpoint | Purpose | Access |
|---|---|---|---|
| GET | `/api/v1/customer/provider-report-reasons` | Fetch provider report reasons | REGISTERED_USER |
| GET | `/api/v1/customer/provider-reports` | List Customer Provider Reports | REGISTERED_USER |
| GET | `/api/v1/customer/provider-reports/{id}` | Fetch Customer Provider Reports details | REGISTERED_USER |
| POST | `/api/v1/customer/providers/{providerId}/reports` | Report provider | REGISTERED_USER |

### Notifications (9 APIs)

| Method | Endpoint | Purpose | Access |
|---|---|---|---|
| GET | `/api/v1/notifications` | List notifications | SUPER_ADMIN, ADMIN, PROVIDER, or REGISTERED_USER |
| POST | `/api/v1/notifications/device-tokens` | Save device token | SUPER_ADMIN, ADMIN, PROVIDER, or REGISTERED_USER |
| DELETE | `/api/v1/notifications/device-tokens/{id}` | Disable device token | SUPER_ADMIN, ADMIN, PROVIDER, or REGISTERED_USER |
| GET | `/api/v1/notifications/preferences` | Fetch notification preferences | SUPER_ADMIN, ADMIN, PROVIDER, or REGISTERED_USER |
| PATCH | `/api/v1/notifications/preferences` | Update notification preferences | SUPER_ADMIN, ADMIN, PROVIDER, or REGISTERED_USER |
| PATCH | `/api/v1/notifications/read-all` | Mark all own notifications as read | SUPER_ADMIN, ADMIN, PROVIDER, or REGISTERED_USER |
| GET | `/api/v1/notifications/summary` | Fetch notification summary | SUPER_ADMIN, ADMIN, PROVIDER, or REGISTERED_USER |
| POST | `/api/v1/notifications/{id}/action` | Process notification action | SUPER_ADMIN, ADMIN, PROVIDER, or REGISTERED_USER |
| PATCH | `/api/v1/notifications/{id}/read` | Mark notification as read | SUPER_ADMIN, ADMIN, PROVIDER, or REGISTERED_USER |

### Provider - Business Info (2 APIs)

| Method | Endpoint | Purpose | Access |
|---|---|---|---|
| GET | `/api/v1/provider/business-info` | Fetch own provider business information | PROVIDER |
| PATCH | `/api/v1/provider/business-info` | Update own provider business information | PROVIDER |

### Provider - Dashboard (1 APIs)

| Method | Endpoint | Purpose | Access |
|---|---|---|---|
| GET | `/api/v1/provider/dashboard` | Fetch mobile provider dashboard | Authenticated |

### Provider - Earnings (3 APIs)

| Method | Endpoint | Purpose | Access |
|---|---|---|---|
| GET | `/api/v1/provider/earnings/chart` | Fetch own provider earnings chart | PROVIDER |
| GET | `/api/v1/provider/earnings/ledger` | List own provider earnings ledger | PROVIDER |
| GET | `/api/v1/provider/earnings/summary` | Fetch own provider earnings summary | PROVIDER |

### Provider - Inventory (8 APIs)

| Method | Endpoint | Purpose | Access |
|---|---|---|---|
| GET | `/api/v1/provider/inventory` | List provider inventory items | PROVIDER |
| POST | `/api/v1/provider/inventory` | Create provider inventory item with optional nested variants | PROVIDER |
| GET | `/api/v1/provider/inventory/lookup` | Lookup active provider inventory items | PROVIDER |
| GET | `/api/v1/provider/inventory/stats` | Fetch provider inventory stats | PROVIDER |
| GET | `/api/v1/provider/inventory/{id}` | Fetch own provider inventory item details | PROVIDER |
| PATCH | `/api/v1/provider/inventory/{id}` | Update own provider inventory item and upsert variants | PROVIDER |
| DELETE | `/api/v1/provider/inventory/{id}` | Delete own inventory item | PROVIDER |
| PATCH | `/api/v1/provider/inventory/{id}/availability` | Update own inventory availability | PROVIDER |

### Provider - Order Analytics (5 APIs)

| Method | Endpoint | Purpose | Access |
|---|---|---|---|
| GET | `/api/v1/provider/orders/analytics/ratings` | Fetch own provider ratings analytics | PROVIDER |
| GET | `/api/v1/provider/orders/analytics/revenue` | Fetch own provider revenue analytics | PROVIDER |
| GET | `/api/v1/provider/orders/export` | Export own provider orders as CSV | PROVIDER |
| GET | `/api/v1/provider/orders/performance` | Fetch own provider order performance | PROVIDER |
| GET | `/api/v1/provider/orders/recent` | List recent own provider orders | PROVIDER |

### Provider - Orders (13 APIs)

| Method | Endpoint | Purpose | Access |
|---|---|---|---|
| GET | `/api/v1/provider/orders` | List own assigned provider orders | PROVIDER |
| GET | `/api/v1/provider/orders/history` | List own provider order history | PROVIDER |
| GET | `/api/v1/provider/orders/reject-reasons` | List provider order reject reasons | PROVIDER |
| GET | `/api/v1/provider/orders/summary` | Fetch own provider order summary | PROVIDER |
| GET | `/api/v1/provider/orders/{id}` | Fetch own provider order details | PROVIDER |
| POST | `/api/v1/provider/orders/{id}/accept` | Accept own pending provider order | PROVIDER |
| GET | `/api/v1/provider/orders/{id}/checklist` | Fetch own provider order checklist | PROVIDER |
| PATCH | `/api/v1/provider/orders/{id}/checklist` | Update own provider order checklist | PROVIDER |
| POST | `/api/v1/provider/orders/{id}/fulfill` | Fulfill own provider order with dispatch details | PROVIDER |
| POST | `/api/v1/provider/orders/{id}/message-buyer` | Message buyer for own provider order | PROVIDER |
| POST | `/api/v1/provider/orders/{id}/reject` | Reject own pending provider order | PROVIDER |
| PATCH | `/api/v1/provider/orders/{id}/status` | Update own provider order fulfillment status | PROVIDER |
| GET | `/api/v1/provider/orders/{id}/timeline` | Fetch own provider order timeline | PROVIDER |

### Provider - Payout Methods (7 APIs)

| Method | Endpoint | Purpose | Access |
|---|---|---|---|
| GET | `/api/v1/provider/payout-methods` | List own provider payout methods | PROVIDER |
| POST | `/api/v1/provider/payout-methods/bank-accounts` | Add provider bank payout method | PROVIDER |
| GET | `/api/v1/provider/payout-methods/{id}` | Fetch own provider payout method details | PROVIDER |
| PATCH | `/api/v1/provider/payout-methods/{id}` | Update provider payout method display metadata | PROVIDER |
| DELETE | `/api/v1/provider/payout-methods/{id}` | Delete own provider payout method | PROVIDER |
| PATCH | `/api/v1/provider/payout-methods/{id}/default` | Set default provider payout method | PROVIDER |
| POST | `/api/v1/provider/payout-methods/{id}/verify` | Start provider payout method verification | PROVIDER |

### Provider - Payouts (6 APIs)

| Method | Endpoint | Purpose | Access |
|---|---|---|---|
| GET | `/api/v1/provider/payouts` | List own provider payout history | PROVIDER |
| GET | `/api/v1/provider/payouts/preview` | Preview provider payout request | PROVIDER |
| POST | `/api/v1/provider/payouts/request` | Request provider payout | PROVIDER |
| GET | `/api/v1/provider/payouts/summary` | Fetch own provider payout summary | PROVIDER |
| GET | `/api/v1/provider/payouts/{id}` | Fetch own provider payout details | PROVIDER |
| POST | `/api/v1/provider/payouts/{id}/cancel` | Cancel own pending provider payout | PROVIDER |

### Provider - Promotional Offers (6 APIs)

| Method | Endpoint | Purpose | Access |
|---|---|---|---|
| GET | `/api/v1/provider/offers` | List Provider Offers | PROVIDER |
| POST | `/api/v1/provider/offers` | Create Provider Offers | PROVIDER |
| GET | `/api/v1/provider/offers/{id}` | Fetch Provider Offers details | PROVIDER |
| PATCH | `/api/v1/provider/offers/{id}` | Update Provider Offers | PROVIDER |
| DELETE | `/api/v1/provider/offers/{id}` | Delete Provider Offers | PROVIDER |
| PATCH | `/api/v1/provider/offers/{id}/status` | Update Provider Offers Status | PROVIDER |

### Provider - Refund Requests (6 APIs)

| Method | Endpoint | Purpose | Access |
|---|---|---|---|
| GET | `/api/v1/provider/refund-requests` | List own provider refund requests | PROVIDER |
| GET | `/api/v1/provider/refund-requests/reject-reasons` | List refund rejection reasons | PROVIDER |
| GET | `/api/v1/provider/refund-requests/summary` | Fetch own refund request summary | PROVIDER |
| GET | `/api/v1/provider/refund-requests/{id}` | Fetch own refund request details | PROVIDER |
| POST | `/api/v1/provider/refund-requests/{id}/approve` | Approve own requested refund | PROVIDER |
| POST | `/api/v1/provider/refund-requests/{id}/reject` | Reject own requested refund | PROVIDER |

### Provider - Reviews (7 APIs)

| Method | Endpoint | Purpose | Access |
|---|---|---|---|
| GET | `/api/v1/provider/reviews` | List provider reviews | PROVIDER |
| GET | `/api/v1/provider/reviews/filter-options` | Fetch provider review filter options | PROVIDER |
| GET | `/api/v1/provider/reviews/summary` | Fetch provider rating summary | PROVIDER |
| GET | `/api/v1/provider/reviews/{id}` | Fetch Provider Reviews details | PROVIDER |
| POST | `/api/v1/provider/reviews/{id}/response` | Post public review response | PROVIDER |
| PATCH | `/api/v1/provider/reviews/{id}/response` | Update public review response | PROVIDER |
| DELETE | `/api/v1/provider/reviews/{id}/response` | Delete public review response | PROVIDER |

### Storage (5 APIs)

| Method | Endpoint | Purpose | Access |
|---|---|---|---|
| GET | `/api/v1/uploads` | List uploads | SUPER_ADMIN, ADMIN, PROVIDER, or REGISTERED_USER |
| POST | `/api/v1/uploads/complete` | Complete upload | SUPER_ADMIN, ADMIN, PROVIDER, or REGISTERED_USER |
| POST | `/api/v1/uploads/presigned-url` | Create presigned upload URL | SUPER_ADMIN, ADMIN, PROVIDER, or REGISTERED_USER |
| GET | `/api/v1/uploads/{id}` | Fetch upload details | SUPER_ADMIN, ADMIN, PROVIDER, or REGISTERED_USER |
| DELETE | `/api/v1/uploads/{id}` | Delete upload | SUPER_ADMIN, ADMIN, PROVIDER, or REGISTERED_USER |

## WebSocket / Real-Time Guide

### Notifications namespace

- Socket URL: `{API_BASE_URL}/notifications`.
- Auth: `auth: { token: 'Bearer <accessToken>' }` or `Authorization: Bearer <accessToken>`.
- Backend joins `user:<userId>` and `role:<role>` after JWT verification.
- Listen for `notification.received`, `notification.read`, and broadcast delivery events.
- `notification.received` payload: `{ id, title, message, type, isRead, metadata, createdAt }`. Metadata is sanitized; Stripe secrets, raw bank data, card numbers, and auth tokens are not emitted.
- Emit `notification.read` with `{ notificationId: string }`; listen for `{ all: true }` after mark-all-read.
- Frontend handling: append/upsert received notifications, increment unread count when `isRead=false`, and call REST `GET /api/v1/notifications` after reconnect to backfill missed events.
- Reconnect with a fresh token after access-token refresh.

### Dedicated chat namespace

- Socket URL: `{API_BASE_URL}/chat`.
- Auth: JWT required via `auth: { token: 'Bearer <accessToken>' }` or `Authorization: Bearer <accessToken>`.
- Connection rooms are automatic: `user:<userId>` and `role:<role>`.
- Thread rooms require backend validation: `chat:<threadId>`, `order:<orderId>`, `provider-order:<providerOrderId>`, `support-chat:<supportChatId>`. Frontend must not manually join arbitrary rooms.

#### Customer-provider / provider buyer chat

- Emit: `chat.join`, `chat.leave`, `chat.typing.start`, `chat.typing.stop`, `chat.message.send`, `chat.message.read`.
- Listen: `chat.joined`, `chat.message.created`, `chat.message.read`, `chat.thread.updated`, `chat.typing.started`, `chat.typing.stopped`, `chat.error`.
- Join/read payload: `{ "threadId": "thread_id" }`.
- Send payload: `{ "threadId": "thread_id", "messageType": "TEXT", "body": "Can you confirm delivery time?", "attachmentUrls": [] }`.
- Ownership: REGISTERED_USER is scoped to own customer-provider threads; PROVIDER is scoped to own provider buyer threads.

#### Admin support chat

- Emit: `support.join`, `support.leave`, `support.typing.start`, `support.typing.stop`, `support.message.send`, `support.message.read`, `support.resolved`, `support.reopened`.
- Listen: `support.message.created`, `support.message.read`, `support.thread.updated`, `support.typing.started`, `support.typing.stopped`, `support.resolved`, `support.reopened`, `support.error`.
- Join/read payload: `{ "supportChatId": "support_chat_id" }`.
- Reply payload: `{ "supportChatId": "support_chat_id", "messageType": "TEXT", "body": "I am checking this issue now.", "attachmentUrls": [] }`.
- Permissions: SUPER_ADMIN can join/reply. ADMIN needs `supportChats.read` to join/read and `supportChats.reply` to send. Assigned-chat scoping remains enforced.

#### Reconnect and REST fallback

- On reconnect, re-emit `chat.join` or `support.join` for visible threads.
- Use REST list/detail endpoints to hydrate initial state and backfill missed messages.
- Fallback REST endpoints: unified `/api/v1/chats...`.
