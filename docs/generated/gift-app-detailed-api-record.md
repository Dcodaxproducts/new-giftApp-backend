# Gift App Backend — Detailed API Record


## 01 Auth

### `POST` `/api/v1/auth/users/register`
- **Access:** PUBLIC
- **Summary:** POST /api/v1/auth/users/register
- **Description:** Access: PUBLIC. PUBLIC.

### `POST` `/api/v1/auth/providers/register`
- **Access:** PUBLIC
- **Summary:** POST /api/v1/auth/providers/register
- **Description:** Access: PUBLIC. PUBLIC.

### `POST` `/api/v1/auth/guest/session`
- **Access:** PUBLIC
- **Summary:** POST /api/v1/auth/guest/session
- **Description:** Access: PUBLIC. PUBLIC.

### `POST` `/api/v1/auth/login`
- **Access:** PUBLIC
- **Summary:** POST /api/v1/auth/login
- **Description:** Access: PUBLIC. PUBLIC.

### `POST` `/api/v1/auth/refresh`
- **Access:** PUBLIC
- **Summary:** POST /api/v1/auth/refresh
- **Description:** Access: PUBLIC. PUBLIC.

### `POST` `/api/v1/auth/logout`
- **Access:** Authenticated
- **Summary:** POST /api/v1/auth/logout
- **Description:** Access: Authenticated. Authenticated JWT required.

### `POST` `/api/v1/auth/verify-email`
- **Access:** Authenticated
- **Summary:** POST /api/v1/auth/verify-email
- **Description:** Access: Authenticated. Authenticated JWT required.

### `POST` `/api/v1/auth/resend-otp`
- **Access:** Authenticated
- **Summary:** POST /api/v1/auth/resend-otp
- **Description:** Access: Authenticated. Authenticated JWT required.

### `POST` `/api/v1/auth/forgot-password`
- **Access:** PUBLIC
- **Summary:** POST /api/v1/auth/forgot-password
- **Description:** Access: PUBLIC. PUBLIC.

### `POST` `/api/v1/auth/verify-reset-otp`
- **Access:** PUBLIC
- **Summary:** POST /api/v1/auth/verify-reset-otp
- **Description:** Access: PUBLIC. PUBLIC.

### `POST` `/api/v1/auth/reset-password`
- **Access:** PUBLIC
- **Summary:** POST /api/v1/auth/reset-password
- **Description:** Access: PUBLIC. PUBLIC.

### `PATCH` `/api/v1/auth/change-password`
- **Access:** Authenticated
- **Summary:** PATCH /api/v1/auth/change-password
- **Description:** Access: Authenticated. Authenticated JWT required.

### `GET` `/api/v1/auth/me`
- **Access:** Authenticated
- **Summary:** GET /api/v1/auth/me
- **Description:** Access: Authenticated. Authenticated JWT required.

### `PATCH` `/api/v1/auth/me`
- **Access:** Authenticated
- **Summary:** PATCH /api/v1/auth/me
- **Description:** Access: Authenticated. Authenticated JWT required.

### `GET` `/api/v1/auth/sessions`
- **Access:** Authenticated
- **Summary:** GET /api/v1/auth/sessions
- **Description:** Access: Authenticated. Authenticated JWT required.

### `POST` `/api/v1/auth/sessions/logout-all`
- **Access:** Authenticated
- **Summary:** POST /api/v1/auth/sessions/logout-all
- **Description:** Access: Authenticated. Authenticated JWT required.

### `DELETE` `/api/v1/auth/sessions/{id}`
- **Access:** Authenticated
- **Summary:** DELETE /api/v1/auth/sessions/{id}
- **Description:** Access: Authenticated. Authenticated JWT required.
- **Parameters:** `id` (path)

### `DELETE` `/api/v1/auth/account`
- **Access:** Authenticated
- **Summary:** DELETE /api/v1/auth/account
- **Description:** Access: Authenticated. Authenticated JWT required.

### `POST` `/api/v1/auth/cancel-deletion`
- **Access:** Authenticated
- **Summary:** POST /api/v1/auth/cancel-deletion
- **Description:** Access: Authenticated. Authenticated JWT required.


## 01 Auth - Login Attempts

### `GET` `/api/v1/login-attempts/stats`
- **Access:** Authenticated
- **Summary:** GET /api/v1/login-attempts/stats
- **Description:** Access: SUPER_ADMIN or ADMIN with loginAttempts.read. SUPER_ADMIN or ADMIN with loginAttempts.read permission.
- **Parameters:** `email` (query), `status` (query), `role` (query), `page` (query), `limit` (query), `userId` (query), `from` (query), `to` (query)

### `GET` `/api/v1/login-attempts/export`
- **Access:** Authenticated
- **Summary:** GET /api/v1/login-attempts/export
- **Description:** Access: SUPER_ADMIN or ADMIN with loginAttempts.export. SUPER_ADMIN or ADMIN with loginAttempts.export permission.
- **Parameters:** `email` (query), `status` (query), `role` (query), `page` (query), `limit` (query), `userId` (query), `from` (query), `to` (query)

### `GET` `/api/v1/login-attempts`
- **Access:** Authenticated
- **Summary:** GET /api/v1/login-attempts
- **Description:** Access: SUPER_ADMIN or ADMIN with loginAttempts.read. SUPER_ADMIN or ADMIN with loginAttempts.read permission.
- **Parameters:** `email` (query), `status` (query), `role` (query), `page` (query), `limit` (query), `userId` (query), `from` (query), `to` (query)


## 02 Admin - Staff Management

### `POST` `/api/v1/admins`
- **Access:** Authenticated
- **Summary:** Create admin staff user
- **Description:** Access: SUPER_ADMIN. SUPER_ADMIN only. Creates ADMIN staff users only. Creates an ADMIN staff user under Super Admin. The roleId field is the AdminRole ID that controls this staff user's permissions. This endpoint cannot create SUPER_ADMIN, REGISTERED_USER, PROVIDER, or GUEST_USER accounts.

### `GET` `/api/v1/admins`
- **Access:** Authenticated
- **Summary:** List admin staff users
- **Description:** Access: SUPER_ADMIN. SUPER_ADMIN only. Admin staff management is controlled by Super Admin only. SUPER_ADMIN only. Returns User.role = ADMIN staff accounts only; SUPER_ADMIN accounts are intentionally excluded.
- **Parameters:** `page` (query), `limit` (query), `search` (query), `roleId` (query), `role` (query), `status` (query), `sortBy` (query), `sortOrder` (query)

### `GET` `/api/v1/admins/{id}`
- **Access:** Authenticated
- **Summary:** GET /api/v1/admins/{id}
- **Description:** Access: SUPER_ADMIN. SUPER_ADMIN only. Fetches ADMIN staff details.
- **Parameters:** `id` (path)

### `PATCH` `/api/v1/admins/{id}`
- **Access:** Authenticated
- **Summary:** PATCH /api/v1/admins/{id}
- **Description:** Access: SUPER_ADMIN. SUPER_ADMIN only. Updates ADMIN staff account details.
- **Parameters:** `id` (path)

### `DELETE` `/api/v1/admins/{id}`
- **Access:** Authenticated
- **Summary:** Permanently delete admin staff user
- **Description:** Access: SUPER_ADMIN. SUPER_ADMIN only. Permanently deletes an ADMIN staff account. DANGER: This endpoint permanently deletes an ADMIN staff account from the database. This is not a soft delete. Use only from Super Admin danger zone screens. SUPER_ADMIN accounts and self-delete are blocked.
- **Parameters:** `id` (path)

### `PATCH` `/api/v1/admins/{id}/active-status`
- **Access:** Authenticated
- **Summary:** PATCH /api/v1/admins/{id}/active-status
- **Description:** Access: SUPER_ADMIN. SUPER_ADMIN only. Updates ADMIN staff active status.
- **Parameters:** `id` (path)

### `PATCH` `/api/v1/admins/{id}/password`
- **Access:** Authenticated
- **Summary:** PATCH /api/v1/admins/{id}/password
- **Description:** Access: SUPER_ADMIN. SUPER_ADMIN only. Changes ADMIN staff password from dashboard.
- **Parameters:** `id` (path)


## 02 Admin - Roles & Permissions

### `GET` `/api/v1/admin-roles`
- **Access:** Authenticated
- **Summary:** GET /api/v1/admin-roles
- **Description:** Access: SUPER_ADMIN. SUPER_ADMIN only. Only SUPER_ADMIN can manage staff roles and permissions. Admin Roles / RBAC manages permission roles for ADMIN staff users only. SUPER_ADMIN has full immutable access and does not depend on AdminRole permissions.
- **Parameters:** `search` (query), `isSystem` (query), `isActive` (query)

### `POST` `/api/v1/admin-roles`
- **Access:** Authenticated
- **Summary:** POST /api/v1/admin-roles
- **Description:** Access: SUPER_ADMIN. SUPER_ADMIN only. ADMIN staff cannot create roles.

### `GET` `/api/v1/admin-roles/{id}`
- **Access:** Authenticated
- **Summary:** GET /api/v1/admin-roles/{id}
- **Description:** Access: SUPER_ADMIN. SUPER_ADMIN only. ADMIN staff cannot view role details.
- **Parameters:** `id` (path)

### `PATCH` `/api/v1/admin-roles/{id}`
- **Access:** Authenticated
- **Summary:** PATCH /api/v1/admin-roles/{id}
- **Description:** Access: SUPER_ADMIN. SUPER_ADMIN only. ADMIN staff cannot update roles.
- **Parameters:** `id` (path)

### `DELETE` `/api/v1/admin-roles/{id}`
- **Access:** Authenticated
- **Summary:** DELETE /api/v1/admin-roles/{id}
- **Description:** Access: SUPER_ADMIN. SUPER_ADMIN only. ADMIN staff cannot delete roles.
- **Parameters:** `id` (path)

### `PATCH` `/api/v1/admin-roles/{id}/permissions`
- **Access:** Authenticated
- **Summary:** PATCH /api/v1/admin-roles/{id}/permissions
- **Description:** Access: SUPER_ADMIN. SUPER_ADMIN only. ADMIN staff cannot update role permissions.
- **Parameters:** `id` (path)

### `GET` `/api/v1/permissions/catalog`
- **Access:** Authenticated
- **Summary:** GET /api/v1/permissions/catalog
- **Description:** Access: SUPER_ADMIN. SUPER_ADMIN only. Read-only backend permission catalog. Read-only list of backend-supported permission keys that can be assigned to admin roles.


## 02 Admin - User Management

### `GET` `/api/v1/users/export`
- **Access:** Authenticated
- **Summary:** GET /api/v1/users/export
- **Description:** Access: SUPER_ADMIN or ADMIN with users.export. SUPER_ADMIN or ADMIN with users.export permission.
- **Parameters:** `search` (query), `status` (query), `registrationFrom` (query), `registrationTo` (query), `format` (query)

### `GET` `/api/v1/users`
- **Access:** Authenticated
- **Summary:** List registered users
- **Description:** Access: SUPER_ADMIN or ADMIN with users.read. SUPER_ADMIN or ADMIN with users.read permission. SUPER_ADMIN/ADMIN with users.read permission.
- **Parameters:** `page` (query), `limit` (query), `search` (query), `status` (query), `registrationFrom` (query), `registrationTo` (query), `sortBy` (query), `sortOrder` (query)

### `GET` `/api/v1/users/{id}`
- **Access:** Authenticated
- **Summary:** GET /api/v1/users/{id}
- **Description:** Access: SUPER_ADMIN or ADMIN with users.read. SUPER_ADMIN or ADMIN with users.read permission.
- **Parameters:** `id` (path)

### `PATCH` `/api/v1/users/{id}`
- **Access:** Authenticated
- **Summary:** PATCH /api/v1/users/{id}
- **Description:** Access: SUPER_ADMIN or ADMIN with users.update. SUPER_ADMIN or ADMIN with users.update permission.
- **Parameters:** `id` (path)

### `DELETE` `/api/v1/users/{id}`
- **Access:** Authenticated
- **Summary:** Permanently delete registered user
- **Description:** Access: SUPER_ADMIN. SUPER_ADMIN only. Permanent delete danger-zone endpoint. DANGER: This endpoint permanently deletes/anonymizes the registered user and removes related non-financial data from the database. This is not a soft delete. Use only from Super Admin danger zone screens.
- **Parameters:** `id` (path)

### `PATCH` `/api/v1/users/{id}/status`
- **Access:** Authenticated
- **Summary:** PATCH /api/v1/users/{id}/status
- **Description:** Access: SUPER_ADMIN or ADMIN with users.status.update. SUPER_ADMIN or ADMIN with users.status.update permission.
- **Parameters:** `id` (path)

### `POST` `/api/v1/users/{id}/suspend`
- **Access:** Authenticated
- **Summary:** POST /api/v1/users/{id}/suspend
- **Description:** Access: SUPER_ADMIN or ADMIN with users.suspend. SUPER_ADMIN or ADMIN with users.suspend permission.
- **Parameters:** `id` (path)

### `POST` `/api/v1/users/{id}/unsuspend`
- **Access:** Authenticated
- **Summary:** POST /api/v1/users/{id}/unsuspend
- **Description:** Access: SUPER_ADMIN or ADMIN with users.unsuspend. SUPER_ADMIN or ADMIN with users.unsuspend permission.
- **Parameters:** `id` (path)

### `POST` `/api/v1/users/{id}/reset-password`
- **Access:** Authenticated
- **Summary:** Change registered user password
- **Description:** Access: SUPER_ADMIN or ADMIN with users.resetPassword. SUPER_ADMIN or ADMIN with users.resetPassword permission. SUPER_ADMIN or ADMIN with users.resetPassword permission can change a REGISTERED_USER password from the dashboard. Optionally sends email and in-app notification to the user.
- **Parameters:** `id` (path)

### `GET` `/api/v1/users/{id}/activity`
- **Access:** Authenticated
- **Summary:** GET /api/v1/users/{id}/activity
- **Description:** Access: SUPER_ADMIN or ADMIN with users.read. SUPER_ADMIN or ADMIN with users.read permission.
- **Parameters:** `id` (path), `page` (query), `limit` (query), `type` (query)

### `GET` `/api/v1/users/{id}/stats`
- **Access:** Authenticated
- **Summary:** GET /api/v1/users/{id}/stats
- **Description:** Access: SUPER_ADMIN or ADMIN with users.read. SUPER_ADMIN or ADMIN with users.read permission.
- **Parameters:** `id` (path)


## 02 Admin - Provider Management

### `GET` `/api/v1/providers/export`
- **Access:** Authenticated
- **Summary:** GET /api/v1/providers/export
- **Description:** Access: SUPER_ADMIN or ADMIN with providers.export. SUPER_ADMIN or ADMIN with providers.export permission.
- **Parameters:** `search` (query), `status` (query), `approvalStatus` (query), `format` (query)

### `GET` `/api/v1/providers/stats`
- **Access:** Authenticated
- **Summary:** GET /api/v1/providers/stats
- **Description:** Access: SUPER_ADMIN or ADMIN with providers.read. SUPER_ADMIN or ADMIN with providers.read permission.

### `GET` `/api/v1/providers`
- **Access:** Authenticated
- **Summary:** List providers
- **Description:** Access: SUPER_ADMIN or ADMIN with providers.read. SUPER_ADMIN or ADMIN with providers.read permission. SUPER_ADMIN/ADMIN with providers.read permission.
- **Parameters:** `page` (query), `limit` (query), `search` (query), `status` (query), `approvalStatus` (query), `sortBy` (query), `sortOrder` (query)

### `POST` `/api/v1/providers`
- **Access:** Authenticated
- **Summary:** Create provider from admin dashboard
- **Description:** Access: SUPER_ADMIN or ADMIN with providers.create. SUPER_ADMIN or ADMIN with providers.create permission. SUPER_ADMIN or ADMIN with providers.create permission. Creates a PROVIDER account and provider business profile. Supports same business fields as provider self-registration, plus temporary password and invite email flow.

### `GET` `/api/v1/providers/lookup`
- **Access:** Authenticated
- **Summary:** GET /api/v1/providers/lookup
- **Description:** Access: SUPER_ADMIN or ADMIN with providers.read. SUPER_ADMIN or ADMIN with providers.read permission.
- **Parameters:** `search` (query), `approvalStatus` (query), `isActive` (query), `limit` (query)

### `GET` `/api/v1/providers/{id}`
- **Access:** Authenticated
- **Summary:** GET /api/v1/providers/{id}
- **Description:** Access: SUPER_ADMIN or ADMIN with providers.read. SUPER_ADMIN or ADMIN with providers.read permission.
- **Parameters:** `id` (path)

### `PATCH` `/api/v1/providers/{id}`
- **Access:** Authenticated
- **Summary:** PATCH /api/v1/providers/{id}
- **Description:** Access: SUPER_ADMIN or ADMIN with providers.update. SUPER_ADMIN or ADMIN with providers.update permission.
- **Parameters:** `id` (path)

### `DELETE` `/api/v1/providers/{id}`
- **Access:** Authenticated
- **Summary:** Permanently delete provider
- **Description:** Access: SUPER_ADMIN. SUPER_ADMIN only. Permanent delete danger-zone endpoint. DANGER: This endpoint permanently deletes/anonymizes the provider and related provider data from the database. This is not a soft delete. Use only from Super Admin danger zone screens. Active processing orders block deletion.
- **Parameters:** `id` (path)

### `PATCH` `/api/v1/providers/{id}/status`
- **Access:** Authenticated
- **Summary:** Update provider lifecycle status
- **Description:** Access: SUPER_ADMIN or ADMIN with provider lifecycle permission (APPROVE=>providers.approve, REJECT=>providers.reject, SUSPEND=>providers.suspend, UNSUSPEND=>providers.suspend, UPDATE_STATUS=>providers.updateStatus). SUPER_ADMIN or ADMIN with lifecycle permission. APPROVE requires providers.approve; REJECT requires providers.reject; SUSPEND and UNSUSPEND require providers.suspend; UPDATE_STATUS requires providers.updateStatus. SUPER_ADMIN or ADMIN with provider lifecycle permission. APPROVE requires providers.approve, REJECT requires providers.reject, SUSPEND and UNSUSPEND require providers.suspend, UPDATE_STATUS requires providers.updateStatus. Uses action-based request body.
- **Request examples:**
  - `approveProvider`: `{"action": "APPROVE", "comment": "Documents verified successfully.", "notifyProvider": true}`
  - `rejectProvider`: `{"action": "REJECT", "reason": "INCOMPLETE_DOCUMENTS", "comment": "Business license document is missing.", "notifyProvider": true}`
  - `updateStatus`: `{"action": "UPDATE_STATUS", "status": "ACTIVE", "reason": "OTHER", "comment": "Provider account restored after review.", "notifyProvider": true}`
  - `suspendProvider`: `{"action": "SUSPEND", "reason": "POLICY_VIOLATION", "comment": "Provider violated platform policy.", "notifyProvider": true}`
  - `unsuspendProvider`: `{"action": "UNSUSPEND", "comment": "Provider account reviewed and restored.", "notifyProvider": true}`
- **Parameters:** `id` (path)

### `GET` `/api/v1/providers/{id}/items`
- **Access:** Authenticated
- **Summary:** GET /api/v1/providers/{id}/items
- **Description:** Access: SUPER_ADMIN or ADMIN with providers.read. SUPER_ADMIN or ADMIN with providers.read permission.
- **Parameters:** `id` (path), `page` (query), `limit` (query), `search` (query), `status` (query), `sortBy` (query), `sortOrder` (query)

### `GET` `/api/v1/providers/{id}/activity`
- **Access:** Authenticated
- **Summary:** GET /api/v1/providers/{id}/activity
- **Description:** Access: SUPER_ADMIN or ADMIN with providers.read. SUPER_ADMIN or ADMIN with providers.read permission.
- **Parameters:** `id` (path), `page` (query), `limit` (query), `type` (query)

### `POST` `/api/v1/providers/{id}/message`
- **Access:** Authenticated
- **Summary:** POST /api/v1/providers/{id}/message
- **Description:** Access: SUPER_ADMIN or ADMIN with providers.message. SUPER_ADMIN or ADMIN with providers.message permission.
- **Parameters:** `id` (path)


## 02 Admin - Provider Business Categories

### `GET` `/api/v1/provider-business-categories`
- **Access:** PUBLIC
- **Summary:** List provider business categories
- **Description:** Access: PUBLIC. PUBLIC. Active provider business category lookup for provider signup. Public/provider-signup dropdown. Returns active provider business categories.
- **Parameters:** `page` (query), `limit` (query), `search` (query), `isActive` (query)

### `POST` `/api/v1/provider-business-categories`
- **Access:** Authenticated
- **Summary:** Create provider business category
- **Description:** Access: SUPER_ADMIN or ADMIN with providerBusinessCategories.create. SUPER_ADMIN or ADMIN with providerBusinessCategories.create permission. SUPER_ADMIN or ADMIN with providerBusinessCategories.create permission only.

### `GET` `/api/v1/provider-business-categories/{id}`
- **Access:** Authenticated
- **Summary:** Fetch provider business category details
- **Description:** Access: SUPER_ADMIN or ADMIN with providerBusinessCategories.read. SUPER_ADMIN or ADMIN with providerBusinessCategories.read permission. SUPER_ADMIN or ADMIN with providerBusinessCategories.read permission only.
- **Parameters:** `id` (path)

### `PATCH` `/api/v1/provider-business-categories/{id}`
- **Access:** Authenticated
- **Summary:** Update provider business category
- **Description:** Access: SUPER_ADMIN or ADMIN with providerBusinessCategories.update. SUPER_ADMIN or ADMIN with providerBusinessCategories.update permission. SUPER_ADMIN or ADMIN with providerBusinessCategories.update permission only.
- **Parameters:** `id` (path)

### `DELETE` `/api/v1/provider-business-categories/{id}`
- **Access:** Authenticated
- **Summary:** Soft-delete provider business category
- **Description:** Access: SUPER_ADMIN or ADMIN with providerBusinessCategories.delete. SUPER_ADMIN or ADMIN with providerBusinessCategories.delete permission. SUPER_ADMIN or ADMIN with providerBusinessCategories.delete permission. Soft delete only; refuses deletion when active providers are attached.
- **Parameters:** `id` (path)


## 02 Admin - Referral Settings

### `GET` `/api/v1/referral-settings`
- **Access:** Authenticated
- **Summary:** Fetch referral settings
- **Description:** Access: SUPER_ADMIN or ADMIN with referralSettings.read. SUPER_ADMIN or ADMIN with referralSettings.read permission. SUPER_ADMIN or ADMIN with referralSettings.read. Customer referral APIs consume these settings. Pending referrals use the settings snapshot stored at referral creation.

### `PATCH` `/api/v1/referral-settings`
- **Access:** Authenticated
- **Summary:** Update referral settings
- **Description:** Access: SUPER_ADMIN. SUPER_ADMIN only. Changes apply to future referral snapshots. SUPER_ADMIN only. Changes apply to future referral snapshots and do not recalculate already-earned rewards.

### `POST` `/api/v1/referral-settings/activate`
- **Access:** Authenticated
- **Summary:** Activate referral program
- **Description:** Access: SUPER_ADMIN. SUPER_ADMIN only. Activates referral program. SUPER_ADMIN only. Existing earned rewards remain redeemable.

### `POST` `/api/v1/referral-settings/deactivate`
- **Access:** Authenticated
- **Summary:** Deactivate referral program
- **Description:** Access: SUPER_ADMIN. SUPER_ADMIN only. Deactivates referral program. SUPER_ADMIN only. New referral rewards are blocked while inactive; earned rewards remain redeemable.

### `GET` `/api/v1/referral-settings/stats`
- **Access:** Authenticated
- **Summary:** Fetch referral stats
- **Description:** Access: SUPER_ADMIN or ADMIN with referralSettings.read. SUPER_ADMIN or ADMIN with referralSettings.read permission. SUPER_ADMIN or ADMIN with referralSettings.read.

### `GET` `/api/v1/referral-settings/audit-logs`
- **Access:** Authenticated
- **Summary:** List referral settings audit logs
- **Description:** Access: SUPER_ADMIN. SUPER_ADMIN only. Referral settings audit logs. SUPER_ADMIN only.
- **Parameters:** `page` (query), `limit` (query), `fromDate` (query), `toDate` (query)


## 02 Admin - Media Upload Policy

### `GET` `/api/v1/media-upload-policy`
- **Access:** Authenticated
- **Summary:** Fetch global media upload policy
- **Description:** Access: SUPER_ADMIN or ADMIN with mediaPolicy.read. SUPER_ADMIN or ADMIN with mediaPolicy.read permission. SUPER_ADMIN or ADMIN with mediaPolicy.read. uploads/presigned-url enforces this policy before issuing upload URLs.

### `PATCH` `/api/v1/media-upload-policy`
- **Access:** Authenticated
- **Summary:** Update global media upload policy
- **Description:** Access: SUPER_ADMIN. SUPER_ADMIN only. Updates global media upload policy. SUPER_ADMIN only. Does not expose AWS secrets or bucket credentials.

### `GET` `/api/v1/media-upload-policy/audit-logs`
- **Access:** Authenticated
- **Summary:** List media upload policy audit logs
- **Description:** Access: SUPER_ADMIN. SUPER_ADMIN only. Media upload policy audit logs. SUPER_ADMIN only.
- **Parameters:** `page` (query), `limit` (query), `fromDate` (query), `toDate` (query)


## 02 Admin - Audit Logs

### `GET` `/api/v1/audit-logs/export`
- **Access:** Authenticated
- **Summary:** GET /api/v1/audit-logs/export
- **Description:** Access: SUPER_ADMIN. SUPER_ADMIN only. Audit log export is restricted to Super Admin.
- **Parameters:** `page` (query), `limit` (query), `actorId` (query), `targetId` (query), `action` (query), `targetType` (query), `module` (query), `from` (query), `to` (query), `sortBy` (query), `sortOrder` (query)

### `GET` `/api/v1/audit-logs`
- **Access:** Authenticated
- **Summary:** GET /api/v1/audit-logs
- **Description:** Access: SUPER_ADMIN. SUPER_ADMIN only. Audit logs are restricted to Super Admin.
- **Parameters:** `page` (query), `limit` (query), `actorId` (query), `targetId` (query), `action` (query), `targetType` (query), `module` (query), `from` (query), `to` (query), `sortBy` (query), `sortOrder` (query)

### `GET` `/api/v1/audit-logs/{id}`
- **Access:** Authenticated
- **Summary:** GET /api/v1/audit-logs/{id}
- **Description:** Access: SUPER_ADMIN. SUPER_ADMIN only. Audit log details are restricted to Super Admin.
- **Parameters:** `id` (path)


## 03 Provider - Business Info

### `GET` `/api/v1/provider/business-info`
- **Access:** Authenticated
- **Summary:** Fetch own provider business information
- **Description:** Access: PROVIDER. PROVIDER only. providerId is derived from JWT; provider can access only own inventory, offers, orders, analytics, and messages. PROVIDER only. providerId is derived from JWT.

### `PATCH` `/api/v1/provider/business-info`
- **Access:** Authenticated
- **Summary:** Update own provider business information
- **Description:** Access: PROVIDER. PROVIDER only. providerId is derived from JWT; provider can access only own inventory, offers, orders, analytics, and messages. PROVIDER only. Cannot set approvalStatus/isActive; material business changes require verification review.


## 03 Provider - Inventory

### `GET` `/api/v1/provider/inventory`
- **Access:** Authenticated
- **Summary:** List provider inventory items
- **Description:** Access: PROVIDER. PROVIDER only. providerId is derived from JWT; provider can access only own inventory, offers, orders, analytics, and messages. PROVIDER only. Returns only inventory owned by the authenticated provider.
- **Parameters:** `page` (query), `limit` (query), `search` (query), `status` (query), `categoryId` (query), `sortBy` (query), `sortOrder` (query)

### `POST` `/api/v1/provider/inventory`
- **Access:** Authenticated
- **Summary:** Create provider inventory item with optional nested variants
- **Description:** Access: PROVIDER. PROVIDER only. providerId is derived from JWT; provider can access only own inventory, offers, orders, analytics, and messages. PROVIDER only. providerId is derived from JWT; provider cannot approve/publish variants directly.
- **Request examples:**
  - `withVariants`: `{"name": "Luxury Perfume", "description": "Long-lasting premium fragrance.", "shortDescription": "Premium fragrance gift.", "categoryId": "gift_category_id", "price": 99.99, "currency": "PKR", "stockQuantity": 50, "sku": "PERFUME-001", "imageUrls": ["https://cdn.yourdomain.com/gift-images/perfume.png"], "isAvailable": true, "variants": [{"name": "30ml", "price": 89.99, "originalPrice": 119.99, "stockQuantity": 10, "sku": "PERFUME-30ML", "isPopular": false, "isDefault": false, "sortOrder": 1, "isActive": true}, {"name": "50ml", "price": 129.99, "originalPrice": 159.99, "stockQuantity": 20, "sku": "PERFUME-50ML", "isPopular": true, "isDefault": true, "sortOrder": 2, "isActive": true}]}`

### `GET` `/api/v1/provider/inventory/stats`
- **Access:** Authenticated
- **Summary:** Fetch provider inventory stats
- **Description:** Access: PROVIDER. PROVIDER only. providerId is derived from JWT; provider can access only own inventory, offers, orders, analytics, and messages.

### `GET` `/api/v1/provider/inventory/lookup`
- **Access:** Authenticated
- **Summary:** Lookup active approved provider inventory items
- **Description:** Access: PROVIDER. PROVIDER only. providerId is derived from JWT; provider can access only own inventory, offers, orders, analytics, and messages.

### `GET` `/api/v1/provider/inventory/{id}`
- **Access:** Authenticated
- **Summary:** Fetch own provider inventory item details
- **Description:** Access: PROVIDER. PROVIDER only. providerId is derived from JWT; provider can access only own inventory, offers, orders, analytics, and messages.
- **Parameters:** `id` (path)

### `PATCH` `/api/v1/provider/inventory/{id}`
- **Access:** Authenticated
- **Summary:** Update own provider inventory item and upsert variants
- **Description:** Access: PROVIDER. PROVIDER only. providerId is derived from JWT; provider can access only own inventory, offers, orders, analytics, and messages. Variant id must belong to the provider-owned gift. Material variant changes re-submit approved gifts for moderation; stock-only changes do not.
- **Request examples:**
  - `upsertVariants`: `{"replaceVariants": false, "variants": [{"id": "variant_id", "name": "50ml", "price": 129.99, "originalPrice": 159.99, "stockQuantity": 20, "sku": "PERFUME-50ML", "isPopular": true, "isDefault": true, "sortOrder": 2, "isActive": true}, {"name": "150ml", "price": 249.99, "originalPrice": 299.99, "stockQuantity": 5, "sku": "PERFUME-150ML", "isPopular": false, "isDefault": false, "sortOrder": 4, "isActive": true}]}`
- **Parameters:** `id` (path)

### `DELETE` `/api/v1/provider/inventory/{id}`
- **Access:** Authenticated
- **Summary:** Soft-delete own inventory item
- **Description:** Access: PROVIDER. PROVIDER only. providerId is derived from JWT; provider can access only own inventory, offers, orders, analytics, and messages.
- **Parameters:** `id` (path)

### `PATCH` `/api/v1/provider/inventory/{id}/availability`
- **Access:** Authenticated
- **Summary:** Update own inventory availability
- **Description:** Access: PROVIDER. PROVIDER only. providerId is derived from JWT; provider can access only own inventory, offers, orders, analytics, and messages.
- **Parameters:** `id` (path)


## 03 Provider - Promotional Offers

### `GET` `/api/v1/provider/offers`
- **Access:** Authenticated
- **Summary:** GET /api/v1/provider/offers
- **Description:** Access: PROVIDER. PROVIDER only. providerId is derived from JWT; provider can access only own inventory, offers, orders, analytics, and messages.
- **Parameters:** `page` (query), `limit` (query), `search` (query), `status` (query), `itemId` (query), `sortBy` (query), `sortOrder` (query)

### `POST` `/api/v1/provider/offers`
- **Access:** Authenticated
- **Summary:** POST /api/v1/provider/offers
- **Description:** Access: PROVIDER. PROVIDER only. providerId is derived from JWT; provider can access only own inventory, offers, orders, analytics, and messages.

### `GET` `/api/v1/provider/offers/{id}`
- **Access:** Authenticated
- **Summary:** GET /api/v1/provider/offers/{id}
- **Description:** Access: PROVIDER. PROVIDER only. providerId is derived from JWT; provider can access only own inventory, offers, orders, analytics, and messages.
- **Parameters:** `id` (path)

### `PATCH` `/api/v1/provider/offers/{id}`
- **Access:** Authenticated
- **Summary:** PATCH /api/v1/provider/offers/{id}
- **Description:** Access: PROVIDER. PROVIDER only. providerId is derived from JWT; provider can access only own inventory, offers, orders, analytics, and messages.
- **Parameters:** `id` (path)

### `DELETE` `/api/v1/provider/offers/{id}`
- **Access:** Authenticated
- **Summary:** DELETE /api/v1/provider/offers/{id}
- **Description:** Access: PROVIDER. PROVIDER only. providerId is derived from JWT; provider can access only own inventory, offers, orders, analytics, and messages.
- **Parameters:** `id` (path)

### `PATCH` `/api/v1/provider/offers/{id}/status`
- **Access:** Authenticated
- **Summary:** PATCH /api/v1/provider/offers/{id}/status
- **Description:** Access: PROVIDER. PROVIDER only. providerId is derived from JWT; provider can access only own inventory, offers, orders, analytics, and messages.
- **Parameters:** `id` (path)

### `GET` `/api/v1/promotional-offers/stats`
- **Access:** Authenticated
- **Summary:** GET /api/v1/promotional-offers/stats
- **Description:** Access: SUPER_ADMIN or ADMIN with promotionalOffers.read. SUPER_ADMIN or ADMIN with promotionalOffers.read permission.

### `GET` `/api/v1/promotional-offers/export`
- **Access:** Authenticated
- **Summary:** GET /api/v1/promotional-offers/export
- **Description:** Access: SUPER_ADMIN or ADMIN with promotionalOffers.export. SUPER_ADMIN or ADMIN with promotionalOffers.export permission.
- **Parameters:** `page` (query), `limit` (query), `search` (query), `status` (query), `itemId` (query), `sortBy` (query), `sortOrder` (query), `providerId` (query), `approvalStatus` (query), `discountType` (query), `startFrom` (query), `startTo` (query)

### `GET` `/api/v1/promotional-offers`
- **Access:** Authenticated
- **Summary:** GET /api/v1/promotional-offers
- **Description:** Access: SUPER_ADMIN or ADMIN with promotionalOffers.read. SUPER_ADMIN or ADMIN with promotionalOffers.read permission.
- **Parameters:** `page` (query), `limit` (query), `search` (query), `status` (query), `itemId` (query), `sortBy` (query), `sortOrder` (query), `providerId` (query), `approvalStatus` (query), `discountType` (query), `startFrom` (query), `startTo` (query)

### `POST` `/api/v1/promotional-offers`
- **Access:** Authenticated
- **Summary:** POST /api/v1/promotional-offers
- **Description:** Access: SUPER_ADMIN or ADMIN with promotionalOffers.create. SUPER_ADMIN or ADMIN with promotionalOffers.create permission.

### `GET` `/api/v1/promotional-offers/{id}`
- **Access:** Authenticated
- **Summary:** GET /api/v1/promotional-offers/{id}
- **Description:** Access: SUPER_ADMIN or ADMIN with promotionalOffers.read. SUPER_ADMIN or ADMIN with promotionalOffers.read permission.
- **Parameters:** `id` (path)

### `PATCH` `/api/v1/promotional-offers/{id}`
- **Access:** Authenticated
- **Summary:** PATCH /api/v1/promotional-offers/{id}
- **Description:** Access: SUPER_ADMIN or ADMIN with promotionalOffers.update. SUPER_ADMIN or ADMIN with promotionalOffers.update permission.
- **Parameters:** `id` (path)

### `DELETE` `/api/v1/promotional-offers/{id}`
- **Access:** Authenticated
- **Summary:** DELETE /api/v1/promotional-offers/{id}
- **Description:** Access: SUPER_ADMIN or ADMIN with promotionalOffers.delete. SUPER_ADMIN or ADMIN with promotionalOffers.delete permission.
- **Parameters:** `id` (path)

### `PATCH` `/api/v1/promotional-offers/{id}/approve`
- **Access:** Authenticated
- **Summary:** PATCH /api/v1/promotional-offers/{id}/approve
- **Description:** Access: SUPER_ADMIN or ADMIN with promotionalOffers.approve. SUPER_ADMIN or ADMIN with promotionalOffers.approve permission.
- **Parameters:** `id` (path)

### `PATCH` `/api/v1/promotional-offers/{id}/reject`
- **Access:** Authenticated
- **Summary:** PATCH /api/v1/promotional-offers/{id}/reject
- **Description:** Access: SUPER_ADMIN or ADMIN with promotionalOffers.reject. SUPER_ADMIN or ADMIN with promotionalOffers.reject permission.
- **Parameters:** `id` (path)

### `PATCH` `/api/v1/promotional-offers/{id}/status`
- **Access:** Authenticated
- **Summary:** PATCH /api/v1/promotional-offers/{id}/status
- **Description:** Access: SUPER_ADMIN or ADMIN with promotionalOffers.status.update. SUPER_ADMIN or ADMIN with promotionalOffers.status.update permission.
- **Parameters:** `id` (path)


## 03 Provider - Orders

### `GET` `/api/v1/provider/orders`
- **Access:** Authenticated
- **Summary:** List own assigned provider orders
- **Description:** Access: PROVIDER. PROVIDER only. providerId is derived from JWT; provider can access only own inventory, offers, orders, analytics, and messages. PROVIDER only. Returns only orders assigned to the authenticated providerId. Default status filter is PENDING.
- **Parameters:** `page` (query), `limit` (query), `status` (query), `search` (query), `fromDate` (query), `toDate` (query), `sortBy` (query), `sortOrder` (query)

### `GET` `/api/v1/provider/orders/history`
- **Access:** Authenticated
- **Summary:** List own provider order history
- **Description:** Access: PROVIDER. PROVIDER only. providerId is derived from JWT; provider can access only own inventory, offers, orders, analytics, and messages. PROVIDER only. Uses ProviderOrder records scoped to the authenticated provider. Status tabs map to provider order statuses.
- **Parameters:** `page` (query), `limit` (query), `status` (query), `search` (query), `fromDate` (query), `toDate` (query), `sortBy` (query), `sortOrder` (query)

### `GET` `/api/v1/provider/orders/performance`
- **Access:** Authenticated
- **Summary:** Fetch own provider order performance
- **Description:** Access: PROVIDER. PROVIDER only. providerId is derived from JWT; provider can access only own inventory, offers, orders, analytics, and messages. PROVIDER only. Completion rate uses completed / non-cancelled own provider orders.
- **Parameters:** `range` (query), `fromDate` (query), `toDate` (query)

### `GET` `/api/v1/provider/orders/analytics/revenue`
- **Access:** Authenticated
- **Summary:** Fetch own provider revenue analytics
- **Description:** Access: PROVIDER. PROVIDER only. providerId is derived from JWT; provider can access only own inventory, offers, orders, analytics, and messages. PROVIDER only. Revenue uses provider totalPayout for paid active/completed provider orders.
- **Parameters:** `range` (query), `fromDate` (query), `toDate` (query)

### `GET` `/api/v1/provider/orders/analytics/ratings`
- **Access:** Authenticated
- **Summary:** Fetch own provider ratings analytics
- **Description:** Access: PROVIDER. PROVIDER only. providerId is derived from JWT; provider can access only own inventory, offers, orders, analytics, and messages. PROVIDER only. Returns stable zero values until reviews module is available.

### `GET` `/api/v1/provider/orders/recent`
- **Access:** Authenticated
- **Summary:** List recent own provider orders
- **Description:** Access: PROVIDER. PROVIDER only. providerId is derived from JWT; provider can access only own inventory, offers, orders, analytics, and messages. PROVIDER only. Defaults to 5 latest orders.
- **Parameters:** `limit` (query)

### `GET` `/api/v1/provider/orders/export`
- **Access:** Authenticated
- **Summary:** Export own provider orders as CSV
- **Description:** Access: PROVIDER. PROVIDER only. providerId is derived from JWT; provider can access only own inventory, offers, orders, analytics, and messages. PROVIDER only. Export is scoped to logged-in provider orders.
- **Parameters:** `status` (query), `fromDate` (query), `toDate` (query), `format` (query)

### `GET` `/api/v1/provider/orders/summary`
- **Access:** Authenticated
- **Summary:** Fetch own provider order summary
- **Description:** Access: PROVIDER. PROVIDER only. providerId is derived from JWT; provider can access only own inventory, offers, orders, analytics, and messages. Route intentionally declared before :id. PROVIDER only.
- **Parameters:** `fromDate` (query), `toDate` (query)

### `GET` `/api/v1/provider/orders/reject-reasons`
- **Access:** Authenticated
- **Summary:** List provider order reject reasons
- **Description:** Access: PROVIDER. PROVIDER only. providerId is derived from JWT; provider can access only own inventory, offers, orders, analytics, and messages. Route intentionally declared before :id.

### `PATCH` `/api/v1/provider/orders/{id}/status`
- **Access:** Authenticated
- **Summary:** Update own provider order fulfillment status
- **Description:** Access: PROVIDER. PROVIDER only. providerId is derived from JWT; provider can access only own inventory, offers, orders, analytics, and messages. PROVIDER only. Enforces ownership, valid transitions, paid-order fulfillment checks, timeline entries, and customer notifications.
- **Parameters:** `id` (path)

### `POST` `/api/v1/provider/orders/{id}/fulfill`
- **Access:** Authenticated
- **Summary:** Fulfill own provider order with dispatch details
- **Description:** Access: PROVIDER. PROVIDER only. providerId is derived from JWT; provider can access only own inventory, offers, orders, analytics, and messages. PROVIDER only. Dedicated Figma fulfill action. Stores dispatch date/time, estimated delivery, carrier, tracking number, moves provider order to SHIPPED, syncs parent order, creates timeline entry, and optionally notifies customer.
- **Parameters:** `id` (path)

### `GET` `/api/v1/provider/orders/{id}/timeline`
- **Access:** Authenticated
- **Summary:** Fetch own provider order timeline
- **Description:** Access: PROVIDER. PROVIDER only. providerId is derived from JWT; provider can access only own inventory, offers, orders, analytics, and messages. PROVIDER only. Timeline is scoped to the authenticated provider order.
- **Parameters:** `id` (path)

### `GET` `/api/v1/provider/orders/{id}/checklist`
- **Access:** Authenticated
- **Summary:** Fetch own provider order checklist
- **Description:** Access: PROVIDER. PROVIDER only. providerId is derived from JWT; provider can access only own inventory, offers, orders, analytics, and messages. PROVIDER only. Checklist is operational and does not change status automatically.
- **Parameters:** `id` (path)

### `PATCH` `/api/v1/provider/orders/{id}/checklist`
- **Access:** Authenticated
- **Summary:** Update own provider order checklist
- **Description:** Access: PROVIDER. PROVIDER only. providerId is derived from JWT; provider can access only own inventory, offers, orders, analytics, and messages. PROVIDER only. Checklist updates do not directly change order status.
- **Parameters:** `id` (path)

### `POST` `/api/v1/provider/orders/{id}/message-buyer`
- **Access:** Authenticated
- **Summary:** Message buyer for own provider order
- **Description:** Access: PROVIDER. PROVIDER only. providerId is derived from JWT; provider can access only own inventory, offers, orders, analytics, and messages. PROVIDER only. Creates an order message and customer notification; SMS is placeholder only.
- **Parameters:** `id` (path)

### `GET` `/api/v1/provider/orders/{id}`
- **Access:** Authenticated
- **Summary:** Fetch own provider order details
- **Description:** Access: PROVIDER. PROVIDER only. providerId is derived from JWT; provider can access only own inventory, offers, orders, analytics, and messages. PROVIDER only. Does not expose customer card/payment secrets or admin-only order fields.
- **Parameters:** `id` (path)

### `POST` `/api/v1/provider/orders/{id}/accept`
- **Access:** Authenticated
- **Summary:** Accept own pending provider order
- **Description:** Access: PROVIDER. PROVIDER only. providerId is derived from JWT; provider can access only own inventory, offers, orders, analytics, and messages. Allowed transition: PENDING -> ACCEPTED. Creates timeline entry and customer notification.
- **Parameters:** `id` (path)

### `POST` `/api/v1/provider/orders/{id}/reject`
- **Access:** Authenticated
- **Summary:** Reject own pending provider order
- **Description:** Access: PROVIDER. PROVIDER only. providerId is derived from JWT; provider can access only own inventory, offers, orders, analytics, and messages. Allowed transition: PENDING -> REJECTED. Does not refund automatically; flags order for review/cancellation based on provider split count.
- **Parameters:** `id` (path)


## 03 Provider - Refund Requests

### `GET` `/api/v1/provider/refund-requests`
- **Access:** Authenticated
- **Summary:** List own provider refund requests
- **Description:** Access: PROVIDER. PROVIDER only. providerId is derived from JWT; provider can access only own inventory, offers, orders, analytics, and messages. PROVIDER only. Returns refund requests for provider orders assigned to the authenticated provider. Search supports order number, customer name, and customer email.
- **Parameters:** `page` (query), `limit` (query), `status` (query), `search` (query), `fromDate` (query), `toDate` (query), `sortBy` (query), `sortOrder` (query)

### `GET` `/api/v1/provider/refund-requests/summary`
- **Access:** Authenticated
- **Summary:** Fetch own refund request summary
- **Description:** Access: PROVIDER. PROVIDER only. providerId is derived from JWT; provider can access only own inventory, offers, orders, analytics, and messages. Route intentionally declared before :id. PROVIDER only.

### `GET` `/api/v1/provider/refund-requests/reject-reasons`
- **Access:** Authenticated
- **Summary:** List refund rejection reasons
- **Description:** Access: PROVIDER. PROVIDER only. providerId is derived from JWT; provider can access only own inventory, offers, orders, analytics, and messages. Route intentionally declared before :id. PROVIDER only.

### `GET` `/api/v1/provider/refund-requests/{id}`
- **Access:** Authenticated
- **Summary:** Fetch own refund request details
- **Description:** Access: PROVIDER. PROVIDER only. providerId is derived from JWT; provider can access only own inventory, offers, orders, analytics, and messages. PROVIDER only. Refund request must belong to the authenticated provider order and never exposes Stripe secrets or raw card data.
- **Parameters:** `id` (path)

### `POST` `/api/v1/provider/refund-requests/{id}/approve`
- **Access:** Authenticated
- **Summary:** Approve own requested refund
- **Description:** Access: PROVIDER. PROVIDER only. providerId is derived from JWT; provider can access only own inventory, offers, orders, analytics, and messages. PROVIDER only. Validates ownership, REQUESTED status, requested amount, refundable amount, creates refund transaction marker, timeline entry, and customer notification.
- **Request examples:**
  - `approve`: `{"comment": "Refund approved after reviewing evidence.", "refundAmount": 45, "notifyCustomer": true}`
- **Parameters:** `id` (path)

### `POST` `/api/v1/provider/refund-requests/{id}/reject`
- **Access:** Authenticated
- **Summary:** Reject own requested refund
- **Description:** Access: PROVIDER. PROVIDER only. providerId is derived from JWT; provider can access only own inventory, offers, orders, analytics, and messages. PROVIDER only. Validates ownership and REQUESTED status. Creates timeline entry and optional customer notification. No Stripe refund is created.
- **Request examples:**
  - `reject`: `{"reason": "REFUND_WINDOW_EXPIRED", "comment": "The request was submitted after the allowed refund period.", "notifyCustomer": true}`
- **Parameters:** `id` (path)


## 04 Gifts - Categories

### `GET` `/api/v1/gift-categories/lookup`
- **Access:** PUBLIC
- **Summary:** Lookup active gift categories
- **Description:** Access: PUBLIC. PUBLIC. Active gift category lookup. Public lookup under Gift Categories. Returns active category identifiers and media fields for lightweight selectors.

### `POST` `/api/v1/gift-categories`
- **Access:** giftCategories
- **Summary:** Create gift category
- **Description:** Access: SUPER_ADMIN or ADMIN with giftCategories.create. SUPER_ADMIN or ADMIN with giftCategories.create permission. RBAC permission: giftCategories.create. Slug is auto-generated and unique. backgroundColor defaults to #F3E8FF; color remains a backward-compatible alias.
- **Request examples:**
  - `create`: `{"name": "Perfumes", "description": "Premium fragrance gifts.", "iconKey": "perfume", "backgroundColor": "#E9D5FF", "imageUrl": "https://<YOUR_PUBLIC_BUCKET_OR_CDN_URL>/gift-category-images/perfumes.png", "sortOrder": 1, "isActive": true}`

### `GET` `/api/v1/gift-categories`
- **Access:** giftCategories
- **Summary:** List gift categories
- **Description:** Access: SUPER_ADMIN or ADMIN with giftCategories.read. SUPER_ADMIN or ADMIN with giftCategories.read permission. RBAC permission: giftCategories.read. Returns soft-delete-filtered categories with gift counts and category media fields.
- **Parameters:** `page` (query), `limit` (query), `search` (query), `isActive` (query), `sortBy` (query), `sortOrder` (query)

### `GET` `/api/v1/gift-categories/stats`
- **Access:** giftCategories
- **Summary:** Fetch gift category stats
- **Description:** Access: SUPER_ADMIN or ADMIN with giftCategories.read. SUPER_ADMIN or ADMIN with giftCategories.read permission. RBAC permission: giftCategories.read. Returns admin category inventory counters.

### `GET` `/api/v1/gift-categories/{id}`
- **Access:** giftCategories
- **Summary:** Fetch gift category details
- **Description:** Access: SUPER_ADMIN or ADMIN with giftCategories.read. SUPER_ADMIN or ADMIN with giftCategories.read permission. RBAC permission: giftCategories.read. Includes backgroundColor and imageUrl for customer app design support.
- **Parameters:** `id` (path)

### `PATCH` `/api/v1/gift-categories/{id}`
- **Access:** giftCategories
- **Summary:** Update gift category
- **Description:** Access: SUPER_ADMIN or ADMIN with giftCategories.update. SUPER_ADMIN or ADMIN with giftCategories.update permission. RBAC permission: giftCategories.update. Slug is regenerated when name changes. Soft-deleted categories are not updated.
- **Request examples:**
  - `update`: `{"backgroundColor": "#F3E8FF", "imageUrl": "https://<YOUR_PUBLIC_BUCKET_OR_CDN_URL>/gift-category-images/perfumes.png", "isActive": true}`
- **Parameters:** `id` (path)

### `DELETE` `/api/v1/gift-categories/{id}`
- **Access:** giftCategories
- **Summary:** Soft-delete gift category
- **Description:** Access: SUPER_ADMIN or ADMIN with giftCategories.delete. SUPER_ADMIN or ADMIN with giftCategories.delete permission. RBAC permission: giftCategories.delete. Categories with attached gifts cannot be deleted; delete writes an audit log.
- **Parameters:** `id` (path)


## 04 Gifts - Management

### `POST` `/api/v1/gifts`
- **Access:** Authenticated
- **Summary:** Create admin gift with optional nested variants
- **Description:** Access: SUPER_ADMIN or ADMIN with gifts.create. SUPER_ADMIN or ADMIN with gifts.create permission. SUPER_ADMIN/ADMIN with gifts.create. Nested variants are created in the same transaction and stored in GiftVariant.
- **Request examples:**
  - `withVariants`: `{"name": "Luxury Perfume", "description": "Long-lasting premium fragrance.", "shortDescription": "Premium fragrance gift.", "categoryId": "gift_category_id", "providerId": "provider_id", "price": 99.99, "currency": "PKR", "stockQuantity": 50, "sku": "PERFUME-001", "imageUrls": ["https://cdn.yourdomain.com/gift-images/perfume.png"], "isPublished": true, "isFeatured": false, "tags": ["perfume", "luxury"], "moderationStatus": "APPROVED", "variants": [{"name": "30ml", "price": 89.99, "originalPrice": 119.99, "stockQuantity": 10, "sku": "PERFUME-30ML", "isPopular": false, "isDefault": false, "sortOrder": 1, "isActive": true}, {"name": "50ml", "price": 129.99, "originalPrice": 159.99, "stockQuantity": 20, "sku": "PERFUME-50ML", "isPopular": true, "isDefault": true, "sortOrder": 2, "isActive": true}]}`

### `GET` `/api/v1/gifts`
- **Access:** Authenticated
- **Summary:** List admin gifts
- **Description:** Access: SUPER_ADMIN or ADMIN with gifts.read. SUPER_ADMIN or ADMIN with gifts.read permission. SUPER_ADMIN/ADMIN with gifts.read. Supports category/provider/status/moderation filters.
- **Parameters:** `page` (query), `limit` (query), `search` (query), `categoryId` (query), `providerId` (query), `status` (query), `moderationStatus` (query), `isPublished` (query), `sortBy` (query), `sortOrder` (query)

### `GET` `/api/v1/gifts/stats`
- **Access:** Authenticated
- **Summary:** Fetch gift inventory stats
- **Description:** Access: SUPER_ADMIN or ADMIN with gifts.read. SUPER_ADMIN or ADMIN with gifts.read permission.

### `GET` `/api/v1/gifts/export`
- **Access:** Authenticated
- **Summary:** Export gift inventory
- **Description:** Access: SUPER_ADMIN or ADMIN with gifts.export. SUPER_ADMIN or ADMIN with gifts.export permission.
- **Parameters:** `page` (query), `limit` (query), `search` (query), `categoryId` (query), `providerId` (query), `status` (query), `moderationStatus` (query), `isPublished` (query), `sortBy` (query), `sortOrder` (query), `format` (query)

### `GET` `/api/v1/gifts/{id}`
- **Access:** Authenticated
- **Summary:** Fetch admin gift details with variants
- **Description:** Access: SUPER_ADMIN or ADMIN with gifts.read. SUPER_ADMIN or ADMIN with gifts.read permission.
- **Parameters:** `id` (path)

### `PATCH` `/api/v1/gifts/{id}`
- **Access:** Authenticated
- **Summary:** Update admin gift and upsert nested variants
- **Description:** Access: SUPER_ADMIN or ADMIN with gifts.update. SUPER_ADMIN or ADMIN with gifts.update permission. If replaceVariants=true, omitted variants are soft-deleted. Only one default variant is allowed.
- **Request examples:**
  - `upsertVariants`: `{"name": "Luxury Perfume Updated", "replaceVariants": false, "variants": [{"id": "variant_id", "name": "50ml", "price": 129.99, "originalPrice": 159.99, "stockQuantity": 20, "sku": "PERFUME-50ML", "isPopular": true, "isDefault": true, "sortOrder": 2, "isActive": true}, {"name": "150ml", "price": 249.99, "originalPrice": 299.99, "stockQuantity": 5, "sku": "PERFUME-150ML", "isPopular": false, "isDefault": false, "sortOrder": 4, "isActive": true}]}`
- **Parameters:** `id` (path)

### `DELETE` `/api/v1/gifts/{id}`
- **Access:** Authenticated
- **Summary:** Soft-delete gift
- **Description:** Access: SUPER_ADMIN or ADMIN with gifts.delete. SUPER_ADMIN or ADMIN with gifts.delete permission.
- **Parameters:** `id` (path)

### `PATCH` `/api/v1/gifts/{id}/status`
- **Access:** Authenticated
- **Summary:** Update gift status
- **Description:** Access: SUPER_ADMIN or ADMIN with gifts.status.update. SUPER_ADMIN or ADMIN with gifts.status.update permission.
- **Parameters:** `id` (path)


## 04 Gifts - Moderation

### `GET` `/api/v1/gift-moderation`
- **Access:** Authenticated
- **Summary:** GET /api/v1/gift-moderation
- **Description:** Access: SUPER_ADMIN or ADMIN with giftModeration.read. SUPER_ADMIN or ADMIN with giftModeration.read permission.
- **Parameters:** `page` (query), `limit` (query), `status` (query), `search` (query), `providerId` (query), `view` (query), `sortBy` (query), `sortOrder` (query)

### `PATCH` `/api/v1/gift-moderation/{id}/approve`
- **Access:** Authenticated
- **Summary:** PATCH /api/v1/gift-moderation/{id}/approve
- **Description:** Access: SUPER_ADMIN or ADMIN with giftModeration.approve. SUPER_ADMIN or ADMIN with giftModeration.approve permission.
- **Parameters:** `id` (path)

### `PATCH` `/api/v1/gift-moderation/{id}/reject`
- **Access:** Authenticated
- **Summary:** PATCH /api/v1/gift-moderation/{id}/reject
- **Description:** Access: SUPER_ADMIN or ADMIN with giftModeration.reject. SUPER_ADMIN or ADMIN with giftModeration.reject permission.
- **Parameters:** `id` (path)

### `PATCH` `/api/v1/gift-moderation/{id}/flag`
- **Access:** Authenticated
- **Summary:** PATCH /api/v1/gift-moderation/{id}/flag
- **Description:** Access: SUPER_ADMIN or ADMIN with giftModeration.flag. SUPER_ADMIN or ADMIN with giftModeration.flag permission.
- **Parameters:** `id` (path)


## 05 Customer - Marketplace

### `GET` `/api/v1/customer/home`
- **Access:** Authenticated
- **Summary:** Fetch customer app home
- **Description:** Access: REGISTERED_USER. REGISTERED_USER only. Endpoint is scoped to the authenticated customer account. REGISTERED_USER only. Returns safe marketplace categories, discounted gifts, default address, and upcoming reminder.

### `GET` `/api/v1/customer/categories`
- **Access:** Authenticated
- **Summary:** List customer marketplace categories
- **Description:** Access: REGISTERED_USER. REGISTERED_USER only. Endpoint is scoped to the authenticated customer account. REGISTERED_USER only. Returns active categories that have available approved gifts.

### `GET` `/api/v1/customer/gifts/discounted`
- **Access:** Authenticated
- **Summary:** List discounted customer gifts
- **Description:** Access: REGISTERED_USER. REGISTERED_USER only. Endpoint is scoped to the authenticated customer account. REGISTERED_USER only. Reuses marketplace gift filters with offerOnly=true.
- **Parameters:** `page` (query), `limit` (query), `search` (query), `categoryId` (query), `categorySlug` (query), `providerId` (query), `offerOnly` (query), `minPrice` (query), `maxPrice` (query), `minRating` (query), `brand` (query), `deliveryOption` (query), `sortBy` (query)

### `GET` `/api/v1/customer/gifts/filter-options`
- **Access:** Authenticated
- **Summary:** Fetch marketplace gift filter options
- **Description:** Access: REGISTERED_USER. REGISTERED_USER only. Endpoint is scoped to the authenticated customer account. REGISTERED_USER only. Brands are derived from approved active provider business names.

### `GET` `/api/v1/customer/gifts`
- **Access:** Authenticated
- **Summary:** List customer marketplace gifts
- **Description:** Access: REGISTERED_USER. REGISTERED_USER only. Endpoint is scoped to the authenticated customer account. REGISTERED_USER only. Only approved, published, active, in-stock gifts from approved active providers are returned. Active offers are calculated by the backend.
- **Parameters:** `page` (query), `limit` (query), `search` (query), `categoryId` (query), `categorySlug` (query), `providerId` (query), `offerOnly` (query), `minPrice` (query), `maxPrice` (query), `minRating` (query), `brand` (query), `deliveryOption` (query), `sortBy` (query)

### `GET` `/api/v1/customer/gifts/{id}`
- **Access:** Authenticated
- **Summary:** Fetch customer-safe gift details
- **Description:** Access: REGISTERED_USER. REGISTERED_USER only. Endpoint is scoped to the authenticated customer account. REGISTERED_USER only. Hidden/admin-only gift records are never returned.
- **Parameters:** `id` (path)


## 05 Customer - Wishlist

### `GET` `/api/v1/customer/wishlist`
- **Access:** Authenticated
- **Summary:** List wishlist gifts
- **Description:** Access: REGISTERED_USER. REGISTERED_USER only. Endpoint is scoped to the authenticated customer account. REGISTERED_USER only. Returns customer-safe available gifts.

### `POST` `/api/v1/customer/wishlist/{giftId}`
- **Access:** Authenticated
- **Summary:** Add gift to wishlist
- **Description:** Access: REGISTERED_USER. REGISTERED_USER only. Endpoint is scoped to the authenticated customer account. REGISTERED_USER only. Gift must be active, approved, published, and in stock. Duplicate wishlist entries are ignored.
- **Parameters:** `giftId` (path)

### `DELETE` `/api/v1/customer/wishlist/{giftId}`
- **Access:** Authenticated
- **Summary:** Remove gift from wishlist
- **Description:** Access: REGISTERED_USER. REGISTERED_USER only. Endpoint is scoped to the authenticated customer account. REGISTERED_USER only. Removes only the current customer wishlist row.
- **Parameters:** `giftId` (path)


## 05 Customer - Addresses

### `GET` `/api/v1/customer/addresses`
- **Access:** Authenticated
- **Summary:** List customer addresses
- **Description:** Access: REGISTERED_USER. REGISTERED_USER only. Endpoint is scoped to the authenticated customer account. REGISTERED_USER only. Customers can only view their own non-deleted addresses.

### `POST` `/api/v1/customer/addresses`
- **Access:** Authenticated
- **Summary:** Create customer address
- **Description:** Access: REGISTERED_USER. REGISTERED_USER only. Endpoint is scoped to the authenticated customer account. REGISTERED_USER only. Maintains one default address per customer.

### `GET` `/api/v1/customer/addresses/{id}`
- **Access:** Authenticated
- **Summary:** Fetch customer address
- **Description:** Access: REGISTERED_USER. REGISTERED_USER only. Endpoint is scoped to the authenticated customer account. REGISTERED_USER only. Address must belong to the current customer.
- **Parameters:** `id` (path)

### `PATCH` `/api/v1/customer/addresses/{id}`
- **Access:** Authenticated
- **Summary:** Update customer address
- **Description:** Access: REGISTERED_USER. REGISTERED_USER only. Endpoint is scoped to the authenticated customer account. REGISTERED_USER only. Maintains one default address per customer.
- **Parameters:** `id` (path)

### `DELETE` `/api/v1/customer/addresses/{id}`
- **Access:** Authenticated
- **Summary:** Soft-delete customer address
- **Description:** Access: REGISTERED_USER. REGISTERED_USER only. Endpoint is scoped to the authenticated customer account. REGISTERED_USER only. Address is soft deleted and removed from default status.
- **Parameters:** `id` (path)

### `PATCH` `/api/v1/customer/addresses/{id}/default`
- **Access:** Authenticated
- **Summary:** Set default customer address
- **Description:** Access: REGISTERED_USER. REGISTERED_USER only. Endpoint is scoped to the authenticated customer account. REGISTERED_USER only. Clears default flag from all other customer addresses.
- **Parameters:** `id` (path)


## 05 Customer - Contacts

### `GET` `/api/v1/customer/contacts`
- **Access:** Authenticated
- **Summary:** List customer contacts
- **Description:** Access: REGISTERED_USER. REGISTERED_USER only. Endpoint is scoped to the authenticated customer account. REGISTERED_USER only. Lists only contacts owned by the authenticated customer.
- **Parameters:** `page` (query), `limit` (query), `search` (query), `relationship` (query), `sortBy` (query), `sortOrder` (query)

### `POST` `/api/v1/customer/contacts`
- **Access:** Authenticated
- **Summary:** Create customer contact
- **Description:** Access: REGISTERED_USER. REGISTERED_USER only. Endpoint is scoped to the authenticated customer account. REGISTERED_USER only. Creates a personal gift contact owned by the authenticated customer. Requires at least one contact method: phone, email, or address.
- **Request examples:**
  - `create`: `{"name": "Mary Wilson", "relationship": "Mother", "phone": "+1234567890", "email": "mary@example.com", "address": "387 Merdina", "likes": "Glasses, makeup, dresses", "avatarUrl": "https://cdn.yourdomain.com/customer-contact-avatars/mary.png", "birthday": "1990-05-12", "notes": "Prefers elegant gifts."}`

### `GET` `/api/v1/customer/contacts/{id}`
- **Access:** Authenticated
- **Summary:** Fetch customer contact
- **Description:** Access: REGISTERED_USER. REGISTERED_USER only. Endpoint is scoped to the authenticated customer account. REGISTERED_USER only. Contact must belong to the authenticated customer.
- **Parameters:** `id` (path)

### `PATCH` `/api/v1/customer/contacts/{id}`
- **Access:** Authenticated
- **Summary:** Update customer contact
- **Description:** Access: REGISTERED_USER. REGISTERED_USER only. Endpoint is scoped to the authenticated customer account. REGISTERED_USER only. Updates only contacts owned by the authenticated customer.
- **Request examples:**
  - `update`: `{"name": "Mary Wilson", "relationship": "Mother", "phone": "+1234567890", "email": "mary@example.com", "address": "387 Merdina", "likes": "Glasses, makeup, dresses", "avatarUrl": "https://cdn.yourdomain.com/customer-contact-avatars/mary.png", "birthday": "1990-05-12", "notes": "Prefers elegant gifts."}`
- **Parameters:** `id` (path)

### `DELETE` `/api/v1/customer/contacts/{id}`
- **Access:** Authenticated
- **Summary:** Soft-delete customer contact
- **Description:** Access: REGISTERED_USER. REGISTERED_USER only. Endpoint is scoped to the authenticated customer account. REGISTERED_USER only. Soft deletes only contacts owned by the authenticated customer.
- **Parameters:** `id` (path)


## 05 Customer - Events

### `GET` `/api/v1/customer/events`
- **Access:** Authenticated
- **Summary:** List customer events
- **Description:** Access: REGISTERED_USER. REGISTERED_USER only. Endpoint is scoped to the authenticated customer account. REGISTERED_USER only. Lists only events owned by the authenticated customer.
- **Parameters:** `page` (query), `limit` (query), `search` (query), `eventType` (query), `fromDate` (query), `toDate` (query), `recipientId` (query), `sortBy` (query), `sortOrder` (query)

### `POST` `/api/v1/customer/events`
- **Access:** Authenticated
- **Summary:** Create customer event
- **Description:** Access: REGISTERED_USER. REGISTERED_USER only. Endpoint is scoped to the authenticated customer account. REGISTERED_USER only. recipientId must belong to the authenticated customer.

### `GET` `/api/v1/customer/events/calendar`
- **Access:** Authenticated
- **Summary:** Fetch monthly calendar events
- **Description:** Access: REGISTERED_USER. REGISTERED_USER only. Endpoint is scoped to the authenticated customer account. REGISTERED_USER only. Returns marked dates and own events.
- **Parameters:** `month` (query), `year` (query), `eventType` (query)

### `GET` `/api/v1/customer/events/upcoming`
- **Access:** Authenticated
- **Summary:** Fetch upcoming customer events
- **Description:** Access: REGISTERED_USER. REGISTERED_USER only. Endpoint is scoped to the authenticated customer account. REGISTERED_USER only. Defaults to 10 events within 30 days.
- **Parameters:** `limit` (query), `daysAhead` (query), `eventType` (query)

### `GET` `/api/v1/customer/events/{id}/reminder-settings`
- **Access:** Authenticated
- **Summary:** Fetch event reminder settings
- **Description:** Access: REGISTERED_USER. REGISTERED_USER only. Endpoint is scoped to the authenticated customer account. REGISTERED_USER only. Event must belong to the authenticated customer.
- **Parameters:** `id` (path)

### `PATCH` `/api/v1/customer/events/{id}/reminder-settings`
- **Access:** Authenticated
- **Summary:** Update event reminder settings
- **Description:** Access: REGISTERED_USER. REGISTERED_USER only. Endpoint is scoped to the authenticated customer account. REGISTERED_USER only. Event must belong to the authenticated customer.
- **Parameters:** `id` (path)

### `GET` `/api/v1/customer/events/{id}`
- **Access:** Authenticated
- **Summary:** Fetch customer event details
- **Description:** Access: REGISTERED_USER. REGISTERED_USER only. Endpoint is scoped to the authenticated customer account. REGISTERED_USER only. Event must belong to the authenticated customer.
- **Parameters:** `id` (path)

### `PATCH` `/api/v1/customer/events/{id}`
- **Access:** Authenticated
- **Summary:** Update customer event
- **Description:** Access: REGISTERED_USER. REGISTERED_USER only. Endpoint is scoped to the authenticated customer account. REGISTERED_USER only. Event and recipient contact must belong to the authenticated customer.
- **Parameters:** `id` (path)

### `DELETE` `/api/v1/customer/events/{id}`
- **Access:** Authenticated
- **Summary:** Soft-delete customer event
- **Description:** Access: REGISTERED_USER. REGISTERED_USER only. Endpoint is scoped to the authenticated customer account. REGISTERED_USER only. Soft deletes only own event and cancels pending reminder jobs.
- **Parameters:** `id` (path)


## 05 Customer - Cart

### `GET` `/api/v1/customer/cart`
- **Access:** Authenticated
- **Summary:** Fetch active cart
- **Description:** Access: REGISTERED_USER. REGISTERED_USER only. Endpoint is scoped to the authenticated customer account. REGISTERED_USER only. Totals are backend calculated from price snapshots.

### `DELETE` `/api/v1/customer/cart`
- **Access:** Authenticated
- **Summary:** Clear active cart
- **Description:** Access: REGISTERED_USER. REGISTERED_USER only. Endpoint is scoped to the authenticated customer account. REGISTERED_USER only. Removes all items from active cart.

### `POST` `/api/v1/customer/cart/items`
- **Access:** Authenticated
- **Summary:** Add item to cart
- **Description:** Access: REGISTERED_USER. REGISTERED_USER only. Endpoint is scoped to the authenticated customer account. REGISTERED_USER only. Backend calculates unit price, active offer discount, final price, subtotal, delivery fee placeholder, and total.
- **Request examples:**
  - `sendGift`: `{"giftId": "cmf0giftroses001", "variantId": "cmf0variant50ml001", "quantity": 1, "deliveryOption": "SAME_DAY", "recipientContactId": "cmf0contactmary001", "recipientName": "Sarah Khan", "recipientPhone": "+923001234567", "recipientAddressId": "cmf0addresshome001", "eventId": "cmf0eventbirthday001", "giftMessage": "Hope you love this special surprise!", "messageMediaUrls": ["https://cdn.yourdomain.com/gift-message-media/photo.png"], "scheduledDeliveryAt": "2026-12-24T10:00:00.000Z"}`

### `PATCH` `/api/v1/customer/cart/items/{id}`
- **Access:** Authenticated
- **Summary:** Update cart item
- **Description:** Access: REGISTERED_USER. REGISTERED_USER only. Endpoint is scoped to the authenticated customer account. REGISTERED_USER only. Validates ownership through the active customer cart.
- **Request examples:**
  - `updateSelection`: `{"variantId": "cmf0variant100ml001", "quantity": 2, "deliveryOption": "SCHEDULED", "recipientContactId": "cmf0contactmary001", "recipientName": "Sarah Khan", "recipientPhone": "+923001234567", "recipientAddressId": "cmf0addresshome001", "eventId": "cmf0eventbirthday001", "giftMessage": "Updated gift note.", "messageMediaUrls": ["https://cdn.yourdomain.com/gift-message-media/video.mp4"], "scheduledDeliveryAt": "2026-12-25T10:00:00.000Z"}`
- **Parameters:** `id` (path)

### `DELETE` `/api/v1/customer/cart/items/{id}`
- **Access:** Authenticated
- **Summary:** Delete cart item
- **Description:** Access: REGISTERED_USER. REGISTERED_USER only. Endpoint is scoped to the authenticated customer account. REGISTERED_USER only. Deletes only items in the current customer active cart.
- **Parameters:** `id` (path)


## 05 Customer - Orders

### `POST` `/api/v1/customer/orders`
- **Access:** Authenticated
- **Summary:** Create order from active cart
- **Description:** Access: REGISTERED_USER. REGISTERED_USER only. Endpoint is scoped to the authenticated customer account. REGISTERED_USER only. Prices are backend-calculated from cart/payment snapshots. STRIPE_CARD requires a successful owned paymentId; COD stays pending; PLACEHOLDER is for development only. Multiple providers are split into provider sub-orders.
- **Request examples:**
  - `stripeCard`: `{"cartId": "cart_id", "paymentId": "payment_id", "deliveryAddressId": "address_id", "paymentMethod": "STRIPE_CARD"}`
  - `cod`: `{"cartId": "cart_id", "deliveryAddressId": "address_id", "paymentMethod": "COD"}`

### `GET` `/api/v1/customer/orders`
- **Access:** Authenticated
- **Summary:** List customer orders
- **Description:** Access: REGISTERED_USER. REGISTERED_USER only. Endpoint is scoped to the authenticated customer account. REGISTERED_USER only. Returns orders owned by the current customer.
- **Parameters:** `page` (query), `limit` (query), `type` (query), `status` (query), `fromDate` (query), `toDate` (query)

### `GET` `/api/v1/customer/orders/{id}`
- **Access:** Authenticated
- **Summary:** Fetch customer order
- **Description:** Access: REGISTERED_USER. REGISTERED_USER only. Endpoint is scoped to the authenticated customer account. REGISTERED_USER only. Order must belong to the current customer.
- **Parameters:** `id` (path)


## 05 Customer - Recurring Payments

### `GET` `/api/v1/customer/recurring-payments`
- **Access:** Authenticated
- **Summary:** List own recurring payments
- **Description:** Access: REGISTERED_USER. REGISTERED_USER only. Endpoint is scoped to the authenticated customer account. REGISTERED_USER only. Returns recurring money/gift payment subscriptions owned by the logged-in customer.
- **Parameters:** `page` (query), `limit` (query), `search` (query), `status` (query), `frequency` (query), `recipientContactId` (query), `sortBy` (query), `sortOrder` (query)

### `POST` `/api/v1/customer/recurring-payments`
- **Access:** Authenticated
- **Summary:** Create recurring payment
- **Description:** Access: REGISTERED_USER. REGISTERED_USER only. Endpoint is scoped to the authenticated customer account. REGISTERED_USER only. Recipient contact and saved Stripe payment method must both belong to the logged-in customer. Stripe card recurring payments require a saved payment method.
- **Request examples:**
  - `weeklyStripe`: `{"amount": 100, "currency": "PKR", "frequency": "WEEKLY", "schedule": {"dayOfWeek": "MONDAY", "dayOfMonth": null, "monthOfYear": null, "time": "09:00", "timezone": "Asia/Karachi"}, "recipientContactId": "contact_id", "message": "Hope you love this special surprise!", "messageMediaUrls": ["https://cdn.yourdomain.com/gift-message-media/photo.png"], "paymentMethod": "STRIPE_CARD", "stripePaymentMethodId": "pm_xxx", "startDate": "2026-05-10T00:00:00.000Z", "endDate": null, "autoSend": true}`

### `GET` `/api/v1/customer/recurring-payments/summary`
- **Access:** Authenticated
- **Summary:** Fetch recurring payment summary counts
- **Description:** Access: REGISTERED_USER. REGISTERED_USER only. Endpoint is scoped to the authenticated customer account. Must stay before /customer/recurring-payments/:id route.

### `GET` `/api/v1/customer/recurring-payments/{id}`
- **Access:** Authenticated
- **Summary:** Fetch own recurring payment details
- **Description:** Access: REGISTERED_USER. REGISTERED_USER only. Endpoint is scoped to the authenticated customer account. REGISTERED_USER only. Customer cannot access another user’s recurring payment.
- **Parameters:** `id` (path)

### `PATCH` `/api/v1/customer/recurring-payments/{id}`
- **Access:** Authenticated
- **Summary:** Update own recurring payment
- **Description:** Access: REGISTERED_USER. REGISTERED_USER only. Endpoint is scoped to the authenticated customer account. Cannot edit CANCELLED recurring payments. Changes apply from the next billing cycle and nextBillingAt is recalculated.
- **Request examples:**
  - `monthly`: `{"amount": 50, "frequency": "MONTHLY", "schedule": {"dayOfMonth": 15, "time": "09:00", "timezone": "Asia/Karachi"}, "message": "Fresh flowers every month.", "messageMediaUrls": [], "stripePaymentMethodId": "pm_xxx"}`
- **Parameters:** `id` (path)

### `POST` `/api/v1/customer/recurring-payments/{id}/pause`
- **Access:** Authenticated
- **Summary:** Pause own active recurring payment
- **Description:** Access: REGISTERED_USER. REGISTERED_USER only. Endpoint is scoped to the authenticated customer account.
- **Request examples:**
  - `pause`: `{"reason": "User paused recurring payment."}`
- **Parameters:** `id` (path)

### `POST` `/api/v1/customer/recurring-payments/{id}/resume`
- **Access:** Authenticated
- **Summary:** Resume own paused recurring payment
- **Description:** Access: REGISTERED_USER. REGISTERED_USER only. Endpoint is scoped to the authenticated customer account.
- **Parameters:** `id` (path)

### `POST` `/api/v1/customer/recurring-payments/{id}/cancel`
- **Access:** Authenticated
- **Summary:** Cancel own recurring payment
- **Description:** Access: REGISTERED_USER. REGISTERED_USER only. Endpoint is scoped to the authenticated customer account. IMMEDIATELY cancels future processing. AFTER_CURRENT_BILLING_CYCLE sets cancelAtPeriodEnd and cancelAt.
- **Request examples:**
  - `immediately`: `{"cancelMode": "IMMEDIATELY", "reason": "No longer needed."}`
  - `periodEnd`: `{"cancelMode": "AFTER_CURRENT_BILLING_CYCLE", "reason": "Finish current cycle."}`
- **Parameters:** `id` (path)

### `GET` `/api/v1/customer/recurring-payments/{id}/history`
- **Access:** Authenticated
- **Summary:** List own recurring payment billing history
- **Description:** Access: REGISTERED_USER. REGISTERED_USER only. Endpoint is scoped to the authenticated customer account.
- **Parameters:** `id` (path), `page` (query), `limit` (query), `status` (query)


## 05 Customer - Transactions

### `GET` `/api/v1/customer/transactions`
- **Access:** Authenticated
- **Summary:** List own customer transactions
- **Description:** Access: REGISTERED_USER. REGISTERED_USER only. Endpoint is scoped to the authenticated customer account. REGISTERED_USER only. Normalizes backend Payment, Order, MoneyGift, and RecurringPayment occurrence records owned by the logged-in customer.
- **Parameters:** `page` (query), `limit` (query), `search` (query), `fromDate` (query), `toDate` (query), `type` (query), `status` (query), `paymentMethod` (query), `minAmount` (query), `maxAmount` (query), `sortBy` (query), `sortOrder` (query)

### `GET` `/api/v1/customer/transactions/summary`
- **Access:** Authenticated
- **Summary:** Fetch own transaction summary
- **Description:** Access: REGISTERED_USER. REGISTERED_USER only. Endpoint is scoped to the authenticated customer account. Defaults to current month when no date range is provided. Uses backend-calculated payment records only.
- **Parameters:** `fromDate` (query), `toDate` (query)

### `GET` `/api/v1/customer/transactions/export`
- **Access:** Authenticated
- **Summary:** Export own transactions
- **Description:** Access: REGISTERED_USER. REGISTERED_USER only. Endpoint is scoped to the authenticated customer account. CSV is supported and returned as a file. Export is scoped to the logged-in customer only.
- **Parameters:** `page` (query), `limit` (query), `search` (query), `fromDate` (query), `toDate` (query), `type` (query), `status` (query), `paymentMethod` (query), `minAmount` (query), `maxAmount` (query), `sortBy` (query), `sortOrder` (query), `format` (query)

### `GET` `/api/v1/customer/transactions/{id}`
- **Access:** Authenticated
- **Summary:** Fetch own transaction details
- **Description:** Access: REGISTERED_USER. REGISTERED_USER only. Endpoint is scoped to the authenticated customer account. Includes order, money gift, recurring payment, and payment gateway references when available. Billing address returns null until available.
- **Parameters:** `id` (path)

### `GET` `/api/v1/customer/transactions/{id}/receipt`
- **Access:** Authenticated
- **Summary:** Download own transaction receipt
- **Description:** Access: REGISTERED_USER. REGISTERED_USER only. Endpoint is scoped to the authenticated customer account. Receipt is generated only for the transaction owner and never exposes Stripe secret data.
- **Parameters:** `id` (path)


## 05 Customer - Referrals & Rewards

### `GET` `/api/v1/customer/referrals/summary`
- **Access:** Authenticated
- **Summary:** Fetch own referral reward summary
- **Description:** Access: REGISTERED_USER. REGISTERED_USER only. Endpoint is scoped to the authenticated customer account. REGISTERED_USER only. Customers can view only their own referral progress and ledger-derived balances.

### `GET` `/api/v1/customer/referrals/link`
- **Access:** Authenticated
- **Summary:** Fetch own referral link
- **Description:** Access: REGISTERED_USER. REGISTERED_USER only. Endpoint is scoped to the authenticated customer account. Generates a unique customer referral code when missing. The link never exposes internal user IDs.

### `GET` `/api/v1/customer/referrals/history`
- **Access:** Authenticated
- **Summary:** List own referral history
- **Description:** Access: REGISTERED_USER. REGISTERED_USER only. Endpoint is scoped to the authenticated customer account. REGISTERED_USER only. History is scoped to referrals created by the logged-in customer.
- **Parameters:** `page` (query), `limit` (query), `status` (query)

### `POST` `/api/v1/customer/referrals/redeem`
- **Access:** Authenticated
- **Summary:** Redeem own available reward credit
- **Description:** Access: REGISTERED_USER. REGISTERED_USER only. Endpoint is scoped to the authenticated customer account. Creates a REDEEMED reward ledger entry. Redemption cannot exceed ledger-derived available credit.

### `GET` `/api/v1/customer/rewards/balance`
- **Access:** Authenticated
- **Summary:** Fetch own reward balance
- **Description:** Access: REGISTERED_USER. REGISTERED_USER only. Endpoint is scoped to the authenticated customer account. Balance is calculated from RewardLedger entries, not a mutable user balance field.

### `GET` `/api/v1/customer/rewards/ledger`
- **Access:** Authenticated
- **Summary:** List own reward ledger
- **Description:** Access: REGISTERED_USER. REGISTERED_USER only. Endpoint is scoped to the authenticated customer account. REGISTERED_USER only. Returns ledger entries owned by the logged-in customer.
- **Parameters:** `page` (query), `limit` (query), `type` (query)

### `GET` `/api/v1/customer/referrals/terms`
- **Access:** Authenticated
- **Summary:** Fetch referral terms
- **Description:** Access: REGISTERED_USER. REGISTERED_USER only. Endpoint is scoped to the authenticated customer account. Returns config/env based customer referral terms for the mobile app.


## 05 Customer - Wallet

### `GET` `/api/v1/customer/wallet`
- **Access:** Authenticated
- **Summary:** Fetch own wallet
- **Description:** Access: REGISTERED_USER. REGISTERED_USER only. Endpoint is scoped to the authenticated customer account. REGISTERED_USER only. Wallet is lazily created and balances are backed by wallet ledger entries.

### `POST` `/api/v1/customer/wallet/add-funds`
- **Access:** Authenticated
- **Summary:** Create wallet top-up payment
- **Description:** Access: REGISTERED_USER. REGISTERED_USER only. Endpoint is scoped to the authenticated customer account. Uses Stripe PaymentIntent. Wallet is credited only after successful server-side confirmation/webhook.

### `GET` `/api/v1/customer/wallet/history`
- **Access:** Authenticated
- **Summary:** List own wallet history
- **Description:** Access: REGISTERED_USER. REGISTERED_USER only. Endpoint is scoped to the authenticated customer account. Positive amounts are credits, negative amounts are debits. Results are scoped to the logged-in customer.
- **Parameters:** `page` (query), `limit` (query), `type` (query), `status` (query), `fromDate` (query), `toDate` (query)


## 05 Customer - Payment Methods

### `POST` `/api/v1/customer/bank-accounts`
- **Access:** Authenticated
- **Summary:** Link placeholder bank account
- **Description:** Access: REGISTERED_USER. REGISTERED_USER only. Endpoint is scoped to the authenticated customer account. Stores only masked display data. Full IBAN/account number is never returned.

### `GET` `/api/v1/customer/bank-accounts`
- **Access:** Authenticated
- **Summary:** List own bank accounts
- **Description:** Access: REGISTERED_USER. REGISTERED_USER only. Endpoint is scoped to the authenticated customer account.

### `PATCH` `/api/v1/customer/bank-accounts/{id}/default`
- **Access:** Authenticated
- **Summary:** Set own default bank account
- **Description:** Access: REGISTERED_USER. REGISTERED_USER only. Endpoint is scoped to the authenticated customer account.
- **Parameters:** `id` (path)

### `DELETE` `/api/v1/customer/bank-accounts/{id}`
- **Access:** Authenticated
- **Summary:** Delete own bank account
- **Description:** Access: REGISTERED_USER. REGISTERED_USER only. Endpoint is scoped to the authenticated customer account.
- **Parameters:** `id` (path)

### `POST` `/api/v1/customer/payment-methods/setup-intent`
- **Access:** Authenticated
- **Summary:** Create Stripe SetupIntent for saving card
- **Description:** Access: REGISTERED_USER. REGISTERED_USER only. Endpoint is scoped to the authenticated customer account. Frontend confirms card with Stripe SDK. Backend never accepts raw card number or CVV.

### `GET` `/api/v1/customer/payment-methods/saved`
- **Access:** Authenticated
- **Summary:** List own saved payment methods
- **Description:** Access: REGISTERED_USER. REGISTERED_USER only. Endpoint is scoped to the authenticated customer account. Returns masked Stripe card metadata only.

### `DELETE` `/api/v1/customer/payment-methods/{id}`
- **Access:** Authenticated
- **Summary:** Delete own saved payment method
- **Description:** Access: REGISTERED_USER. REGISTERED_USER only. Endpoint is scoped to the authenticated customer account. Rejects deletion when the method is used by an active recurring payment.
- **Parameters:** `id` (path)

### `GET` `/api/v1/customer/payment-methods`
- **Access:** Authenticated
- **Summary:** List supported customer payment methods
- **Description:** Access: REGISTERED_USER. REGISTERED_USER only. Endpoint is scoped to the authenticated customer account.

### `PATCH` `/api/v1/customer/payment-methods/{id}/default`
- **Access:** Authenticated
- **Summary:** Set own default payment method
- **Description:** Access: REGISTERED_USER. REGISTERED_USER only. Endpoint is scoped to the authenticated customer account.
- **Parameters:** `id` (path)


## 06 Payments

### `POST` `/api/v1/customer/payments/create-intent`
- **Access:** Authenticated
- **Summary:** Create payment intent from active cart
- **Description:** Access: REGISTERED_USER. REGISTERED_USER only. Endpoint is scoped to the authenticated customer account. REGISTERED_USER only. Amount is calculated from backend cart totals; frontend amount is never accepted.
- **Request examples:**
  - `stripe`: `{"cartId": "cmf0cartactive001", "paymentMethod": "STRIPE_CARD"}`
  - `cod`: `{"cartId": "cmf0cartactive001", "paymentMethod": "COD"}`

### `POST` `/api/v1/customer/payments/confirm`
- **Access:** Authenticated
- **Summary:** Confirm Stripe payment
- **Description:** Access: REGISTERED_USER. REGISTERED_USER only. Endpoint is scoped to the authenticated customer account. REGISTERED_USER only. Retrieves Stripe PaymentIntent server-side before updating local payment status.

### `GET` `/api/v1/customer/payments/{id}`
- **Access:** Authenticated
- **Summary:** Fetch own payment details
- **Description:** Access: REGISTERED_USER. REGISTERED_USER only. Endpoint is scoped to the authenticated customer account.
- **Parameters:** `id` (path)

### `POST` `/api/v1/payments/stripe/webhook`
- **Access:** PUBLIC
- **Summary:** Stripe webhook endpoint
- **Description:** Access: PUBLIC. PUBLIC. Verifies Stripe-Signature using the configured webhook secret before processing events.

### `POST` `/api/v1/customer/money-gifts`
- **Access:** Authenticated
- **Summary:** Send payment as gift
- **Description:** Access: REGISTERED_USER. REGISTERED_USER only. Endpoint is scoped to the authenticated customer account. Creates a customer-to-recipient money gift record and Stripe PaymentIntent for STRIPE_CARD.
- **Request examples:**
  - `create`: `{"amount": 100, "currency": "PKR", "recipientContactId": "cmf0contactmary001", "message": "Hope this helps. Enjoy your day!", "messageMediaUrls": [], "deliveryDate": "2026-12-24T00:00:00.000Z", "repeatAnnually": false, "paymentMethod": "STRIPE_CARD"}`

### `GET` `/api/v1/customer/money-gifts`
- **Access:** Authenticated
- **Summary:** List own money gifts
- **Description:** Access: REGISTERED_USER. REGISTERED_USER only. Endpoint is scoped to the authenticated customer account.

### `GET` `/api/v1/customer/money-gifts/{id}`
- **Access:** Authenticated
- **Summary:** Fetch own money gift details
- **Description:** Access: REGISTERED_USER. REGISTERED_USER only. Endpoint is scoped to the authenticated customer account.
- **Parameters:** `id` (path)


## 06 Notifications

### `GET` `/api/v1/notifications`
- **Access:** Authenticated
- **Summary:** List notifications
- **Description:** Access: SUPER_ADMIN, ADMIN, PROVIDER, or REGISTERED_USER. SUPER_ADMIN, ADMIN, PROVIDER, or REGISTERED_USER. Access is scoped to the authenticated account. JWT auth. Returns only notifications belonging to the logged-in account. Supports All, Unread, Birthdays, Deliveries, and New Contacts filters. No group gift notifications are supported.
- **Parameters:** `page` (query), `limit` (query), `filter` (query), `type` (query), `isRead` (query), `groupByDate` (query), `sortOrder` (query)

### `GET` `/api/v1/notifications/summary`
- **Access:** Authenticated
- **Summary:** Fetch notification summary
- **Description:** Access: SUPER_ADMIN, ADMIN, PROVIDER, or REGISTERED_USER. SUPER_ADMIN, ADMIN, PROVIDER, or REGISTERED_USER. Access is scoped to the authenticated account. JWT auth. Counts only notifications belonging to the logged-in account.

### `GET` `/api/v1/notifications/preferences`
- **Access:** Authenticated
- **Summary:** Fetch notification preferences
- **Description:** Access: SUPER_ADMIN, ADMIN, PROVIDER, or REGISTERED_USER. SUPER_ADMIN, ADMIN, PROVIDER, or REGISTERED_USER. Access is scoped to the authenticated account. JWT auth. Preferences belong only to the logged-in account.

### `PATCH` `/api/v1/notifications/preferences`
- **Access:** Authenticated
- **Summary:** Update notification preferences
- **Description:** Access: SUPER_ADMIN, ADMIN, PROVIDER, or REGISTERED_USER. SUPER_ADMIN, ADMIN, PROVIDER, or REGISTERED_USER. Access is scoped to the authenticated account. JWT auth. Push toggle does not delete device tokens. No group gift preference exists.

### `PATCH` `/api/v1/notifications/read-all`
- **Access:** Authenticated
- **Summary:** Mark all own notifications as read
- **Description:** Access: SUPER_ADMIN, ADMIN, PROVIDER, or REGISTERED_USER. SUPER_ADMIN, ADMIN, PROVIDER, or REGISTERED_USER. Access is scoped to the authenticated account. JWT auth. Marks only notifications belonging to the logged-in account.

### `PATCH` `/api/v1/notifications/{id}/read`
- **Access:** Authenticated
- **Summary:** Mark notification as read
- **Description:** Access: SUPER_ADMIN, ADMIN, PROVIDER, or REGISTERED_USER. SUPER_ADMIN, ADMIN, PROVIDER, or REGISTERED_USER. Access is scoped to the authenticated account. JWT auth. Notification must belong to the logged-in account.
- **Parameters:** `id` (path)

### `POST` `/api/v1/notifications/{id}/action`
- **Access:** Authenticated
- **Summary:** Process notification action
- **Description:** Access: SUPER_ADMIN, ADMIN, PROVIDER, or REGISTERED_USER. SUPER_ADMIN, ADMIN, PROVIDER, or REGISTERED_USER. Access is scoped to the authenticated account. JWT auth. Supports SEND_GIFT, REMIND_ME_LATER, VIEW_ORDER, VIEW_CONTACT. Group gift actions are not supported.
- **Request examples:**
  - `sendGift`: `{"action": "SEND_GIFT"}`
- **Parameters:** `id` (path)

### `POST` `/api/v1/notifications/device-tokens`
- **Access:** Authenticated
- **Summary:** Save device token
- **Description:** Access: SUPER_ADMIN, ADMIN, PROVIDER, or REGISTERED_USER. SUPER_ADMIN, ADMIN, PROVIDER, or REGISTERED_USER. Access is scoped to the authenticated account. JWT auth. Token belongs only to logged-in account. Duplicate deviceId updates existing record.

### `DELETE` `/api/v1/notifications/device-tokens/{id}`
- **Access:** Authenticated
- **Summary:** Disable device token
- **Description:** Access: SUPER_ADMIN, ADMIN, PROVIDER, or REGISTERED_USER. SUPER_ADMIN, ADMIN, PROVIDER, or REGISTERED_USER. Access is scoped to the authenticated account. JWT auth. Users can disable only their own device tokens.
- **Parameters:** `id` (path)


## 06 Broadcast Notifications

### `POST` `/api/v1/broadcasts`
- **Access:** Authenticated
- **Summary:** POST /api/v1/broadcasts
- **Description:** Access: SUPER_ADMIN or ADMIN with broadcasts.create. SUPER_ADMIN or ADMIN with broadcasts.create permission.

### `GET` `/api/v1/broadcasts`
- **Access:** Authenticated
- **Summary:** GET /api/v1/broadcasts
- **Description:** Access: SUPER_ADMIN or ADMIN with broadcasts.read. SUPER_ADMIN or ADMIN with broadcasts.read permission.
- **Parameters:** `page` (query), `limit` (query), `search` (query), `status` (query), `channel` (query), `priority` (query), `createdFrom` (query), `createdTo` (query), `scheduledFrom` (query), `scheduledTo` (query), `sortBy` (query), `sortOrder` (query)

### `GET` `/api/v1/broadcasts/{id}`
- **Access:** Authenticated
- **Summary:** GET /api/v1/broadcasts/{id}
- **Description:** Access: SUPER_ADMIN or ADMIN with broadcasts.read. SUPER_ADMIN or ADMIN with broadcasts.read permission.
- **Parameters:** `id` (path)

### `PATCH` `/api/v1/broadcasts/{id}`
- **Access:** Authenticated
- **Summary:** PATCH /api/v1/broadcasts/{id}
- **Description:** Access: SUPER_ADMIN or ADMIN with broadcasts.update. SUPER_ADMIN or ADMIN with broadcasts.update permission.
- **Parameters:** `id` (path)

### `PATCH` `/api/v1/broadcasts/{id}/targeting`
- **Access:** Authenticated
- **Summary:** PATCH /api/v1/broadcasts/{id}/targeting
- **Description:** Access: SUPER_ADMIN or ADMIN with broadcasts.update. SUPER_ADMIN or ADMIN with broadcasts.update permission.
- **Parameters:** `id` (path)

### `POST` `/api/v1/broadcasts/estimate-reach`
- **Access:** Authenticated
- **Summary:** POST /api/v1/broadcasts/estimate-reach
- **Description:** Access: SUPER_ADMIN or ADMIN with broadcasts.read. SUPER_ADMIN or ADMIN with broadcasts.read permission.

### `PATCH` `/api/v1/broadcasts/{id}/schedule`
- **Access:** Authenticated
- **Summary:** PATCH /api/v1/broadcasts/{id}/schedule
- **Description:** Access: SUPER_ADMIN or ADMIN with broadcasts.schedule. SUPER_ADMIN or ADMIN with broadcasts.schedule permission.
- **Parameters:** `id` (path)

### `POST` `/api/v1/broadcasts/{id}/cancel`
- **Access:** Authenticated
- **Summary:** POST /api/v1/broadcasts/{id}/cancel
- **Description:** Access: SUPER_ADMIN or ADMIN with broadcasts.cancel. SUPER_ADMIN or ADMIN with broadcasts.cancel permission.
- **Parameters:** `id` (path)

### `GET` `/api/v1/broadcasts/{id}/report`
- **Access:** Authenticated
- **Summary:** GET /api/v1/broadcasts/{id}/report
- **Description:** Access: SUPER_ADMIN or ADMIN with broadcasts.report.read. SUPER_ADMIN or ADMIN with broadcasts.report.read permission.
- **Parameters:** `id` (path)

### `GET` `/api/v1/broadcasts/{id}/recipients`
- **Access:** Authenticated
- **Summary:** GET /api/v1/broadcasts/{id}/recipients
- **Description:** Access: SUPER_ADMIN or ADMIN with broadcasts.report.read. SUPER_ADMIN or ADMIN with broadcasts.report.read permission.
- **Parameters:** `id` (path), `page` (query), `limit` (query), `channel` (query), `status` (query), `search` (query)


## 07 Plans & Coupons

### `GET` `/api/v1/subscription-plans`
- **Access:** Authenticated
- **Summary:** GET /api/v1/subscription-plans
- **Description:** Access: SUPER_ADMIN or ADMIN with subscriptionPlans.read. SUPER_ADMIN or ADMIN with subscriptionPlans.read permission.
- **Parameters:** `page` (query), `limit` (query), `search` (query), `status` (query), `visibility` (query), `billingCycle` (query), `sortBy` (query), `sortOrder` (query)

### `POST` `/api/v1/subscription-plans`
- **Access:** Authenticated
- **Summary:** POST /api/v1/subscription-plans
- **Description:** Access: SUPER_ADMIN or ADMIN with subscriptionPlans.create. SUPER_ADMIN or ADMIN with subscriptionPlans.create permission.

### `GET` `/api/v1/subscription-plans/stats`
- **Access:** Authenticated
- **Summary:** GET /api/v1/subscription-plans/stats
- **Description:** Access: SUPER_ADMIN or ADMIN with subscriptionPlans.analytics.read. SUPER_ADMIN or ADMIN with subscriptionPlans.analytics.read permission.

### `GET` `/api/v1/subscription-plans/{id}`
- **Access:** Authenticated
- **Summary:** GET /api/v1/subscription-plans/{id}
- **Description:** Access: SUPER_ADMIN or ADMIN with subscriptionPlans.read. SUPER_ADMIN or ADMIN with subscriptionPlans.read permission.
- **Parameters:** `id` (path)

### `PATCH` `/api/v1/subscription-plans/{id}`
- **Access:** Authenticated
- **Summary:** PATCH /api/v1/subscription-plans/{id}
- **Description:** Access: SUPER_ADMIN or ADMIN with subscriptionPlans.update. SUPER_ADMIN or ADMIN with subscriptionPlans.update permission.
- **Parameters:** `id` (path)

### `DELETE` `/api/v1/subscription-plans/{id}`
- **Access:** Authenticated
- **Summary:** DELETE /api/v1/subscription-plans/{id}
- **Description:** Access: SUPER_ADMIN or ADMIN with subscriptionPlans.delete. SUPER_ADMIN or ADMIN with subscriptionPlans.delete permission.
- **Parameters:** `id` (path)

### `PATCH` `/api/v1/subscription-plans/{id}/status`
- **Access:** Authenticated
- **Summary:** PATCH /api/v1/subscription-plans/{id}/status
- **Description:** Access: SUPER_ADMIN or ADMIN with subscriptionPlans.status.update. SUPER_ADMIN or ADMIN with subscriptionPlans.status.update permission.
- **Parameters:** `id` (path)

### `PATCH` `/api/v1/subscription-plans/{id}/visibility`
- **Access:** Authenticated
- **Summary:** PATCH /api/v1/subscription-plans/{id}/visibility
- **Description:** Access: SUPER_ADMIN or ADMIN with subscriptionPlans.visibility.update. SUPER_ADMIN or ADMIN with subscriptionPlans.visibility.update permission.
- **Parameters:** `id` (path)

### `GET` `/api/v1/subscription-plans/{id}/analytics`
- **Access:** Authenticated
- **Summary:** GET /api/v1/subscription-plans/{id}/analytics
- **Description:** Access: SUPER_ADMIN or ADMIN with subscriptionPlans.analytics.read. SUPER_ADMIN or ADMIN with subscriptionPlans.analytics.read permission.
- **Parameters:** `id` (path)

### `GET` `/api/v1/plan-features/catalog`
- **Access:** Authenticated
- **Summary:** GET /api/v1/plan-features/catalog
- **Description:** Access: SUPER_ADMIN or ADMIN with planFeatures.read. SUPER_ADMIN or ADMIN with planFeatures.read permission.

### `GET` `/api/v1/plan-features`
- **Access:** Authenticated
- **Summary:** GET /api/v1/plan-features
- **Description:** Access: SUPER_ADMIN or ADMIN with planFeatures.read. SUPER_ADMIN or ADMIN with planFeatures.read permission.
- **Parameters:** `page` (query), `limit` (query), `search` (query), `isActive` (query)

### `POST` `/api/v1/plan-features`
- **Access:** Authenticated
- **Summary:** POST /api/v1/plan-features
- **Description:** Access: SUPER_ADMIN or ADMIN with planFeatures.create. SUPER_ADMIN or ADMIN with planFeatures.create permission.

### `GET` `/api/v1/plan-features/{id}`
- **Access:** Authenticated
- **Summary:** GET /api/v1/plan-features/{id}
- **Description:** Access: SUPER_ADMIN or ADMIN with planFeatures.read. SUPER_ADMIN or ADMIN with planFeatures.read permission.
- **Parameters:** `id` (path)

### `PATCH` `/api/v1/plan-features/{id}`
- **Access:** Authenticated
- **Summary:** PATCH /api/v1/plan-features/{id}
- **Description:** Access: SUPER_ADMIN or ADMIN with planFeatures.update. SUPER_ADMIN or ADMIN with planFeatures.update permission.
- **Parameters:** `id` (path)

### `DELETE` `/api/v1/plan-features/{id}`
- **Access:** Authenticated
- **Summary:** DELETE /api/v1/plan-features/{id}
- **Description:** Access: SUPER_ADMIN or ADMIN with planFeatures.delete. SUPER_ADMIN or ADMIN with planFeatures.delete permission.
- **Parameters:** `id` (path)

### `GET` `/api/v1/coupons`
- **Access:** Authenticated
- **Summary:** GET /api/v1/coupons
- **Description:** Access: SUPER_ADMIN or ADMIN with coupons.read. SUPER_ADMIN or ADMIN with coupons.read permission.
- **Parameters:** `page` (query), `limit` (query), `search` (query), `status` (query), `planId` (query)

### `POST` `/api/v1/coupons`
- **Access:** Authenticated
- **Summary:** POST /api/v1/coupons
- **Description:** Access: SUPER_ADMIN or ADMIN with coupons.create. SUPER_ADMIN or ADMIN with coupons.create permission.

### `GET` `/api/v1/coupons/{id}`
- **Access:** Authenticated
- **Summary:** GET /api/v1/coupons/{id}
- **Description:** Access: SUPER_ADMIN or ADMIN with coupons.read. SUPER_ADMIN or ADMIN with coupons.read permission.
- **Parameters:** `id` (path)

### `PATCH` `/api/v1/coupons/{id}`
- **Access:** Authenticated
- **Summary:** PATCH /api/v1/coupons/{id}
- **Description:** Access: SUPER_ADMIN or ADMIN with coupons.update. SUPER_ADMIN or ADMIN with coupons.update permission.
- **Parameters:** `id` (path)

### `DELETE` `/api/v1/coupons/{id}`
- **Access:** Authenticated
- **Summary:** DELETE /api/v1/coupons/{id}
- **Description:** Access: SUPER_ADMIN or ADMIN with coupons.delete. SUPER_ADMIN or ADMIN with coupons.delete permission.
- **Parameters:** `id` (path)

### `PATCH` `/api/v1/coupons/{id}/status`
- **Access:** Authenticated
- **Summary:** PATCH /api/v1/coupons/{id}/status
- **Description:** Access: SUPER_ADMIN or ADMIN with coupons.status.update. SUPER_ADMIN or ADMIN with coupons.status.update permission.
- **Parameters:** `id` (path)


## 07 Storage

### `POST` `/api/v1/uploads/presigned-url`
- **Access:** Authenticated
- **Summary:** Create presigned upload URL
- **Description:** Access: SUPER_ADMIN, ADMIN, PROVIDER, or REGISTERED_USER. SUPER_ADMIN, ADMIN, PROVIDER, or REGISTERED_USER. Access is scoped to the authenticated account. Backend derives ownerId/ownerRole from the authenticated JWT. targetAccountId is optional and allowed only for SUPER_ADMIN/authorized ADMIN dashboard uploads. Normal users/providers should not send targetAccountId. Include giftId only for gift image uploads.
- **Request examples:**
  - `giftUpload`: `{"folder": "gift-images", "fileName": "perfume.png", "contentType": "image/png", "sizeBytes": 1048576, "giftId": "gift_id"}`
  - `normalUpload`: `{"folder": "provider-avatars", "fileName": "avatar.png", "contentType": "image/png", "sizeBytes": 1048576}`
  - `adminOnBehalf`: `{"folder": "provider-logos", "fileName": "logo.png", "contentType": "image/png", "sizeBytes": 1048576, "targetAccountId": "provider_user_id"}`

### `POST` `/api/v1/uploads/complete`
- **Access:** Authenticated
- **Summary:** POST /api/v1/uploads/complete
- **Description:** Access: SUPER_ADMIN, ADMIN, PROVIDER, or REGISTERED_USER. SUPER_ADMIN, ADMIN, PROVIDER, or REGISTERED_USER. Access is scoped to the authenticated account.

### `GET` `/api/v1/uploads`
- **Access:** Authenticated
- **Summary:** GET /api/v1/uploads
- **Description:** Access: SUPER_ADMIN, ADMIN, PROVIDER, or REGISTERED_USER. SUPER_ADMIN, ADMIN, PROVIDER, or REGISTERED_USER. Access is scoped to the authenticated account.
- **Parameters:** `page` (query), `limit` (query), `folder` (query), `ownerId` (query)

### `GET` `/api/v1/uploads/{id}`
- **Access:** Authenticated
- **Summary:** GET /api/v1/uploads/{id}
- **Description:** Access: SUPER_ADMIN, ADMIN, PROVIDER, or REGISTERED_USER. SUPER_ADMIN, ADMIN, PROVIDER, or REGISTERED_USER. Access is scoped to the authenticated account.
- **Parameters:** `id` (path)

### `DELETE` `/api/v1/uploads/{id}`
- **Access:** Authenticated
- **Summary:** DELETE /api/v1/uploads/{id}
- **Description:** Access: SUPER_ADMIN, ADMIN, PROVIDER, or REGISTERED_USER. SUPER_ADMIN, ADMIN, PROVIDER, or REGISTERED_USER. Access is scoped to the authenticated account.
- **Parameters:** `id` (path)
