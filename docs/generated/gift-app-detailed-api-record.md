# Gift App Detailed API Record

_Generated from OpenAPI: 2026-05-13T06:21:33.041Z_

## 02 Admin - Roles & Permissions

### `GET` `/api/v1/admin-roles`

Summary: GET /api/v1/admin-roles
Description: Access: SUPER_ADMIN. SUPER_ADMIN only. Only SUPER_ADMIN can manage staff roles and permissions. Admin Roles / RBAC manages permission roles for ADMIN staff users only. SUPER_ADMIN has full immutable access and does not depend on AdminRole permissions.
Access: "SUPER_ADMIN"

## 02 Admin - Roles & Permissions

### `POST` `/api/v1/admin-roles`

Summary: POST /api/v1/admin-roles
Description: Access: SUPER_ADMIN. SUPER_ADMIN only. ADMIN staff cannot create roles.
Access: "SUPER_ADMIN"

## 02 Admin - Roles & Permissions

### `GET` `/api/v1/admin-roles/{id}`

Summary: GET /api/v1/admin-roles/{id}
Description: Access: SUPER_ADMIN. SUPER_ADMIN only. ADMIN staff cannot view role details.
Access: "SUPER_ADMIN"

## 02 Admin - Roles & Permissions

### `PATCH` `/api/v1/admin-roles/{id}`

Summary: PATCH /api/v1/admin-roles/{id}
Description: Access: SUPER_ADMIN. SUPER_ADMIN only. ADMIN staff cannot update roles.
Access: "SUPER_ADMIN"

## 02 Admin - Roles & Permissions

### `DELETE` `/api/v1/admin-roles/{id}`

Summary: DELETE /api/v1/admin-roles/{id}
Description: Access: SUPER_ADMIN. SUPER_ADMIN only. ADMIN staff cannot delete roles.
Access: "SUPER_ADMIN"

## 02 Admin - Roles & Permissions

### `PATCH` `/api/v1/admin-roles/{id}/permissions`

Summary: PATCH /api/v1/admin-roles/{id}/permissions
Description: Access: SUPER_ADMIN. SUPER_ADMIN only. ADMIN staff cannot update role permissions.
Access: "SUPER_ADMIN"

## 02 Admin - Dispute Manager

### `GET` `/api/v1/admin/disputes`

Summary: List dispute queue
Description: Access: Authenticated. Authenticated JWT required. SUPER_ADMIN or ADMIN with disputes.read. Used by Dispute & Refund Cases queue with filters and sorting.
Access: "Authenticated"

## 02 Admin - Dispute Manager

### `GET` `/api/v1/admin/disputes/{id}`

Summary: Fetch dispute details and evidence review summary
Description: Access: Authenticated. Authenticated JWT required. SUPER_ADMIN or ADMIN with disputes.read. SLA remaining text is computed from slaDeadlineAt; approaching deadline is true within 24 hours.
Access: "Authenticated"

## 02 Admin - Dispute Manager

### `GET` `/api/v1/admin/disputes/{id}/evidence`

Summary: Fetch dispute evidence
Description: Access: Authenticated. Authenticated JWT required. SUPER_ADMIN or ADMIN with disputes.evidence.read. Returns only evidence rows linked to this dispute, from customer/admin uploads in dispute-evidence folder.
Access: "Authenticated"

## 02 Admin - Dispute Manager

### `GET` `/api/v1/admin/disputes/{id}/internal-data`

Summary: Fetch internal transaction data
Description: Access: Authenticated. Authenticated JWT required. SUPER_ADMIN or ADMIN with disputes.read. Includes payment status, refund eligibility, auth code, and order/provider transaction history without card secrets.
Access: "Authenticated"

## 02 Admin - Dispute Manager

### `GET` `/api/v1/admin/disputes/{id}/notes`

Summary: Fetch internal dispute notes
Description: Access: Authenticated. Authenticated JWT required. SUPER_ADMIN or ADMIN with disputes.read. Returns internal notes only.
Access: "Authenticated"

## 02 Admin - Dispute Manager

### `POST` `/api/v1/admin/disputes/{id}/notes`

Summary: Add internal dispute note
Description: Access: Authenticated. Authenticated JWT required. SUPER_ADMIN or ADMIN with disputes.notes.create. Notes are internal-only and create audit/timeline entries.
Access: "Authenticated"

## 02 Admin - Dispute Manager

### `GET` `/api/v1/admin/disputes/{id}/timeline`

Summary: Fetch dispute timeline
Description: Access: Authenticated. Authenticated JWT required. SUPER_ADMIN or ADMIN with disputes.timeline.read. Returns timeline preview events in chronological order.
Access: "Authenticated"

## 02 Admin - Dispute Manager

### `GET` `/api/v1/admin/disputes/export`

Summary: Export dispute cases
Description: Access: Authenticated. Authenticated JWT required. SUPER_ADMIN or ADMIN with disputes.export. Sensitive card/payment secrets are never exported.
Access: "Authenticated"

## 02 Admin - Dispute Manager

### `GET` `/api/v1/admin/disputes/stats`

Summary: Fetch dispute dashboard stats
Description: Access: Authenticated. Authenticated JWT required. SUPER_ADMIN or ADMIN with disputes.read. Supports TODAY, LAST_7_DAYS, LAST_30_DAYS, and CUSTOM ranges.
Access: "Authenticated"

## 02 Admin - Review Policies

### `GET` `/api/v1/admin/review-policies`

Summary: Fetch review moderation policies
Description: Access: Authenticated. Authenticated JWT required. SUPER_ADMIN or ADMIN with reviewPolicies.read. AI moderation fields are config-only until external AI is configured.
Access: "Authenticated"

## 02 Admin - Review Policies

### `PATCH` `/api/v1/admin/review-policies`

Summary: Update review moderation policies
Description: Access: Authenticated. Authenticated JWT required. SUPER_ADMIN or delegated ADMIN with reviewPolicies.update. Creates an audit log and never exposes AI provider secrets.
Access: "Authenticated"

## 02 Admin - Review Policies

### `POST` `/api/v1/admin/review-policies/test`

Summary: Test review policy result
Description: Access: Authenticated. Authenticated JWT required. Deterministic rule-based placeholder. No external AI call is made unless future configuration enables it.
Access: "Authenticated"

## 02 Admin - Reviews Management

### `GET` `/api/v1/admin/reviews`

Summary: GET /api/v1/admin/reviews
Description: Access: Authenticated. Authenticated JWT required.
Access: "Authenticated"

## 02 Admin - Reviews Management

### `GET` `/api/v1/admin/reviews/{id}`

Summary: GET /api/v1/admin/reviews/{id}
Description: Access: Authenticated. Authenticated JWT required.
Access: "Authenticated"

## 02 Admin - Reviews Management

### `POST` `/api/v1/admin/reviews/{id}/moderate`

Summary: Moderate a review
Description: Access: Authenticated. Authenticated JWT required. SUPER_ADMIN or ADMIN with reviews.moderate/specific moderation permissions. Creates ReviewModerationLog and admin audit log. Does not physically delete reviews.
Access: "Authenticated"

## 02 Admin - Reviews Management

### `GET` `/api/v1/admin/reviews/dashboard`

Summary: Fetch platform review dashboard
Description: Access: Authenticated. Authenticated JWT required. SUPER_ADMIN or ADMIN with reviews.read. Review records are shared with provider review module.
Access: "Authenticated"

## 02 Admin - Reviews Management

### `GET` `/api/v1/admin/reviews/export`

Summary: GET /api/v1/admin/reviews/export
Description: Access: Authenticated. Authenticated JWT required.
Access: "Authenticated"

## 02 Admin - Reviews Management

### `GET` `/api/v1/admin/reviews/flagged-summary`

Summary: GET /api/v1/admin/reviews/flagged-summary
Description: Access: Authenticated. Authenticated JWT required.
Access: "Authenticated"

## 02 Admin - Reviews Management

### `GET` `/api/v1/admin/reviews/moderation-logs`

Summary: GET /api/v1/admin/reviews/moderation-logs
Description: Access: Authenticated. Authenticated JWT required.
Access: "Authenticated"

## 02 Admin - Reviews Management

### `GET` `/api/v1/admin/reviews/moderation-queue`

Summary: GET /api/v1/admin/reviews/moderation-queue
Description: Access: Authenticated. Authenticated JWT required.
Access: "Authenticated"

## 02 Admin - Reviews Management

### `GET` `/api/v1/admin/reviews/stats`

Summary: GET /api/v1/admin/reviews/stats
Description: Access: Authenticated. Authenticated JWT required.
Access: "Authenticated"

## 02 Admin - Staff Management

### `GET` `/api/v1/admins`

Summary: List admin staff users
Description: Access: SUPER_ADMIN. SUPER_ADMIN only. Admin staff management is controlled by Super Admin only. SUPER_ADMIN only. Returns User.role = ADMIN staff accounts only; SUPER_ADMIN accounts are intentionally excluded.
Access: "SUPER_ADMIN"

## 02 Admin - Staff Management

### `POST` `/api/v1/admins`

Summary: Create admin staff user
Description: Access: SUPER_ADMIN. SUPER_ADMIN only. Creates ADMIN staff users only. Creates an ADMIN staff user under Super Admin. The roleId field is the AdminRole ID that controls this staff user's permissions. This endpoint cannot create SUPER_ADMIN, REGISTERED_USER, PROVIDER, or GUEST_USER accounts.
Access: "SUPER_ADMIN"

## 02 Admin - Staff Management

### `GET` `/api/v1/admins/{id}`

Summary: GET /api/v1/admins/{id}
Description: Access: SUPER_ADMIN. SUPER_ADMIN only. Fetches ADMIN staff details.
Access: "SUPER_ADMIN"

## 02 Admin - Staff Management

### `PATCH` `/api/v1/admins/{id}`

Summary: PATCH /api/v1/admins/{id}
Description: Access: SUPER_ADMIN. SUPER_ADMIN only. Updates ADMIN staff account details.
Access: "SUPER_ADMIN"

## 02 Admin - Staff Management

### `DELETE` `/api/v1/admins/{id}`

Summary: Permanently delete admin staff user
Description: Access: SUPER_ADMIN. SUPER_ADMIN only. Permanently deletes an ADMIN staff account. DANGER: This endpoint permanently deletes an ADMIN staff account from the database. This is not a soft delete. Use only from Super Admin danger zone screens. SUPER_ADMIN accounts and self-delete are blocked.
Access: "SUPER_ADMIN"

## 02 Admin - Staff Management

### `PATCH` `/api/v1/admins/{id}/active-status`

Summary: PATCH /api/v1/admins/{id}/active-status
Description: Access: SUPER_ADMIN. SUPER_ADMIN only. Updates ADMIN staff active status.
Access: "SUPER_ADMIN"

## 02 Admin - Staff Management

### `PATCH` `/api/v1/admins/{id}/password`

Summary: PATCH /api/v1/admins/{id}/password
Description: Access: SUPER_ADMIN. SUPER_ADMIN only. Changes ADMIN staff password from dashboard.
Access: "SUPER_ADMIN"

## 02 Admin - Audit Logs

### `GET` `/api/v1/audit-logs`

Summary: GET /api/v1/audit-logs
Description: Access: SUPER_ADMIN. SUPER_ADMIN only. Audit logs are restricted to Super Admin.
Access: "SUPER_ADMIN"

## 02 Admin - Audit Logs

### `GET` `/api/v1/audit-logs/{id}`

Summary: GET /api/v1/audit-logs/{id}
Description: Access: SUPER_ADMIN. SUPER_ADMIN only. Audit log details are restricted to Super Admin.
Access: "SUPER_ADMIN"

## 02 Admin - Audit Logs

### `GET` `/api/v1/audit-logs/export`

Summary: GET /api/v1/audit-logs/export
Description: Access: SUPER_ADMIN. SUPER_ADMIN only. Audit log export is restricted to Super Admin.
Access: "SUPER_ADMIN"

## 01 Auth

### `DELETE` `/api/v1/auth/account`

Summary: DELETE /api/v1/auth/account
Description: Access: Authenticated. Authenticated JWT required.
Access: "Authenticated"

## 01 Auth

### `POST` `/api/v1/auth/cancel-deletion`

Summary: POST /api/v1/auth/cancel-deletion
Description: Access: Authenticated. Authenticated JWT required.
Access: "Authenticated"

## 01 Auth

### `PATCH` `/api/v1/auth/change-password`

Summary: PATCH /api/v1/auth/change-password
Description: Access: Authenticated. Authenticated JWT required.
Access: "Authenticated"

## 01 Auth

### `POST` `/api/v1/auth/forgot-password`

Summary: POST /api/v1/auth/forgot-password
Description: Access: PUBLIC. PUBLIC.
Access: "PUBLIC"

## 01 Auth

### `POST` `/api/v1/auth/guest/session`

Summary: POST /api/v1/auth/guest/session
Description: Access: PUBLIC. PUBLIC.
Access: "PUBLIC"

## 01 Auth

### `POST` `/api/v1/auth/login`

Summary: POST /api/v1/auth/login
Description: Access: PUBLIC. PUBLIC.
Access: "PUBLIC"

## 01 Auth

### `POST` `/api/v1/auth/logout`

Summary: POST /api/v1/auth/logout
Description: Access: Authenticated. Authenticated JWT required.
Access: "Authenticated"

## 01 Auth

### `GET` `/api/v1/auth/me`

Summary: GET /api/v1/auth/me
Description: Access: Authenticated. Authenticated JWT required.
Access: "Authenticated"

## 01 Auth

### `PATCH` `/api/v1/auth/me`

Summary: PATCH /api/v1/auth/me
Description: Access: Authenticated. Authenticated JWT required.
Access: "Authenticated"

## 01 Auth

### `POST` `/api/v1/auth/providers/register`

Summary: POST /api/v1/auth/providers/register
Description: Access: PUBLIC. PUBLIC.
Access: "PUBLIC"

## 01 Auth

### `POST` `/api/v1/auth/refresh`

Summary: POST /api/v1/auth/refresh
Description: Access: PUBLIC. PUBLIC.
Access: "PUBLIC"

## 01 Auth

### `POST` `/api/v1/auth/resend-otp`

Summary: POST /api/v1/auth/resend-otp
Description: Access: Authenticated. Authenticated JWT required.
Access: "Authenticated"

## 01 Auth

### `POST` `/api/v1/auth/reset-password`

Summary: POST /api/v1/auth/reset-password
Description: Access: PUBLIC. PUBLIC.
Access: "PUBLIC"

## 01 Auth

### `GET` `/api/v1/auth/sessions`

Summary: GET /api/v1/auth/sessions
Description: Access: Authenticated. Authenticated JWT required.
Access: "Authenticated"

## 01 Auth

### `DELETE` `/api/v1/auth/sessions/{id}`

Summary: DELETE /api/v1/auth/sessions/{id}
Description: Access: Authenticated. Authenticated JWT required.
Access: "Authenticated"

## 01 Auth

### `POST` `/api/v1/auth/sessions/logout-all`

Summary: POST /api/v1/auth/sessions/logout-all
Description: Access: Authenticated. Authenticated JWT required.
Access: "Authenticated"

## 01 Auth

### `POST` `/api/v1/auth/users/register`

Summary: POST /api/v1/auth/users/register
Description: Access: PUBLIC. PUBLIC.
Access: "PUBLIC"

## 01 Auth

### `POST` `/api/v1/auth/verify-email`

Summary: POST /api/v1/auth/verify-email
Description: Access: Authenticated. Authenticated JWT required.
Access: "Authenticated"

## 01 Auth

### `POST` `/api/v1/auth/verify-reset-otp`

Summary: POST /api/v1/auth/verify-reset-otp
Description: Access: PUBLIC. PUBLIC.
Access: "PUBLIC"

## 06 Broadcast Notifications

### `GET` `/api/v1/broadcasts`

Summary: GET /api/v1/broadcasts
Description: Access: SUPER_ADMIN or ADMIN with broadcasts.read. SUPER_ADMIN or ADMIN with broadcasts.read permission.
Access: "SUPER_ADMIN or ADMIN with broadcasts.read"

## 06 Broadcast Notifications

### `POST` `/api/v1/broadcasts`

Summary: POST /api/v1/broadcasts
Description: Access: SUPER_ADMIN or ADMIN with broadcasts.create. SUPER_ADMIN or ADMIN with broadcasts.create permission.
Access: "SUPER_ADMIN or ADMIN with broadcasts.create"

## 06 Broadcast Notifications

### `GET` `/api/v1/broadcasts/{id}`

Summary: GET /api/v1/broadcasts/{id}
Description: Access: SUPER_ADMIN or ADMIN with broadcasts.read. SUPER_ADMIN or ADMIN with broadcasts.read permission.
Access: "SUPER_ADMIN or ADMIN with broadcasts.read"

## 06 Broadcast Notifications

### `PATCH` `/api/v1/broadcasts/{id}`

Summary: PATCH /api/v1/broadcasts/{id}
Description: Access: SUPER_ADMIN or ADMIN with broadcasts.update. SUPER_ADMIN or ADMIN with broadcasts.update permission.
Access: "SUPER_ADMIN or ADMIN with broadcasts.update"

## 06 Broadcast Notifications

### `POST` `/api/v1/broadcasts/{id}/cancel`

Summary: POST /api/v1/broadcasts/{id}/cancel
Description: Access: SUPER_ADMIN or ADMIN with broadcasts.cancel. SUPER_ADMIN or ADMIN with broadcasts.cancel permission.
Access: "SUPER_ADMIN or ADMIN with broadcasts.cancel"

## 06 Broadcast Notifications

### `GET` `/api/v1/broadcasts/{id}/recipients`

Summary: GET /api/v1/broadcasts/{id}/recipients
Description: Access: SUPER_ADMIN or ADMIN with broadcasts.report.read. SUPER_ADMIN or ADMIN with broadcasts.report.read permission.
Access: "SUPER_ADMIN or ADMIN with broadcasts.report.read"

## 06 Broadcast Notifications

### `GET` `/api/v1/broadcasts/{id}/report`

Summary: GET /api/v1/broadcasts/{id}/report
Description: Access: SUPER_ADMIN or ADMIN with broadcasts.report.read. SUPER_ADMIN or ADMIN with broadcasts.report.read permission.
Access: "SUPER_ADMIN or ADMIN with broadcasts.report.read"

## 06 Broadcast Notifications

### `PATCH` `/api/v1/broadcasts/{id}/schedule`

Summary: PATCH /api/v1/broadcasts/{id}/schedule
Description: Access: SUPER_ADMIN or ADMIN with broadcasts.schedule. SUPER_ADMIN or ADMIN with broadcasts.schedule permission.
Access: "SUPER_ADMIN or ADMIN with broadcasts.schedule"

## 06 Broadcast Notifications

### `PATCH` `/api/v1/broadcasts/{id}/targeting`

Summary: PATCH /api/v1/broadcasts/{id}/targeting
Description: Access: SUPER_ADMIN or ADMIN with broadcasts.update. SUPER_ADMIN or ADMIN with broadcasts.update permission.
Access: "SUPER_ADMIN or ADMIN with broadcasts.update"

## 06 Broadcast Notifications

### `POST` `/api/v1/broadcasts/estimate-reach`

Summary: POST /api/v1/broadcasts/estimate-reach
Description: Access: SUPER_ADMIN or ADMIN with broadcasts.read. SUPER_ADMIN or ADMIN with broadcasts.read permission.
Access: "SUPER_ADMIN or ADMIN with broadcasts.read"

## 07 Plans & Coupons

### `GET` `/api/v1/coupons`

Summary: GET /api/v1/coupons
Description: Access: SUPER_ADMIN or ADMIN with coupons.read. SUPER_ADMIN or ADMIN with coupons.read permission.
Access: "SUPER_ADMIN or ADMIN with coupons.read"

## 07 Plans & Coupons

### `POST` `/api/v1/coupons`

Summary: POST /api/v1/coupons
Description: Access: SUPER_ADMIN or ADMIN with coupons.create. SUPER_ADMIN or ADMIN with coupons.create permission.
Access: "SUPER_ADMIN or ADMIN with coupons.create"

## 07 Plans & Coupons

### `GET` `/api/v1/coupons/{id}`

Summary: GET /api/v1/coupons/{id}
Description: Access: SUPER_ADMIN or ADMIN with coupons.read. SUPER_ADMIN or ADMIN with coupons.read permission.
Access: "SUPER_ADMIN or ADMIN with coupons.read"

## 07 Plans & Coupons

### `PATCH` `/api/v1/coupons/{id}`

Summary: PATCH /api/v1/coupons/{id}
Description: Access: SUPER_ADMIN or ADMIN with coupons.update. SUPER_ADMIN or ADMIN with coupons.update permission.
Access: "SUPER_ADMIN or ADMIN with coupons.update"

## 07 Plans & Coupons

### `DELETE` `/api/v1/coupons/{id}`

Summary: DELETE /api/v1/coupons/{id}
Description: Access: SUPER_ADMIN or ADMIN with coupons.delete. SUPER_ADMIN or ADMIN with coupons.delete permission.
Access: "SUPER_ADMIN or ADMIN with coupons.delete"

## 07 Plans & Coupons

### `PATCH` `/api/v1/coupons/{id}/status`

Summary: PATCH /api/v1/coupons/{id}/status
Description: Access: SUPER_ADMIN or ADMIN with coupons.status.update. SUPER_ADMIN or ADMIN with coupons.status.update permission.
Access: "SUPER_ADMIN or ADMIN with coupons.status.update"

## 05 Customer - Addresses

### `GET` `/api/v1/customer/addresses`

Summary: List customer addresses
Description: Access: REGISTERED_USER. REGISTERED_USER only. Endpoint is scoped to the authenticated customer account. REGISTERED_USER only. Customers can only view their own non-deleted addresses.
Access: "REGISTERED_USER"

## 05 Customer - Addresses

### `POST` `/api/v1/customer/addresses`

Summary: Create customer address
Description: Access: REGISTERED_USER. REGISTERED_USER only. Endpoint is scoped to the authenticated customer account. REGISTERED_USER only. Maintains one default address per customer.
Access: "REGISTERED_USER"

## 05 Customer - Addresses

### `GET` `/api/v1/customer/addresses/{id}`

Summary: Fetch customer address
Description: Access: REGISTERED_USER. REGISTERED_USER only. Endpoint is scoped to the authenticated customer account. REGISTERED_USER only. Address must belong to the current customer.
Access: "REGISTERED_USER"

## 05 Customer - Addresses

### `PATCH` `/api/v1/customer/addresses/{id}`

Summary: Update customer address
Description: Access: REGISTERED_USER. REGISTERED_USER only. Endpoint is scoped to the authenticated customer account. REGISTERED_USER only. Maintains one default address per customer.
Access: "REGISTERED_USER"

## 05 Customer - Addresses

### `DELETE` `/api/v1/customer/addresses/{id}`

Summary: Soft-delete customer address
Description: Access: REGISTERED_USER. REGISTERED_USER only. Endpoint is scoped to the authenticated customer account. REGISTERED_USER only. Address is soft deleted and removed from default status.
Access: "REGISTERED_USER"

## 05 Customer - Addresses

### `PATCH` `/api/v1/customer/addresses/{id}/default`

Summary: Set default customer address
Description: Access: REGISTERED_USER. REGISTERED_USER only. Endpoint is scoped to the authenticated customer account. REGISTERED_USER only. Clears default flag from all other customer addresses.
Access: "REGISTERED_USER"

## 05 Customer - Payment Methods

### `GET` `/api/v1/customer/bank-accounts`

Summary: List own bank accounts
Description: Access: REGISTERED_USER. REGISTERED_USER only. Endpoint is scoped to the authenticated customer account.
Access: "REGISTERED_USER"

## 05 Customer - Payment Methods

### `POST` `/api/v1/customer/bank-accounts`

Summary: Link placeholder bank account
Description: Access: REGISTERED_USER. REGISTERED_USER only. Endpoint is scoped to the authenticated customer account. Stores only masked display data. Full IBAN/account number is never returned.
Access: "REGISTERED_USER"

## 05 Customer - Payment Methods

### `DELETE` `/api/v1/customer/bank-accounts/{id}`

Summary: Delete own bank account
Description: Access: REGISTERED_USER. REGISTERED_USER only. Endpoint is scoped to the authenticated customer account.
Access: "REGISTERED_USER"

## 05 Customer - Payment Methods

### `PATCH` `/api/v1/customer/bank-accounts/{id}/default`

Summary: Set own default bank account
Description: Access: REGISTERED_USER. REGISTERED_USER only. Endpoint is scoped to the authenticated customer account.
Access: "REGISTERED_USER"

## 05 Customer - Cart

### `GET` `/api/v1/customer/cart`

Summary: Fetch active cart
Description: Access: REGISTERED_USER. REGISTERED_USER only. Endpoint is scoped to the authenticated customer account. REGISTERED_USER only. Totals are backend calculated from price snapshots.
Access: "REGISTERED_USER"

## 05 Customer - Cart

### `DELETE` `/api/v1/customer/cart`

Summary: Clear active cart
Description: Access: REGISTERED_USER. REGISTERED_USER only. Endpoint is scoped to the authenticated customer account. REGISTERED_USER only. Removes all items from active cart.
Access: "REGISTERED_USER"

## 05 Customer - Cart

### `POST` `/api/v1/customer/cart/items`

Summary: Add item to cart
Description: Access: REGISTERED_USER. REGISTERED_USER only. Endpoint is scoped to the authenticated customer account. REGISTERED_USER only. Backend calculates unit price, active offer discount, final price, subtotal, delivery fee placeholder, and total.
Access: "REGISTERED_USER"

## 05 Customer - Cart

### `PATCH` `/api/v1/customer/cart/items/{id}`

Summary: Update cart item
Description: Access: REGISTERED_USER. REGISTERED_USER only. Endpoint is scoped to the authenticated customer account. REGISTERED_USER only. Validates ownership through the active customer cart.
Access: "REGISTERED_USER"

## 05 Customer - Cart

### `DELETE` `/api/v1/customer/cart/items/{id}`

Summary: Delete cart item
Description: Access: REGISTERED_USER. REGISTERED_USER only. Endpoint is scoped to the authenticated customer account. REGISTERED_USER only. Deletes only items in the current customer active cart.
Access: "REGISTERED_USER"

## 05 Customer - Marketplace

### `GET` `/api/v1/customer/categories`

Summary: List customer marketplace categories
Description: Access: REGISTERED_USER. REGISTERED_USER only. Endpoint is scoped to the authenticated customer account. REGISTERED_USER only. Returns active categories that have active, available, in-stock gifts from approved active providers.
Access: "REGISTERED_USER"

## 05 Customer - Provider Chat

### `GET` `/api/v1/customer/chats`

Summary: List customer provider chats
Description: Access: REGISTERED_USER. REGISTERED_USER only. Endpoint is scoped to the authenticated customer account. REGISTERED_USER only. Uses shared ChatThread/ChatMessage records with provider buyer chat. Customer sees only own order threads.
Access: "REGISTERED_USER"

## 05 Customer - Provider Chat

### `GET` `/api/v1/customer/chats/{threadId}`

Summary: Fetch customer chat messages
Description: Access: REGISTERED_USER. REGISTERED_USER only. Endpoint is scoped to the authenticated customer account. REGISTERED_USER only. Thread must belong to the current customer.
Access: "REGISTERED_USER"

## 05 Customer - Provider Chat

### `POST` `/api/v1/customer/chats/{threadId}/messages`

Summary: Send message to provider
Description: Access: REGISTERED_USER. REGISTERED_USER only. Endpoint is scoped to the authenticated customer account. REGISTERED_USER only. Customer can send only in own order thread. Creates provider notification and updates read receipts.
Access: "REGISTERED_USER"

## 05 Customer - Provider Chat

### `PATCH` `/api/v1/customer/chats/{threadId}/read`

Summary: Mark provider messages read
Description: Access: REGISTERED_USER. REGISTERED_USER only. Endpoint is scoped to the authenticated customer account. REGISTERED_USER only. Marks provider messages as read for the customer in the owned thread.
Access: "REGISTERED_USER"

## 05 Customer - Provider Chat

### `GET` `/api/v1/customer/chats/quick-replies`

Summary: Fetch provider chat quick replies
Description: Access: REGISTERED_USER. REGISTERED_USER only. Endpoint is scoped to the authenticated customer account. REGISTERED_USER only. Declared before /customer/chats/:threadId.
Access: "REGISTERED_USER"

## 05 Customer - Contacts

### `GET` `/api/v1/customer/contacts`

Summary: List customer contacts
Description: Access: REGISTERED_USER. REGISTERED_USER only. Endpoint is scoped to the authenticated customer account. REGISTERED_USER only. Lists only contacts owned by the authenticated customer.
Access: "REGISTERED_USER"

## 05 Customer - Contacts

### `POST` `/api/v1/customer/contacts`

Summary: Create customer contact
Description: Access: REGISTERED_USER. REGISTERED_USER only. Endpoint is scoped to the authenticated customer account. REGISTERED_USER only. Creates a personal gift contact owned by the authenticated customer. Requires at least one contact method: phone, email, or address.
Access: "REGISTERED_USER"

## 05 Customer - Contacts

### `GET` `/api/v1/customer/contacts/{id}`

Summary: Fetch customer contact
Description: Access: REGISTERED_USER. REGISTERED_USER only. Endpoint is scoped to the authenticated customer account. REGISTERED_USER only. Contact must belong to the authenticated customer.
Access: "REGISTERED_USER"

## 05 Customer - Contacts

### `PATCH` `/api/v1/customer/contacts/{id}`

Summary: Update customer contact
Description: Access: REGISTERED_USER. REGISTERED_USER only. Endpoint is scoped to the authenticated customer account. REGISTERED_USER only. Updates only contacts owned by the authenticated customer.
Access: "REGISTERED_USER"

## 05 Customer - Contacts

### `DELETE` `/api/v1/customer/contacts/{id}`

Summary: Soft-delete customer contact
Description: Access: REGISTERED_USER. REGISTERED_USER only. Endpoint is scoped to the authenticated customer account. REGISTERED_USER only. Soft deletes only contacts owned by the authenticated customer.
Access: "REGISTERED_USER"

## 05 Customer - Events

### `GET` `/api/v1/customer/events`

Summary: List customer events
Description: Access: REGISTERED_USER. REGISTERED_USER only. Endpoint is scoped to the authenticated customer account. REGISTERED_USER only. Lists only events owned by the authenticated customer.
Access: "REGISTERED_USER"

## 05 Customer - Events

### `POST` `/api/v1/customer/events`

Summary: Create customer event
Description: Access: REGISTERED_USER. REGISTERED_USER only. Endpoint is scoped to the authenticated customer account. REGISTERED_USER only. recipientId must belong to the authenticated customer.
Access: "REGISTERED_USER"

## 05 Customer - Events

### `GET` `/api/v1/customer/events/{id}`

Summary: Fetch customer event details
Description: Access: REGISTERED_USER. REGISTERED_USER only. Endpoint is scoped to the authenticated customer account. REGISTERED_USER only. Event must belong to the authenticated customer.
Access: "REGISTERED_USER"

## 05 Customer - Events

### `PATCH` `/api/v1/customer/events/{id}`

Summary: Update customer event
Description: Access: REGISTERED_USER. REGISTERED_USER only. Endpoint is scoped to the authenticated customer account. REGISTERED_USER only. Event and recipient contact must belong to the authenticated customer.
Access: "REGISTERED_USER"

## 05 Customer - Events

### `DELETE` `/api/v1/customer/events/{id}`

Summary: Soft-delete customer event
Description: Access: REGISTERED_USER. REGISTERED_USER only. Endpoint is scoped to the authenticated customer account. REGISTERED_USER only. Soft deletes only own event and cancels pending reminder jobs.
Access: "REGISTERED_USER"

## 05 Customer - Events

### `GET` `/api/v1/customer/events/{id}/reminder-settings`

Summary: Fetch event reminder settings
Description: Access: REGISTERED_USER. REGISTERED_USER only. Endpoint is scoped to the authenticated customer account. REGISTERED_USER only. Event must belong to the authenticated customer.
Access: "REGISTERED_USER"

## 05 Customer - Events

### `PATCH` `/api/v1/customer/events/{id}/reminder-settings`

Summary: Update event reminder settings
Description: Access: REGISTERED_USER. REGISTERED_USER only. Endpoint is scoped to the authenticated customer account. REGISTERED_USER only. Event must belong to the authenticated customer.
Access: "REGISTERED_USER"

## 05 Customer - Events

### `GET` `/api/v1/customer/events/calendar`

Summary: Fetch monthly calendar events
Description: Access: REGISTERED_USER. REGISTERED_USER only. Endpoint is scoped to the authenticated customer account. REGISTERED_USER only. Returns marked dates and own events.
Access: "REGISTERED_USER"

## 05 Customer - Events

### `GET` `/api/v1/customer/events/upcoming`

Summary: Fetch upcoming customer events
Description: Access: REGISTERED_USER. REGISTERED_USER only. Endpoint is scoped to the authenticated customer account. REGISTERED_USER only. Defaults to 10 events within 30 days.
Access: "REGISTERED_USER"

## 05 Customer - Marketplace

### `GET` `/api/v1/customer/gifts`

Summary: List customer marketplace gifts
Description: Access: REGISTERED_USER. REGISTERED_USER only. Endpoint is scoped to the authenticated customer account. REGISTERED_USER only. Returns active, available, in-stock gifts from approved active providers. Provider inventory does not require separate gift moderation approval. Active offers are calculated by the backend.
Access: "REGISTERED_USER"

## 05 Customer - Marketplace

### `GET` `/api/v1/customer/gifts/{id}`

Summary: Fetch customer-safe gift details
Description: Access: REGISTERED_USER. REGISTERED_USER only. Endpoint is scoped to the authenticated customer account. REGISTERED_USER only. Hidden/admin-only gift records are never returned. Provider inventory does not require separate gift moderation approval.
Access: "REGISTERED_USER"

## 05 Customer - Marketplace

### `GET` `/api/v1/customer/gifts/discounted`

Summary: List discounted customer gifts
Description: Access: REGISTERED_USER. REGISTERED_USER only. Endpoint is scoped to the authenticated customer account. REGISTERED_USER only. Reuses marketplace gift filters with offerOnly=true.
Access: "REGISTERED_USER"

## 05 Customer - Marketplace

### `GET` `/api/v1/customer/gifts/filter-options`

Summary: Fetch marketplace gift filter options
Description: Access: REGISTERED_USER. REGISTERED_USER only. Endpoint is scoped to the authenticated customer account. REGISTERED_USER only. Brands are derived from approved active provider business names.
Access: "REGISTERED_USER"

## 05 Customer - Marketplace

### `GET` `/api/v1/customer/home`

Summary: Fetch customer app home
Description: Access: REGISTERED_USER. REGISTERED_USER only. Endpoint is scoped to the authenticated customer account. REGISTERED_USER only. Returns safe marketplace categories, discounted gifts, default address, and upcoming reminder.
Access: "REGISTERED_USER"

## 06 Payments

### `GET` `/api/v1/customer/money-gifts`

Summary: List own money gifts
Description: Access: REGISTERED_USER. REGISTERED_USER only. Endpoint is scoped to the authenticated customer account.
Access: "REGISTERED_USER"

## 06 Payments

### `POST` `/api/v1/customer/money-gifts`

Summary: Send payment as gift
Description: Access: REGISTERED_USER. REGISTERED_USER only. Endpoint is scoped to the authenticated customer account. Creates a customer-to-recipient money gift record and Stripe PaymentIntent for STRIPE_CARD.
Access: "REGISTERED_USER"

## 06 Payments

### `GET` `/api/v1/customer/money-gifts/{id}`

Summary: Fetch own money gift details
Description: Access: REGISTERED_USER. REGISTERED_USER only. Endpoint is scoped to the authenticated customer account.
Access: "REGISTERED_USER"

## 05 Customer - Orders

### `GET` `/api/v1/customer/orders`

Summary: List customer orders
Description: Access: REGISTERED_USER. REGISTERED_USER only. Endpoint is scoped to the authenticated customer account. REGISTERED_USER only. Returns orders owned by the current customer.
Access: "REGISTERED_USER"

## 05 Customer - Orders

### `POST` `/api/v1/customer/orders`

Summary: Create order from active cart
Description: Access: REGISTERED_USER. REGISTERED_USER only. Endpoint is scoped to the authenticated customer account. REGISTERED_USER only. Prices are backend-calculated from cart/payment snapshots. STRIPE_CARD requires a successful owned paymentId; COD stays pending; PLACEHOLDER is for development only. Multiple providers are split into provider sub-orders.
Access: "REGISTERED_USER"

## 05 Customer - Orders

### `GET` `/api/v1/customer/orders/{id}`

Summary: Fetch customer order
Description: Access: REGISTERED_USER. REGISTERED_USER only. Endpoint is scoped to the authenticated customer account. REGISTERED_USER only. Order must belong to the current customer.
Access: "REGISTERED_USER"

## 05 Customer - Provider Chat

### `GET` `/api/v1/customer/orders/{id}/chat`

Summary: Get or optionally create order chat
Description: Access: REGISTERED_USER. REGISTERED_USER only. Endpoint is scoped to the authenticated customer account. REGISTERED_USER only. Order must belong to the logged-in customer and have an attached provider order.
Access: "REGISTERED_USER"

## 05 Customer - Provider Chat

### `POST` `/api/v1/customer/orders/{id}/chat`

Summary: Create order chat
Description: Access: REGISTERED_USER. REGISTERED_USER only. Endpoint is scoped to the authenticated customer account. REGISTERED_USER only. Reuses existing ChatThread if already created for the provider order.
Access: "REGISTERED_USER"

## 05 Customer - Reviews

### `POST` `/api/v1/customer/orders/{id}/reviews`

Summary: Submit provider review for an order
Description: Access: REGISTERED_USER. REGISTERED_USER only. Endpoint is scoped to the authenticated customer account. REGISTERED_USER only. Uses shared Review records consumed by provider reviews and admin review management.
Access: "REGISTERED_USER"

## 05 Customer - Payment Methods

### `GET` `/api/v1/customer/payment-methods`

Summary: List supported customer payment methods
Description: Access: REGISTERED_USER. REGISTERED_USER only. Endpoint is scoped to the authenticated customer account.
Access: "REGISTERED_USER"

## 05 Customer - Payment Methods

### `DELETE` `/api/v1/customer/payment-methods/{id}`

Summary: Delete own saved payment method
Description: Access: REGISTERED_USER. REGISTERED_USER only. Endpoint is scoped to the authenticated customer account. Rejects deletion when the method is used by an active recurring payment.
Access: "REGISTERED_USER"

## 05 Customer - Payment Methods

### `PATCH` `/api/v1/customer/payment-methods/{id}/default`

Summary: Set own default payment method
Description: Access: REGISTERED_USER. REGISTERED_USER only. Endpoint is scoped to the authenticated customer account.
Access: "REGISTERED_USER"

## 05 Customer - Payment Methods

### `GET` `/api/v1/customer/payment-methods/saved`

Summary: List own saved payment methods
Description: Access: REGISTERED_USER. REGISTERED_USER only. Endpoint is scoped to the authenticated customer account. Returns masked Stripe card metadata only.
Access: "REGISTERED_USER"

## 05 Customer - Payment Methods

### `POST` `/api/v1/customer/payment-methods/setup-intent`

Summary: Create Stripe SetupIntent for saving card
Description: Access: REGISTERED_USER. REGISTERED_USER only. Endpoint is scoped to the authenticated customer account. Frontend confirms card with Stripe SDK. Backend never accepts raw card number or CVV.
Access: "REGISTERED_USER"

## 06 Payments

### `GET` `/api/v1/customer/payments/{id}`

Summary: Fetch own payment details
Description: Access: REGISTERED_USER. REGISTERED_USER only. Endpoint is scoped to the authenticated customer account.
Access: "REGISTERED_USER"

## 06 Payments

### `POST` `/api/v1/customer/payments/confirm`

Summary: Confirm Stripe payment
Description: Access: REGISTERED_USER. REGISTERED_USER only. Endpoint is scoped to the authenticated customer account. REGISTERED_USER only. Retrieves Stripe PaymentIntent server-side before updating local payment status.
Access: "REGISTERED_USER"

## 06 Payments

### `POST` `/api/v1/customer/payments/create-intent`

Summary: Create payment intent from active cart
Description: Access: REGISTERED_USER. REGISTERED_USER only. Endpoint is scoped to the authenticated customer account. REGISTERED_USER only. Amount is calculated from backend cart totals; frontend amount is never accepted.
Access: "REGISTERED_USER"

## 05 Customer - Provider Reports

### `GET` `/api/v1/customer/provider-report-reasons`

Summary: Fetch provider report reasons
Description: Access: REGISTERED_USER. REGISTERED_USER only. Endpoint is scoped to the authenticated customer account. REGISTERED_USER only. Declared before /customer/provider-reports/:id.
Access: "REGISTERED_USER"

## 05 Customer - Provider Reports

### `GET` `/api/v1/customer/provider-reports`

Summary: GET /api/v1/customer/provider-reports
Description: Access: REGISTERED_USER. REGISTERED_USER only. Endpoint is scoped to the authenticated customer account.
Access: "REGISTERED_USER"

## 05 Customer - Provider Reports

### `GET` `/api/v1/customer/provider-reports/{id}`

Summary: GET /api/v1/customer/provider-reports/{id}
Description: Access: REGISTERED_USER. REGISTERED_USER only. Endpoint is scoped to the authenticated customer account.
Access: "REGISTERED_USER"

## 05 Customer - Provider Reports

### `POST` `/api/v1/customer/providers/{providerId}/reports`

Summary: Report provider
Description: Access: REGISTERED_USER. REGISTERED_USER only. Endpoint is scoped to the authenticated customer account. REGISTERED_USER only. Customer must have an order, chat, or review relationship with provider. Duplicate active provider/order/reason reports are blocked.
Access: "REGISTERED_USER"

## 05 Customer - Recurring Payments

### `GET` `/api/v1/customer/recurring-payments`

Summary: List own recurring payments
Description: Access: REGISTERED_USER. REGISTERED_USER only. Endpoint is scoped to the authenticated customer account. REGISTERED_USER only. Returns recurring money/gift payment subscriptions owned by the logged-in customer.
Access: "REGISTERED_USER"

## 05 Customer - Recurring Payments

### `POST` `/api/v1/customer/recurring-payments`

Summary: Create recurring payment
Description: Access: REGISTERED_USER. REGISTERED_USER only. Endpoint is scoped to the authenticated customer account. REGISTERED_USER only. Recipient contact and saved Stripe payment method must both belong to the logged-in customer. Stripe card recurring payments require a saved payment method.
Access: "REGISTERED_USER"

## 05 Customer - Recurring Payments

### `GET` `/api/v1/customer/recurring-payments/{id}`

Summary: Fetch own recurring payment details
Description: Access: REGISTERED_USER. REGISTERED_USER only. Endpoint is scoped to the authenticated customer account. REGISTERED_USER only. Customer cannot access another user’s recurring payment.
Access: "REGISTERED_USER"

## 05 Customer - Recurring Payments

### `PATCH` `/api/v1/customer/recurring-payments/{id}`

Summary: Update own recurring payment
Description: Access: REGISTERED_USER. REGISTERED_USER only. Endpoint is scoped to the authenticated customer account. Cannot edit CANCELLED recurring payments. Changes apply from the next billing cycle and nextBillingAt is recalculated.
Access: "REGISTERED_USER"

## 05 Customer - Recurring Payments

### `POST` `/api/v1/customer/recurring-payments/{id}/cancel`

Summary: Cancel own recurring payment
Description: Access: REGISTERED_USER. REGISTERED_USER only. Endpoint is scoped to the authenticated customer account. IMMEDIATELY cancels future processing. AFTER_CURRENT_BILLING_CYCLE sets cancelAtPeriodEnd and cancelAt.
Access: "REGISTERED_USER"

## 05 Customer - Recurring Payments

### `GET` `/api/v1/customer/recurring-payments/{id}/history`

Summary: List own recurring payment billing history
Description: Access: REGISTERED_USER. REGISTERED_USER only. Endpoint is scoped to the authenticated customer account.
Access: "REGISTERED_USER"

## 05 Customer - Recurring Payments

### `POST` `/api/v1/customer/recurring-payments/{id}/pause`

Summary: Pause own active recurring payment
Description: Access: REGISTERED_USER. REGISTERED_USER only. Endpoint is scoped to the authenticated customer account.
Access: "REGISTERED_USER"

## 05 Customer - Recurring Payments

### `POST` `/api/v1/customer/recurring-payments/{id}/resume`

Summary: Resume own paused recurring payment
Description: Access: REGISTERED_USER. REGISTERED_USER only. Endpoint is scoped to the authenticated customer account.
Access: "REGISTERED_USER"

## 05 Customer - Recurring Payments

### `GET` `/api/v1/customer/recurring-payments/summary`

Summary: Fetch recurring payment summary counts
Description: Access: REGISTERED_USER. REGISTERED_USER only. Endpoint is scoped to the authenticated customer account. Must stay before /customer/recurring-payments/:id route.
Access: "REGISTERED_USER"

## 05 Customer - Referrals & Rewards

### `GET` `/api/v1/customer/referrals/history`

Summary: List own referral history
Description: Access: REGISTERED_USER. REGISTERED_USER only. Endpoint is scoped to the authenticated customer account. REGISTERED_USER only. History is scoped to referrals created by the logged-in customer.
Access: "REGISTERED_USER"

## 05 Customer - Referrals & Rewards

### `GET` `/api/v1/customer/referrals/link`

Summary: Fetch own referral link
Description: Access: REGISTERED_USER. REGISTERED_USER only. Endpoint is scoped to the authenticated customer account. Generates a unique customer referral code when missing. The link never exposes internal user IDs.
Access: "REGISTERED_USER"

## 05 Customer - Referrals & Rewards

### `POST` `/api/v1/customer/referrals/redeem`

Summary: Redeem own available reward credit
Description: Access: REGISTERED_USER. REGISTERED_USER only. Endpoint is scoped to the authenticated customer account. Creates a REDEEMED reward ledger entry. Redemption cannot exceed ledger-derived available credit.
Access: "REGISTERED_USER"

## 05 Customer - Referrals & Rewards

### `GET` `/api/v1/customer/referrals/summary`

Summary: Fetch own referral reward summary
Description: Access: REGISTERED_USER. REGISTERED_USER only. Endpoint is scoped to the authenticated customer account. REGISTERED_USER only. Customers can view only their own referral progress and ledger-derived balances.
Access: "REGISTERED_USER"

## 05 Customer - Referrals & Rewards

### `GET` `/api/v1/customer/referrals/terms`

Summary: Fetch referral terms
Description: Access: REGISTERED_USER. REGISTERED_USER only. Endpoint is scoped to the authenticated customer account. Returns config/env based customer referral terms for the mobile app.
Access: "REGISTERED_USER"

## 05 Customer - Reviews

### `GET` `/api/v1/customer/reviews`

Summary: List own provider reviews
Description: Access: REGISTERED_USER. REGISTERED_USER only. Endpoint is scoped to the authenticated customer account. REGISTERED_USER only. Customer sees only their own non-deleted reviews.
Access: "REGISTERED_USER"

## 05 Customer - Reviews

### `GET` `/api/v1/customer/reviews/{id}`

Summary: GET /api/v1/customer/reviews/{id}
Description: Access: REGISTERED_USER. REGISTERED_USER only. Endpoint is scoped to the authenticated customer account.
Access: "REGISTERED_USER"

## 05 Customer - Reviews

### `PATCH` `/api/v1/customer/reviews/{id}`

Summary: Update own review
Description: Access: REGISTERED_USER. REGISTERED_USER only. Endpoint is scoped to the authenticated customer account. REGISTERED_USER only. Cannot update deleted/removed reviews; updated content is re-run through deterministic moderation.
Access: "REGISTERED_USER"

## 05 Customer - Reviews

### `DELETE` `/api/v1/customer/reviews/{id}`

Summary: Soft-delete own review
Description: Access: REGISTERED_USER. REGISTERED_USER only. Endpoint is scoped to the authenticated customer account. REGISTERED_USER only. Does not physically delete provider response.
Access: "REGISTERED_USER"

## 05 Customer - Referrals & Rewards

### `GET` `/api/v1/customer/rewards/balance`

Summary: Fetch own reward balance
Description: Access: REGISTERED_USER. REGISTERED_USER only. Endpoint is scoped to the authenticated customer account. Balance is calculated from RewardLedger entries, not a mutable user balance field.
Access: "REGISTERED_USER"

## 05 Customer - Referrals & Rewards

### `GET` `/api/v1/customer/rewards/ledger`

Summary: List own reward ledger
Description: Access: REGISTERED_USER. REGISTERED_USER only. Endpoint is scoped to the authenticated customer account. REGISTERED_USER only. Returns ledger entries owned by the logged-in customer.
Access: "REGISTERED_USER"

## 05 Customer - Subscriptions

### `POST` `/api/v1/customer/subscription/apply-coupon`

Summary: Preview subscription coupon
Description: Access: REGISTERED_USER. REGISTERED_USER only. Endpoint is scoped to the authenticated customer account. REGISTERED_USER only. Validates coupon against active coupon rules and plan restrictions; frontend discount amounts are ignored.
Access: "REGISTERED_USER"

## 05 Customer - Subscriptions

### `POST` `/api/v1/customer/subscription/cancel`

Summary: Cancel own subscription
Description: Access: REGISTERED_USER. REGISTERED_USER only. Endpoint is scoped to the authenticated customer account. REGISTERED_USER only. Supports immediate cancellation or cancel_at_period_end in Stripe. Does not delete local subscription record.
Access: "REGISTERED_USER"

## 05 Customer - Subscriptions

### `POST` `/api/v1/customer/subscription/checkout`

Summary: Create Stripe subscription checkout
Description: Access: REGISTERED_USER. REGISTERED_USER only. Endpoint is scoped to the authenticated customer account. REGISTERED_USER only. Backend calculates price from admin-created SubscriptionPlan and optional coupon. Uses Stripe subscription flow with payment_behavior=default_incomplete.
Access: "REGISTERED_USER"

## 05 Customer - Subscriptions

### `POST` `/api/v1/customer/subscription/confirm`

Summary: Confirm Stripe subscription activation
Description: Access: REGISTERED_USER. REGISTERED_USER only. Endpoint is scoped to the authenticated customer account. REGISTERED_USER only. Fetches Stripe subscription server-side and activates local entitlement when active/trialing.
Access: "REGISTERED_USER"

## 05 Customer - Subscriptions

### `GET` `/api/v1/customer/subscription/current`

Summary: Fetch own current subscription
Description: Access: REGISTERED_USER. REGISTERED_USER only. Endpoint is scoped to the authenticated customer account. REGISTERED_USER only. Returns FREE state when no active premium subscription exists.
Access: "REGISTERED_USER"

## 05 Customer - Subscriptions

### `GET` `/api/v1/customer/subscription/invoices`

Summary: List own subscription invoices
Description: Access: REGISTERED_USER. REGISTERED_USER only. Endpoint is scoped to the authenticated customer account. REGISTERED_USER only. Returns invoices synced from Stripe subscription webhooks.
Access: "REGISTERED_USER"

## 05 Customer - Subscriptions

### `GET` `/api/v1/customer/subscription/invoices/{id}`

Summary: Fetch own subscription invoice details
Description: Access: REGISTERED_USER. REGISTERED_USER only. Endpoint is scoped to the authenticated customer account. REGISTERED_USER only.
Access: "REGISTERED_USER"

## 05 Customer - Subscriptions

### `GET` `/api/v1/customer/subscription/plans`

Summary: List public active subscription plans
Description: Access: REGISTERED_USER. REGISTERED_USER only. Endpoint is scoped to the authenticated customer account. REGISTERED_USER only. Uses admin-created active/public Subscription Plans. Customer cannot create/update/delete plans.
Access: "REGISTERED_USER"

## 05 Customer - Subscriptions

### `POST` `/api/v1/customer/subscription/reactivate`

Summary: Reactivate scheduled cancellation
Description: Access: REGISTERED_USER. REGISTERED_USER only. Endpoint is scoped to the authenticated customer account. REGISTERED_USER only. Works only when own subscription has cancelAtPeriodEnd=true.
Access: "REGISTERED_USER"

## 05 Customer - Transactions

### `GET` `/api/v1/customer/transactions`

Summary: List own customer transactions
Description: Access: REGISTERED_USER. REGISTERED_USER only. Endpoint is scoped to the authenticated customer account. REGISTERED_USER only. Normalizes backend Payment, Order, MoneyGift, and RecurringPayment occurrence records owned by the logged-in customer.
Access: "REGISTERED_USER"

## 05 Customer - Transactions

### `GET` `/api/v1/customer/transactions/{id}`

Summary: Fetch own transaction details
Description: Access: REGISTERED_USER. REGISTERED_USER only. Endpoint is scoped to the authenticated customer account. Includes order, money gift, recurring payment, and payment gateway references when available. Billing address returns null until available.
Access: "REGISTERED_USER"

## 05 Customer - Transactions

### `GET` `/api/v1/customer/transactions/{id}/receipt`

Summary: Download own transaction receipt
Description: Access: REGISTERED_USER. REGISTERED_USER only. Endpoint is scoped to the authenticated customer account. Receipt is generated only for the transaction owner and never exposes Stripe secret data.
Access: "REGISTERED_USER"

## 05 Customer - Transactions

### `GET` `/api/v1/customer/transactions/export`

Summary: Export own transactions
Description: Access: REGISTERED_USER. REGISTERED_USER only. Endpoint is scoped to the authenticated customer account. CSV is supported and returned as a file. Export is scoped to the logged-in customer only.
Access: "REGISTERED_USER"

## 05 Customer - Transactions

### `GET` `/api/v1/customer/transactions/summary`

Summary: Fetch own transaction summary
Description: Access: REGISTERED_USER. REGISTERED_USER only. Endpoint is scoped to the authenticated customer account. Defaults to current month when no date range is provided. Uses backend-calculated payment records only.
Access: "REGISTERED_USER"

## 05 Customer - Wallet

### `GET` `/api/v1/customer/wallet`

Summary: Fetch own wallet
Description: Access: REGISTERED_USER. REGISTERED_USER only. Endpoint is scoped to the authenticated customer account. REGISTERED_USER only. Wallet is lazily created and balances are backed by wallet ledger entries.
Access: "REGISTERED_USER"

## 05 Customer - Wallet

### `POST` `/api/v1/customer/wallet/add-funds`

Summary: Create wallet top-up payment
Description: Access: REGISTERED_USER. REGISTERED_USER only. Endpoint is scoped to the authenticated customer account. Uses Stripe PaymentIntent. Wallet is credited only after successful server-side confirmation/webhook.
Access: "REGISTERED_USER"

## 05 Customer - Wallet

### `GET` `/api/v1/customer/wallet/history`

Summary: List own wallet history
Description: Access: REGISTERED_USER. REGISTERED_USER only. Endpoint is scoped to the authenticated customer account. Positive amounts are credits, negative amounts are debits. Results are scoped to the logged-in customer.
Access: "REGISTERED_USER"

## 05 Customer - Wishlist

### `GET` `/api/v1/customer/wishlist`

Summary: List wishlist gifts
Description: Access: REGISTERED_USER. REGISTERED_USER only. Endpoint is scoped to the authenticated customer account. REGISTERED_USER only. Returns customer-safe available gifts.
Access: "REGISTERED_USER"

## 05 Customer - Wishlist

### `POST` `/api/v1/customer/wishlist/{giftId}`

Summary: Add gift to wishlist
Description: Access: REGISTERED_USER. REGISTERED_USER only. Endpoint is scoped to the authenticated customer account. REGISTERED_USER only. Gift must be active, approved, published, and in stock. Duplicate wishlist entries are ignored.
Access: "REGISTERED_USER"

## 05 Customer - Wishlist

### `DELETE` `/api/v1/customer/wishlist/{giftId}`

Summary: Remove gift from wishlist
Description: Access: REGISTERED_USER. REGISTERED_USER only. Endpoint is scoped to the authenticated customer account. REGISTERED_USER only. Removes only the current customer wishlist row.
Access: "REGISTERED_USER"

## 04 Gifts - Categories

### `GET` `/api/v1/gift-categories`

Summary: List gift categories
Description: Access: SUPER_ADMIN or ADMIN with giftCategories.read. SUPER_ADMIN or ADMIN with giftCategories.read permission. RBAC permission: giftCategories.read. Returns soft-delete-filtered categories with gift counts and category media fields.
Access: "SUPER_ADMIN or ADMIN with giftCategories.read"

## 04 Gifts - Categories

### `POST` `/api/v1/gift-categories`

Summary: Create gift category
Description: Access: SUPER_ADMIN or ADMIN with giftCategories.create. SUPER_ADMIN or ADMIN with giftCategories.create permission. RBAC permission: giftCategories.create. Slug is auto-generated and unique. backgroundColor defaults to #F3E8FF; color remains a backward-compatible alias.
Access: "SUPER_ADMIN or ADMIN with giftCategories.create"

## 04 Gifts - Categories

### `GET` `/api/v1/gift-categories/{id}`

Summary: Fetch gift category details
Description: Access: SUPER_ADMIN or ADMIN with giftCategories.read. SUPER_ADMIN or ADMIN with giftCategories.read permission. RBAC permission: giftCategories.read. Includes backgroundColor and imageUrl for customer app design support.
Access: "SUPER_ADMIN or ADMIN with giftCategories.read"

## 04 Gifts - Categories

### `PATCH` `/api/v1/gift-categories/{id}`

Summary: Update gift category
Description: Access: SUPER_ADMIN or ADMIN with giftCategories.update. SUPER_ADMIN or ADMIN with giftCategories.update permission. RBAC permission: giftCategories.update. Slug is regenerated when name changes. Soft-deleted categories are not updated.
Access: "SUPER_ADMIN or ADMIN with giftCategories.update"

## 04 Gifts - Categories

### `DELETE` `/api/v1/gift-categories/{id}`

Summary: Soft-delete gift category
Description: Access: SUPER_ADMIN or ADMIN with giftCategories.delete. SUPER_ADMIN or ADMIN with giftCategories.delete permission. RBAC permission: giftCategories.delete. Categories with attached gifts cannot be deleted; delete writes an audit log.
Access: "SUPER_ADMIN or ADMIN with giftCategories.delete"

## 04 Gifts - Categories

### `GET` `/api/v1/gift-categories/lookup`

Summary: Lookup active gift categories
Description: Access: PUBLIC. PUBLIC. Active gift category lookup. Public lookup under Gift Categories. Returns active category identifiers and media fields for lightweight selectors.
Access: "PUBLIC"

## 04 Gifts - Categories

### `GET` `/api/v1/gift-categories/stats`

Summary: Fetch gift category stats
Description: Access: SUPER_ADMIN or ADMIN with giftCategories.read. SUPER_ADMIN or ADMIN with giftCategories.read permission. RBAC permission: giftCategories.read. Returns admin category inventory counters.
Access: "SUPER_ADMIN or ADMIN with giftCategories.read"

## 04 Gifts - Moderation

### `GET` `/api/v1/gift-moderation`

Summary: List optional gift moderation queue
Description: Access: SUPER_ADMIN or ADMIN with giftModeration.read. SUPER_ADMIN or ADMIN with giftModeration.read permission. Gift Moderation is optional/admin review workflow for flagged/reported/admin-curated content. Provider inventory does not require mandatory gift approval for marketplace visibility.
Access: "SUPER_ADMIN or ADMIN with giftModeration.read"

## 04 Gifts - Moderation

### `PATCH` `/api/v1/gift-moderation/{id}/approve`

Summary: Approve gift in optional moderation workflow
Description: Access: SUPER_ADMIN or ADMIN with giftModeration.approve. SUPER_ADMIN or ADMIN with giftModeration.approve permission. This is no longer required for provider-created inventory visibility; approved active providers can publish inventory directly.
Access: "SUPER_ADMIN or ADMIN with giftModeration.approve"

## 04 Gifts - Moderation

### `PATCH` `/api/v1/gift-moderation/{id}/flag`

Summary: PATCH /api/v1/gift-moderation/{id}/flag
Description: Access: SUPER_ADMIN or ADMIN with giftModeration.flag. SUPER_ADMIN or ADMIN with giftModeration.flag permission.
Access: "SUPER_ADMIN or ADMIN with giftModeration.flag"

## 04 Gifts - Moderation

### `PATCH` `/api/v1/gift-moderation/{id}/reject`

Summary: PATCH /api/v1/gift-moderation/{id}/reject
Description: Access: SUPER_ADMIN or ADMIN with giftModeration.reject. SUPER_ADMIN or ADMIN with giftModeration.reject permission.
Access: "SUPER_ADMIN or ADMIN with giftModeration.reject"

## 04 Gifts - Management

### `GET` `/api/v1/gifts`

Summary: List admin gifts
Description: Access: SUPER_ADMIN or ADMIN with gifts.read. SUPER_ADMIN or ADMIN with gifts.read permission. SUPER_ADMIN/ADMIN with gifts.read. Supports category/provider/status/moderation filters.
Access: "SUPER_ADMIN or ADMIN with gifts.read"

## 04 Gifts - Management

### `POST` `/api/v1/gifts`

Summary: Create admin gift with optional nested variants
Description: Access: SUPER_ADMIN or ADMIN with gifts.create. SUPER_ADMIN or ADMIN with gifts.create permission. SUPER_ADMIN/ADMIN with gifts.create. Nested variants are created in the same transaction and stored in GiftVariant.
Access: "SUPER_ADMIN or ADMIN with gifts.create"

## 04 Gifts - Management

### `GET` `/api/v1/gifts/{id}`

Summary: Fetch admin gift details with variants
Description: Access: SUPER_ADMIN or ADMIN with gifts.read. SUPER_ADMIN or ADMIN with gifts.read permission.
Access: "SUPER_ADMIN or ADMIN with gifts.read"

## 04 Gifts - Management

### `PATCH` `/api/v1/gifts/{id}`

Summary: Update admin gift and upsert nested variants
Description: Access: SUPER_ADMIN or ADMIN with gifts.update. SUPER_ADMIN or ADMIN with gifts.update permission. If replaceVariants=true, omitted variants are soft-deleted. Only one default variant is allowed.
Access: "SUPER_ADMIN or ADMIN with gifts.update"

## 04 Gifts - Management

### `DELETE` `/api/v1/gifts/{id}`

Summary: Soft-delete gift
Description: Access: SUPER_ADMIN or ADMIN with gifts.delete. SUPER_ADMIN or ADMIN with gifts.delete permission.
Access: "SUPER_ADMIN or ADMIN with gifts.delete"

## 04 Gifts - Management

### `PATCH` `/api/v1/gifts/{id}/status`

Summary: Update gift status
Description: Access: SUPER_ADMIN or ADMIN with gifts.status.update. SUPER_ADMIN or ADMIN with gifts.status.update permission.
Access: "SUPER_ADMIN or ADMIN with gifts.status.update"

## 04 Gifts - Management

### `GET` `/api/v1/gifts/export`

Summary: Export gift inventory
Description: Access: SUPER_ADMIN or ADMIN with gifts.export. SUPER_ADMIN or ADMIN with gifts.export permission.
Access: "SUPER_ADMIN or ADMIN with gifts.export"

## 04 Gifts - Management

### `GET` `/api/v1/gifts/stats`

Summary: Fetch gift inventory stats
Description: Access: SUPER_ADMIN or ADMIN with gifts.read. SUPER_ADMIN or ADMIN with gifts.read permission.
Access: "SUPER_ADMIN or ADMIN with gifts.read"

## 01 Auth - Login Attempts

### `GET` `/api/v1/login-attempts`

Summary: GET /api/v1/login-attempts
Description: Access: SUPER_ADMIN or ADMIN with loginAttempts.read. SUPER_ADMIN or ADMIN with loginAttempts.read permission.
Access: "SUPER_ADMIN or ADMIN with loginAttempts.read"

## 01 Auth - Login Attempts

### `GET` `/api/v1/login-attempts/export`

Summary: GET /api/v1/login-attempts/export
Description: Access: SUPER_ADMIN or ADMIN with loginAttempts.export. SUPER_ADMIN or ADMIN with loginAttempts.export permission.
Access: "SUPER_ADMIN or ADMIN with loginAttempts.export"

## 01 Auth - Login Attempts

### `GET` `/api/v1/login-attempts/stats`

Summary: GET /api/v1/login-attempts/stats
Description: Access: SUPER_ADMIN or ADMIN with loginAttempts.read. SUPER_ADMIN or ADMIN with loginAttempts.read permission.
Access: "SUPER_ADMIN or ADMIN with loginAttempts.read"

## 02 Admin - Media Upload Policy

### `GET` `/api/v1/media-upload-policy`

Summary: Fetch global media upload policy
Description: Access: SUPER_ADMIN or ADMIN with mediaPolicy.read. SUPER_ADMIN or ADMIN with mediaPolicy.read permission. SUPER_ADMIN or ADMIN with mediaPolicy.read. uploads/presigned-url enforces this policy before issuing upload URLs.
Access: "SUPER_ADMIN or ADMIN with mediaPolicy.read"

## 02 Admin - Media Upload Policy

### `PATCH` `/api/v1/media-upload-policy`

Summary: Update global media upload policy
Description: Access: SUPER_ADMIN. SUPER_ADMIN only. Updates global media upload policy. SUPER_ADMIN only. Does not expose AWS secrets or bucket credentials.
Access: "SUPER_ADMIN"

## 02 Admin - Media Upload Policy

### `GET` `/api/v1/media-upload-policy/audit-logs`

Summary: List media upload policy audit logs
Description: Access: SUPER_ADMIN. SUPER_ADMIN only. Media upload policy audit logs. SUPER_ADMIN only.
Access: "SUPER_ADMIN"

## 06 Notifications

### `GET` `/api/v1/notifications`

Summary: List notifications
Description: Access: SUPER_ADMIN, ADMIN, PROVIDER, or REGISTERED_USER. SUPER_ADMIN, ADMIN, PROVIDER, or REGISTERED_USER. Access is scoped to the authenticated account. JWT auth. Returns only notifications belonging to the logged-in account. Supports All, Unread, Birthdays, Deliveries, and New Contacts filters. No group gift notifications are supported.
Access: "SUPER_ADMIN, ADMIN, PROVIDER, or REGISTERED_USER"

## 06 Notifications

### `POST` `/api/v1/notifications/{id}/action`

Summary: Process notification action
Description: Access: SUPER_ADMIN, ADMIN, PROVIDER, or REGISTERED_USER. SUPER_ADMIN, ADMIN, PROVIDER, or REGISTERED_USER. Access is scoped to the authenticated account. JWT auth. Supports SEND_GIFT, REMIND_ME_LATER, VIEW_ORDER, VIEW_CONTACT. Group gift actions are not supported.
Access: "SUPER_ADMIN, ADMIN, PROVIDER, or REGISTERED_USER"

## 06 Notifications

### `PATCH` `/api/v1/notifications/{id}/read`

Summary: Mark notification as read
Description: Access: SUPER_ADMIN, ADMIN, PROVIDER, or REGISTERED_USER. SUPER_ADMIN, ADMIN, PROVIDER, or REGISTERED_USER. Access is scoped to the authenticated account. JWT auth. Notification must belong to the logged-in account.
Access: "SUPER_ADMIN, ADMIN, PROVIDER, or REGISTERED_USER"

## 06 Notifications

### `POST` `/api/v1/notifications/device-tokens`

Summary: Save device token
Description: Access: SUPER_ADMIN, ADMIN, PROVIDER, or REGISTERED_USER. SUPER_ADMIN, ADMIN, PROVIDER, or REGISTERED_USER. Access is scoped to the authenticated account. JWT auth. Token belongs only to logged-in account. Duplicate deviceId updates existing record.
Access: "SUPER_ADMIN, ADMIN, PROVIDER, or REGISTERED_USER"

## 06 Notifications

### `DELETE` `/api/v1/notifications/device-tokens/{id}`

Summary: Disable device token
Description: Access: SUPER_ADMIN, ADMIN, PROVIDER, or REGISTERED_USER. SUPER_ADMIN, ADMIN, PROVIDER, or REGISTERED_USER. Access is scoped to the authenticated account. JWT auth. Users can disable only their own device tokens.
Access: "SUPER_ADMIN, ADMIN, PROVIDER, or REGISTERED_USER"

## 06 Notifications

### `GET` `/api/v1/notifications/preferences`

Summary: Fetch notification preferences
Description: Access: SUPER_ADMIN, ADMIN, PROVIDER, or REGISTERED_USER. SUPER_ADMIN, ADMIN, PROVIDER, or REGISTERED_USER. Access is scoped to the authenticated account. JWT auth. Preferences belong only to the logged-in account.
Access: "SUPER_ADMIN, ADMIN, PROVIDER, or REGISTERED_USER"

## 06 Notifications

### `PATCH` `/api/v1/notifications/preferences`

Summary: Update notification preferences
Description: Access: SUPER_ADMIN, ADMIN, PROVIDER, or REGISTERED_USER. SUPER_ADMIN, ADMIN, PROVIDER, or REGISTERED_USER. Access is scoped to the authenticated account. JWT auth. Push toggle does not delete device tokens. No group gift preference exists.
Access: "SUPER_ADMIN, ADMIN, PROVIDER, or REGISTERED_USER"

## 06 Notifications

### `PATCH` `/api/v1/notifications/read-all`

Summary: Mark all own notifications as read
Description: Access: SUPER_ADMIN, ADMIN, PROVIDER, or REGISTERED_USER. SUPER_ADMIN, ADMIN, PROVIDER, or REGISTERED_USER. Access is scoped to the authenticated account. JWT auth. Marks only notifications belonging to the logged-in account.
Access: "SUPER_ADMIN, ADMIN, PROVIDER, or REGISTERED_USER"

## 06 Notifications

### `GET` `/api/v1/notifications/summary`

Summary: Fetch notification summary
Description: Access: SUPER_ADMIN, ADMIN, PROVIDER, or REGISTERED_USER. SUPER_ADMIN, ADMIN, PROVIDER, or REGISTERED_USER. Access is scoped to the authenticated account. JWT auth. Counts only notifications belonging to the logged-in account.
Access: "SUPER_ADMIN, ADMIN, PROVIDER, or REGISTERED_USER"

## 06 Payments

### `POST` `/api/v1/payments/stripe/webhook`

Summary: Stripe webhook endpoint
Description: Access: PUBLIC. PUBLIC. Verifies Stripe-Signature using the configured webhook secret before processing events.
Access: "PUBLIC"

## 02 Admin - Roles & Permissions

### `GET` `/api/v1/permissions/catalog`

Summary: GET /api/v1/permissions/catalog
Description: Access: SUPER_ADMIN. SUPER_ADMIN only. Read-only backend permission catalog. Read-only list of backend-supported permission keys that can be assigned to admin roles.
Access: "SUPER_ADMIN"

## 07 Plans & Coupons

### `GET` `/api/v1/plan-features`

Summary: GET /api/v1/plan-features
Description: Access: SUPER_ADMIN or ADMIN with planFeatures.read. SUPER_ADMIN or ADMIN with planFeatures.read permission.
Access: "SUPER_ADMIN or ADMIN with planFeatures.read"

## 07 Plans & Coupons

### `POST` `/api/v1/plan-features`

Summary: POST /api/v1/plan-features
Description: Access: SUPER_ADMIN or ADMIN with planFeatures.create. SUPER_ADMIN or ADMIN with planFeatures.create permission.
Access: "SUPER_ADMIN or ADMIN with planFeatures.create"

## 07 Plans & Coupons

### `GET` `/api/v1/plan-features/{id}`

Summary: GET /api/v1/plan-features/{id}
Description: Access: SUPER_ADMIN or ADMIN with planFeatures.read. SUPER_ADMIN or ADMIN with planFeatures.read permission.
Access: "SUPER_ADMIN or ADMIN with planFeatures.read"

## 07 Plans & Coupons

### `PATCH` `/api/v1/plan-features/{id}`

Summary: PATCH /api/v1/plan-features/{id}
Description: Access: SUPER_ADMIN or ADMIN with planFeatures.update. SUPER_ADMIN or ADMIN with planFeatures.update permission.
Access: "SUPER_ADMIN or ADMIN with planFeatures.update"

## 07 Plans & Coupons

### `DELETE` `/api/v1/plan-features/{id}`

Summary: DELETE /api/v1/plan-features/{id}
Description: Access: SUPER_ADMIN or ADMIN with planFeatures.delete. SUPER_ADMIN or ADMIN with planFeatures.delete permission.
Access: "SUPER_ADMIN or ADMIN with planFeatures.delete"

## 07 Plans & Coupons

### `GET` `/api/v1/plan-features/catalog`

Summary: GET /api/v1/plan-features/catalog
Description: Access: SUPER_ADMIN or ADMIN with planFeatures.read. SUPER_ADMIN or ADMIN with planFeatures.read permission.
Access: "SUPER_ADMIN or ADMIN with planFeatures.read"

## 03 Provider - Promotional Offers

### `GET` `/api/v1/promotional-offers`

Summary: GET /api/v1/promotional-offers
Description: Access: SUPER_ADMIN or ADMIN with promotionalOffers.read. SUPER_ADMIN or ADMIN with promotionalOffers.read permission.
Access: "SUPER_ADMIN or ADMIN with promotionalOffers.read"

## 03 Provider - Promotional Offers

### `POST` `/api/v1/promotional-offers`

Summary: POST /api/v1/promotional-offers
Description: Access: SUPER_ADMIN or ADMIN with promotionalOffers.create. SUPER_ADMIN or ADMIN with promotionalOffers.create permission.
Access: "SUPER_ADMIN or ADMIN with promotionalOffers.create"

## 03 Provider - Promotional Offers

### `GET` `/api/v1/promotional-offers/{id}`

Summary: GET /api/v1/promotional-offers/{id}
Description: Access: SUPER_ADMIN or ADMIN with promotionalOffers.read. SUPER_ADMIN or ADMIN with promotionalOffers.read permission.
Access: "SUPER_ADMIN or ADMIN with promotionalOffers.read"

## 03 Provider - Promotional Offers

### `PATCH` `/api/v1/promotional-offers/{id}`

Summary: PATCH /api/v1/promotional-offers/{id}
Description: Access: SUPER_ADMIN or ADMIN with promotionalOffers.update. SUPER_ADMIN or ADMIN with promotionalOffers.update permission.
Access: "SUPER_ADMIN or ADMIN with promotionalOffers.update"

## 03 Provider - Promotional Offers

### `DELETE` `/api/v1/promotional-offers/{id}`

Summary: DELETE /api/v1/promotional-offers/{id}
Description: Access: SUPER_ADMIN or ADMIN with promotionalOffers.delete. SUPER_ADMIN or ADMIN with promotionalOffers.delete permission.
Access: "SUPER_ADMIN or ADMIN with promotionalOffers.delete"

## 03 Provider - Promotional Offers

### `PATCH` `/api/v1/promotional-offers/{id}/approve`

Summary: PATCH /api/v1/promotional-offers/{id}/approve
Description: Access: SUPER_ADMIN or ADMIN with promotionalOffers.approve. SUPER_ADMIN or ADMIN with promotionalOffers.approve permission.
Access: "SUPER_ADMIN or ADMIN with promotionalOffers.approve"

## 03 Provider - Promotional Offers

### `PATCH` `/api/v1/promotional-offers/{id}/reject`

Summary: PATCH /api/v1/promotional-offers/{id}/reject
Description: Access: SUPER_ADMIN or ADMIN with promotionalOffers.reject. SUPER_ADMIN or ADMIN with promotionalOffers.reject permission.
Access: "SUPER_ADMIN or ADMIN with promotionalOffers.reject"

## 03 Provider - Promotional Offers

### `PATCH` `/api/v1/promotional-offers/{id}/status`

Summary: PATCH /api/v1/promotional-offers/{id}/status
Description: Access: SUPER_ADMIN or ADMIN with promotionalOffers.status.update. SUPER_ADMIN or ADMIN with promotionalOffers.status.update permission.
Access: "SUPER_ADMIN or ADMIN with promotionalOffers.status.update"

## 03 Provider - Promotional Offers

### `GET` `/api/v1/promotional-offers/export`

Summary: GET /api/v1/promotional-offers/export
Description: Access: SUPER_ADMIN or ADMIN with promotionalOffers.export. SUPER_ADMIN or ADMIN with promotionalOffers.export permission.
Access: "SUPER_ADMIN or ADMIN with promotionalOffers.export"

## 03 Provider - Promotional Offers

### `GET` `/api/v1/promotional-offers/stats`

Summary: GET /api/v1/promotional-offers/stats
Description: Access: SUPER_ADMIN or ADMIN with promotionalOffers.read. SUPER_ADMIN or ADMIN with promotionalOffers.read permission.
Access: "SUPER_ADMIN or ADMIN with promotionalOffers.read"

## 02 Admin - Provider Business Categories

### `GET` `/api/v1/provider-business-categories`

Summary: List provider business categories
Description: Access: PUBLIC. PUBLIC. Active provider business category lookup for provider signup. Public/provider-signup dropdown. Returns active provider business categories.
Access: "PUBLIC"

## 02 Admin - Provider Business Categories

### `POST` `/api/v1/provider-business-categories`

Summary: Create provider business category
Description: Access: SUPER_ADMIN or ADMIN with providerBusinessCategories.create. SUPER_ADMIN or ADMIN with providerBusinessCategories.create permission. SUPER_ADMIN or ADMIN with providerBusinessCategories.create permission only.
Access: "SUPER_ADMIN or ADMIN with providerBusinessCategories.create"

## 02 Admin - Provider Business Categories

### `GET` `/api/v1/provider-business-categories/{id}`

Summary: Fetch provider business category details
Description: Access: SUPER_ADMIN or ADMIN with providerBusinessCategories.read. SUPER_ADMIN or ADMIN with providerBusinessCategories.read permission. SUPER_ADMIN or ADMIN with providerBusinessCategories.read permission only.
Access: "SUPER_ADMIN or ADMIN with providerBusinessCategories.read"

## 02 Admin - Provider Business Categories

### `PATCH` `/api/v1/provider-business-categories/{id}`

Summary: Update provider business category
Description: Access: SUPER_ADMIN or ADMIN with providerBusinessCategories.update. SUPER_ADMIN or ADMIN with providerBusinessCategories.update permission. SUPER_ADMIN or ADMIN with providerBusinessCategories.update permission only.
Access: "SUPER_ADMIN or ADMIN with providerBusinessCategories.update"

## 02 Admin - Provider Business Categories

### `DELETE` `/api/v1/provider-business-categories/{id}`

Summary: Soft-delete provider business category
Description: Access: SUPER_ADMIN or ADMIN with providerBusinessCategories.delete. SUPER_ADMIN or ADMIN with providerBusinessCategories.delete permission. SUPER_ADMIN or ADMIN with providerBusinessCategories.delete permission. Soft delete only; refuses deletion when active providers are attached.
Access: "SUPER_ADMIN or ADMIN with providerBusinessCategories.delete"

## 03 Provider - Business Info

### `GET` `/api/v1/provider/business-info`

Summary: Fetch own provider business information
Description: Access: PROVIDER. PROVIDER only. providerId is derived from JWT; provider can access only own inventory, offers, orders, analytics, and messages. PROVIDER only. providerId is derived from JWT.
Access: "PROVIDER"

## 03 Provider - Business Info

### `PATCH` `/api/v1/provider/business-info`

Summary: Update own provider business information
Description: Access: PROVIDER. PROVIDER only. providerId is derived from JWT; provider can access only own inventory, offers, orders, analytics, and messages. PROVIDER only. Cannot set approvalStatus/isActive; material business changes require verification review.
Access: "PROVIDER"

## 03 Provider - Buyer Chat

### `GET` `/api/v1/provider/chats`

Summary: List provider buyer chats
Description: Access: Authenticated. Authenticated JWT required. PROVIDER only. Uses shared ChatThread/ChatMessage records with customer provider chat. Provider sees only own provider-order threads.
Access: "Authenticated"

## 03 Provider - Buyer Chat

### `GET` `/api/v1/provider/chats/{threadId}`

Summary: Fetch provider buyer chat messages
Description: Access: Authenticated. Authenticated JWT required. PROVIDER only. Thread must belong to the authenticated provider.
Access: "Authenticated"

## 03 Provider - Buyer Chat

### `POST` `/api/v1/provider/chats/{threadId}/messages`

Summary: Send chat message to buyer
Description: Access: Authenticated. Authenticated JWT required. PROVIDER only. Provider can send only in own provider order thread. Creates customer notification and updates read receipts.
Access: "Authenticated"

## 03 Provider - Buyer Chat

### `PATCH` `/api/v1/provider/chats/{threadId}/read`

Summary: Mark buyer messages read
Description: Access: Authenticated. Authenticated JWT required. PROVIDER only. Marks customer messages as read for provider in an owned thread.
Access: "Authenticated"

## 03 Provider - Buyer Chat

### `GET` `/api/v1/provider/chats/quick-replies`

Summary: Fetch provider buyer chat quick replies
Description: Access: Authenticated. Authenticated JWT required. PROVIDER only. Declared before /provider/chats/:threadId.
Access: "Authenticated"

## 03 Provider - Inventory

### `GET` `/api/v1/provider/inventory`

Summary: List provider inventory items
Description: Access: PROVIDER. PROVIDER only. providerId is derived from JWT; provider can access only own inventory, offers, orders, analytics, and messages. PROVIDER only. Pending providers cannot access inventory. Provider inventory items do not require separate admin approval; visibility depends on approved/active provider plus item active, available, in stock, and not deleted.
Access: "PROVIDER"

## 03 Provider - Inventory

### `POST` `/api/v1/provider/inventory`

Summary: Create provider inventory item with optional nested variants
Description: Access: PROVIDER. PROVIDER only. providerId is derived from JWT; provider can access only own inventory, offers, orders, analytics, and messages. PROVIDER only. Pending providers cannot access this module. Provider inventory items do not require separate admin approval; approved active providers can create active, available inventory directly.
Access: "PROVIDER"

## 03 Provider - Inventory

### `GET` `/api/v1/provider/inventory/{id}`

Summary: Fetch own provider inventory item details
Description: Access: PROVIDER. PROVIDER only. providerId is derived from JWT; provider can access only own inventory, offers, orders, analytics, and messages.
Access: "PROVIDER"

## 03 Provider - Inventory

### `PATCH` `/api/v1/provider/inventory/{id}`

Summary: Update own provider inventory item and upsert variants
Description: Access: PROVIDER. PROVIDER only. providerId is derived from JWT; provider can access only own inventory, offers, orders, analytics, and messages. Variant id must belong to the provider-owned gift. Price, name, media, and variant changes do not reset provider inventory to pending moderation.
Access: "PROVIDER"

## 03 Provider - Inventory

### `DELETE` `/api/v1/provider/inventory/{id}`

Summary: Soft-delete own inventory item
Description: Access: PROVIDER. PROVIDER only. providerId is derived from JWT; provider can access only own inventory, offers, orders, analytics, and messages.
Access: "PROVIDER"

## 03 Provider - Inventory

### `PATCH` `/api/v1/provider/inventory/{id}/availability`

Summary: Update own inventory availability
Description: Access: PROVIDER. PROVIDER only. providerId is derived from JWT; provider can access only own inventory, offers, orders, analytics, and messages.
Access: "PROVIDER"

## 03 Provider - Inventory

### `GET` `/api/v1/provider/inventory/lookup`

Summary: Lookup active provider inventory items
Description: Access: PROVIDER. PROVIDER only. providerId is derived from JWT; provider can access only own inventory, offers, orders, analytics, and messages. PROVIDER only. Gift moderation approval is not required for provider inventory lookup.
Access: "PROVIDER"

## 03 Provider - Inventory

### `GET` `/api/v1/provider/inventory/stats`

Summary: Fetch provider inventory stats
Description: Access: PROVIDER. PROVIDER only. providerId is derived from JWT; provider can access only own inventory, offers, orders, analytics, and messages.
Access: "PROVIDER"

## 03 Provider - Promotional Offers

### `GET` `/api/v1/provider/offers`

Summary: GET /api/v1/provider/offers
Description: Access: PROVIDER. PROVIDER only. providerId is derived from JWT; provider can access only own inventory, offers, orders, analytics, and messages.
Access: "PROVIDER"

## 03 Provider - Promotional Offers

### `POST` `/api/v1/provider/offers`

Summary: POST /api/v1/provider/offers
Description: Access: PROVIDER. PROVIDER only. providerId is derived from JWT; provider can access only own inventory, offers, orders, analytics, and messages.
Access: "PROVIDER"

## 03 Provider - Promotional Offers

### `GET` `/api/v1/provider/offers/{id}`

Summary: GET /api/v1/provider/offers/{id}
Description: Access: PROVIDER. PROVIDER only. providerId is derived from JWT; provider can access only own inventory, offers, orders, analytics, and messages.
Access: "PROVIDER"

## 03 Provider - Promotional Offers

### `PATCH` `/api/v1/provider/offers/{id}`

Summary: PATCH /api/v1/provider/offers/{id}
Description: Access: PROVIDER. PROVIDER only. providerId is derived from JWT; provider can access only own inventory, offers, orders, analytics, and messages.
Access: "PROVIDER"

## 03 Provider - Promotional Offers

### `DELETE` `/api/v1/provider/offers/{id}`

Summary: DELETE /api/v1/provider/offers/{id}
Description: Access: PROVIDER. PROVIDER only. providerId is derived from JWT; provider can access only own inventory, offers, orders, analytics, and messages.
Access: "PROVIDER"

## 03 Provider - Promotional Offers

### `PATCH` `/api/v1/provider/offers/{id}/status`

Summary: PATCH /api/v1/provider/offers/{id}/status
Description: Access: PROVIDER. PROVIDER only. providerId is derived from JWT; provider can access only own inventory, offers, orders, analytics, and messages.
Access: "PROVIDER"

## 03 Provider - Orders

### `GET` `/api/v1/provider/orders`

Summary: List own assigned provider orders
Description: Access: PROVIDER. PROVIDER only. providerId is derived from JWT; provider can access only own inventory, offers, orders, analytics, and messages. PROVIDER only. Returns only orders assigned to the authenticated providerId. Default status filter is PENDING.
Access: "PROVIDER"

## 03 Provider - Orders

### `GET` `/api/v1/provider/orders/{id}`

Summary: Fetch own provider order details
Description: Access: PROVIDER. PROVIDER only. providerId is derived from JWT; provider can access only own inventory, offers, orders, analytics, and messages. PROVIDER only. Does not expose customer card/payment secrets or admin-only order fields.
Access: "PROVIDER"

## 03 Provider - Orders

### `POST` `/api/v1/provider/orders/{id}/accept`

Summary: Accept own pending provider order
Description: Access: PROVIDER. PROVIDER only. providerId is derived from JWT; provider can access only own inventory, offers, orders, analytics, and messages. Allowed transition: PENDING -> ACCEPTED. Creates timeline entry and customer notification.
Access: "PROVIDER"

## 03 Provider - Buyer Chat

### `GET` `/api/v1/provider/orders/{id}/chat`

Summary: Get or optionally create provider order chat
Description: Access: PROVIDER. PROVIDER only. providerId is derived from JWT; provider can access only own inventory, offers, orders, analytics, and messages. PROVIDER only. Provider order must belong to logged-in provider. Reuses existing thread if present.
Access: "PROVIDER"

## 03 Provider - Buyer Chat

### `POST` `/api/v1/provider/orders/{id}/chat`

Summary: Create provider order chat
Description: Access: PROVIDER. PROVIDER only. providerId is derived from JWT; provider can access only own inventory, offers, orders, analytics, and messages. PROVIDER only. Creates or returns shared ChatThread for an owned provider order.
Access: "PROVIDER"

## 03 Provider - Orders

### `GET` `/api/v1/provider/orders/{id}/checklist`

Summary: Fetch own provider order checklist
Description: Access: PROVIDER. PROVIDER only. providerId is derived from JWT; provider can access only own inventory, offers, orders, analytics, and messages. PROVIDER only. Checklist is operational and does not change status automatically.
Access: "PROVIDER"

## 03 Provider - Orders

### `PATCH` `/api/v1/provider/orders/{id}/checklist`

Summary: Update own provider order checklist
Description: Access: PROVIDER. PROVIDER only. providerId is derived from JWT; provider can access only own inventory, offers, orders, analytics, and messages. PROVIDER only. Checklist updates do not directly change order status.
Access: "PROVIDER"

## 03 Provider - Orders

### `POST` `/api/v1/provider/orders/{id}/fulfill`

Summary: Fulfill own provider order with dispatch details
Description: Access: PROVIDER. PROVIDER only. providerId is derived from JWT; provider can access only own inventory, offers, orders, analytics, and messages. PROVIDER only. Dedicated Figma fulfill action. Stores dispatch date/time, estimated delivery, carrier, tracking number, moves provider order to SHIPPED, syncs parent order, creates timeline entry, and optionally notifies customer.
Access: "PROVIDER"

## 03 Provider - Orders

### `POST` `/api/v1/provider/orders/{id}/message-buyer`

Summary: Message buyer for own provider order
Description: Access: PROVIDER. PROVIDER only. providerId is derived from JWT; provider can access only own inventory, offers, orders, analytics, and messages. PROVIDER only. Creates an order message and customer notification; SMS is placeholder only.
Access: "PROVIDER"

## 03 Provider - Orders

### `POST` `/api/v1/provider/orders/{id}/reject`

Summary: Reject own pending provider order
Description: Access: PROVIDER. PROVIDER only. providerId is derived from JWT; provider can access only own inventory, offers, orders, analytics, and messages. Allowed transition: PENDING -> REJECTED. Does not refund automatically; flags order for review/cancellation based on provider split count.
Access: "PROVIDER"

## 03 Provider - Orders

### `PATCH` `/api/v1/provider/orders/{id}/status`

Summary: Update own provider order fulfillment status
Description: Access: PROVIDER. PROVIDER only. providerId is derived from JWT; provider can access only own inventory, offers, orders, analytics, and messages. PROVIDER only. Enforces ownership, valid transitions, paid-order fulfillment checks, timeline entries, and customer notifications.
Access: "PROVIDER"

## 03 Provider - Orders

### `GET` `/api/v1/provider/orders/{id}/timeline`

Summary: Fetch own provider order timeline
Description: Access: PROVIDER. PROVIDER only. providerId is derived from JWT; provider can access only own inventory, offers, orders, analytics, and messages. PROVIDER only. Timeline is scoped to the authenticated provider order.
Access: "PROVIDER"

## 03 Provider - Orders

### `GET` `/api/v1/provider/orders/analytics/ratings`

Summary: Fetch own provider ratings analytics
Description: Access: PROVIDER. PROVIDER only. providerId is derived from JWT; provider can access only own inventory, offers, orders, analytics, and messages. PROVIDER only. Returns stable zero values until reviews module is available.
Access: "PROVIDER"

## 03 Provider - Orders

### `GET` `/api/v1/provider/orders/analytics/revenue`

Summary: Fetch own provider revenue analytics
Description: Access: PROVIDER. PROVIDER only. providerId is derived from JWT; provider can access only own inventory, offers, orders, analytics, and messages. PROVIDER only. Revenue uses provider totalPayout for paid active/completed provider orders.
Access: "PROVIDER"

## 03 Provider - Orders

### `GET` `/api/v1/provider/orders/export`

Summary: Export own provider orders as CSV
Description: Access: PROVIDER. PROVIDER only. providerId is derived from JWT; provider can access only own inventory, offers, orders, analytics, and messages. PROVIDER only. Export is scoped to logged-in provider orders.
Access: "PROVIDER"

## 03 Provider - Orders

### `GET` `/api/v1/provider/orders/history`

Summary: List own provider order history
Description: Access: PROVIDER. PROVIDER only. providerId is derived from JWT; provider can access only own inventory, offers, orders, analytics, and messages. PROVIDER only. Uses ProviderOrder records scoped to the authenticated provider. Status tabs map to provider order statuses.
Access: "PROVIDER"

## 03 Provider - Orders

### `GET` `/api/v1/provider/orders/performance`

Summary: Fetch own provider order performance
Description: Access: PROVIDER. PROVIDER only. providerId is derived from JWT; provider can access only own inventory, offers, orders, analytics, and messages. PROVIDER only. Completion rate uses completed / non-cancelled own provider orders.
Access: "PROVIDER"

## 03 Provider - Orders

### `GET` `/api/v1/provider/orders/recent`

Summary: List recent own provider orders
Description: Access: PROVIDER. PROVIDER only. providerId is derived from JWT; provider can access only own inventory, offers, orders, analytics, and messages. PROVIDER only. Defaults to 5 latest orders.
Access: "PROVIDER"

## 03 Provider - Orders

### `GET` `/api/v1/provider/orders/reject-reasons`

Summary: List provider order reject reasons
Description: Access: PROVIDER. PROVIDER only. providerId is derived from JWT; provider can access only own inventory, offers, orders, analytics, and messages. Route intentionally declared before :id.
Access: "PROVIDER"

## 03 Provider - Orders

### `GET` `/api/v1/provider/orders/summary`

Summary: Fetch own provider order summary
Description: Access: PROVIDER. PROVIDER only. providerId is derived from JWT; provider can access only own inventory, offers, orders, analytics, and messages. Route intentionally declared before :id. PROVIDER only.
Access: "PROVIDER"

## 03 Provider - Refund Requests

### `GET` `/api/v1/provider/refund-requests`

Summary: List own provider refund requests
Description: Access: PROVIDER. PROVIDER only. providerId is derived from JWT; provider can access only own inventory, offers, orders, analytics, and messages. PROVIDER only. Returns refund requests for provider orders assigned to the authenticated provider. Search supports order number, customer name, and customer email.
Access: "PROVIDER"

## 03 Provider - Refund Requests

### `GET` `/api/v1/provider/refund-requests/{id}`

Summary: Fetch own refund request details
Description: Access: PROVIDER. PROVIDER only. providerId is derived from JWT; provider can access only own inventory, offers, orders, analytics, and messages. PROVIDER only. Refund request must belong to the authenticated provider order and never exposes Stripe secrets or raw card data.
Access: "PROVIDER"

## 03 Provider - Refund Requests

### `POST` `/api/v1/provider/refund-requests/{id}/approve`

Summary: Approve own requested refund
Description: Access: PROVIDER. PROVIDER only. providerId is derived from JWT; provider can access only own inventory, offers, orders, analytics, and messages. PROVIDER only. Validates ownership, REQUESTED status, requested amount, refundable amount, creates refund transaction marker, timeline entry, and customer notification.
Access: "PROVIDER"

## 03 Provider - Refund Requests

### `POST` `/api/v1/provider/refund-requests/{id}/reject`

Summary: Reject own requested refund
Description: Access: PROVIDER. PROVIDER only. providerId is derived from JWT; provider can access only own inventory, offers, orders, analytics, and messages. PROVIDER only. Validates ownership and REQUESTED status. Creates timeline entry and optional customer notification. No Stripe refund is created.
Access: "PROVIDER"

## 03 Provider - Refund Requests

### `GET` `/api/v1/provider/refund-requests/reject-reasons`

Summary: List refund rejection reasons
Description: Access: PROVIDER. PROVIDER only. providerId is derived from JWT; provider can access only own inventory, offers, orders, analytics, and messages. Route intentionally declared before :id. PROVIDER only.
Access: "PROVIDER"

## 03 Provider - Refund Requests

### `GET` `/api/v1/provider/refund-requests/summary`

Summary: Fetch own refund request summary
Description: Access: PROVIDER. PROVIDER only. providerId is derived from JWT; provider can access only own inventory, offers, orders, analytics, and messages. Route intentionally declared before :id. PROVIDER only.
Access: "PROVIDER"

## 03 Provider - Reviews

### `GET` `/api/v1/provider/reviews`

Summary: List provider reviews
Description: Access: Authenticated. Authenticated JWT required. PROVIDER only. Shows only reviews for own provider account/orders and excludes hidden/removed reviews.
Access: "Authenticated"

## 03 Provider - Reviews

### `GET` `/api/v1/provider/reviews/{id}`

Summary: GET /api/v1/provider/reviews/{id}
Description: Access: Authenticated. Authenticated JWT required.
Access: "Authenticated"

## 03 Provider - Reviews

### `POST` `/api/v1/provider/reviews/{id}/response`

Summary: Post public review response
Description: Access: Authenticated. Authenticated JWT required. PROVIDER only. Provider can respond only to own review. Only one active public response per review.
Access: "Authenticated"

## 03 Provider - Reviews

### `PATCH` `/api/v1/provider/reviews/{id}/response`

Summary: Update public review response
Description: Access: Authenticated. Authenticated JWT required. PROVIDER only. Updates only provider’s own active response; customer review content is never modified.
Access: "Authenticated"

## 03 Provider - Reviews

### `DELETE` `/api/v1/provider/reviews/{id}/response`

Summary: Soft-delete public review response
Description: Access: Authenticated. Authenticated JWT required. PROVIDER only. Soft-deletes own response and does not delete the original customer review.
Access: "Authenticated"

## 03 Provider - Reviews

### `GET` `/api/v1/provider/reviews/filter-options`

Summary: Fetch provider review filter options
Description: Access: Authenticated. Authenticated JWT required. PROVIDER only. Declared before /provider/reviews/:id.
Access: "Authenticated"

## 03 Provider - Reviews

### `GET` `/api/v1/provider/reviews/summary`

Summary: Fetch provider rating summary
Description: Access: Authenticated. Authenticated JWT required. PROVIDER only. Uses shared Review records visible to provider/customer/admin modules.
Access: "Authenticated"

## 02 Admin - Provider Management

### `GET` `/api/v1/providers`

Summary: List providers
Description: Access: SUPER_ADMIN or ADMIN with providers.read. SUPER_ADMIN or ADMIN with providers.read permission. SUPER_ADMIN/ADMIN with providers.read permission.
Access: "SUPER_ADMIN or ADMIN with providers.read"

## 02 Admin - Provider Management

### `POST` `/api/v1/providers`

Summary: Create provider from admin dashboard
Description: Access: SUPER_ADMIN or ADMIN with providers.create. SUPER_ADMIN or ADMIN with providers.create permission. SUPER_ADMIN or ADMIN with providers.create permission. Creates a PROVIDER account and provider business profile. Supports same business fields as provider self-registration, plus temporary password and invite email flow.
Access: "SUPER_ADMIN or ADMIN with providers.create"

## 02 Admin - Provider Management

### `GET` `/api/v1/providers/{id}`

Summary: GET /api/v1/providers/{id}
Description: Access: SUPER_ADMIN or ADMIN with providers.read. SUPER_ADMIN or ADMIN with providers.read permission.
Access: "SUPER_ADMIN or ADMIN with providers.read"

## 02 Admin - Provider Management

### `PATCH` `/api/v1/providers/{id}`

Summary: PATCH /api/v1/providers/{id}
Description: Access: SUPER_ADMIN or ADMIN with providers.update. SUPER_ADMIN or ADMIN with providers.update permission.
Access: "SUPER_ADMIN or ADMIN with providers.update"

## 02 Admin - Provider Management

### `DELETE` `/api/v1/providers/{id}`

Summary: Permanently delete provider
Description: Access: SUPER_ADMIN. SUPER_ADMIN only. Permanent delete danger-zone endpoint. DANGER: This endpoint permanently deletes/anonymizes the provider and related provider data from the database. This is not a soft delete. Use only from Super Admin danger zone screens. Active processing orders block deletion.
Access: "SUPER_ADMIN"

## 02 Admin - Provider Management

### `GET` `/api/v1/providers/{id}/activity`

Summary: GET /api/v1/providers/{id}/activity
Description: Access: SUPER_ADMIN or ADMIN with providers.read. SUPER_ADMIN or ADMIN with providers.read permission.
Access: "SUPER_ADMIN or ADMIN with providers.read"

## 02 Admin - Provider Management

### `GET` `/api/v1/providers/{id}/items`

Summary: GET /api/v1/providers/{id}/items
Description: Access: SUPER_ADMIN or ADMIN with providers.read. SUPER_ADMIN or ADMIN with providers.read permission.
Access: "SUPER_ADMIN or ADMIN with providers.read"

## 02 Admin - Provider Management

### `POST` `/api/v1/providers/{id}/message`

Summary: POST /api/v1/providers/{id}/message
Description: Access: SUPER_ADMIN or ADMIN with providers.message. SUPER_ADMIN or ADMIN with providers.message permission.
Access: "SUPER_ADMIN or ADMIN with providers.message"

## 02 Admin - Provider Management

### `PATCH` `/api/v1/providers/{id}/status`

Summary: Update provider lifecycle status
Description: Access: SUPER_ADMIN or ADMIN with provider lifecycle permission (APPROVE=>providers.approve, REJECT=>providers.reject, SUSPEND=>providers.suspend, UNSUSPEND=>providers.suspend, UPDATE_STATUS=>providers.updateStatus). SUPER_ADMIN or ADMIN with lifecycle permission. APPROVE requires providers.approve; REJECT requires providers.reject; SUSPEND and UNSUSPEND require providers.suspend; UPDATE_STATUS requires providers.updateStatus. SUPER_ADMIN or ADMIN with provider lifecycle permission. APPROVE requires providers.approve, REJECT requires providers.reject, SUSPEND and UNSUSPEND require providers.suspend, UPDATE_STATUS requires providers.updateStatus. Uses action-based request body.
Access: "SUPER_ADMIN or ADMIN with provider lifecycle permission (APPROVE=>providers.approve, REJECT=>providers.reject, SUSPEND=>providers.suspend, UNSUSPEND=>providers.suspend, UPDATE_STATUS=>providers.updateStatus)"

## 02 Admin - Provider Management

### `GET` `/api/v1/providers/export`

Summary: GET /api/v1/providers/export
Description: Access: SUPER_ADMIN or ADMIN with providers.export. SUPER_ADMIN or ADMIN with providers.export permission.
Access: "SUPER_ADMIN or ADMIN with providers.export"

## 02 Admin - Provider Management

### `GET` `/api/v1/providers/lookup`

Summary: GET /api/v1/providers/lookup
Description: Access: SUPER_ADMIN or ADMIN with providers.read. SUPER_ADMIN or ADMIN with providers.read permission.
Access: "SUPER_ADMIN or ADMIN with providers.read"

## 02 Admin - Provider Management

### `GET` `/api/v1/providers/stats`

Summary: GET /api/v1/providers/stats
Description: Access: SUPER_ADMIN or ADMIN with providers.read. SUPER_ADMIN or ADMIN with providers.read permission.
Access: "SUPER_ADMIN or ADMIN with providers.read"

## 02 Admin - Referral Settings

### `GET` `/api/v1/referral-settings`

Summary: Fetch referral settings
Description: Access: SUPER_ADMIN or ADMIN with referralSettings.read. SUPER_ADMIN or ADMIN with referralSettings.read permission. SUPER_ADMIN or ADMIN with referralSettings.read. Customer referral APIs consume these settings. Pending referrals use the settings snapshot stored at referral creation.
Access: "SUPER_ADMIN or ADMIN with referralSettings.read"

## 02 Admin - Referral Settings

### `PATCH` `/api/v1/referral-settings`

Summary: Update referral settings
Description: Access: SUPER_ADMIN. SUPER_ADMIN only. Changes apply to future referral snapshots. SUPER_ADMIN only. Changes apply to future referral snapshots and do not recalculate already-earned rewards.
Access: "SUPER_ADMIN"

## 02 Admin - Referral Settings

### `POST` `/api/v1/referral-settings/activate`

Summary: Activate referral program
Description: Access: SUPER_ADMIN. SUPER_ADMIN only. Activates referral program. SUPER_ADMIN only. Existing earned rewards remain redeemable.
Access: "SUPER_ADMIN"

## 02 Admin - Referral Settings

### `GET` `/api/v1/referral-settings/audit-logs`

Summary: List referral settings audit logs
Description: Access: SUPER_ADMIN. SUPER_ADMIN only. Referral settings audit logs. SUPER_ADMIN only.
Access: "SUPER_ADMIN"

## 02 Admin - Referral Settings

### `POST` `/api/v1/referral-settings/deactivate`

Summary: Deactivate referral program
Description: Access: SUPER_ADMIN. SUPER_ADMIN only. Deactivates referral program. SUPER_ADMIN only. New referral rewards are blocked while inactive; earned rewards remain redeemable.
Access: "SUPER_ADMIN"

## 02 Admin - Referral Settings

### `GET` `/api/v1/referral-settings/stats`

Summary: Fetch referral stats
Description: Access: SUPER_ADMIN or ADMIN with referralSettings.read. SUPER_ADMIN or ADMIN with referralSettings.read permission. SUPER_ADMIN or ADMIN with referralSettings.read.
Access: "SUPER_ADMIN or ADMIN with referralSettings.read"

## 07 Plans & Coupons

### `GET` `/api/v1/subscription-plans`

Summary: GET /api/v1/subscription-plans
Description: Access: SUPER_ADMIN or ADMIN with subscriptionPlans.read. SUPER_ADMIN or ADMIN with subscriptionPlans.read permission.
Access: "SUPER_ADMIN or ADMIN with subscriptionPlans.read"

## 07 Plans & Coupons

### `POST` `/api/v1/subscription-plans`

Summary: POST /api/v1/subscription-plans
Description: Access: SUPER_ADMIN or ADMIN with subscriptionPlans.create. SUPER_ADMIN or ADMIN with subscriptionPlans.create permission.
Access: "SUPER_ADMIN or ADMIN with subscriptionPlans.create"

## 07 Plans & Coupons

### `GET` `/api/v1/subscription-plans/{id}`

Summary: GET /api/v1/subscription-plans/{id}
Description: Access: SUPER_ADMIN or ADMIN with subscriptionPlans.read. SUPER_ADMIN or ADMIN with subscriptionPlans.read permission.
Access: "SUPER_ADMIN or ADMIN with subscriptionPlans.read"

## 07 Plans & Coupons

### `PATCH` `/api/v1/subscription-plans/{id}`

Summary: PATCH /api/v1/subscription-plans/{id}
Description: Access: SUPER_ADMIN or ADMIN with subscriptionPlans.update. SUPER_ADMIN or ADMIN with subscriptionPlans.update permission.
Access: "SUPER_ADMIN or ADMIN with subscriptionPlans.update"

## 07 Plans & Coupons

### `DELETE` `/api/v1/subscription-plans/{id}`

Summary: DELETE /api/v1/subscription-plans/{id}
Description: Access: SUPER_ADMIN or ADMIN with subscriptionPlans.delete. SUPER_ADMIN or ADMIN with subscriptionPlans.delete permission.
Access: "SUPER_ADMIN or ADMIN with subscriptionPlans.delete"

## 07 Plans & Coupons

### `GET` `/api/v1/subscription-plans/{id}/analytics`

Summary: GET /api/v1/subscription-plans/{id}/analytics
Description: Access: SUPER_ADMIN or ADMIN with subscriptionPlans.analytics.read. SUPER_ADMIN or ADMIN with subscriptionPlans.analytics.read permission.
Access: "SUPER_ADMIN or ADMIN with subscriptionPlans.analytics.read"

## 07 Plans & Coupons

### `PATCH` `/api/v1/subscription-plans/{id}/status`

Summary: PATCH /api/v1/subscription-plans/{id}/status
Description: Access: SUPER_ADMIN or ADMIN with subscriptionPlans.status.update. SUPER_ADMIN or ADMIN with subscriptionPlans.status.update permission.
Access: "SUPER_ADMIN or ADMIN with subscriptionPlans.status.update"

## 07 Plans & Coupons

### `PATCH` `/api/v1/subscription-plans/{id}/visibility`

Summary: PATCH /api/v1/subscription-plans/{id}/visibility
Description: Access: SUPER_ADMIN or ADMIN with subscriptionPlans.visibility.update. SUPER_ADMIN or ADMIN with subscriptionPlans.visibility.update permission.
Access: "SUPER_ADMIN or ADMIN with subscriptionPlans.visibility.update"

## 07 Plans & Coupons

### `GET` `/api/v1/subscription-plans/stats`

Summary: GET /api/v1/subscription-plans/stats
Description: Access: SUPER_ADMIN or ADMIN with subscriptionPlans.analytics.read. SUPER_ADMIN or ADMIN with subscriptionPlans.analytics.read permission.
Access: "SUPER_ADMIN or ADMIN with subscriptionPlans.analytics.read"

## 07 Storage

### `GET` `/api/v1/uploads`

Summary: GET /api/v1/uploads
Description: Access: SUPER_ADMIN, ADMIN, PROVIDER, or REGISTERED_USER. SUPER_ADMIN, ADMIN, PROVIDER, or REGISTERED_USER. Access is scoped to the authenticated account.
Access: "SUPER_ADMIN, ADMIN, PROVIDER, or REGISTERED_USER"

## 07 Storage

### `GET` `/api/v1/uploads/{id}`

Summary: GET /api/v1/uploads/{id}
Description: Access: SUPER_ADMIN, ADMIN, PROVIDER, or REGISTERED_USER. SUPER_ADMIN, ADMIN, PROVIDER, or REGISTERED_USER. Access is scoped to the authenticated account.
Access: "SUPER_ADMIN, ADMIN, PROVIDER, or REGISTERED_USER"

## 07 Storage

### `DELETE` `/api/v1/uploads/{id}`

Summary: DELETE /api/v1/uploads/{id}
Description: Access: SUPER_ADMIN, ADMIN, PROVIDER, or REGISTERED_USER. SUPER_ADMIN, ADMIN, PROVIDER, or REGISTERED_USER. Access is scoped to the authenticated account.
Access: "SUPER_ADMIN, ADMIN, PROVIDER, or REGISTERED_USER"

## 07 Storage

### `POST` `/api/v1/uploads/complete`

Summary: POST /api/v1/uploads/complete
Description: Access: SUPER_ADMIN, ADMIN, PROVIDER, or REGISTERED_USER. SUPER_ADMIN, ADMIN, PROVIDER, or REGISTERED_USER. Access is scoped to the authenticated account.
Access: "SUPER_ADMIN, ADMIN, PROVIDER, or REGISTERED_USER"

## 07 Storage

### `POST` `/api/v1/uploads/presigned-url`

Summary: Create presigned upload URL
Description: Access: SUPER_ADMIN, ADMIN, PROVIDER, or REGISTERED_USER. SUPER_ADMIN, ADMIN, PROVIDER, or REGISTERED_USER. Access is scoped to the authenticated account. Backend derives ownerId/ownerRole from the authenticated JWT. targetAccountId is optional and allowed only for SUPER_ADMIN/authorized ADMIN dashboard uploads. Normal users/providers should not send targetAccountId. Include giftId only for gift image uploads.
Access: "SUPER_ADMIN, ADMIN, PROVIDER, or REGISTERED_USER"

## 02 Admin - User Management

### `GET` `/api/v1/users`

Summary: List registered users
Description: Access: SUPER_ADMIN or ADMIN with users.read. SUPER_ADMIN or ADMIN with users.read permission. SUPER_ADMIN/ADMIN with users.read permission.
Access: "SUPER_ADMIN or ADMIN with users.read"

## 02 Admin - User Management

### `GET` `/api/v1/users/{id}`

Summary: GET /api/v1/users/{id}
Description: Access: SUPER_ADMIN or ADMIN with users.read. SUPER_ADMIN or ADMIN with users.read permission.
Access: "SUPER_ADMIN or ADMIN with users.read"

## 02 Admin - User Management

### `PATCH` `/api/v1/users/{id}`

Summary: PATCH /api/v1/users/{id}
Description: Access: SUPER_ADMIN or ADMIN with users.update. SUPER_ADMIN or ADMIN with users.update permission.
Access: "SUPER_ADMIN or ADMIN with users.update"

## 02 Admin - User Management

### `DELETE` `/api/v1/users/{id}`

Summary: Permanently delete registered user
Description: Access: SUPER_ADMIN. SUPER_ADMIN only. Permanent delete danger-zone endpoint. DANGER: This endpoint permanently deletes/anonymizes the registered user and removes related non-financial data from the database. This is not a soft delete. Use only from Super Admin danger zone screens.
Access: "SUPER_ADMIN"

## 02 Admin - User Management

### `GET` `/api/v1/users/{id}/activity`

Summary: GET /api/v1/users/{id}/activity
Description: Access: SUPER_ADMIN or ADMIN with users.read. SUPER_ADMIN or ADMIN with users.read permission.
Access: "SUPER_ADMIN or ADMIN with users.read"

## 02 Admin - User Management

### `POST` `/api/v1/users/{id}/reset-password`

Summary: Change registered user password
Description: Access: SUPER_ADMIN or ADMIN with users.resetPassword. SUPER_ADMIN or ADMIN with users.resetPassword permission. SUPER_ADMIN or ADMIN with users.resetPassword permission can change a REGISTERED_USER password from the dashboard. Optionally sends email and in-app notification to the user.
Access: "SUPER_ADMIN or ADMIN with users.resetPassword"

## 02 Admin - User Management

### `GET` `/api/v1/users/{id}/stats`

Summary: GET /api/v1/users/{id}/stats
Description: Access: SUPER_ADMIN or ADMIN with users.read. SUPER_ADMIN or ADMIN with users.read permission.
Access: "SUPER_ADMIN or ADMIN with users.read"

## 02 Admin - User Management

### `PATCH` `/api/v1/users/{id}/status`

Summary: PATCH /api/v1/users/{id}/status
Description: Access: SUPER_ADMIN or ADMIN with users.status.update. SUPER_ADMIN or ADMIN with users.status.update permission.
Access: "SUPER_ADMIN or ADMIN with users.status.update"

## 02 Admin - User Management

### `POST` `/api/v1/users/{id}/suspend`

Summary: POST /api/v1/users/{id}/suspend
Description: Access: SUPER_ADMIN or ADMIN with users.suspend. SUPER_ADMIN or ADMIN with users.suspend permission.
Access: "SUPER_ADMIN or ADMIN with users.suspend"

## 02 Admin - User Management

### `POST` `/api/v1/users/{id}/unsuspend`

Summary: POST /api/v1/users/{id}/unsuspend
Description: Access: SUPER_ADMIN or ADMIN with users.unsuspend. SUPER_ADMIN or ADMIN with users.unsuspend permission.
Access: "SUPER_ADMIN or ADMIN with users.unsuspend"

## 02 Admin - User Management

### `GET` `/api/v1/users/export`

Summary: GET /api/v1/users/export
Description: Access: SUPER_ADMIN or ADMIN with users.export. SUPER_ADMIN or ADMIN with users.export permission.
Access: "SUPER_ADMIN or ADMIN with users.export"
