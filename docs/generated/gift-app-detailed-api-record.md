# Gift App Backend — Full API Record

Includes every API developed so far with allowed roles, request payloads, and response payloads/examples.

## 01 Auth

### `POST` `/api/v1/auth/users/register`

**Allowed roles:** PUBLIC

**Summary:** POST /api/v1/auth/users/register

**Description:** Access: PUBLIC. PUBLIC.

**Request payload (application/json):**
```json
{
  "$ref": "#/components/schemas/RegisterUserDto"
}
```

**Response payload:** Not documented

### `POST` `/api/v1/auth/providers/register`

**Allowed roles:** PUBLIC

**Summary:** POST /api/v1/auth/providers/register

**Description:** Access: PUBLIC. PUBLIC.

**Request payload (application/json):**
```json
{
  "$ref": "#/components/schemas/RegisterProviderDto"
}
```

**Response payload:** Not documented

### `POST` `/api/v1/auth/guest/session`

**Allowed roles:** PUBLIC

**Summary:** POST /api/v1/auth/guest/session

**Description:** Access: PUBLIC. PUBLIC.

**Request payload (application/json):**
```json
{
  "$ref": "#/components/schemas/GuestSessionDto"
}
```

**Response payload:** Not documented

### `POST` `/api/v1/auth/login`

**Allowed roles:** PUBLIC

**Summary:** POST /api/v1/auth/login

**Description:** Access: PUBLIC. PUBLIC.

**Request payload (application/json):**
```json
{
  "$ref": "#/components/schemas/LoginDto"
}
```

**Response payload:** Not documented

### `POST` `/api/v1/auth/refresh`

**Allowed roles:** PUBLIC

**Summary:** POST /api/v1/auth/refresh

**Description:** Access: PUBLIC. PUBLIC.

**Request payload (application/json):**
```json
{
  "$ref": "#/components/schemas/RefreshDto"
}
```

**Response payload:** Not documented

### `POST` `/api/v1/auth/logout`

**Allowed roles:** Authenticated

**Summary:** POST /api/v1/auth/logout

**Description:** Access: Authenticated. Authenticated JWT required.

**Request payload:** None

**Response payload:** Not documented

### `POST` `/api/v1/auth/verify-email`

**Allowed roles:** Authenticated

**Summary:** POST /api/v1/auth/verify-email

**Description:** Access: Authenticated. Authenticated JWT required.

**Request payload (application/json):**
```json
{
  "$ref": "#/components/schemas/VerifyEmailDto"
}
```

**Response payload:** Not documented

### `POST` `/api/v1/auth/resend-otp`

**Allowed roles:** Authenticated

**Summary:** POST /api/v1/auth/resend-otp

**Description:** Access: Authenticated. Authenticated JWT required.

**Request payload:** None

**Response payload:** Not documented

### `POST` `/api/v1/auth/forgot-password`

**Allowed roles:** PUBLIC

**Summary:** POST /api/v1/auth/forgot-password

**Description:** Access: PUBLIC. PUBLIC.

**Request payload (application/json):**
```json
{
  "$ref": "#/components/schemas/ForgotPasswordDto"
}
```

**Response payload:** Not documented

### `POST` `/api/v1/auth/verify-reset-otp`

**Allowed roles:** PUBLIC

**Summary:** POST /api/v1/auth/verify-reset-otp

**Description:** Access: PUBLIC. PUBLIC.

**Request payload (application/json):**
```json
{
  "$ref": "#/components/schemas/VerifyResetOtpDto"
}
```

**Response payload:** Not documented

### `POST` `/api/v1/auth/reset-password`

**Allowed roles:** PUBLIC

**Summary:** POST /api/v1/auth/reset-password

**Description:** Access: PUBLIC. PUBLIC.

**Request payload (application/json):**
```json
{
  "$ref": "#/components/schemas/ResetPasswordDto"
}
```

**Response payload:** Not documented

### `PATCH` `/api/v1/auth/change-password`

**Allowed roles:** Authenticated

**Summary:** PATCH /api/v1/auth/change-password

**Description:** Access: Authenticated. Authenticated JWT required.

**Request payload (application/json):**
```json
{
  "$ref": "#/components/schemas/ChangePasswordDto"
}
```

**Response payload:** Not documented

### `GET` `/api/v1/auth/me`

**Allowed roles:** Authenticated

**Summary:** GET /api/v1/auth/me

**Description:** Access: Authenticated. Authenticated JWT required.

**Request payload:** None

**Response payload:** Not documented

### `PATCH` `/api/v1/auth/me`

**Allowed roles:** Authenticated

**Summary:** PATCH /api/v1/auth/me

**Description:** Access: Authenticated. Authenticated JWT required.

**Request payload (application/json):**
```json
{
  "$ref": "#/components/schemas/UpdateOwnProfileDto"
}
```

**Response payload:** Not documented

### `GET` `/api/v1/auth/sessions`

**Allowed roles:** Authenticated

**Summary:** GET /api/v1/auth/sessions

**Description:** Access: Authenticated. Authenticated JWT required.

**Request payload:** None

**Response payload:** Not documented

### `POST` `/api/v1/auth/sessions/logout-all`

**Allowed roles:** Authenticated

**Summary:** POST /api/v1/auth/sessions/logout-all

**Description:** Access: Authenticated. Authenticated JWT required.

**Request payload:** None

**Response payload:** Not documented

### `DELETE` `/api/v1/auth/sessions/{id}`

**Allowed roles:** Authenticated

**Summary:** DELETE /api/v1/auth/sessions/{id}

**Description:** Access: Authenticated. Authenticated JWT required.

**Request payload:** None

**Response payload:** Not documented

### `DELETE` `/api/v1/auth/account`

**Allowed roles:** Authenticated

**Summary:** DELETE /api/v1/auth/account

**Description:** Access: Authenticated. Authenticated JWT required.

**Request payload:** None

**Response payload:** Not documented

### `POST` `/api/v1/auth/cancel-deletion`

**Allowed roles:** Authenticated

**Summary:** POST /api/v1/auth/cancel-deletion

**Description:** Access: Authenticated. Authenticated JWT required.

**Request payload:** None

**Response payload:** Not documented

## 01 Auth - Login Attempts

### `GET` `/api/v1/login-attempts/stats`

**Allowed roles:** SUPER_ADMIN or ADMIN with loginAttempts.read

**Summary:** GET /api/v1/login-attempts/stats

**Description:** Access: SUPER_ADMIN or ADMIN with loginAttempts.read. SUPER_ADMIN or ADMIN with loginAttempts.read permission.

**Request payload:** None

**Response payload:** Not documented

### `GET` `/api/v1/login-attempts/export`

**Allowed roles:** SUPER_ADMIN or ADMIN with loginAttempts.export

**Summary:** GET /api/v1/login-attempts/export

**Description:** Access: SUPER_ADMIN or ADMIN with loginAttempts.export. SUPER_ADMIN or ADMIN with loginAttempts.export permission.

**Request payload:** None

**Response payload:** Not documented

### `GET` `/api/v1/login-attempts`

**Allowed roles:** SUPER_ADMIN or ADMIN with loginAttempts.read

**Summary:** GET /api/v1/login-attempts

**Description:** Access: SUPER_ADMIN or ADMIN with loginAttempts.read. SUPER_ADMIN or ADMIN with loginAttempts.read permission.

**Request payload:** None

**Response payload:** Not documented

## 02 Admin - Staff Management

### `POST` `/api/v1/admins`

**Allowed roles:** SUPER_ADMIN

**Summary:** Create admin staff user

**Description:** Access: SUPER_ADMIN. SUPER_ADMIN only. Creates ADMIN staff users only. Creates an ADMIN staff user under Super Admin. The roleId field is the AdminRole ID that controls this staff user's permissions. This endpoint cannot create SUPER_ADMIN, REGISTERED_USER, PROVIDER, or GUEST_USER accounts.

**Request payload (application/json):**
```json
{
  "example": {
    "email": "staff@example.com",
    "temporaryPassword": "Temp@123456",
    "generateTemporaryPassword": false,
    "mustChangePassword": true,
    "firstName": "Operations",
    "lastName": "Staff",
    "phone": "+15550000002",
    "title": "Operations Manager",
    "roleId": "admin_role_id",
    "avatarUrl": "https://cdn.yourdomain.com/admin-avatars/staff.png",
    "isActive": true,
    "sendInviteEmail": true
  }
}
```

**Response payload:** Not documented

### `GET` `/api/v1/admins`

**Allowed roles:** SUPER_ADMIN

**Summary:** List admin staff users

**Description:** Access: SUPER_ADMIN. SUPER_ADMIN only. Admin staff management is controlled by Super Admin only. SUPER_ADMIN only. Returns User.role = ADMIN staff accounts only; SUPER_ADMIN accounts are intentionally excluded.

**Request payload:** None

**Response payload — 200 (application/json):**
```json
{
  "example": {
    "success": true,
    "data": [
      {
        "id": "admin_id",
        "firstName": "Operations",
        "lastName": "Staff",
        "fullName": "Operations Staff",
        "email": "staff@example.com",
        "phone": "+15550000002",
        "role": {
          "id": "admin_role_id",
          "name": "Gift Manager",
          "slug": "gift-manager"
        },
        "isActive": true,
        "isVerified": true,
        "createdAt": "2026-05-09T10:00:00.000Z",
        "lastLoginAt": null
      }
    ],
    "meta": {
      "page": 1,
      "limit": 10,
      "total": 1,
      "totalPages": 1
    },
    "message": "Admins fetched successfully"
  }
}
```

### `GET` `/api/v1/admins/{id}`

**Allowed roles:** SUPER_ADMIN

**Summary:** GET /api/v1/admins/{id}

**Description:** Access: SUPER_ADMIN. SUPER_ADMIN only. Fetches ADMIN staff details.

**Request payload:** None

**Response payload:** Not documented

### `PATCH` `/api/v1/admins/{id}`

**Allowed roles:** SUPER_ADMIN

**Summary:** PATCH /api/v1/admins/{id}

**Description:** Access: SUPER_ADMIN. SUPER_ADMIN only. Updates ADMIN staff account details.

**Request payload (application/json):**
```json
{
  "$ref": "#/components/schemas/UpdateAdminDto"
}
```

**Response payload:** Not documented

### `DELETE` `/api/v1/admins/{id}`

**Allowed roles:** SUPER_ADMIN

**Summary:** Permanently delete admin staff user

**Description:** Access: SUPER_ADMIN. SUPER_ADMIN only. Permanently deletes an ADMIN staff account. DANGER: This endpoint permanently deletes an ADMIN staff account from the database. This is not a soft delete. Use only from Super Admin danger zone screens. SUPER_ADMIN accounts and self-delete are blocked.

**Request payload (application/json):**
```json
{
  "$ref": "#/components/schemas/PermanentlyDeleteAdminDto"
}
```

**Response payload — 200 (application/json):**
```json
{
  "example": {
    "success": true,
    "data": {
      "deletedAdminId": "admin_id"
    },
    "message": "Admin staff user permanently deleted successfully."
  }
}
```

### `PATCH` `/api/v1/admins/{id}/active-status`

**Allowed roles:** SUPER_ADMIN

**Summary:** PATCH /api/v1/admins/{id}/active-status

**Description:** Access: SUPER_ADMIN. SUPER_ADMIN only. Updates ADMIN staff active status.

**Request payload (application/json):**
```json
{
  "$ref": "#/components/schemas/UpdateAdminActiveStatusDto"
}
```

**Response payload:** Not documented

### `PATCH` `/api/v1/admins/{id}/password`

**Allowed roles:** SUPER_ADMIN

**Summary:** PATCH /api/v1/admins/{id}/password

**Description:** Access: SUPER_ADMIN. SUPER_ADMIN only. Changes ADMIN staff password from dashboard.

**Request payload (application/json):**
```json
{
  "$ref": "#/components/schemas/ResetAdminPasswordDto"
}
```

**Response payload:** Not documented

## 02 Admin - Roles & Permissions

### `GET` `/api/v1/admin-roles`

**Allowed roles:** SUPER_ADMIN

**Summary:** GET /api/v1/admin-roles

**Description:** Access: SUPER_ADMIN. SUPER_ADMIN only. Only SUPER_ADMIN can manage staff roles and permissions. Admin Roles / RBAC manages permission roles for ADMIN staff users only. SUPER_ADMIN has full immutable access and does not depend on AdminRole permissions.

**Request payload:** None

**Response payload:** Not documented

### `POST` `/api/v1/admin-roles`

**Allowed roles:** SUPER_ADMIN

**Summary:** POST /api/v1/admin-roles

**Description:** Access: SUPER_ADMIN. SUPER_ADMIN only. ADMIN staff cannot create roles.

**Request payload (application/json):**
```json
{
  "$ref": "#/components/schemas/CreateAdminRoleDto"
}
```

**Response payload:** Not documented

### `GET` `/api/v1/admin-roles/{id}`

**Allowed roles:** SUPER_ADMIN

**Summary:** GET /api/v1/admin-roles/{id}

**Description:** Access: SUPER_ADMIN. SUPER_ADMIN only. ADMIN staff cannot view role details.

**Request payload:** None

**Response payload:** Not documented

### `PATCH` `/api/v1/admin-roles/{id}`

**Allowed roles:** SUPER_ADMIN

**Summary:** PATCH /api/v1/admin-roles/{id}

**Description:** Access: SUPER_ADMIN. SUPER_ADMIN only. ADMIN staff cannot update roles.

**Request payload (application/json):**
```json
{
  "$ref": "#/components/schemas/UpdateAdminRoleDto"
}
```

**Response payload:** Not documented

### `DELETE` `/api/v1/admin-roles/{id}`

**Allowed roles:** SUPER_ADMIN

**Summary:** DELETE /api/v1/admin-roles/{id}

**Description:** Access: SUPER_ADMIN. SUPER_ADMIN only. ADMIN staff cannot delete roles.

**Request payload:** None

**Response payload:** Not documented

### `PATCH` `/api/v1/admin-roles/{id}/permissions`

**Allowed roles:** SUPER_ADMIN

**Summary:** PATCH /api/v1/admin-roles/{id}/permissions

**Description:** Access: SUPER_ADMIN. SUPER_ADMIN only. ADMIN staff cannot update role permissions.

**Request payload (application/json):**
```json
{
  "$ref": "#/components/schemas/UpdateRolePermissionsDto"
}
```

**Response payload:** Not documented

### `GET` `/api/v1/permissions/catalog`

**Allowed roles:** SUPER_ADMIN

**Summary:** GET /api/v1/permissions/catalog

**Description:** Access: SUPER_ADMIN. SUPER_ADMIN only. Read-only backend permission catalog. Read-only list of backend-supported permission keys that can be assigned to admin roles.

**Request payload:** None

**Response payload:** Not documented

## 02 Admin - User Management

### `GET` `/api/v1/users/export`

**Allowed roles:** SUPER_ADMIN or ADMIN with users.export

**Summary:** GET /api/v1/users/export

**Description:** Access: SUPER_ADMIN or ADMIN with users.export. SUPER_ADMIN or ADMIN with users.export permission.

**Request payload:** None

**Response payload:** Not documented

### `GET` `/api/v1/users`

**Allowed roles:** SUPER_ADMIN or ADMIN with users.read

**Summary:** List registered users

**Description:** Access: SUPER_ADMIN or ADMIN with users.read. SUPER_ADMIN or ADMIN with users.read permission. SUPER_ADMIN/ADMIN with users.read permission.

**Request payload:** None

**Response payload — 200 (application/json):**
```json
{
  "example": {
    "success": true,
    "data": [
      {
        "id": "user_id",
        "email": "customer@example.com",
        "firstName": "Sarah",
        "lastName": "Johnson",
        "phone": "+923001234567",
        "role": "REGISTERED_USER",
        "isVerified": true,
        "isActive": true,
        "createdAt": "2026-05-09T10:00:00.000Z"
      }
    ],
    "meta": {
      "page": 1,
      "limit": 20,
      "total": 1,
      "totalPages": 1
    },
    "message": "Users fetched successfully"
  }
}
```

### `GET` `/api/v1/users/{id}`

**Allowed roles:** SUPER_ADMIN or ADMIN with users.read

**Summary:** GET /api/v1/users/{id}

**Description:** Access: SUPER_ADMIN or ADMIN with users.read. SUPER_ADMIN or ADMIN with users.read permission.

**Request payload:** None

**Response payload:** Not documented

### `PATCH` `/api/v1/users/{id}`

**Allowed roles:** SUPER_ADMIN or ADMIN with users.update

**Summary:** PATCH /api/v1/users/{id}

**Description:** Access: SUPER_ADMIN or ADMIN with users.update. SUPER_ADMIN or ADMIN with users.update permission.

**Request payload (application/json):**
```json
{
  "$ref": "#/components/schemas/UpdateRegisteredUserDto"
}
```

**Response payload:** Not documented

### `DELETE` `/api/v1/users/{id}`

**Allowed roles:** SUPER_ADMIN

**Summary:** Permanently delete registered user

**Description:** Access: SUPER_ADMIN. SUPER_ADMIN only. Permanent delete danger-zone endpoint. DANGER: This endpoint permanently deletes/anonymizes the registered user and removes related non-financial data from the database. This is not a soft delete. Use only from Super Admin danger zone screens.

**Request payload (application/json):**
```json
{
  "$ref": "#/components/schemas/PermanentlyDeleteRegisteredUserDto"
}
```

**Response payload — 200 (application/json):**
```json
{
  "example": {
    "success": true,
    "data": {
      "deletedUserId": "user_id",
      "deletedRelatedRecords": true
    },
    "message": "User permanently deleted successfully."
  }
}
```

### `PATCH` `/api/v1/users/{id}/status`

**Allowed roles:** SUPER_ADMIN or ADMIN with users.status.update

**Summary:** PATCH /api/v1/users/{id}/status

**Description:** Access: SUPER_ADMIN or ADMIN with users.status.update. SUPER_ADMIN or ADMIN with users.status.update permission.

**Request payload (application/json):**
```json
{
  "$ref": "#/components/schemas/UpdateRegisteredUserStatusDto"
}
```

**Response payload:** Not documented

### `POST` `/api/v1/users/{id}/suspend`

**Allowed roles:** SUPER_ADMIN or ADMIN with users.suspend

**Summary:** POST /api/v1/users/{id}/suspend

**Description:** Access: SUPER_ADMIN or ADMIN with users.suspend. SUPER_ADMIN or ADMIN with users.suspend permission.

**Request payload (application/json):**
```json
{
  "$ref": "#/components/schemas/SuspendRegisteredUserDto"
}
```

**Response payload:** Not documented

### `POST` `/api/v1/users/{id}/unsuspend`

**Allowed roles:** SUPER_ADMIN or ADMIN with users.unsuspend

**Summary:** POST /api/v1/users/{id}/unsuspend

**Description:** Access: SUPER_ADMIN or ADMIN with users.unsuspend. SUPER_ADMIN or ADMIN with users.unsuspend permission.

**Request payload (application/json):**
```json
{
  "$ref": "#/components/schemas/UnsuspendRegisteredUserDto"
}
```

**Response payload:** Not documented

### `POST` `/api/v1/users/{id}/reset-password`

**Allowed roles:** SUPER_ADMIN or ADMIN with users.resetPassword

**Summary:** Change registered user password

**Description:** Access: SUPER_ADMIN or ADMIN with users.resetPassword. SUPER_ADMIN or ADMIN with users.resetPassword permission. SUPER_ADMIN or ADMIN with users.resetPassword permission can change a REGISTERED_USER password from the dashboard. Optionally sends email and in-app notification to the user.

**Request payload (application/json):**
```json
{
  "$ref": "#/components/schemas/ResetRegisteredUserPasswordDto"
}
```

**Response payload — 200 (application/json):**
```json
{
  "example": {
    "success": true,
    "data": {
      "userId": "user_id",
      "email": "user@example.com",
      "emailSent": true,
      "notificationSent": true
    },
    "message": "User password changed successfully."
  }
}
```

### `GET` `/api/v1/users/{id}/activity`

**Allowed roles:** SUPER_ADMIN or ADMIN with users.read

**Summary:** GET /api/v1/users/{id}/activity

**Description:** Access: SUPER_ADMIN or ADMIN with users.read. SUPER_ADMIN or ADMIN with users.read permission.

**Request payload:** None

**Response payload:** Not documented

### `GET` `/api/v1/users/{id}/stats`

**Allowed roles:** SUPER_ADMIN or ADMIN with users.read

**Summary:** GET /api/v1/users/{id}/stats

**Description:** Access: SUPER_ADMIN or ADMIN with users.read. SUPER_ADMIN or ADMIN with users.read permission.

**Request payload:** None

**Response payload:** Not documented

## 02 Admin - Provider Management

### `GET` `/api/v1/providers/export`

**Allowed roles:** SUPER_ADMIN or ADMIN with providers.export

**Summary:** GET /api/v1/providers/export

**Description:** Access: SUPER_ADMIN or ADMIN with providers.export. SUPER_ADMIN or ADMIN with providers.export permission.

**Request payload:** None

**Response payload:** Not documented

### `GET` `/api/v1/providers/stats`

**Allowed roles:** SUPER_ADMIN or ADMIN with providers.read

**Summary:** GET /api/v1/providers/stats

**Description:** Access: SUPER_ADMIN or ADMIN with providers.read. SUPER_ADMIN or ADMIN with providers.read permission.

**Request payload:** None

**Response payload:** Not documented

### `GET` `/api/v1/providers`

**Allowed roles:** SUPER_ADMIN or ADMIN with providers.read

**Summary:** List providers

**Description:** Access: SUPER_ADMIN or ADMIN with providers.read. SUPER_ADMIN or ADMIN with providers.read permission. SUPER_ADMIN/ADMIN with providers.read permission.

**Request payload:** None

**Response payload — 200 (application/json):**
```json
{
  "example": {
    "success": true,
    "data": [
      {
        "id": "provider_id",
        "businessName": "Premium Gifts Co",
        "email": "provider@example.com",
        "phone": "+923001234567",
        "approvalStatus": "APPROVED",
        "isActive": true,
        "businessCategory": {
          "id": "category_id",
          "name": "Gift Supplier"
        },
        "createdAt": "2026-05-09T10:00:00.000Z"
      }
    ],
    "meta": {
      "page": 1,
      "limit": 20,
      "total": 1,
      "totalPages": 1
    },
    "message": "Providers fetched successfully"
  }
}
```

### `POST` `/api/v1/providers`

**Allowed roles:** SUPER_ADMIN or ADMIN with providers.create

**Summary:** Create provider from admin dashboard

**Description:** Access: SUPER_ADMIN or ADMIN with providers.create. SUPER_ADMIN or ADMIN with providers.create permission. SUPER_ADMIN or ADMIN with providers.create permission. Creates a PROVIDER account and provider business profile. Supports same business fields as provider self-registration, plus temporary password and invite email flow.

**Request payload (application/json):**
```json
{
  "$ref": "#/components/schemas/CreateProviderDto"
}
```

**Response payload — 201 (application/json):**
```json
{
  "example": {
    "success": true,
    "data": {
      "id": "provider_id",
      "userId": "provider_id",
      "email": "contact@giftsandblooms.com",
      "businessName": "Gifts & Blooms Co. Ltd",
      "approvalStatus": "PENDING",
      "isActive": true,
      "inviteEmailSent": true
    },
    "message": "Provider created successfully and invite email sent."
  }
}
```

### `GET` `/api/v1/providers/lookup`

**Allowed roles:** SUPER_ADMIN or ADMIN with providers.read

**Summary:** GET /api/v1/providers/lookup

**Description:** Access: SUPER_ADMIN or ADMIN with providers.read. SUPER_ADMIN or ADMIN with providers.read permission.

**Request payload:** None

**Response payload:** Not documented

### `GET` `/api/v1/providers/{id}`

**Allowed roles:** SUPER_ADMIN or ADMIN with providers.read

**Summary:** GET /api/v1/providers/{id}

**Description:** Access: SUPER_ADMIN or ADMIN with providers.read. SUPER_ADMIN or ADMIN with providers.read permission.

**Request payload:** None

**Response payload:** Not documented

### `PATCH` `/api/v1/providers/{id}`

**Allowed roles:** SUPER_ADMIN or ADMIN with providers.update

**Summary:** PATCH /api/v1/providers/{id}

**Description:** Access: SUPER_ADMIN or ADMIN with providers.update. SUPER_ADMIN or ADMIN with providers.update permission.

**Request payload (application/json):**
```json
{
  "$ref": "#/components/schemas/UpdateProviderDto"
}
```

**Response payload:** Not documented

### `DELETE` `/api/v1/providers/{id}`

**Allowed roles:** SUPER_ADMIN

**Summary:** Permanently delete provider

**Description:** Access: SUPER_ADMIN. SUPER_ADMIN only. Permanent delete danger-zone endpoint. DANGER: This endpoint permanently deletes/anonymizes the provider and related provider data from the database. This is not a soft delete. Use only from Super Admin danger zone screens. Active processing orders block deletion.

**Request payload (application/json):**
```json
{
  "$ref": "#/components/schemas/PermanentlyDeleteProviderDto"
}
```

**Response payload — 200 (application/json):**
```json
{
  "example": {
    "success": true,
    "data": {
      "deletedProviderId": "provider_id",
      "deletedRelatedRecords": true
    },
    "message": "Provider permanently deleted successfully."
  }
}
```

### `PATCH` `/api/v1/providers/{id}/status`

**Allowed roles:** SUPER_ADMIN or ADMIN with provider lifecycle permission (APPROVE=>providers.approve, REJECT=>providers.reject, SUSPEND=>providers.suspend, UNSUSPEND=>providers.suspend, UPDATE_STATUS=>providers.updateStatus)

**Summary:** Update provider lifecycle status

**Description:** Access: SUPER_ADMIN or ADMIN with provider lifecycle permission (APPROVE=>providers.approve, REJECT=>providers.reject, SUSPEND=>providers.suspend, UNSUSPEND=>providers.suspend, UPDATE_STATUS=>providers.updateStatus). SUPER_ADMIN or ADMIN with lifecycle permission. APPROVE requires providers.approve; REJECT requires providers.reject; SUSPEND and UNSUSPEND require providers.suspend; UPDATE_STATUS requires providers.updateStatus. SUPER_ADMIN or ADMIN with provider lifecycle permission. APPROVE requires providers.approve, REJECT requires providers.reject, SUSPEND and UNSUSPEND require providers.suspend, UPDATE_STATUS requires providers.updateStatus. Uses action-based request body.

**Request payload (application/json):**
```json
{
  "action": "APPROVE",
  "comment": "Documents verified successfully.",
  "notifyProvider": true
}
```

**Response payload — 200 (application/json):**
```json
{
  "example": {
    "success": true,
    "data": {
      "id": "provider_id",
      "approvalStatus": "APPROVED",
      "status": "ACTIVE",
      "isActive": true
    },
    "message": "Provider approved successfully."
  }
}
```

### `GET` `/api/v1/providers/{id}/items`

**Allowed roles:** SUPER_ADMIN or ADMIN with providers.read

**Summary:** GET /api/v1/providers/{id}/items

**Description:** Access: SUPER_ADMIN or ADMIN with providers.read. SUPER_ADMIN or ADMIN with providers.read permission.

**Request payload:** None

**Response payload:** Not documented

### `GET` `/api/v1/providers/{id}/activity`

**Allowed roles:** SUPER_ADMIN or ADMIN with providers.read

**Summary:** GET /api/v1/providers/{id}/activity

**Description:** Access: SUPER_ADMIN or ADMIN with providers.read. SUPER_ADMIN or ADMIN with providers.read permission.

**Request payload:** None

**Response payload:** Not documented

### `POST` `/api/v1/providers/{id}/message`

**Allowed roles:** SUPER_ADMIN or ADMIN with providers.message

**Summary:** POST /api/v1/providers/{id}/message

**Description:** Access: SUPER_ADMIN or ADMIN with providers.message. SUPER_ADMIN or ADMIN with providers.message permission.

**Request payload (application/json):**
```json
{
  "$ref": "#/components/schemas/MessageProviderDto"
}
```

**Response payload:** Not documented

## 02 Admin - Provider Business Categories

### `GET` `/api/v1/provider-business-categories`

**Allowed roles:** PUBLIC

**Summary:** List provider business categories

**Description:** Access: PUBLIC. PUBLIC. Active provider business category lookup for provider signup. Public/provider-signup dropdown. Returns active provider business categories.

**Request payload:** None

**Response payload:** Not documented

### `POST` `/api/v1/provider-business-categories`

**Allowed roles:** SUPER_ADMIN or ADMIN with providerBusinessCategories.create

**Summary:** Create provider business category

**Description:** Access: SUPER_ADMIN or ADMIN with providerBusinessCategories.create. SUPER_ADMIN or ADMIN with providerBusinessCategories.create permission. SUPER_ADMIN or ADMIN with providerBusinessCategories.create permission only.

**Request payload (application/json):**
```json
{
  "$ref": "#/components/schemas/CreateProviderBusinessCategoryDto"
}
```

**Response payload:** Not documented

### `GET` `/api/v1/provider-business-categories/{id}`

**Allowed roles:** SUPER_ADMIN or ADMIN with providerBusinessCategories.read

**Summary:** Fetch provider business category details

**Description:** Access: SUPER_ADMIN or ADMIN with providerBusinessCategories.read. SUPER_ADMIN or ADMIN with providerBusinessCategories.read permission. SUPER_ADMIN or ADMIN with providerBusinessCategories.read permission only.

**Request payload:** None

**Response payload:** Not documented

### `PATCH` `/api/v1/provider-business-categories/{id}`

**Allowed roles:** SUPER_ADMIN or ADMIN with providerBusinessCategories.update

**Summary:** Update provider business category

**Description:** Access: SUPER_ADMIN or ADMIN with providerBusinessCategories.update. SUPER_ADMIN or ADMIN with providerBusinessCategories.update permission. SUPER_ADMIN or ADMIN with providerBusinessCategories.update permission only.

**Request payload (application/json):**
```json
{
  "$ref": "#/components/schemas/UpdateProviderBusinessCategoryDto"
}
```

**Response payload:** Not documented

### `DELETE` `/api/v1/provider-business-categories/{id}`

**Allowed roles:** SUPER_ADMIN or ADMIN with providerBusinessCategories.delete

**Summary:** Soft-delete provider business category

**Description:** Access: SUPER_ADMIN or ADMIN with providerBusinessCategories.delete. SUPER_ADMIN or ADMIN with providerBusinessCategories.delete permission. SUPER_ADMIN or ADMIN with providerBusinessCategories.delete permission. Soft delete only; refuses deletion when active providers are attached.

**Request payload:** None

**Response payload:** Not documented

## 02 Admin - Referral Settings

### `GET` `/api/v1/referral-settings`

**Allowed roles:** SUPER_ADMIN or ADMIN with referralSettings.read

**Summary:** Fetch referral settings

**Description:** Access: SUPER_ADMIN or ADMIN with referralSettings.read. SUPER_ADMIN or ADMIN with referralSettings.read permission. SUPER_ADMIN or ADMIN with referralSettings.read. Customer referral APIs consume these settings. Pending referrals use the settings snapshot stored at referral creation.

**Request payload:** None

**Response payload — 200 (application/json):**
```json
{
  "example": {
    "success": true,
    "data": {
      "isActive": true,
      "referrerRewardAmount": 25,
      "newUserRewardAmount": 10,
      "rewardCurrency": "USD",
      "minimumTransactionAmount": 50,
      "referralExpirationValue": 30,
      "referralExpirationUnit": "DAYS",
      "allowSelfReferrals": false,
      "qualificationRule": "FIRST_SUCCESSFUL_PURCHASE",
      "updatedAt": "2026-05-09T10:00:00.000Z"
    },
    "message": "Referral settings fetched successfully."
  }
}
```

### `PATCH` `/api/v1/referral-settings`

**Allowed roles:** SUPER_ADMIN

**Summary:** Update referral settings

**Description:** Access: SUPER_ADMIN. SUPER_ADMIN only. Changes apply to future referral snapshots. SUPER_ADMIN only. Changes apply to future referral snapshots and do not recalculate already-earned rewards.

**Request payload (application/json):**
```json
{
  "$ref": "#/components/schemas/UpdateReferralSettingsDto"
}
```

**Response payload:** Not documented

### `POST` `/api/v1/referral-settings/activate`

**Allowed roles:** SUPER_ADMIN

**Summary:** Activate referral program

**Description:** Access: SUPER_ADMIN. SUPER_ADMIN only. Activates referral program. SUPER_ADMIN only. Existing earned rewards remain redeemable.

**Request payload:** None

**Response payload:** Not documented

### `POST` `/api/v1/referral-settings/deactivate`

**Allowed roles:** SUPER_ADMIN

**Summary:** Deactivate referral program

**Description:** Access: SUPER_ADMIN. SUPER_ADMIN only. Deactivates referral program. SUPER_ADMIN only. New referral rewards are blocked while inactive; earned rewards remain redeemable.

**Request payload (application/json):**
```json
{
  "$ref": "#/components/schemas/DeactivateReferralSettingsDto"
}
```

**Response payload:** Not documented

### `GET` `/api/v1/referral-settings/stats`

**Allowed roles:** SUPER_ADMIN or ADMIN with referralSettings.read

**Summary:** Fetch referral stats

**Description:** Access: SUPER_ADMIN or ADMIN with referralSettings.read. SUPER_ADMIN or ADMIN with referralSettings.read permission. SUPER_ADMIN or ADMIN with referralSettings.read.

**Request payload:** None

**Response payload:** Not documented

### `GET` `/api/v1/referral-settings/audit-logs`

**Allowed roles:** SUPER_ADMIN

**Summary:** List referral settings audit logs

**Description:** Access: SUPER_ADMIN. SUPER_ADMIN only. Referral settings audit logs. SUPER_ADMIN only.

**Request payload:** None

**Response payload:** Not documented

## 02 Admin - Media Upload Policy

### `GET` `/api/v1/media-upload-policy`

**Allowed roles:** SUPER_ADMIN or ADMIN with mediaPolicy.read

**Summary:** Fetch global media upload policy

**Description:** Access: SUPER_ADMIN or ADMIN with mediaPolicy.read. SUPER_ADMIN or ADMIN with mediaPolicy.read permission. SUPER_ADMIN or ADMIN with mediaPolicy.read. uploads/presigned-url enforces this policy before issuing upload URLs.

**Request payload:** None

**Response payload — 200 (application/json):**
```json
{
  "example": {
    "success": true,
    "data": {
      "allowedFileTypes": {
        "jpeg": true,
        "jpg": true,
        "png": true,
        "gif": false,
        "mp4": true,
        "mov": true,
        "mp3": true,
        "wav": false,
        "svg": false
      },
      "maxImageSizeMb": 10,
      "maxVideoSizeMb": 500,
      "maxAudioSizeMb": 50,
      "scanUploads": true,
      "blockSvgUploads": true,
      "updatedAt": "2026-05-09T10:00:00.000Z",
      "updatedBy": {
        "id": "admin_id",
        "name": "Alex Rivera"
      }
    },
    "message": "Media upload policy fetched successfully."
  }
}
```

### `PATCH` `/api/v1/media-upload-policy`

**Allowed roles:** SUPER_ADMIN

**Summary:** Update global media upload policy

**Description:** Access: SUPER_ADMIN. SUPER_ADMIN only. Updates global media upload policy. SUPER_ADMIN only. Does not expose AWS secrets or bucket credentials.

**Request payload (application/json):**
```json
{
  "$ref": "#/components/schemas/UpdateMediaUploadPolicyDto"
}
```

**Response payload:** Not documented

### `GET` `/api/v1/media-upload-policy/audit-logs`

**Allowed roles:** SUPER_ADMIN

**Summary:** List media upload policy audit logs

**Description:** Access: SUPER_ADMIN. SUPER_ADMIN only. Media upload policy audit logs. SUPER_ADMIN only.

**Request payload:** None

**Response payload:** Not documented

## 02 Admin - Audit Logs

### `GET` `/api/v1/audit-logs/export`

**Allowed roles:** SUPER_ADMIN

**Summary:** GET /api/v1/audit-logs/export

**Description:** Access: SUPER_ADMIN. SUPER_ADMIN only. Audit log export is restricted to Super Admin.

**Request payload:** None

**Response payload:** Not documented

### `GET` `/api/v1/audit-logs`

**Allowed roles:** SUPER_ADMIN

**Summary:** GET /api/v1/audit-logs

**Description:** Access: SUPER_ADMIN. SUPER_ADMIN only. Audit logs are restricted to Super Admin.

**Request payload:** None

**Response payload:** Not documented

### `GET` `/api/v1/audit-logs/{id}`

**Allowed roles:** SUPER_ADMIN

**Summary:** GET /api/v1/audit-logs/{id}

**Description:** Access: SUPER_ADMIN. SUPER_ADMIN only. Audit log details are restricted to Super Admin.

**Request payload:** None

**Response payload:** Not documented

## 03 Provider - Business Info

### `GET` `/api/v1/provider/business-info`

**Allowed roles:** PROVIDER

**Summary:** Fetch own provider business information

**Description:** Access: PROVIDER. PROVIDER only. providerId is derived from JWT; provider can access only own inventory, offers, orders, analytics, and messages. PROVIDER only. providerId is derived from JWT.

**Request payload:** None

**Response payload:** Not documented

### `PATCH` `/api/v1/provider/business-info`

**Allowed roles:** PROVIDER

**Summary:** Update own provider business information

**Description:** Access: PROVIDER. PROVIDER only. providerId is derived from JWT; provider can access only own inventory, offers, orders, analytics, and messages. PROVIDER only. Cannot set approvalStatus/isActive; material business changes require verification review.

**Request payload (application/json):**
```json
{
  "$ref": "#/components/schemas/UpdateProviderBusinessInfoDto"
}
```

**Response payload:** Not documented

## 03 Provider - Inventory

### `GET` `/api/v1/provider/inventory`

**Allowed roles:** PROVIDER

**Summary:** List provider inventory items

**Description:** Access: PROVIDER. PROVIDER only. providerId is derived from JWT; provider can access only own inventory, offers, orders, analytics, and messages. PROVIDER only. Returns only inventory owned by the authenticated provider.

**Request payload:** None

**Response payload — 200 (application/json):**
```json
{
  "example": {
    "success": true,
    "data": [
      {
        "id": "gift_id",
        "name": "Luxury Perfume",
        "price": 99.99,
        "currency": "PKR",
        "stockQuantity": 50,
        "status": "ACTIVE",
        "moderationStatus": "APPROVED",
        "isAvailable": true,
        "category": {
          "id": "category_id",
          "name": "Perfumes"
        },
        "variants": [
          {
            "id": "variant_id",
            "name": "50ml",
            "price": 129.99,
            "stockQuantity": 20,
            "isDefault": true
          }
        ]
      }
    ],
    "meta": {
      "page": 1,
      "limit": 20,
      "total": 1,
      "totalPages": 1
    },
    "message": "Provider inventory fetched successfully"
  }
}
```

### `POST` `/api/v1/provider/inventory`

**Allowed roles:** PROVIDER

**Summary:** Create provider inventory item with optional nested variants

**Description:** Access: PROVIDER. PROVIDER only. providerId is derived from JWT; provider can access only own inventory, offers, orders, analytics, and messages. PROVIDER only. providerId is derived from JWT; provider cannot approve/publish variants directly.

**Request payload (application/json):**
```json
{
  "name": "Luxury Perfume",
  "description": "Long-lasting premium fragrance.",
  "shortDescription": "Premium fragrance gift.",
  "categoryId": "gift_category_id",
  "price": 99.99,
  "currency": "PKR",
  "stockQuantity": 50,
  "sku": "PERFUME-001",
  "imageUrls": [
    "https://cdn.yourdomain.com/gift-images/perfume.png"
  ],
  "isAvailable": true,
  "variants": [
    {
      "name": "30ml",
      "price": 89.99,
      "originalPrice": 119.99,
      "stockQuantity": 10,
      "sku": "PERFUME-30ML",
      "isPopular": false,
      "isDefault": false,
      "sortOrder": 1,
      "isActive": true
    },
    {
      "name": "50ml",
      "price": 129.99,
      "originalPrice": 159.99,
      "stockQuantity": 20,
      "sku": "PERFUME-50ML",
      "isPopular": true,
      "isDefault": true,
      "sortOrder": 2,
      "isActive": true
    }
  ]
}
```

**Response payload — 201 (application/json):**
```json
{
  "example": {
    "success": true,
    "data": {
      "id": "gift_id",
      "name": "Luxury Perfume",
      "price": 99.99,
      "currency": "PKR",
      "stockQuantity": 50,
      "status": "ACTIVE",
      "moderationStatus": "PENDING",
      "variants": [
        {
          "id": "variant_id",
          "name": "50ml",
          "price": 129.99,
          "originalPrice": 159.99,
          "stockQuantity": 20,
          "sku": "PERFUME-50ML",
          "isDefault": true,
          "isActive": true
        }
      ]
    },
    "message": "Inventory item created successfully"
  }
}
```

### `GET` `/api/v1/provider/inventory/stats`

**Allowed roles:** PROVIDER

**Summary:** Fetch provider inventory stats

**Description:** Access: PROVIDER. PROVIDER only. providerId is derived from JWT; provider can access only own inventory, offers, orders, analytics, and messages.

**Request payload:** None

**Response payload:** Not documented

### `GET` `/api/v1/provider/inventory/lookup`

**Allowed roles:** PROVIDER

**Summary:** Lookup active approved provider inventory items

**Description:** Access: PROVIDER. PROVIDER only. providerId is derived from JWT; provider can access only own inventory, offers, orders, analytics, and messages.

**Request payload:** None

**Response payload:** Not documented

### `GET` `/api/v1/provider/inventory/{id}`

**Allowed roles:** PROVIDER

**Summary:** Fetch own provider inventory item details

**Description:** Access: PROVIDER. PROVIDER only. providerId is derived from JWT; provider can access only own inventory, offers, orders, analytics, and messages.

**Request payload:** None

**Response payload — 200 (application/json):**
```json
{
  "example": {
    "success": true,
    "data": {
      "id": "gift_id",
      "name": "Luxury Perfume",
      "description": "Long-lasting premium fragrance.",
      "price": 99.99,
      "currency": "PKR",
      "stockQuantity": 50,
      "status": "ACTIVE",
      "moderationStatus": "APPROVED",
      "imageUrls": [
        "https://cdn.yourdomain.com/gift-images/perfume.png"
      ],
      "variants": [
        {
          "id": "variant_id",
          "name": "50ml",
          "price": 129.99,
          "originalPrice": 159.99,
          "stockQuantity": 20,
          "sku": "PERFUME-50ML",
          "isDefault": true,
          "isActive": true
        }
      ]
    },
    "message": "Inventory item fetched successfully"
  }
}
```

### `PATCH` `/api/v1/provider/inventory/{id}`

**Allowed roles:** PROVIDER

**Summary:** Update own provider inventory item and upsert variants

**Description:** Access: PROVIDER. PROVIDER only. providerId is derived from JWT; provider can access only own inventory, offers, orders, analytics, and messages. Variant id must belong to the provider-owned gift. Material variant changes re-submit approved gifts for moderation; stock-only changes do not.

**Request payload (application/json):**
```json
{
  "replaceVariants": false,
  "variants": [
    {
      "id": "variant_id",
      "name": "50ml",
      "price": 129.99,
      "originalPrice": 159.99,
      "stockQuantity": 20,
      "sku": "PERFUME-50ML",
      "isPopular": true,
      "isDefault": true,
      "sortOrder": 2,
      "isActive": true
    },
    {
      "name": "150ml",
      "price": 249.99,
      "originalPrice": 299.99,
      "stockQuantity": 5,
      "sku": "PERFUME-150ML",
      "isPopular": false,
      "isDefault": false,
      "sortOrder": 4,
      "isActive": true
    }
  ]
}
```

**Response payload — 200 (application/json):**
```json
{
  "example": {
    "success": true,
    "data": {
      "id": "gift_id",
      "name": "Luxury Perfume",
      "variants": [
        {
          "id": "variant_id",
          "name": "50ml",
          "price": 129.99,
          "stockQuantity": 20,
          "isDefault": true,
          "isActive": true
        }
      ]
    },
    "message": "Inventory item updated successfully"
  }
}
```

### `DELETE` `/api/v1/provider/inventory/{id}`

**Allowed roles:** PROVIDER

**Summary:** Soft-delete own inventory item

**Description:** Access: PROVIDER. PROVIDER only. providerId is derived from JWT; provider can access only own inventory, offers, orders, analytics, and messages.

**Request payload:** None

**Response payload:** Not documented

### `PATCH` `/api/v1/provider/inventory/{id}/availability`

**Allowed roles:** PROVIDER

**Summary:** Update own inventory availability

**Description:** Access: PROVIDER. PROVIDER only. providerId is derived from JWT; provider can access only own inventory, offers, orders, analytics, and messages.

**Request payload (application/json):**
```json
{
  "$ref": "#/components/schemas/UpdateProviderAvailabilityDto"
}
```

**Response payload:** Not documented

## 03 Provider - Promotional Offers

### `GET` `/api/v1/provider/offers`

**Allowed roles:** PROVIDER

**Summary:** GET /api/v1/provider/offers

**Description:** Access: PROVIDER. PROVIDER only. providerId is derived from JWT; provider can access only own inventory, offers, orders, analytics, and messages.

**Request payload:** None

**Response payload:** Not documented

### `POST` `/api/v1/provider/offers`

**Allowed roles:** PROVIDER

**Summary:** POST /api/v1/provider/offers

**Description:** Access: PROVIDER. PROVIDER only. providerId is derived from JWT; provider can access only own inventory, offers, orders, analytics, and messages.

**Request payload (application/json):**
```json
{
  "$ref": "#/components/schemas/CreateProviderOfferDto"
}
```

**Response payload:** Not documented

### `GET` `/api/v1/provider/offers/{id}`

**Allowed roles:** PROVIDER

**Summary:** GET /api/v1/provider/offers/{id}

**Description:** Access: PROVIDER. PROVIDER only. providerId is derived from JWT; provider can access only own inventory, offers, orders, analytics, and messages.

**Request payload:** None

**Response payload:** Not documented

### `PATCH` `/api/v1/provider/offers/{id}`

**Allowed roles:** PROVIDER

**Summary:** PATCH /api/v1/provider/offers/{id}

**Description:** Access: PROVIDER. PROVIDER only. providerId is derived from JWT; provider can access only own inventory, offers, orders, analytics, and messages.

**Request payload (application/json):**
```json
{
  "$ref": "#/components/schemas/UpdatePromotionalOfferDto"
}
```

**Response payload:** Not documented

### `DELETE` `/api/v1/provider/offers/{id}`

**Allowed roles:** PROVIDER

**Summary:** DELETE /api/v1/provider/offers/{id}

**Description:** Access: PROVIDER. PROVIDER only. providerId is derived from JWT; provider can access only own inventory, offers, orders, analytics, and messages.

**Request payload:** None

**Response payload:** Not documented

### `PATCH` `/api/v1/provider/offers/{id}/status`

**Allowed roles:** PROVIDER

**Summary:** PATCH /api/v1/provider/offers/{id}/status

**Description:** Access: PROVIDER. PROVIDER only. providerId is derived from JWT; provider can access only own inventory, offers, orders, analytics, and messages.

**Request payload (application/json):**
```json
{
  "$ref": "#/components/schemas/UpdateOfferStatusDto"
}
```

**Response payload:** Not documented

### `GET` `/api/v1/promotional-offers/stats`

**Allowed roles:** SUPER_ADMIN or ADMIN with promotionalOffers.read

**Summary:** GET /api/v1/promotional-offers/stats

**Description:** Access: SUPER_ADMIN or ADMIN with promotionalOffers.read. SUPER_ADMIN or ADMIN with promotionalOffers.read permission.

**Request payload:** None

**Response payload:** Not documented

### `GET` `/api/v1/promotional-offers/export`

**Allowed roles:** SUPER_ADMIN or ADMIN with promotionalOffers.export

**Summary:** GET /api/v1/promotional-offers/export

**Description:** Access: SUPER_ADMIN or ADMIN with promotionalOffers.export. SUPER_ADMIN or ADMIN with promotionalOffers.export permission.

**Request payload:** None

**Response payload:** Not documented

### `GET` `/api/v1/promotional-offers`

**Allowed roles:** SUPER_ADMIN or ADMIN with promotionalOffers.read

**Summary:** GET /api/v1/promotional-offers

**Description:** Access: SUPER_ADMIN or ADMIN with promotionalOffers.read. SUPER_ADMIN or ADMIN with promotionalOffers.read permission.

**Request payload:** None

**Response payload:** Not documented

### `POST` `/api/v1/promotional-offers`

**Allowed roles:** SUPER_ADMIN or ADMIN with promotionalOffers.create

**Summary:** POST /api/v1/promotional-offers

**Description:** Access: SUPER_ADMIN or ADMIN with promotionalOffers.create. SUPER_ADMIN or ADMIN with promotionalOffers.create permission.

**Request payload (application/json):**
```json
{
  "$ref": "#/components/schemas/CreateAdminOfferDto"
}
```

**Response payload:** Not documented

### `GET` `/api/v1/promotional-offers/{id}`

**Allowed roles:** SUPER_ADMIN or ADMIN with promotionalOffers.read

**Summary:** GET /api/v1/promotional-offers/{id}

**Description:** Access: SUPER_ADMIN or ADMIN with promotionalOffers.read. SUPER_ADMIN or ADMIN with promotionalOffers.read permission.

**Request payload:** None

**Response payload:** Not documented

### `PATCH` `/api/v1/promotional-offers/{id}`

**Allowed roles:** SUPER_ADMIN or ADMIN with promotionalOffers.update

**Summary:** PATCH /api/v1/promotional-offers/{id}

**Description:** Access: SUPER_ADMIN or ADMIN with promotionalOffers.update. SUPER_ADMIN or ADMIN with promotionalOffers.update permission.

**Request payload (application/json):**
```json
{
  "$ref": "#/components/schemas/UpdatePromotionalOfferDto"
}
```

**Response payload:** Not documented

### `DELETE` `/api/v1/promotional-offers/{id}`

**Allowed roles:** SUPER_ADMIN or ADMIN with promotionalOffers.delete

**Summary:** DELETE /api/v1/promotional-offers/{id}

**Description:** Access: SUPER_ADMIN or ADMIN with promotionalOffers.delete. SUPER_ADMIN or ADMIN with promotionalOffers.delete permission.

**Request payload:** None

**Response payload:** Not documented

### `PATCH` `/api/v1/promotional-offers/{id}/approve`

**Allowed roles:** SUPER_ADMIN or ADMIN with promotionalOffers.approve

**Summary:** PATCH /api/v1/promotional-offers/{id}/approve

**Description:** Access: SUPER_ADMIN or ADMIN with promotionalOffers.approve. SUPER_ADMIN or ADMIN with promotionalOffers.approve permission.

**Request payload (application/json):**
```json
{
  "$ref": "#/components/schemas/ApproveOfferDto"
}
```

**Response payload:** Not documented

### `PATCH` `/api/v1/promotional-offers/{id}/reject`

**Allowed roles:** SUPER_ADMIN or ADMIN with promotionalOffers.reject

**Summary:** PATCH /api/v1/promotional-offers/{id}/reject

**Description:** Access: SUPER_ADMIN or ADMIN with promotionalOffers.reject. SUPER_ADMIN or ADMIN with promotionalOffers.reject permission.

**Request payload (application/json):**
```json
{
  "$ref": "#/components/schemas/RejectOfferDto"
}
```

**Response payload:** Not documented

### `PATCH` `/api/v1/promotional-offers/{id}/status`

**Allowed roles:** SUPER_ADMIN or ADMIN with promotionalOffers.status.update

**Summary:** PATCH /api/v1/promotional-offers/{id}/status

**Description:** Access: SUPER_ADMIN or ADMIN with promotionalOffers.status.update. SUPER_ADMIN or ADMIN with promotionalOffers.status.update permission.

**Request payload (application/json):**
```json
{
  "$ref": "#/components/schemas/UpdateOfferStatusDto"
}
```

**Response payload:** Not documented

## 03 Provider - Orders

### `GET` `/api/v1/provider/orders`

**Allowed roles:** PROVIDER

**Summary:** List own assigned provider orders

**Description:** Access: PROVIDER. PROVIDER only. providerId is derived from JWT; provider can access only own inventory, offers, orders, analytics, and messages. PROVIDER only. Returns only orders assigned to the authenticated providerId. Default status filter is PENDING.

**Request payload:** None

**Response payload — 200 (application/json):**
```json
{
  "example": {
    "success": true,
    "data": [
      {
        "id": "provider_order_id",
        "orderId": "order_id",
        "orderNumber": "ORD-10293",
        "status": "PENDING",
        "paymentStatus": "SUCCEEDED",
        "customer": {
          "name": "Sarah Jenkins",
          "phone": "+15551234567"
        },
        "itemPreview": [
          {
            "name": "Premium Sneakers",
            "imageUrl": "https://cdn.yourdomain.com/gifts/sneaker.png"
          }
        ],
        "itemCount": 3,
        "totalPayout": 142,
        "currency": "PKR",
        "createdAt": "2026-10-24T10:45:00.000Z",
        "receivedAgoText": "5m ago"
      }
    ],
    "message": "Provider orders fetched successfully."
  }
}
```

### `GET` `/api/v1/provider/orders/history`

**Allowed roles:** PROVIDER

**Summary:** List own provider order history

**Description:** Access: PROVIDER. PROVIDER only. providerId is derived from JWT; provider can access only own inventory, offers, orders, analytics, and messages. PROVIDER only. Uses ProviderOrder records scoped to the authenticated provider. Status tabs map to provider order statuses.

**Request payload:** None

**Response payload:** Not documented

### `GET` `/api/v1/provider/orders/performance`

**Allowed roles:** PROVIDER

**Summary:** Fetch own provider order performance

**Description:** Access: PROVIDER. PROVIDER only. providerId is derived from JWT; provider can access only own inventory, offers, orders, analytics, and messages. PROVIDER only. Completion rate uses completed / non-cancelled own provider orders.

**Request payload:** None

**Response payload:** Not documented

### `GET` `/api/v1/provider/orders/analytics/revenue`

**Allowed roles:** PROVIDER

**Summary:** Fetch own provider revenue analytics

**Description:** Access: PROVIDER. PROVIDER only. providerId is derived from JWT; provider can access only own inventory, offers, orders, analytics, and messages. PROVIDER only. Revenue uses provider totalPayout for paid active/completed provider orders.

**Request payload:** None

**Response payload:** Not documented

### `GET` `/api/v1/provider/orders/analytics/ratings`

**Allowed roles:** PROVIDER

**Summary:** Fetch own provider ratings analytics

**Description:** Access: PROVIDER. PROVIDER only. providerId is derived from JWT; provider can access only own inventory, offers, orders, analytics, and messages. PROVIDER only. Returns stable zero values until reviews module is available.

**Request payload:** None

**Response payload:** Not documented

### `GET` `/api/v1/provider/orders/recent`

**Allowed roles:** PROVIDER

**Summary:** List recent own provider orders

**Description:** Access: PROVIDER. PROVIDER only. providerId is derived from JWT; provider can access only own inventory, offers, orders, analytics, and messages. PROVIDER only. Defaults to 5 latest orders.

**Request payload:** None

**Response payload:** Not documented

### `GET` `/api/v1/provider/orders/export`

**Allowed roles:** PROVIDER

**Summary:** Export own provider orders as CSV

**Description:** Access: PROVIDER. PROVIDER only. providerId is derived from JWT; provider can access only own inventory, offers, orders, analytics, and messages. PROVIDER only. Export is scoped to logged-in provider orders.

**Request payload:** None

**Response payload:** Not documented

### `GET` `/api/v1/provider/orders/summary`

**Allowed roles:** PROVIDER

**Summary:** Fetch own provider order summary

**Description:** Access: PROVIDER. PROVIDER only. providerId is derived from JWT; provider can access only own inventory, offers, orders, analytics, and messages. Route intentionally declared before :id. PROVIDER only.

**Request payload:** None

**Response payload:** Not documented

### `GET` `/api/v1/provider/orders/reject-reasons`

**Allowed roles:** PROVIDER

**Summary:** List provider order reject reasons

**Description:** Access: PROVIDER. PROVIDER only. providerId is derived from JWT; provider can access only own inventory, offers, orders, analytics, and messages. Route intentionally declared before :id.

**Request payload:** None

**Response payload:** Not documented

### `PATCH` `/api/v1/provider/orders/{id}/status`

**Allowed roles:** PROVIDER

**Summary:** Update own provider order fulfillment status

**Description:** Access: PROVIDER. PROVIDER only. providerId is derived from JWT; provider can access only own inventory, offers, orders, analytics, and messages. PROVIDER only. Enforces ownership, valid transitions, paid-order fulfillment checks, timeline entries, and customer notifications.

**Request payload (application/json):**
```json
{
  "$ref": "#/components/schemas/UpdateProviderOrderStatusDto"
}
```

**Response payload:** Not documented

### `POST` `/api/v1/provider/orders/{id}/fulfill`

**Allowed roles:** PROVIDER

**Summary:** Fulfill own provider order with dispatch details

**Description:** Access: PROVIDER. PROVIDER only. providerId is derived from JWT; provider can access only own inventory, offers, orders, analytics, and messages. PROVIDER only. Dedicated Figma fulfill action. Stores dispatch date/time, estimated delivery, carrier, tracking number, moves provider order to SHIPPED, syncs parent order, creates timeline entry, and optionally notifies customer.

**Request payload (application/json):**
```json
{
  "$ref": "#/components/schemas/FulfillProviderOrderDto"
}
```

**Response payload:** Not documented

### `GET` `/api/v1/provider/orders/{id}/timeline`

**Allowed roles:** PROVIDER

**Summary:** Fetch own provider order timeline

**Description:** Access: PROVIDER. PROVIDER only. providerId is derived from JWT; provider can access only own inventory, offers, orders, analytics, and messages. PROVIDER only. Timeline is scoped to the authenticated provider order.

**Request payload:** None

**Response payload:** Not documented

### `GET` `/api/v1/provider/orders/{id}/checklist`

**Allowed roles:** PROVIDER

**Summary:** Fetch own provider order checklist

**Description:** Access: PROVIDER. PROVIDER only. providerId is derived from JWT; provider can access only own inventory, offers, orders, analytics, and messages. PROVIDER only. Checklist is operational and does not change status automatically.

**Request payload:** None

**Response payload:** Not documented

### `PATCH` `/api/v1/provider/orders/{id}/checklist`

**Allowed roles:** PROVIDER

**Summary:** Update own provider order checklist

**Description:** Access: PROVIDER. PROVIDER only. providerId is derived from JWT; provider can access only own inventory, offers, orders, analytics, and messages. PROVIDER only. Checklist updates do not directly change order status.

**Request payload (application/json):**
```json
{
  "$ref": "#/components/schemas/UpdateProviderOrderChecklistDto"
}
```

**Response payload:** Not documented

### `POST` `/api/v1/provider/orders/{id}/message-buyer`

**Allowed roles:** PROVIDER

**Summary:** Message buyer for own provider order

**Description:** Access: PROVIDER. PROVIDER only. providerId is derived from JWT; provider can access only own inventory, offers, orders, analytics, and messages. PROVIDER only. Creates an order message and customer notification; SMS is placeholder only.

**Request payload (application/json):**
```json
{
  "$ref": "#/components/schemas/MessageBuyerDto"
}
```

**Response payload:** Not documented

### `GET` `/api/v1/provider/orders/{id}`

**Allowed roles:** PROVIDER

**Summary:** Fetch own provider order details

**Description:** Access: PROVIDER. PROVIDER only. providerId is derived from JWT; provider can access only own inventory, offers, orders, analytics, and messages. PROVIDER only. Does not expose customer card/payment secrets or admin-only order fields.

**Request payload:** None

**Response payload:** Not documented

### `POST` `/api/v1/provider/orders/{id}/accept`

**Allowed roles:** PROVIDER

**Summary:** Accept own pending provider order

**Description:** Access: PROVIDER. PROVIDER only. providerId is derived from JWT; provider can access only own inventory, offers, orders, analytics, and messages. Allowed transition: PENDING -> ACCEPTED. Creates timeline entry and customer notification.

**Request payload (application/json):**
```json
{
  "$ref": "#/components/schemas/AcceptProviderOrderDto"
}
```

**Response payload:** Not documented

### `POST` `/api/v1/provider/orders/{id}/reject`

**Allowed roles:** PROVIDER

**Summary:** Reject own pending provider order

**Description:** Access: PROVIDER. PROVIDER only. providerId is derived from JWT; provider can access only own inventory, offers, orders, analytics, and messages. Allowed transition: PENDING -> REJECTED. Does not refund automatically; flags order for review/cancellation based on provider split count.

**Request payload (application/json):**
```json
{
  "$ref": "#/components/schemas/RejectProviderOrderDto"
}
```

**Response payload:** Not documented

## 03 Provider - Refund Requests

### `GET` `/api/v1/provider/refund-requests`

**Allowed roles:** PROVIDER

**Summary:** List own provider refund requests

**Description:** Access: PROVIDER. PROVIDER only. providerId is derived from JWT; provider can access only own inventory, offers, orders, analytics, and messages. PROVIDER only. Returns refund requests for provider orders assigned to the authenticated provider. Search supports order number, customer name, and customer email.

**Request payload:** None

**Response payload — 200 (application/json):**
```json
{
  "example": {
    "success": true,
    "data": [
      {
        "id": "refund_request_id",
        "providerOrderId": "provider_order_id",
        "orderNumber": "88417",
        "customer": {
          "name": "Jane Cooper",
          "email": "jane.cooper@example.com",
          "avatarUrl": "https://cdn.yourdomain.com/customer-avatar.jpg"
        },
        "requestedAmount": 45,
        "currency": "PKR",
        "status": "REQUESTED",
        "customerReason": "Item was damaged on arrival",
        "createdAt": "2026-10-23T18:10:00.000Z"
      }
    ],
    "message": "Provider refund requests fetched successfully."
  }
}
```

### `GET` `/api/v1/provider/refund-requests/summary`

**Allowed roles:** PROVIDER

**Summary:** Fetch own refund request summary

**Description:** Access: PROVIDER. PROVIDER only. providerId is derived from JWT; provider can access only own inventory, offers, orders, analytics, and messages. Route intentionally declared before :id. PROVIDER only.

**Request payload:** None

**Response payload:** Not documented

### `GET` `/api/v1/provider/refund-requests/reject-reasons`

**Allowed roles:** PROVIDER

**Summary:** List refund rejection reasons

**Description:** Access: PROVIDER. PROVIDER only. providerId is derived from JWT; provider can access only own inventory, offers, orders, analytics, and messages. Route intentionally declared before :id. PROVIDER only.

**Request payload:** None

**Response payload:** Not documented

### `GET` `/api/v1/provider/refund-requests/{id}`

**Allowed roles:** PROVIDER

**Summary:** Fetch own refund request details

**Description:** Access: PROVIDER. PROVIDER only. providerId is derived from JWT; provider can access only own inventory, offers, orders, analytics, and messages. PROVIDER only. Refund request must belong to the authenticated provider order and never exposes Stripe secrets or raw card data.

**Request payload:** None

**Response payload:** Not documented

### `POST` `/api/v1/provider/refund-requests/{id}/approve`

**Allowed roles:** PROVIDER

**Summary:** Approve own requested refund

**Description:** Access: PROVIDER. PROVIDER only. providerId is derived from JWT; provider can access only own inventory, offers, orders, analytics, and messages. PROVIDER only. Validates ownership, REQUESTED status, requested amount, refundable amount, creates refund transaction marker, timeline entry, and customer notification.

**Request payload (application/json):**
```json
{
  "comment": "Refund approved after reviewing evidence.",
  "refundAmount": 45,
  "notifyCustomer": true
}
```

**Response payload:** Not documented

### `POST` `/api/v1/provider/refund-requests/{id}/reject`

**Allowed roles:** PROVIDER

**Summary:** Reject own requested refund

**Description:** Access: PROVIDER. PROVIDER only. providerId is derived from JWT; provider can access only own inventory, offers, orders, analytics, and messages. PROVIDER only. Validates ownership and REQUESTED status. Creates timeline entry and optional customer notification. No Stripe refund is created.

**Request payload (application/json):**
```json
{
  "reason": "REFUND_WINDOW_EXPIRED",
  "comment": "The request was submitted after the allowed refund period.",
  "notifyCustomer": true
}
```

**Response payload:** Not documented

## 04 Gifts - Categories

### `GET` `/api/v1/gift-categories/lookup`

**Allowed roles:** PUBLIC

**Summary:** Lookup active gift categories

**Description:** Access: PUBLIC. PUBLIC. Active gift category lookup. Public lookup under Gift Categories. Returns active category identifiers and media fields for lightweight selectors.

**Request payload:** None

**Response payload — 200:**
```json
{
  "description": "Gift category lookup fetched successfully"
}
```

### `POST` `/api/v1/gift-categories`

**Allowed roles:** SUPER_ADMIN or ADMIN with giftCategories.create

**Summary:** Create gift category

**Description:** Access: SUPER_ADMIN or ADMIN with giftCategories.create. SUPER_ADMIN or ADMIN with giftCategories.create permission. RBAC permission: giftCategories.create. Slug is auto-generated and unique. backgroundColor defaults to #F3E8FF; color remains a backward-compatible alias.

**Request payload (application/json):**
```json
{
  "name": "Perfumes",
  "description": "Premium fragrance gifts.",
  "iconKey": "perfume",
  "backgroundColor": "#E9D5FF",
  "imageUrl": "https://<YOUR_PUBLIC_BUCKET_OR_CDN_URL>/gift-category-images/perfumes.png",
  "sortOrder": 1,
  "isActive": true
}
```

**Response payload — 201:**
```json
{
  "description": "Gift category created successfully"
}
```

### `GET` `/api/v1/gift-categories`

**Allowed roles:** SUPER_ADMIN or ADMIN with giftCategories.read

**Summary:** List gift categories

**Description:** Access: SUPER_ADMIN or ADMIN with giftCategories.read. SUPER_ADMIN or ADMIN with giftCategories.read permission. RBAC permission: giftCategories.read. Returns soft-delete-filtered categories with gift counts and category media fields.

**Request payload:** None

**Response payload — 200:**
```json
{
  "description": "Gift categories fetched successfully"
}
```

### `GET` `/api/v1/gift-categories/stats`

**Allowed roles:** SUPER_ADMIN or ADMIN with giftCategories.read

**Summary:** Fetch gift category stats

**Description:** Access: SUPER_ADMIN or ADMIN with giftCategories.read. SUPER_ADMIN or ADMIN with giftCategories.read permission. RBAC permission: giftCategories.read. Returns admin category inventory counters.

**Request payload:** None

**Response payload:** Not documented

### `GET` `/api/v1/gift-categories/{id}`

**Allowed roles:** SUPER_ADMIN or ADMIN with giftCategories.read

**Summary:** Fetch gift category details

**Description:** Access: SUPER_ADMIN or ADMIN with giftCategories.read. SUPER_ADMIN or ADMIN with giftCategories.read permission. RBAC permission: giftCategories.read. Includes backgroundColor and imageUrl for customer app design support.

**Request payload:** None

**Response payload — 200:**
```json
{
  "description": "Gift category details fetched successfully"
}
```

### `PATCH` `/api/v1/gift-categories/{id}`

**Allowed roles:** SUPER_ADMIN or ADMIN with giftCategories.update

**Summary:** Update gift category

**Description:** Access: SUPER_ADMIN or ADMIN with giftCategories.update. SUPER_ADMIN or ADMIN with giftCategories.update permission. RBAC permission: giftCategories.update. Slug is regenerated when name changes. Soft-deleted categories are not updated.

**Request payload (application/json):**
```json
{
  "backgroundColor": "#F3E8FF",
  "imageUrl": "https://<YOUR_PUBLIC_BUCKET_OR_CDN_URL>/gift-category-images/perfumes.png",
  "isActive": true
}
```

**Response payload — 200:**
```json
{
  "description": "Gift category updated successfully"
}
```

### `DELETE` `/api/v1/gift-categories/{id}`

**Allowed roles:** SUPER_ADMIN or ADMIN with giftCategories.delete

**Summary:** Soft-delete gift category

**Description:** Access: SUPER_ADMIN or ADMIN with giftCategories.delete. SUPER_ADMIN or ADMIN with giftCategories.delete permission. RBAC permission: giftCategories.delete. Categories with attached gifts cannot be deleted; delete writes an audit log.

**Request payload:** None

**Response payload:** Not documented

## 04 Gifts - Management

### `POST` `/api/v1/gifts`

**Allowed roles:** SUPER_ADMIN or ADMIN with gifts.create

**Summary:** Create admin gift with optional nested variants

**Description:** Access: SUPER_ADMIN or ADMIN with gifts.create. SUPER_ADMIN or ADMIN with gifts.create permission. SUPER_ADMIN/ADMIN with gifts.create. Nested variants are created in the same transaction and stored in GiftVariant.

**Request payload (application/json):**
```json
{
  "name": "Luxury Perfume",
  "description": "Long-lasting premium fragrance.",
  "shortDescription": "Premium fragrance gift.",
  "categoryId": "gift_category_id",
  "providerId": "provider_id",
  "price": 99.99,
  "currency": "PKR",
  "stockQuantity": 50,
  "sku": "PERFUME-001",
  "imageUrls": [
    "https://cdn.yourdomain.com/gift-images/perfume.png"
  ],
  "isPublished": true,
  "isFeatured": false,
  "tags": [
    "perfume",
    "luxury"
  ],
  "moderationStatus": "APPROVED",
  "variants": [
    {
      "name": "30ml",
      "price": 89.99,
      "originalPrice": 119.99,
      "stockQuantity": 10,
      "sku": "PERFUME-30ML",
      "isPopular": false,
      "isDefault": false,
      "sortOrder": 1,
      "isActive": true
    },
    {
      "name": "50ml",
      "price": 129.99,
      "originalPrice": 159.99,
      "stockQuantity": 20,
      "sku": "PERFUME-50ML",
      "isPopular": true,
      "isDefault": true,
      "sortOrder": 2,
      "isActive": true
    }
  ]
}
```

**Response payload — 201 (application/json):**
```json
{
  "example": {
    "success": true,
    "data": {
      "id": "gift_id",
      "name": "Luxury Perfume",
      "price": 99.99,
      "currency": "PKR",
      "stockQuantity": 50,
      "sku": "PERFUME-001",
      "variants": [
        {
          "id": "variant_id",
          "name": "50ml",
          "price": 129.99,
          "originalPrice": 159.99,
          "stockQuantity": 20,
          "sku": "PERFUME-50ML",
          "isPopular": true,
          "isDefault": true,
          "sortOrder": 2,
          "isActive": true
        }
      ]
    },
    "message": "Gift created successfully"
  }
}
```

### `GET` `/api/v1/gifts`

**Allowed roles:** SUPER_ADMIN or ADMIN with gifts.read

**Summary:** List admin gifts

**Description:** Access: SUPER_ADMIN or ADMIN with gifts.read. SUPER_ADMIN or ADMIN with gifts.read permission. SUPER_ADMIN/ADMIN with gifts.read. Supports category/provider/status/moderation filters.

**Request payload:** None

**Response payload:** Not documented

### `GET` `/api/v1/gifts/stats`

**Allowed roles:** SUPER_ADMIN or ADMIN with gifts.read

**Summary:** Fetch gift inventory stats

**Description:** Access: SUPER_ADMIN or ADMIN with gifts.read. SUPER_ADMIN or ADMIN with gifts.read permission.

**Request payload:** None

**Response payload:** Not documented

### `GET` `/api/v1/gifts/export`

**Allowed roles:** SUPER_ADMIN or ADMIN with gifts.export

**Summary:** Export gift inventory

**Description:** Access: SUPER_ADMIN or ADMIN with gifts.export. SUPER_ADMIN or ADMIN with gifts.export permission.

**Request payload:** None

**Response payload:** Not documented

### `GET` `/api/v1/gifts/{id}`

**Allowed roles:** SUPER_ADMIN or ADMIN with gifts.read

**Summary:** Fetch admin gift details with variants

**Description:** Access: SUPER_ADMIN or ADMIN with gifts.read. SUPER_ADMIN or ADMIN with gifts.read permission.

**Request payload:** None

**Response payload:** Not documented

### `PATCH` `/api/v1/gifts/{id}`

**Allowed roles:** SUPER_ADMIN or ADMIN with gifts.update

**Summary:** Update admin gift and upsert nested variants

**Description:** Access: SUPER_ADMIN or ADMIN with gifts.update. SUPER_ADMIN or ADMIN with gifts.update permission. If replaceVariants=true, omitted variants are soft-deleted. Only one default variant is allowed.

**Request payload (application/json):**
```json
{
  "name": "Luxury Perfume Updated",
  "replaceVariants": false,
  "variants": [
    {
      "id": "variant_id",
      "name": "50ml",
      "price": 129.99,
      "originalPrice": 159.99,
      "stockQuantity": 20,
      "sku": "PERFUME-50ML",
      "isPopular": true,
      "isDefault": true,
      "sortOrder": 2,
      "isActive": true
    },
    {
      "name": "150ml",
      "price": 249.99,
      "originalPrice": 299.99,
      "stockQuantity": 5,
      "sku": "PERFUME-150ML",
      "isPopular": false,
      "isDefault": false,
      "sortOrder": 4,
      "isActive": true
    }
  ]
}
```

**Response payload — 200 (application/json):**
```json
{
  "example": {
    "success": true,
    "data": {
      "id": "gift_id",
      "name": "Luxury Perfume Updated",
      "variants": [
        {
          "id": "variant_id",
          "name": "50ml",
          "price": 129.99,
          "originalPrice": 159.99,
          "stockQuantity": 20,
          "sku": "PERFUME-50ML",
          "isDefault": true,
          "isActive": true
        }
      ]
    },
    "message": "Gift updated successfully"
  }
}
```

### `DELETE` `/api/v1/gifts/{id}`

**Allowed roles:** SUPER_ADMIN or ADMIN with gifts.delete

**Summary:** Soft-delete gift

**Description:** Access: SUPER_ADMIN or ADMIN with gifts.delete. SUPER_ADMIN or ADMIN with gifts.delete permission.

**Request payload:** None

**Response payload:** Not documented

### `PATCH` `/api/v1/gifts/{id}/status`

**Allowed roles:** SUPER_ADMIN or ADMIN with gifts.status.update

**Summary:** Update gift status

**Description:** Access: SUPER_ADMIN or ADMIN with gifts.status.update. SUPER_ADMIN or ADMIN with gifts.status.update permission.

**Request payload (application/json):**
```json
{
  "$ref": "#/components/schemas/UpdateGiftStatusDto"
}
```

**Response payload:** Not documented

## 04 Gifts - Moderation

### `GET` `/api/v1/gift-moderation`

**Allowed roles:** SUPER_ADMIN or ADMIN with giftModeration.read

**Summary:** GET /api/v1/gift-moderation

**Description:** Access: SUPER_ADMIN or ADMIN with giftModeration.read. SUPER_ADMIN or ADMIN with giftModeration.read permission.

**Request payload:** None

**Response payload:** Not documented

### `PATCH` `/api/v1/gift-moderation/{id}/approve`

**Allowed roles:** SUPER_ADMIN or ADMIN with giftModeration.approve

**Summary:** PATCH /api/v1/gift-moderation/{id}/approve

**Description:** Access: SUPER_ADMIN or ADMIN with giftModeration.approve. SUPER_ADMIN or ADMIN with giftModeration.approve permission.

**Request payload (application/json):**
```json
{
  "$ref": "#/components/schemas/ApproveGiftDto"
}
```

**Response payload:** Not documented

### `PATCH` `/api/v1/gift-moderation/{id}/reject`

**Allowed roles:** SUPER_ADMIN or ADMIN with giftModeration.reject

**Summary:** PATCH /api/v1/gift-moderation/{id}/reject

**Description:** Access: SUPER_ADMIN or ADMIN with giftModeration.reject. SUPER_ADMIN or ADMIN with giftModeration.reject permission.

**Request payload (application/json):**
```json
{
  "$ref": "#/components/schemas/RejectGiftDto"
}
```

**Response payload:** Not documented

### `PATCH` `/api/v1/gift-moderation/{id}/flag`

**Allowed roles:** SUPER_ADMIN or ADMIN with giftModeration.flag

**Summary:** PATCH /api/v1/gift-moderation/{id}/flag

**Description:** Access: SUPER_ADMIN or ADMIN with giftModeration.flag. SUPER_ADMIN or ADMIN with giftModeration.flag permission.

**Request payload (application/json):**
```json
{
  "$ref": "#/components/schemas/FlagGiftDto"
}
```

**Response payload:** Not documented

## 05 Customer - Marketplace

### `GET` `/api/v1/customer/home`

**Allowed roles:** REGISTERED_USER

**Summary:** Fetch customer app home

**Description:** Access: REGISTERED_USER. REGISTERED_USER only. Endpoint is scoped to the authenticated customer account. REGISTERED_USER only. Returns safe marketplace categories, discounted gifts, default address, and upcoming reminder.

**Request payload:** None

**Response payload — 200:**
```json
{
  "description": "Customer home fetched successfully"
}
```

### `GET` `/api/v1/customer/categories`

**Allowed roles:** REGISTERED_USER

**Summary:** List customer marketplace categories

**Description:** Access: REGISTERED_USER. REGISTERED_USER only. Endpoint is scoped to the authenticated customer account. REGISTERED_USER only. Returns active categories that have available approved gifts.

**Request payload:** None

**Response payload — 200:**
```json
{
  "description": "Customer categories fetched successfully"
}
```

### `GET` `/api/v1/customer/gifts/discounted`

**Allowed roles:** REGISTERED_USER

**Summary:** List discounted customer gifts

**Description:** Access: REGISTERED_USER. REGISTERED_USER only. Endpoint is scoped to the authenticated customer account. REGISTERED_USER only. Reuses marketplace gift filters with offerOnly=true.

**Request payload:** None

**Response payload — 200:**
```json
{
  "description": "Discounted gifts fetched successfully"
}
```

### `GET` `/api/v1/customer/gifts/filter-options`

**Allowed roles:** REGISTERED_USER

**Summary:** Fetch marketplace gift filter options

**Description:** Access: REGISTERED_USER. REGISTERED_USER only. Endpoint is scoped to the authenticated customer account. REGISTERED_USER only. Brands are derived from approved active provider business names.

**Request payload:** None

**Response payload — 200:**
```json
{
  "description": "Gift filter options fetched successfully"
}
```

### `GET` `/api/v1/customer/gifts`

**Allowed roles:** REGISTERED_USER

**Summary:** List customer marketplace gifts

**Description:** Access: REGISTERED_USER. REGISTERED_USER only. Endpoint is scoped to the authenticated customer account. REGISTERED_USER only. Only approved, published, active, in-stock gifts from approved active providers are returned. Active offers are calculated by the backend.

**Request payload:** None

**Response payload — 200 (application/json):**
```json
{
  "example": {
    "success": true,
    "data": [
      {
        "id": "gift_id",
        "name": "Luxury Perfume",
        "price": 99.99,
        "currency": "PKR",
        "imageUrl": "https://cdn.yourdomain.com/gift-images/perfume.png",
        "rating": 4.8,
        "isWishlisted": false,
        "shortDescription": "Premium fragrance gift.",
        "reviewCount": 0,
        "stockQuantity": 50,
        "category": {
          "id": "gift_category_id",
          "name": "Perfumes",
          "slug": "perfumes"
        },
        "provider": {
          "id": "provider_id",
          "businessName": "Dcodax Gifts"
        },
        "deliveryOptions": [
          "SAME_DAY",
          "NEXT_DAY",
          "SCHEDULED"
        ],
        "activeOffer": null
      }
    ],
    "meta": {
      "page": 1,
      "limit": 20,
      "total": 1,
      "totalPages": 1
    },
    "message": "Customer gifts fetched successfully"
  }
}
```

### `GET` `/api/v1/customer/gifts/{id}`

**Allowed roles:** REGISTERED_USER

**Summary:** Fetch customer-safe gift details

**Description:** Access: REGISTERED_USER. REGISTERED_USER only. Endpoint is scoped to the authenticated customer account. REGISTERED_USER only. Hidden/admin-only gift records are never returned.

**Request payload:** None

**Response payload — 200 (application/json):**
```json
{
  "example": {
    "success": true,
    "data": {
      "id": "gift_id",
      "name": "Luxury Perfume",
      "description": "Long-lasting premium fragrance.",
      "shortDescription": "Premium fragrance gift.",
      "price": 99.99,
      "originalPrice": 99.99,
      "currency": "PKR",
      "imageUrls": [
        "https://cdn.yourdomain.com/gift-images/perfume.png"
      ],
      "rating": 4.8,
      "reviewCount": 0,
      "stockQuantity": 50,
      "sku": "PERFUME-001",
      "isWishlisted": false,
      "badges": [
        "AUTHENTIC"
      ],
      "category": {
        "id": "gift_category_id",
        "name": "Perfumes",
        "slug": "perfumes"
      },
      "provider": {
        "id": "provider_id",
        "businessName": "Dcodax Gifts",
        "rating": 4.8,
        "reviewCount": 0,
        "fulfillmentMethods": [
          "DELIVERY"
        ]
      },
      "variants": [
        {
          "id": "variant_id",
          "name": "50ml",
          "price": 129.99,
          "originalPrice": 159.99,
          "stockQuantity": 20,
          "sku": "PERFUME-50ML",
          "isPopular": true,
          "isDefault": true
        }
      ],
      "deliveryOptions": [
        "SAME_DAY",
        "NEXT_DAY",
        "SCHEDULED"
      ],
      "activeOffer": null
    },
    "message": "Gift details fetched successfully"
  }
}
```

## 05 Customer - Wishlist

### `GET` `/api/v1/customer/wishlist`

**Allowed roles:** REGISTERED_USER

**Summary:** List wishlist gifts

**Description:** Access: REGISTERED_USER. REGISTERED_USER only. Endpoint is scoped to the authenticated customer account. REGISTERED_USER only. Returns customer-safe available gifts.

**Request payload:** None

**Response payload:** Not documented

### `POST` `/api/v1/customer/wishlist/{giftId}`

**Allowed roles:** REGISTERED_USER

**Summary:** Add gift to wishlist

**Description:** Access: REGISTERED_USER. REGISTERED_USER only. Endpoint is scoped to the authenticated customer account. REGISTERED_USER only. Gift must be active, approved, published, and in stock. Duplicate wishlist entries are ignored.

**Request payload:** None

**Response payload:** Not documented

### `DELETE` `/api/v1/customer/wishlist/{giftId}`

**Allowed roles:** REGISTERED_USER

**Summary:** Remove gift from wishlist

**Description:** Access: REGISTERED_USER. REGISTERED_USER only. Endpoint is scoped to the authenticated customer account. REGISTERED_USER only. Removes only the current customer wishlist row.

**Request payload:** None

**Response payload:** Not documented

## 05 Customer - Addresses

### `GET` `/api/v1/customer/addresses`

**Allowed roles:** REGISTERED_USER

**Summary:** List customer addresses

**Description:** Access: REGISTERED_USER. REGISTERED_USER only. Endpoint is scoped to the authenticated customer account. REGISTERED_USER only. Customers can only view their own non-deleted addresses.

**Request payload:** None

**Response payload:** Not documented

### `POST` `/api/v1/customer/addresses`

**Allowed roles:** REGISTERED_USER

**Summary:** Create customer address

**Description:** Access: REGISTERED_USER. REGISTERED_USER only. Endpoint is scoped to the authenticated customer account. REGISTERED_USER only. Maintains one default address per customer.

**Request payload (application/json):**
```json
{
  "$ref": "#/components/schemas/CreateCustomerAddressDto"
}
```

**Response payload:** Not documented

### `GET` `/api/v1/customer/addresses/{id}`

**Allowed roles:** REGISTERED_USER

**Summary:** Fetch customer address

**Description:** Access: REGISTERED_USER. REGISTERED_USER only. Endpoint is scoped to the authenticated customer account. REGISTERED_USER only. Address must belong to the current customer.

**Request payload:** None

**Response payload:** Not documented

### `PATCH` `/api/v1/customer/addresses/{id}`

**Allowed roles:** REGISTERED_USER

**Summary:** Update customer address

**Description:** Access: REGISTERED_USER. REGISTERED_USER only. Endpoint is scoped to the authenticated customer account. REGISTERED_USER only. Maintains one default address per customer.

**Request payload (application/json):**
```json
{
  "$ref": "#/components/schemas/UpdateCustomerAddressDto"
}
```

**Response payload:** Not documented

### `DELETE` `/api/v1/customer/addresses/{id}`

**Allowed roles:** REGISTERED_USER

**Summary:** Soft-delete customer address

**Description:** Access: REGISTERED_USER. REGISTERED_USER only. Endpoint is scoped to the authenticated customer account. REGISTERED_USER only. Address is soft deleted and removed from default status.

**Request payload:** None

**Response payload:** Not documented

### `PATCH` `/api/v1/customer/addresses/{id}/default`

**Allowed roles:** REGISTERED_USER

**Summary:** Set default customer address

**Description:** Access: REGISTERED_USER. REGISTERED_USER only. Endpoint is scoped to the authenticated customer account. REGISTERED_USER only. Clears default flag from all other customer addresses.

**Request payload:** None

**Response payload:** Not documented

## 05 Customer - Contacts

### `GET` `/api/v1/customer/contacts`

**Allowed roles:** REGISTERED_USER

**Summary:** List customer contacts

**Description:** Access: REGISTERED_USER. REGISTERED_USER only. Endpoint is scoped to the authenticated customer account. REGISTERED_USER only. Lists only contacts owned by the authenticated customer.

**Request payload:** None

**Response payload — 200:**
```json
{
  "description": "Contacts fetched successfully"
}
```

### `POST` `/api/v1/customer/contacts`

**Allowed roles:** REGISTERED_USER

**Summary:** Create customer contact

**Description:** Access: REGISTERED_USER. REGISTERED_USER only. Endpoint is scoped to the authenticated customer account. REGISTERED_USER only. Creates a personal gift contact owned by the authenticated customer. Requires at least one contact method: phone, email, or address.

**Request payload (application/json):**
```json
{
  "name": "Mary Wilson",
  "relationship": "Mother",
  "phone": "+1234567890",
  "email": "mary@example.com",
  "address": "387 Merdina",
  "likes": "Glasses, makeup, dresses",
  "avatarUrl": "https://cdn.yourdomain.com/customer-contact-avatars/mary.png",
  "birthday": "1990-05-12",
  "notes": "Prefers elegant gifts."
}
```

**Response payload — 201:**
```json
{
  "description": "Contact created successfully"
}
```

### `GET` `/api/v1/customer/contacts/{id}`

**Allowed roles:** REGISTERED_USER

**Summary:** Fetch customer contact

**Description:** Access: REGISTERED_USER. REGISTERED_USER only. Endpoint is scoped to the authenticated customer account. REGISTERED_USER only. Contact must belong to the authenticated customer.

**Request payload:** None

**Response payload — 200:**
```json
{
  "description": "Contact fetched successfully"
}
```

### `PATCH` `/api/v1/customer/contacts/{id}`

**Allowed roles:** REGISTERED_USER

**Summary:** Update customer contact

**Description:** Access: REGISTERED_USER. REGISTERED_USER only. Endpoint is scoped to the authenticated customer account. REGISTERED_USER only. Updates only contacts owned by the authenticated customer.

**Request payload (application/json):**
```json
{
  "name": "Mary Wilson",
  "relationship": "Mother",
  "phone": "+1234567890",
  "email": "mary@example.com",
  "address": "387 Merdina",
  "likes": "Glasses, makeup, dresses",
  "avatarUrl": "https://cdn.yourdomain.com/customer-contact-avatars/mary.png",
  "birthday": "1990-05-12",
  "notes": "Prefers elegant gifts."
}
```

**Response payload — 200:**
```json
{
  "description": "Contact updated successfully"
}
```

### `DELETE` `/api/v1/customer/contacts/{id}`

**Allowed roles:** REGISTERED_USER

**Summary:** Soft-delete customer contact

**Description:** Access: REGISTERED_USER. REGISTERED_USER only. Endpoint is scoped to the authenticated customer account. REGISTERED_USER only. Soft deletes only contacts owned by the authenticated customer.

**Request payload:** None

**Response payload — 200:**
```json
{
  "description": "Contact deleted successfully."
}
```

## 05 Customer - Events

### `GET` `/api/v1/customer/events`

**Allowed roles:** REGISTERED_USER

**Summary:** List customer events

**Description:** Access: REGISTERED_USER. REGISTERED_USER only. Endpoint is scoped to the authenticated customer account. REGISTERED_USER only. Lists only events owned by the authenticated customer.

**Request payload:** None

**Response payload — 200:**
```json
{
  "description": "Events fetched successfully"
}
```

### `POST` `/api/v1/customer/events`

**Allowed roles:** REGISTERED_USER

**Summary:** Create customer event

**Description:** Access: REGISTERED_USER. REGISTERED_USER only. Endpoint is scoped to the authenticated customer account. REGISTERED_USER only. recipientId must belong to the authenticated customer.

**Request payload (application/json):**
```json
{
  "$ref": "#/components/schemas/CreateCustomerEventDto"
}
```

**Response payload — 201:**
```json
{
  "description": "Event created successfully"
}
```

### `GET` `/api/v1/customer/events/calendar`

**Allowed roles:** REGISTERED_USER

**Summary:** Fetch monthly calendar events

**Description:** Access: REGISTERED_USER. REGISTERED_USER only. Endpoint is scoped to the authenticated customer account. REGISTERED_USER only. Returns marked dates and own events.

**Request payload:** None

**Response payload:** Not documented

### `GET` `/api/v1/customer/events/upcoming`

**Allowed roles:** REGISTERED_USER

**Summary:** Fetch upcoming customer events

**Description:** Access: REGISTERED_USER. REGISTERED_USER only. Endpoint is scoped to the authenticated customer account. REGISTERED_USER only. Defaults to 10 events within 30 days.

**Request payload:** None

**Response payload:** Not documented

### `GET` `/api/v1/customer/events/{id}/reminder-settings`

**Allowed roles:** REGISTERED_USER

**Summary:** Fetch event reminder settings

**Description:** Access: REGISTERED_USER. REGISTERED_USER only. Endpoint is scoped to the authenticated customer account. REGISTERED_USER only. Event must belong to the authenticated customer.

**Request payload:** None

**Response payload:** Not documented

### `PATCH` `/api/v1/customer/events/{id}/reminder-settings`

**Allowed roles:** REGISTERED_USER

**Summary:** Update event reminder settings

**Description:** Access: REGISTERED_USER. REGISTERED_USER only. Endpoint is scoped to the authenticated customer account. REGISTERED_USER only. Event must belong to the authenticated customer.

**Request payload (application/json):**
```json
{
  "$ref": "#/components/schemas/UpdateReminderSettingsDto"
}
```

**Response payload:** Not documented

### `GET` `/api/v1/customer/events/{id}`

**Allowed roles:** REGISTERED_USER

**Summary:** Fetch customer event details

**Description:** Access: REGISTERED_USER. REGISTERED_USER only. Endpoint is scoped to the authenticated customer account. REGISTERED_USER only. Event must belong to the authenticated customer.

**Request payload:** None

**Response payload:** Not documented

### `PATCH` `/api/v1/customer/events/{id}`

**Allowed roles:** REGISTERED_USER

**Summary:** Update customer event

**Description:** Access: REGISTERED_USER. REGISTERED_USER only. Endpoint is scoped to the authenticated customer account. REGISTERED_USER only. Event and recipient contact must belong to the authenticated customer.

**Request payload (application/json):**
```json
{
  "$ref": "#/components/schemas/UpdateCustomerEventDto"
}
```

**Response payload:** Not documented

### `DELETE` `/api/v1/customer/events/{id}`

**Allowed roles:** REGISTERED_USER

**Summary:** Soft-delete customer event

**Description:** Access: REGISTERED_USER. REGISTERED_USER only. Endpoint is scoped to the authenticated customer account. REGISTERED_USER only. Soft deletes only own event and cancels pending reminder jobs.

**Request payload:** None

**Response payload:** Not documented

## 05 Customer - Cart

### `GET` `/api/v1/customer/cart`

**Allowed roles:** REGISTERED_USER

**Summary:** Fetch active cart

**Description:** Access: REGISTERED_USER. REGISTERED_USER only. Endpoint is scoped to the authenticated customer account. REGISTERED_USER only. Totals are backend calculated from price snapshots.

**Request payload:** None

**Response payload — 200 (application/json):**
```json
{
  "example": {
    "success": true,
    "data": {
      "id": "cart_id",
      "status": "ACTIVE",
      "items": [
        {
          "id": "cart_item_id",
          "giftId": "gift_id",
          "variantId": "variant_id",
          "name": "Luxury Perfume",
          "variantName": "50ml",
          "quantity": 1,
          "unitPrice": 129.99,
          "discountAmount": 20,
          "finalUnitPrice": 109.99,
          "lineTotal": 109.99,
          "imageUrl": "https://cdn.yourdomain.com/gift-images/perfume.png",
          "deliveryOption": "SAME_DAY",
          "recipient": {
            "contactId": "contact_id",
            "name": "Sarah Khan",
            "phone": "+923001234567",
            "addressId": "address_id"
          },
          "giftMessage": "Hope you love this special surprise!",
          "messageMediaUrls": [
            "https://cdn.yourdomain.com/gift-message-media/photo.png"
          ],
          "scheduledDeliveryAt": "2026-12-24T10:00:00.000Z"
        }
      ],
      "summary": {
        "subtotal": 129.99,
        "discountTotal": 20,
        "deliveryFee": 0,
        "tax": 0,
        "total": 109.99,
        "currency": "PKR"
      }
    },
    "message": "Cart fetched successfully"
  }
}
```

### `DELETE` `/api/v1/customer/cart`

**Allowed roles:** REGISTERED_USER

**Summary:** Clear active cart

**Description:** Access: REGISTERED_USER. REGISTERED_USER only. Endpoint is scoped to the authenticated customer account. REGISTERED_USER only. Removes all items from active cart.

**Request payload:** None

**Response payload:** Not documented

### `POST` `/api/v1/customer/cart/items`

**Allowed roles:** REGISTERED_USER

**Summary:** Add item to cart

**Description:** Access: REGISTERED_USER. REGISTERED_USER only. Endpoint is scoped to the authenticated customer account. REGISTERED_USER only. Backend calculates unit price, active offer discount, final price, subtotal, delivery fee placeholder, and total.

**Request payload (application/json):**
```json
{
  "giftId": "cmf0giftroses001",
  "variantId": "cmf0variant50ml001",
  "quantity": 1,
  "deliveryOption": "SAME_DAY",
  "recipientContactId": "cmf0contactmary001",
  "recipientName": "Sarah Khan",
  "recipientPhone": "+923001234567",
  "recipientAddressId": "cmf0addresshome001",
  "eventId": "cmf0eventbirthday001",
  "giftMessage": "Hope you love this special surprise!",
  "messageMediaUrls": [
    "https://cdn.yourdomain.com/gift-message-media/photo.png"
  ],
  "scheduledDeliveryAt": "2026-12-24T10:00:00.000Z"
}
```

**Response payload:** Not documented

### `PATCH` `/api/v1/customer/cart/items/{id}`

**Allowed roles:** REGISTERED_USER

**Summary:** Update cart item

**Description:** Access: REGISTERED_USER. REGISTERED_USER only. Endpoint is scoped to the authenticated customer account. REGISTERED_USER only. Validates ownership through the active customer cart.

**Request payload (application/json):**
```json
{
  "variantId": "cmf0variant100ml001",
  "quantity": 2,
  "deliveryOption": "SCHEDULED",
  "recipientContactId": "cmf0contactmary001",
  "recipientName": "Sarah Khan",
  "recipientPhone": "+923001234567",
  "recipientAddressId": "cmf0addresshome001",
  "eventId": "cmf0eventbirthday001",
  "giftMessage": "Updated gift note.",
  "messageMediaUrls": [
    "https://cdn.yourdomain.com/gift-message-media/video.mp4"
  ],
  "scheduledDeliveryAt": "2026-12-25T10:00:00.000Z"
}
```

**Response payload:** Not documented

### `DELETE` `/api/v1/customer/cart/items/{id}`

**Allowed roles:** REGISTERED_USER

**Summary:** Delete cart item

**Description:** Access: REGISTERED_USER. REGISTERED_USER only. Endpoint is scoped to the authenticated customer account. REGISTERED_USER only. Deletes only items in the current customer active cart.

**Request payload:** None

**Response payload:** Not documented

## 05 Customer - Orders

### `POST` `/api/v1/customer/orders`

**Allowed roles:** REGISTERED_USER

**Summary:** Create order from active cart

**Description:** Access: REGISTERED_USER. REGISTERED_USER only. Endpoint is scoped to the authenticated customer account. REGISTERED_USER only. Prices are backend-calculated from cart/payment snapshots. STRIPE_CARD requires a successful owned paymentId; COD stays pending; PLACEHOLDER is for development only. Multiple providers are split into provider sub-orders.

**Request payload (application/json):**
```json
{
  "cartId": "cart_id",
  "paymentId": "payment_id",
  "deliveryAddressId": "address_id",
  "paymentMethod": "STRIPE_CARD"
}
```

**Response payload:** Not documented

### `GET` `/api/v1/customer/orders`

**Allowed roles:** REGISTERED_USER

**Summary:** List customer orders

**Description:** Access: REGISTERED_USER. REGISTERED_USER only. Endpoint is scoped to the authenticated customer account. REGISTERED_USER only. Returns orders owned by the current customer.

**Request payload:** None

**Response payload:** Not documented

### `GET` `/api/v1/customer/orders/{id}`

**Allowed roles:** REGISTERED_USER

**Summary:** Fetch customer order

**Description:** Access: REGISTERED_USER. REGISTERED_USER only. Endpoint is scoped to the authenticated customer account. REGISTERED_USER only. Order must belong to the current customer.

**Request payload:** None

**Response payload — 200 (application/json):**
```json
{
  "example": {
    "success": true,
    "data": {
      "id": "order_id",
      "orderNumber": "ORD-1760000000000",
      "status": "CONFIRMED",
      "paymentStatus": "SUCCEEDED",
      "paymentMethod": "STRIPE_CARD",
      "recipient": {
        "name": "Sarah Khan",
        "email": null,
        "phone": "+923001234567",
        "avatarUrl": null
      },
      "deliveryDate": "2026-12-24T10:00:00.000Z",
      "occasion": null,
      "giftMessage": "Hope you love this special surprise!",
      "items": [
        {
          "giftId": "gift_id",
          "name": "Luxury Perfume",
          "variantName": "50ml",
          "quantity": 1,
          "imageUrl": "https://cdn.yourdomain.com/gift-images/perfume.png",
          "total": 109.99
        }
      ],
      "summary": {
        "subtotal": 129.99,
        "discountTotal": 20,
        "deliveryFee": 0,
        "tax": 0,
        "total": 109.99,
        "currency": "PKR"
      }
    },
    "message": "Order fetched successfully."
  }
}
```

## 05 Customer - Recurring Payments

### `GET` `/api/v1/customer/recurring-payments`

**Allowed roles:** REGISTERED_USER

**Summary:** List own recurring payments

**Description:** Access: REGISTERED_USER. REGISTERED_USER only. Endpoint is scoped to the authenticated customer account. REGISTERED_USER only. Returns recurring money/gift payment subscriptions owned by the logged-in customer.

**Request payload:** None

**Response payload — 200 (application/json):**
```json
{
  "example": {
    "success": true,
    "data": [
      {
        "id": "recurring_payment_id",
        "title": "Sarah's Birthday",
        "recipient": {
          "id": "contact_id",
          "name": "Sarah Johnson",
          "email": "sarah.j@example.com",
          "avatarUrl": "https://cdn.yourdomain.com/customer-contact-avatars/sarah.png"
        },
        "amount": 50,
        "currency": "PKR",
        "frequency": "MONTHLY",
        "nextBillingAt": "2026-03-15T09:00:00.000Z",
        "status": "ACTIVE",
        "message": "Monthly flowers",
        "createdAt": "2026-05-09T10:00:00.000Z"
      }
    ],
    "meta": {
      "page": 1,
      "limit": 20,
      "total": 1,
      "totalPages": 1
    },
    "message": "Recurring payments fetched successfully."
  }
}
```

### `POST` `/api/v1/customer/recurring-payments`

**Allowed roles:** REGISTERED_USER

**Summary:** Create recurring payment

**Description:** Access: REGISTERED_USER. REGISTERED_USER only. Endpoint is scoped to the authenticated customer account. REGISTERED_USER only. Recipient contact and saved Stripe payment method must both belong to the logged-in customer. Stripe card recurring payments require a saved payment method.

**Request payload (application/json):**
```json
{
  "amount": 100,
  "currency": "PKR",
  "frequency": "WEEKLY",
  "schedule": {
    "dayOfWeek": "MONDAY",
    "dayOfMonth": null,
    "monthOfYear": null,
    "time": "09:00",
    "timezone": "Asia/Karachi"
  },
  "recipientContactId": "contact_id",
  "message": "Hope you love this special surprise!",
  "messageMediaUrls": [
    "https://cdn.yourdomain.com/gift-message-media/photo.png"
  ],
  "paymentMethod": "STRIPE_CARD",
  "stripePaymentMethodId": "pm_xxx",
  "startDate": "2026-05-10T00:00:00.000Z",
  "endDate": null,
  "autoSend": true
}
```

**Response payload — 201 (application/json):**
```json
{
  "example": {
    "success": true,
    "data": {
      "id": "recurring_payment_id",
      "amount": 100,
      "currency": "PKR",
      "frequency": "WEEKLY",
      "nextBillingAt": "2026-05-12T09:00:00.000Z",
      "status": "ACTIVE"
    },
    "message": "Recurring payment created successfully."
  }
}
```

### `GET` `/api/v1/customer/recurring-payments/summary`

**Allowed roles:** REGISTERED_USER

**Summary:** Fetch recurring payment summary counts

**Description:** Access: REGISTERED_USER. REGISTERED_USER only. Endpoint is scoped to the authenticated customer account. Must stay before /customer/recurring-payments/:id route.

**Request payload:** None

**Response payload — 200 (application/json):**
```json
{
  "example": {
    "success": true,
    "data": {
      "total": 5,
      "active": 3,
      "paused": 1,
      "cancelled": 1,
      "failed": 0
    },
    "message": "Recurring payment summary fetched successfully."
  }
}
```

### `GET` `/api/v1/customer/recurring-payments/{id}`

**Allowed roles:** REGISTERED_USER

**Summary:** Fetch own recurring payment details

**Description:** Access: REGISTERED_USER. REGISTERED_USER only. Endpoint is scoped to the authenticated customer account. REGISTERED_USER only. Customer cannot access another user’s recurring payment.

**Request payload:** None

**Response payload — 200 (application/json):**
```json
{
  "example": {
    "success": true,
    "data": {
      "id": "recurring_payment_id",
      "title": "Monthly Flowers",
      "recipient": {
        "id": "contact_id",
        "name": "Sarah Johnson",
        "email": "sarah.j@example.com",
        "avatarUrl": "https://cdn.yourdomain.com/customer-contact-avatars/sarah.png"
      },
      "amount": 50,
      "currency": "PKR",
      "frequency": "MONTHLY",
      "nextBillingAt": "2026-03-15T09:00:00.000Z",
      "status": "ACTIVE",
      "message": "Fresh seasonal bouquet delivered to her doorstep every month",
      "messageMediaUrls": [],
      "paymentMethod": {
        "type": "STRIPE_CARD",
        "brand": "visa",
        "last4": "4242",
        "expiryMonth": 12,
        "expiryYear": 2026
      },
      "schedule": {
        "frequency": "MONTHLY",
        "dayOfMonth": 15,
        "time": "09:00",
        "timezone": "Asia/Karachi"
      },
      "createdAt": "2026-05-09T10:00:00.000Z"
    },
    "message": "Recurring payment fetched successfully."
  }
}
```

### `PATCH` `/api/v1/customer/recurring-payments/{id}`

**Allowed roles:** REGISTERED_USER

**Summary:** Update own recurring payment

**Description:** Access: REGISTERED_USER. REGISTERED_USER only. Endpoint is scoped to the authenticated customer account. Cannot edit CANCELLED recurring payments. Changes apply from the next billing cycle and nextBillingAt is recalculated.

**Request payload (application/json):**
```json
{
  "amount": 50,
  "frequency": "MONTHLY",
  "schedule": {
    "dayOfMonth": 15,
    "time": "09:00",
    "timezone": "Asia/Karachi"
  },
  "message": "Fresh flowers every month.",
  "messageMediaUrls": [],
  "stripePaymentMethodId": "pm_xxx"
}
```

**Response payload — 200 (application/json):**
```json
{
  "example": {
    "success": true,
    "data": {
      "id": "recurring_payment_id",
      "status": "ACTIVE",
      "nextBillingAt": "2026-03-15T09:00:00.000Z"
    },
    "message": "Recurring payment updated successfully. Changes will apply from the next billing cycle."
  }
}
```

### `POST` `/api/v1/customer/recurring-payments/{id}/pause`

**Allowed roles:** REGISTERED_USER

**Summary:** Pause own active recurring payment

**Description:** Access: REGISTERED_USER. REGISTERED_USER only. Endpoint is scoped to the authenticated customer account.

**Request payload (application/json):**
```json
{
  "reason": "User paused recurring payment."
}
```

**Response payload:** Not documented

### `POST` `/api/v1/customer/recurring-payments/{id}/resume`

**Allowed roles:** REGISTERED_USER

**Summary:** Resume own paused recurring payment

**Description:** Access: REGISTERED_USER. REGISTERED_USER only. Endpoint is scoped to the authenticated customer account.

**Request payload:** None

**Response payload:** Not documented

### `POST` `/api/v1/customer/recurring-payments/{id}/cancel`

**Allowed roles:** REGISTERED_USER

**Summary:** Cancel own recurring payment

**Description:** Access: REGISTERED_USER. REGISTERED_USER only. Endpoint is scoped to the authenticated customer account. IMMEDIATELY cancels future processing. AFTER_CURRENT_BILLING_CYCLE sets cancelAtPeriodEnd and cancelAt.

**Request payload (application/json):**
```json
{
  "cancelMode": "IMMEDIATELY",
  "reason": "No longer needed."
}
```

**Response payload — 200 (application/json):**
```json
{
  "example": {
    "success": true,
    "data": {
      "id": "recurring_payment_id",
      "status": "CANCELLED",
      "cancelMode": "IMMEDIATELY"
    },
    "message": "Recurring payment cancelled successfully."
  }
}
```

### `GET` `/api/v1/customer/recurring-payments/{id}/history`

**Allowed roles:** REGISTERED_USER

**Summary:** List own recurring payment billing history

**Description:** Access: REGISTERED_USER. REGISTERED_USER only. Endpoint is scoped to the authenticated customer account.

**Request payload:** None

**Response payload — 200 (application/json):**
```json
{
  "example": {
    "success": true,
    "data": [
      {
        "id": "history_id",
        "paymentId": "payment_id",
        "amount": 50,
        "currency": "PKR",
        "status": "SUCCESS",
        "billingDate": "2026-02-15T09:00:00.000Z",
        "transactionId": "GFT-8829-XPL",
        "failureReason": null
      }
    ],
    "meta": {
      "page": 1,
      "limit": 20,
      "total": 1,
      "totalPages": 1
    },
    "message": "Recurring payment history fetched successfully."
  }
}
```

## 05 Customer - Transactions

### `GET` `/api/v1/customer/transactions`

**Allowed roles:** REGISTERED_USER

**Summary:** List own customer transactions

**Description:** Access: REGISTERED_USER. REGISTERED_USER only. Endpoint is scoped to the authenticated customer account. REGISTERED_USER only. Normalizes backend Payment, Order, MoneyGift, and RecurringPayment occurrence records owned by the logged-in customer.

**Request payload:** None

**Response payload — 200 (application/json):**
```json
{
  "example": {
    "success": true,
    "data": [
      {
        "id": "payment_id",
        "transactionId": "TXN-2026-001234",
        "title": "Monthly Flowers",
        "description": "Recurring payment",
        "recipient": {
          "id": "contact_id",
          "name": "Sarah Johnson",
          "avatarUrl": "https://cdn.yourdomain.com/customer-contact-avatars/sarah.png"
        },
        "amount": 50,
        "currency": "PKR",
        "type": "RECURRING_PAYMENT",
        "status": "SUCCESS",
        "paymentMethod": "STRIPE_CARD",
        "createdAt": "2026-03-01T14:34:00.000Z"
      }
    ],
    "meta": {
      "page": 1,
      "limit": 20,
      "total": 1,
      "totalPages": 1
    },
    "message": "Transactions fetched successfully."
  }
}
```

### `GET` `/api/v1/customer/transactions/summary`

**Allowed roles:** REGISTERED_USER

**Summary:** Fetch own transaction summary

**Description:** Access: REGISTERED_USER. REGISTERED_USER only. Endpoint is scoped to the authenticated customer account. Defaults to current month when no date range is provided. Uses backend-calculated payment records only.

**Request payload:** None

**Response payload — 200 (application/json):**
```json
{
  "example": {
    "success": true,
    "data": {
      "totalSpentThisMonth": 255,
      "currency": "PKR",
      "successfulCount": 9,
      "failedCount": 1,
      "pendingCount": 0,
      "refundedCount": 0
    },
    "message": "Transaction summary fetched successfully."
  }
}
```

### `GET` `/api/v1/customer/transactions/export`

**Allowed roles:** REGISTERED_USER

**Summary:** Export own transactions

**Description:** Access: REGISTERED_USER. REGISTERED_USER only. Endpoint is scoped to the authenticated customer account. CSV is supported and returned as a file. Export is scoped to the logged-in customer only.

**Request payload:** None

**Response payload — 200:**
```json
{
  "description": "Transaction export file."
}
```

### `GET` `/api/v1/customer/transactions/{id}`

**Allowed roles:** REGISTERED_USER

**Summary:** Fetch own transaction details

**Description:** Access: REGISTERED_USER. REGISTERED_USER only. Endpoint is scoped to the authenticated customer account. Includes order, money gift, recurring payment, and payment gateway references when available. Billing address returns null until available.

**Request payload:** None

**Response payload — 200 (application/json):**
```json
{
  "example": {
    "success": true,
    "data": {
      "id": "payment_id",
      "transactionId": "TXN-2026-001234-ABC-XYZ",
      "status": "SUCCESS",
      "amount": 50,
      "currency": "PKR",
      "createdAt": "2026-03-01T14:34:00.000Z",
      "type": "RECURRING_PAYMENT",
      "giftInformation": {
        "giftName": "Monthly Flowers Subscription",
        "deliveryType": "Money",
        "recipient": {
          "id": "contact_id",
          "name": "Sarah Johnson",
          "avatarUrl": "https://cdn.yourdomain.com/customer-contact-avatars/sarah.png"
        },
        "orderReference": null,
        "recurringPaymentId": "recurring_payment_id"
      },
      "paymentInformation": {
        "paymentMethod": "Stripe card",
        "gatewayReference": "pi_3MmlLrLkdIwHu7ix0fhBHWqt",
        "billingAddress": null
      }
    },
    "message": "Transaction details fetched successfully."
  }
}
```

### `GET` `/api/v1/customer/transactions/{id}/receipt`

**Allowed roles:** REGISTERED_USER

**Summary:** Download own transaction receipt

**Description:** Access: REGISTERED_USER. REGISTERED_USER only. Endpoint is scoped to the authenticated customer account. Receipt is generated only for the transaction owner and never exposes Stripe secret data.

**Request payload:** None

**Response payload — 200:**
```json
{
  "description": "Receipt PDF file for the authenticated transaction owner. Includes app name, transaction ID, customer, recipient, references, totals, currency, status, and support email."
}
```

## 05 Customer - Referrals & Rewards

### `GET` `/api/v1/customer/referrals/summary`

**Allowed roles:** REGISTERED_USER

**Summary:** Fetch own referral reward summary

**Description:** Access: REGISTERED_USER. REGISTERED_USER only. Endpoint is scoped to the authenticated customer account. REGISTERED_USER only. Customers can view only their own referral progress and ledger-derived balances.

**Request payload:** None

**Response payload — 200 (application/json):**
```json
{
  "example": {
    "success": true,
    "data": {
      "invitedFriends": 3,
      "successfulReferrals": 2,
      "rewardsEarned": 20,
      "availableCredit": 20,
      "currency": "USD",
      "progress": {
        "totalInvited": 3,
        "joined": 2,
        "pending": 1
      }
    },
    "message": "Referral summary fetched successfully."
  }
}
```

### `GET` `/api/v1/customer/referrals/link`

**Allowed roles:** REGISTERED_USER

**Summary:** Fetch own referral link

**Description:** Access: REGISTERED_USER. REGISTERED_USER only. Endpoint is scoped to the authenticated customer account. Generates a unique customer referral code when missing. The link never exposes internal user IDs.

**Request payload:** None

**Response payload — 200 (application/json):**
```json
{
  "example": {
    "success": true,
    "data": {
      "referralCode": "SARAH-M",
      "referralLink": "https://giftapp.com/share/sarah-m",
      "shareTitle": "Invite Friends, Earn Rewards",
      "shareMessage": "Join Gift App with my referral link and we both earn rewards after your first gift purchase.",
      "rewardText": "Get $10 credit after your friend's first gift purchase."
    },
    "message": "Referral link fetched successfully."
  }
}
```

### `GET` `/api/v1/customer/referrals/history`

**Allowed roles:** REGISTERED_USER

**Summary:** List own referral history

**Description:** Access: REGISTERED_USER. REGISTERED_USER only. Endpoint is scoped to the authenticated customer account. REGISTERED_USER only. History is scoped to referrals created by the logged-in customer.

**Request payload:** None

**Response payload:** Not documented

### `POST` `/api/v1/customer/referrals/redeem`

**Allowed roles:** REGISTERED_USER

**Summary:** Redeem own available reward credit

**Description:** Access: REGISTERED_USER. REGISTERED_USER only. Endpoint is scoped to the authenticated customer account. Creates a REDEEMED reward ledger entry. Redemption cannot exceed ledger-derived available credit.

**Request payload (application/json):**
```json
{
  "$ref": "#/components/schemas/RedeemRewardDto"
}
```

**Response payload — 201 (application/json):**
```json
{
  "example": {
    "success": true,
    "data": {
      "redeemedAmount": 20,
      "currency": "USD",
      "walletBalance": 20
    },
    "message": "Reward redeemed successfully."
  }
}
```

### `GET` `/api/v1/customer/rewards/balance`

**Allowed roles:** REGISTERED_USER

**Summary:** Fetch own reward balance

**Description:** Access: REGISTERED_USER. REGISTERED_USER only. Endpoint is scoped to the authenticated customer account. Balance is calculated from RewardLedger entries, not a mutable user balance field.

**Request payload:** None

**Response payload — 200 (application/json):**
```json
{
  "example": {
    "success": true,
    "data": {
      "availableCredit": 20,
      "lifetimeEarned": 20,
      "lifetimeRedeemed": 0,
      "currency": "USD"
    },
    "message": "Reward balance fetched successfully."
  }
}
```

### `GET` `/api/v1/customer/rewards/ledger`

**Allowed roles:** REGISTERED_USER

**Summary:** List own reward ledger

**Description:** Access: REGISTERED_USER. REGISTERED_USER only. Endpoint is scoped to the authenticated customer account. REGISTERED_USER only. Returns ledger entries owned by the logged-in customer.

**Request payload:** None

**Response payload:** Not documented

### `GET` `/api/v1/customer/referrals/terms`

**Allowed roles:** REGISTERED_USER

**Summary:** Fetch referral terms

**Description:** Access: REGISTERED_USER. REGISTERED_USER only. Endpoint is scoped to the authenticated customer account. Returns config/env based customer referral terms for the mobile app.

**Request payload:** None

**Response payload — 200 (application/json):**
```json
{
  "example": {
    "success": true,
    "data": {
      "title": "Referral Terms",
      "rewardAmount": 10,
      "currency": "USD",
      "qualificationRule": "Reward is credited after your referred friend completes their first gift purchase.",
      "terms": [
        "Referral rewards are available only for registered users.",
        "Reward is credited after the referred user's first successful purchase.",
        "Cancelled or refunded orders may revoke reward eligibility.",
        "Referral abuse may result in reward cancellation."
      ]
    },
    "message": "Referral terms fetched successfully."
  }
}
```

## 05 Customer - Wallet

### `GET` `/api/v1/customer/wallet`

**Allowed roles:** REGISTERED_USER

**Summary:** Fetch own wallet

**Description:** Access: REGISTERED_USER. REGISTERED_USER only. Endpoint is scoped to the authenticated customer account. REGISTERED_USER only. Wallet is lazily created and balances are backed by wallet ledger entries.

**Request payload:** None

**Response payload — 200 (application/json):**
```json
{
  "example": {
    "success": true,
    "data": {
      "totalBalance": 1240.5,
      "giftCredits": 350,
      "cashBalance": 890.5,
      "currency": "USD",
      "defaultPaymentMethod": {
        "id": "pm_xxx",
        "type": "CARD",
        "brand": "visa",
        "last4": "4242",
        "expiryMonth": 9,
        "expiryYear": 2025,
        "isDefault": true
      },
      "defaultBankAccount": {
        "id": "bank_account_id",
        "bankName": "Chase Bank",
        "last4": "8821",
        "isDefault": false
      }
    },
    "message": "Wallet fetched successfully."
  }
}
```

### `POST` `/api/v1/customer/wallet/add-funds`

**Allowed roles:** REGISTERED_USER

**Summary:** Create wallet top-up payment

**Description:** Access: REGISTERED_USER. REGISTERED_USER only. Endpoint is scoped to the authenticated customer account. Uses Stripe PaymentIntent. Wallet is credited only after successful server-side confirmation/webhook.

**Request payload (application/json):**
```json
{
  "$ref": "#/components/schemas/AddWalletFundsDto"
}
```

**Response payload:** Not documented

### `GET` `/api/v1/customer/wallet/history`

**Allowed roles:** REGISTERED_USER

**Summary:** List own wallet history

**Description:** Access: REGISTERED_USER. REGISTERED_USER only. Endpoint is scoped to the authenticated customer account. Positive amounts are credits, negative amounts are debits. Results are scoped to the logged-in customer.

**Request payload:** None

**Response payload:** Not documented

## 05 Customer - Payment Methods

### `POST` `/api/v1/customer/bank-accounts`

**Allowed roles:** REGISTERED_USER

**Summary:** Link placeholder bank account

**Description:** Access: REGISTERED_USER. REGISTERED_USER only. Endpoint is scoped to the authenticated customer account. Stores only masked display data. Full IBAN/account number is never returned.

**Request payload (application/json):**
```json
{
  "$ref": "#/components/schemas/CreateBankAccountDto"
}
```

**Response payload:** Not documented

### `GET` `/api/v1/customer/bank-accounts`

**Allowed roles:** REGISTERED_USER

**Summary:** List own bank accounts

**Description:** Access: REGISTERED_USER. REGISTERED_USER only. Endpoint is scoped to the authenticated customer account.

**Request payload:** None

**Response payload — 200 (application/json):**
```json
{
  "example": {
    "success": true,
    "data": [
      {
        "id": "bank_account_id",
        "accountHolderName": "John Smith",
        "bankName": "Chase Bank",
        "last4": "8821",
        "maskedAccount": "**** 8821",
        "isDefault": false
      }
    ],
    "message": "Bank accounts fetched successfully."
  }
}
```

### `PATCH` `/api/v1/customer/bank-accounts/{id}/default`

**Allowed roles:** REGISTERED_USER

**Summary:** Set own default bank account

**Description:** Access: REGISTERED_USER. REGISTERED_USER only. Endpoint is scoped to the authenticated customer account.

**Request payload:** None

**Response payload:** Not documented

### `DELETE` `/api/v1/customer/bank-accounts/{id}`

**Allowed roles:** REGISTERED_USER

**Summary:** Delete own bank account

**Description:** Access: REGISTERED_USER. REGISTERED_USER only. Endpoint is scoped to the authenticated customer account.

**Request payload:** None

**Response payload:** Not documented

### `POST` `/api/v1/customer/payment-methods/setup-intent`

**Allowed roles:** REGISTERED_USER

**Summary:** Create Stripe SetupIntent for saving card

**Description:** Access: REGISTERED_USER. REGISTERED_USER only. Endpoint is scoped to the authenticated customer account. Frontend confirms card with Stripe SDK. Backend never accepts raw card number or CVV.

**Request payload:** None

**Response payload — 201 (application/json):**
```json
{
  "example": {
    "success": true,
    "data": {
      "setupIntentId": "seti_xxx",
      "clientSecret": "seti_xxx_secret_xxx",
      "publishableKey": "pk_test_xxx"
    },
    "message": "Setup intent created successfully."
  }
}
```

### `GET` `/api/v1/customer/payment-methods/saved`

**Allowed roles:** REGISTERED_USER

**Summary:** List own saved payment methods

**Description:** Access: REGISTERED_USER. REGISTERED_USER only. Endpoint is scoped to the authenticated customer account. Returns masked Stripe card metadata only.

**Request payload:** None

**Response payload — 200 (application/json):**
```json
{
  "example": {
    "success": true,
    "data": [
      {
        "id": "pm_xxx",
        "type": "CARD",
        "brand": "visa",
        "last4": "4242",
        "expiryMonth": 9,
        "expiryYear": 2025,
        "isDefault": true
      }
    ],
    "message": "Saved payment methods fetched successfully."
  }
}
```

### `DELETE` `/api/v1/customer/payment-methods/{id}`

**Allowed roles:** REGISTERED_USER

**Summary:** Delete own saved payment method

**Description:** Access: REGISTERED_USER. REGISTERED_USER only. Endpoint is scoped to the authenticated customer account. Rejects deletion when the method is used by an active recurring payment.

**Request payload:** None

**Response payload:** Not documented

### `GET` `/api/v1/customer/payment-methods`

**Allowed roles:** REGISTERED_USER

**Summary:** List supported customer payment methods

**Description:** Access: REGISTERED_USER. REGISTERED_USER only. Endpoint is scoped to the authenticated customer account.

**Request payload:** None

**Response payload — 200 (application/json):**
```json
{
  "example": {
    "success": true,
    "data": [
      {
        "key": "STRIPE_CARD",
        "label": "Credit/Debit Card",
        "enabled": true
      },
      {
        "key": "BANK_TRANSFER",
        "label": "Bank Payment",
        "enabled": true
      },
      {
        "key": "E_WALLET",
        "label": "E-Wallet",
        "enabled": false
      }
    ],
    "message": "Payment methods fetched successfully."
  }
}
```

### `PATCH` `/api/v1/customer/payment-methods/{id}/default`

**Allowed roles:** REGISTERED_USER

**Summary:** Set own default payment method

**Description:** Access: REGISTERED_USER. REGISTERED_USER only. Endpoint is scoped to the authenticated customer account.

**Request payload:** None

**Response payload:** Not documented

## 06 Payments

### `POST` `/api/v1/customer/payments/create-intent`

**Allowed roles:** REGISTERED_USER

**Summary:** Create payment intent from active cart

**Description:** Access: REGISTERED_USER. REGISTERED_USER only. Endpoint is scoped to the authenticated customer account. REGISTERED_USER only. Amount is calculated from backend cart totals; frontend amount is never accepted.

**Request payload (application/json):**
```json
{
  "cartId": "cmf0cartactive001",
  "paymentMethod": "STRIPE_CARD"
}
```

**Response payload — 201 (application/json):**
```json
{
  "example": {
    "success": true,
    "data": {
      "paymentId": "payment_id",
      "stripePaymentIntentId": "pi_xxx",
      "clientSecret": "pi_xxx_secret_xxx",
      "publishableKey": "pk_live_or_test",
      "amount": 10999,
      "currency": "PKR"
    },
    "message": "Payment intent created successfully."
  }
}
```

### `POST` `/api/v1/customer/payments/confirm`

**Allowed roles:** REGISTERED_USER

**Summary:** Confirm Stripe payment

**Description:** Access: REGISTERED_USER. REGISTERED_USER only. Endpoint is scoped to the authenticated customer account. REGISTERED_USER only. Retrieves Stripe PaymentIntent server-side before updating local payment status.

**Request payload (application/json):**
```json
{
  "$ref": "#/components/schemas/ConfirmPaymentDto"
}
```

**Response payload:** Not documented

### `GET` `/api/v1/customer/payments/{id}`

**Allowed roles:** REGISTERED_USER

**Summary:** Fetch own payment details

**Description:** Access: REGISTERED_USER. REGISTERED_USER only. Endpoint is scoped to the authenticated customer account.

**Request payload:** None

**Response payload — 200 (application/json):**
```json
{
  "example": {
    "success": true,
    "data": {
      "paymentId": "payment_id",
      "provider": "STRIPE",
      "stripePaymentIntentId": "pi_xxx",
      "amount": 109.99,
      "currency": "PKR",
      "status": "SUCCEEDED",
      "paymentMethod": "STRIPE_CARD",
      "failureReason": null
    },
    "message": "Payment fetched successfully."
  }
}
```

### `POST` `/api/v1/payments/stripe/webhook`

**Allowed roles:** PUBLIC

**Summary:** Stripe webhook endpoint

**Description:** Access: PUBLIC. PUBLIC. Verifies Stripe-Signature using the configured webhook secret before processing events.

**Request payload:** None

**Response payload:** Not documented

### `POST` `/api/v1/customer/money-gifts`

**Allowed roles:** REGISTERED_USER

**Summary:** Send payment as gift

**Description:** Access: REGISTERED_USER. REGISTERED_USER only. Endpoint is scoped to the authenticated customer account. Creates a customer-to-recipient money gift record and Stripe PaymentIntent for STRIPE_CARD.

**Request payload (application/json):**
```json
{
  "amount": 100,
  "currency": "PKR",
  "recipientContactId": "cmf0contactmary001",
  "message": "Hope this helps. Enjoy your day!",
  "messageMediaUrls": [],
  "deliveryDate": "2026-12-24T00:00:00.000Z",
  "repeatAnnually": false,
  "paymentMethod": "STRIPE_CARD"
}
```

**Response payload:** Not documented

### `GET` `/api/v1/customer/money-gifts`

**Allowed roles:** REGISTERED_USER

**Summary:** List own money gifts

**Description:** Access: REGISTERED_USER. REGISTERED_USER only. Endpoint is scoped to the authenticated customer account.

**Request payload:** None

**Response payload:** Not documented

### `GET` `/api/v1/customer/money-gifts/{id}`

**Allowed roles:** REGISTERED_USER

**Summary:** Fetch own money gift details

**Description:** Access: REGISTERED_USER. REGISTERED_USER only. Endpoint is scoped to the authenticated customer account.

**Request payload:** None

**Response payload:** Not documented

## 06 Notifications

### `GET` `/api/v1/notifications`

**Allowed roles:** SUPER_ADMIN, ADMIN, PROVIDER, or REGISTERED_USER

**Summary:** List notifications

**Description:** Access: SUPER_ADMIN, ADMIN, PROVIDER, or REGISTERED_USER. SUPER_ADMIN, ADMIN, PROVIDER, or REGISTERED_USER. Access is scoped to the authenticated account. JWT auth. Returns only notifications belonging to the logged-in account. Supports All, Unread, Birthdays, Deliveries, and New Contacts filters. No group gift notifications are supported.

**Request payload:** None

**Response payload — 200 (application/json):**
```json
{
  "example": {
    "success": true,
    "data": [
      {
        "id": "notification_id",
        "title": "Payment successful",
        "message": "Your payment was completed successfully.",
        "type": "PAYMENT_SUCCEEDED",
        "isRead": false,
        "metadata": {
          "paymentId": "payment_id"
        },
        "createdAt": "2026-05-09T10:00:00.000Z"
      }
    ],
    "meta": {
      "page": 1,
      "limit": 20,
      "total": 1,
      "totalPages": 1
    },
    "message": "Notifications fetched successfully"
  }
}
```

### `GET` `/api/v1/notifications/summary`

**Allowed roles:** SUPER_ADMIN, ADMIN, PROVIDER, or REGISTERED_USER

**Summary:** Fetch notification summary

**Description:** Access: SUPER_ADMIN, ADMIN, PROVIDER, or REGISTERED_USER. SUPER_ADMIN, ADMIN, PROVIDER, or REGISTERED_USER. Access is scoped to the authenticated account. JWT auth. Counts only notifications belonging to the logged-in account.

**Request payload:** None

**Response payload — 200 (application/json):**
```json
{
  "example": {
    "success": true,
    "data": {
      "total": 12,
      "unread": 3,
      "byType": {
        "PAYMENT_SUCCEEDED": 2,
        "RECURRING_PAYMENT_CHARGE_FAILED": 1,
        "BROADCAST": 9
      }
    },
    "message": "Notification summary fetched successfully"
  }
}
```

### `GET` `/api/v1/notifications/preferences`

**Allowed roles:** SUPER_ADMIN, ADMIN, PROVIDER, or REGISTERED_USER

**Summary:** Fetch notification preferences

**Description:** Access: SUPER_ADMIN, ADMIN, PROVIDER, or REGISTERED_USER. SUPER_ADMIN, ADMIN, PROVIDER, or REGISTERED_USER. Access is scoped to the authenticated account. JWT auth. Preferences belong only to the logged-in account.

**Request payload:** None

**Response payload:** Not documented

### `PATCH` `/api/v1/notifications/preferences`

**Allowed roles:** SUPER_ADMIN, ADMIN, PROVIDER, or REGISTERED_USER

**Summary:** Update notification preferences

**Description:** Access: SUPER_ADMIN, ADMIN, PROVIDER, or REGISTERED_USER. SUPER_ADMIN, ADMIN, PROVIDER, or REGISTERED_USER. Access is scoped to the authenticated account. JWT auth. Push toggle does not delete device tokens. No group gift preference exists.

**Request payload (application/json):**
```json
{
  "$ref": "#/components/schemas/UpdateNotificationPreferencesDto"
}
```

**Response payload:** Not documented

### `PATCH` `/api/v1/notifications/read-all`

**Allowed roles:** SUPER_ADMIN, ADMIN, PROVIDER, or REGISTERED_USER

**Summary:** Mark all own notifications as read

**Description:** Access: SUPER_ADMIN, ADMIN, PROVIDER, or REGISTERED_USER. SUPER_ADMIN, ADMIN, PROVIDER, or REGISTERED_USER. Access is scoped to the authenticated account. JWT auth. Marks only notifications belonging to the logged-in account.

**Request payload:** None

**Response payload:** Not documented

### `PATCH` `/api/v1/notifications/{id}/read`

**Allowed roles:** SUPER_ADMIN, ADMIN, PROVIDER, or REGISTERED_USER

**Summary:** Mark notification as read

**Description:** Access: SUPER_ADMIN, ADMIN, PROVIDER, or REGISTERED_USER. SUPER_ADMIN, ADMIN, PROVIDER, or REGISTERED_USER. Access is scoped to the authenticated account. JWT auth. Notification must belong to the logged-in account.

**Request payload:** None

**Response payload:** Not documented

### `POST` `/api/v1/notifications/{id}/action`

**Allowed roles:** SUPER_ADMIN, ADMIN, PROVIDER, or REGISTERED_USER

**Summary:** Process notification action

**Description:** Access: SUPER_ADMIN, ADMIN, PROVIDER, or REGISTERED_USER. SUPER_ADMIN, ADMIN, PROVIDER, or REGISTERED_USER. Access is scoped to the authenticated account. JWT auth. Supports SEND_GIFT, REMIND_ME_LATER, VIEW_ORDER, VIEW_CONTACT. Group gift actions are not supported.

**Request payload (application/json):**
```json
{
  "action": "SEND_GIFT"
}
```

**Response payload:** Not documented

### `POST` `/api/v1/notifications/device-tokens`

**Allowed roles:** SUPER_ADMIN, ADMIN, PROVIDER, or REGISTERED_USER

**Summary:** Save device token

**Description:** Access: SUPER_ADMIN, ADMIN, PROVIDER, or REGISTERED_USER. SUPER_ADMIN, ADMIN, PROVIDER, or REGISTERED_USER. Access is scoped to the authenticated account. JWT auth. Token belongs only to logged-in account. Duplicate deviceId updates existing record.

**Request payload (application/json):**
```json
{
  "$ref": "#/components/schemas/DeviceTokenDto"
}
```

**Response payload:** Not documented

### `DELETE` `/api/v1/notifications/device-tokens/{id}`

**Allowed roles:** SUPER_ADMIN, ADMIN, PROVIDER, or REGISTERED_USER

**Summary:** Disable device token

**Description:** Access: SUPER_ADMIN, ADMIN, PROVIDER, or REGISTERED_USER. SUPER_ADMIN, ADMIN, PROVIDER, or REGISTERED_USER. Access is scoped to the authenticated account. JWT auth. Users can disable only their own device tokens.

**Request payload:** None

**Response payload:** Not documented

## 06 Broadcast Notifications

### `POST` `/api/v1/broadcasts`

**Allowed roles:** SUPER_ADMIN or ADMIN with broadcasts.create

**Summary:** POST /api/v1/broadcasts

**Description:** Access: SUPER_ADMIN or ADMIN with broadcasts.create. SUPER_ADMIN or ADMIN with broadcasts.create permission.

**Request payload (application/json):**
```json
{
  "$ref": "#/components/schemas/CreateBroadcastDto"
}
```

**Response payload:** Not documented

### `GET` `/api/v1/broadcasts`

**Allowed roles:** SUPER_ADMIN or ADMIN with broadcasts.read

**Summary:** GET /api/v1/broadcasts

**Description:** Access: SUPER_ADMIN or ADMIN with broadcasts.read. SUPER_ADMIN or ADMIN with broadcasts.read permission.

**Request payload:** None

**Response payload:** Not documented

### `GET` `/api/v1/broadcasts/{id}`

**Allowed roles:** SUPER_ADMIN or ADMIN with broadcasts.read

**Summary:** GET /api/v1/broadcasts/{id}

**Description:** Access: SUPER_ADMIN or ADMIN with broadcasts.read. SUPER_ADMIN or ADMIN with broadcasts.read permission.

**Request payload:** None

**Response payload:** Not documented

### `PATCH` `/api/v1/broadcasts/{id}`

**Allowed roles:** SUPER_ADMIN or ADMIN with broadcasts.update

**Summary:** PATCH /api/v1/broadcasts/{id}

**Description:** Access: SUPER_ADMIN or ADMIN with broadcasts.update. SUPER_ADMIN or ADMIN with broadcasts.update permission.

**Request payload (application/json):**
```json
{
  "$ref": "#/components/schemas/UpdateBroadcastDto"
}
```

**Response payload:** Not documented

### `PATCH` `/api/v1/broadcasts/{id}/targeting`

**Allowed roles:** SUPER_ADMIN or ADMIN with broadcasts.update

**Summary:** PATCH /api/v1/broadcasts/{id}/targeting

**Description:** Access: SUPER_ADMIN or ADMIN with broadcasts.update. SUPER_ADMIN or ADMIN with broadcasts.update permission.

**Request payload (application/json):**
```json
{
  "$ref": "#/components/schemas/BroadcastTargetingDto"
}
```

**Response payload:** Not documented

### `POST` `/api/v1/broadcasts/estimate-reach`

**Allowed roles:** SUPER_ADMIN or ADMIN with broadcasts.read

**Summary:** POST /api/v1/broadcasts/estimate-reach

**Description:** Access: SUPER_ADMIN or ADMIN with broadcasts.read. SUPER_ADMIN or ADMIN with broadcasts.read permission.

**Request payload (application/json):**
```json
{
  "$ref": "#/components/schemas/EstimateReachDto"
}
```

**Response payload:** Not documented

### `PATCH` `/api/v1/broadcasts/{id}/schedule`

**Allowed roles:** SUPER_ADMIN or ADMIN with broadcasts.schedule

**Summary:** PATCH /api/v1/broadcasts/{id}/schedule

**Description:** Access: SUPER_ADMIN or ADMIN with broadcasts.schedule. SUPER_ADMIN or ADMIN with broadcasts.schedule permission.

**Request payload (application/json):**
```json
{
  "$ref": "#/components/schemas/ScheduleBroadcastDto"
}
```

**Response payload:** Not documented

### `POST` `/api/v1/broadcasts/{id}/cancel`

**Allowed roles:** SUPER_ADMIN or ADMIN with broadcasts.cancel

**Summary:** POST /api/v1/broadcasts/{id}/cancel

**Description:** Access: SUPER_ADMIN or ADMIN with broadcasts.cancel. SUPER_ADMIN or ADMIN with broadcasts.cancel permission.

**Request payload (application/json):**
```json
{
  "$ref": "#/components/schemas/CancelBroadcastDto"
}
```

**Response payload:** Not documented

### `GET` `/api/v1/broadcasts/{id}/report`

**Allowed roles:** SUPER_ADMIN or ADMIN with broadcasts.report.read

**Summary:** GET /api/v1/broadcasts/{id}/report

**Description:** Access: SUPER_ADMIN or ADMIN with broadcasts.report.read. SUPER_ADMIN or ADMIN with broadcasts.report.read permission.

**Request payload:** None

**Response payload:** Not documented

### `GET` `/api/v1/broadcasts/{id}/recipients`

**Allowed roles:** SUPER_ADMIN or ADMIN with broadcasts.report.read

**Summary:** GET /api/v1/broadcasts/{id}/recipients

**Description:** Access: SUPER_ADMIN or ADMIN with broadcasts.report.read. SUPER_ADMIN or ADMIN with broadcasts.report.read permission.

**Request payload:** None

**Response payload:** Not documented

## 07 Plans & Coupons

### `GET` `/api/v1/subscription-plans`

**Allowed roles:** SUPER_ADMIN or ADMIN with subscriptionPlans.read

**Summary:** GET /api/v1/subscription-plans

**Description:** Access: SUPER_ADMIN or ADMIN with subscriptionPlans.read. SUPER_ADMIN or ADMIN with subscriptionPlans.read permission.

**Request payload:** None

**Response payload:** Not documented

### `POST` `/api/v1/subscription-plans`

**Allowed roles:** SUPER_ADMIN or ADMIN with subscriptionPlans.create

**Summary:** POST /api/v1/subscription-plans

**Description:** Access: SUPER_ADMIN or ADMIN with subscriptionPlans.create. SUPER_ADMIN or ADMIN with subscriptionPlans.create permission.

**Request payload (application/json):**
```json
{
  "$ref": "#/components/schemas/CreateSubscriptionPlanDto"
}
```

**Response payload:** Not documented

### `GET` `/api/v1/subscription-plans/stats`

**Allowed roles:** SUPER_ADMIN or ADMIN with subscriptionPlans.analytics.read

**Summary:** GET /api/v1/subscription-plans/stats

**Description:** Access: SUPER_ADMIN or ADMIN with subscriptionPlans.analytics.read. SUPER_ADMIN or ADMIN with subscriptionPlans.analytics.read permission.

**Request payload:** None

**Response payload:** Not documented

### `GET` `/api/v1/subscription-plans/{id}`

**Allowed roles:** SUPER_ADMIN or ADMIN with subscriptionPlans.read

**Summary:** GET /api/v1/subscription-plans/{id}

**Description:** Access: SUPER_ADMIN or ADMIN with subscriptionPlans.read. SUPER_ADMIN or ADMIN with subscriptionPlans.read permission.

**Request payload:** None

**Response payload:** Not documented

### `PATCH` `/api/v1/subscription-plans/{id}`

**Allowed roles:** SUPER_ADMIN or ADMIN with subscriptionPlans.update

**Summary:** PATCH /api/v1/subscription-plans/{id}

**Description:** Access: SUPER_ADMIN or ADMIN with subscriptionPlans.update. SUPER_ADMIN or ADMIN with subscriptionPlans.update permission.

**Request payload (application/json):**
```json
{
  "$ref": "#/components/schemas/UpdateSubscriptionPlanDto"
}
```

**Response payload:** Not documented

### `DELETE` `/api/v1/subscription-plans/{id}`

**Allowed roles:** SUPER_ADMIN or ADMIN with subscriptionPlans.delete

**Summary:** DELETE /api/v1/subscription-plans/{id}

**Description:** Access: SUPER_ADMIN or ADMIN with subscriptionPlans.delete. SUPER_ADMIN or ADMIN with subscriptionPlans.delete permission.

**Request payload:** None

**Response payload:** Not documented

### `PATCH` `/api/v1/subscription-plans/{id}/status`

**Allowed roles:** SUPER_ADMIN or ADMIN with subscriptionPlans.status.update

**Summary:** PATCH /api/v1/subscription-plans/{id}/status

**Description:** Access: SUPER_ADMIN or ADMIN with subscriptionPlans.status.update. SUPER_ADMIN or ADMIN with subscriptionPlans.status.update permission.

**Request payload (application/json):**
```json
{
  "$ref": "#/components/schemas/UpdatePlanStatusDto"
}
```

**Response payload:** Not documented

### `PATCH` `/api/v1/subscription-plans/{id}/visibility`

**Allowed roles:** SUPER_ADMIN or ADMIN with subscriptionPlans.visibility.update

**Summary:** PATCH /api/v1/subscription-plans/{id}/visibility

**Description:** Access: SUPER_ADMIN or ADMIN with subscriptionPlans.visibility.update. SUPER_ADMIN or ADMIN with subscriptionPlans.visibility.update permission.

**Request payload (application/json):**
```json
{
  "$ref": "#/components/schemas/UpdatePlanVisibilityDto"
}
```

**Response payload:** Not documented

### `GET` `/api/v1/subscription-plans/{id}/analytics`

**Allowed roles:** SUPER_ADMIN or ADMIN with subscriptionPlans.analytics.read

**Summary:** GET /api/v1/subscription-plans/{id}/analytics

**Description:** Access: SUPER_ADMIN or ADMIN with subscriptionPlans.analytics.read. SUPER_ADMIN or ADMIN with subscriptionPlans.analytics.read permission.

**Request payload:** None

**Response payload:** Not documented

### `GET` `/api/v1/plan-features/catalog`

**Allowed roles:** SUPER_ADMIN or ADMIN with planFeatures.read

**Summary:** GET /api/v1/plan-features/catalog

**Description:** Access: SUPER_ADMIN or ADMIN with planFeatures.read. SUPER_ADMIN or ADMIN with planFeatures.read permission.

**Request payload:** None

**Response payload:** Not documented

### `GET` `/api/v1/plan-features`

**Allowed roles:** SUPER_ADMIN or ADMIN with planFeatures.read

**Summary:** GET /api/v1/plan-features

**Description:** Access: SUPER_ADMIN or ADMIN with planFeatures.read. SUPER_ADMIN or ADMIN with planFeatures.read permission.

**Request payload:** None

**Response payload:** Not documented

### `POST` `/api/v1/plan-features`

**Allowed roles:** SUPER_ADMIN or ADMIN with planFeatures.create

**Summary:** POST /api/v1/plan-features

**Description:** Access: SUPER_ADMIN or ADMIN with planFeatures.create. SUPER_ADMIN or ADMIN with planFeatures.create permission.

**Request payload (application/json):**
```json
{
  "$ref": "#/components/schemas/CreatePlanFeatureDto"
}
```

**Response payload:** Not documented

### `GET` `/api/v1/plan-features/{id}`

**Allowed roles:** SUPER_ADMIN or ADMIN with planFeatures.read

**Summary:** GET /api/v1/plan-features/{id}

**Description:** Access: SUPER_ADMIN or ADMIN with planFeatures.read. SUPER_ADMIN or ADMIN with planFeatures.read permission.

**Request payload:** None

**Response payload:** Not documented

### `PATCH` `/api/v1/plan-features/{id}`

**Allowed roles:** SUPER_ADMIN or ADMIN with planFeatures.update

**Summary:** PATCH /api/v1/plan-features/{id}

**Description:** Access: SUPER_ADMIN or ADMIN with planFeatures.update. SUPER_ADMIN or ADMIN with planFeatures.update permission.

**Request payload (application/json):**
```json
{
  "$ref": "#/components/schemas/UpdatePlanFeatureDto"
}
```

**Response payload:** Not documented

### `DELETE` `/api/v1/plan-features/{id}`

**Allowed roles:** SUPER_ADMIN or ADMIN with planFeatures.delete

**Summary:** DELETE /api/v1/plan-features/{id}

**Description:** Access: SUPER_ADMIN or ADMIN with planFeatures.delete. SUPER_ADMIN or ADMIN with planFeatures.delete permission.

**Request payload:** None

**Response payload:** Not documented

### `GET` `/api/v1/coupons`

**Allowed roles:** SUPER_ADMIN or ADMIN with coupons.read

**Summary:** GET /api/v1/coupons

**Description:** Access: SUPER_ADMIN or ADMIN with coupons.read. SUPER_ADMIN or ADMIN with coupons.read permission.

**Request payload:** None

**Response payload:** Not documented

### `POST` `/api/v1/coupons`

**Allowed roles:** SUPER_ADMIN or ADMIN with coupons.create

**Summary:** POST /api/v1/coupons

**Description:** Access: SUPER_ADMIN or ADMIN with coupons.create. SUPER_ADMIN or ADMIN with coupons.create permission.

**Request payload (application/json):**
```json
{
  "$ref": "#/components/schemas/CreateCouponDto"
}
```

**Response payload:** Not documented

### `GET` `/api/v1/coupons/{id}`

**Allowed roles:** SUPER_ADMIN or ADMIN with coupons.read

**Summary:** GET /api/v1/coupons/{id}

**Description:** Access: SUPER_ADMIN or ADMIN with coupons.read. SUPER_ADMIN or ADMIN with coupons.read permission.

**Request payload:** None

**Response payload:** Not documented

### `PATCH` `/api/v1/coupons/{id}`

**Allowed roles:** SUPER_ADMIN or ADMIN with coupons.update

**Summary:** PATCH /api/v1/coupons/{id}

**Description:** Access: SUPER_ADMIN or ADMIN with coupons.update. SUPER_ADMIN or ADMIN with coupons.update permission.

**Request payload (application/json):**
```json
{
  "$ref": "#/components/schemas/UpdateCouponDto"
}
```

**Response payload:** Not documented

### `DELETE` `/api/v1/coupons/{id}`

**Allowed roles:** SUPER_ADMIN or ADMIN with coupons.delete

**Summary:** DELETE /api/v1/coupons/{id}

**Description:** Access: SUPER_ADMIN or ADMIN with coupons.delete. SUPER_ADMIN or ADMIN with coupons.delete permission.

**Request payload:** None

**Response payload:** Not documented

### `PATCH` `/api/v1/coupons/{id}/status`

**Allowed roles:** SUPER_ADMIN or ADMIN with coupons.status.update

**Summary:** PATCH /api/v1/coupons/{id}/status

**Description:** Access: SUPER_ADMIN or ADMIN with coupons.status.update. SUPER_ADMIN or ADMIN with coupons.status.update permission.

**Request payload (application/json):**
```json
{
  "$ref": "#/components/schemas/UpdateCouponStatusDto"
}
```

**Response payload:** Not documented

## 07 Storage

### `POST` `/api/v1/uploads/presigned-url`

**Allowed roles:** SUPER_ADMIN, ADMIN, PROVIDER, or REGISTERED_USER

**Summary:** POST /api/v1/uploads/presigned-url

**Description:** Access: SUPER_ADMIN, ADMIN, PROVIDER, or REGISTERED_USER. SUPER_ADMIN, ADMIN, PROVIDER, or REGISTERED_USER. Access is scoped to the authenticated account.

**Request payload (application/json):**
```json
{
  "$ref": "#/components/schemas/CreatePresignedUploadDto"
}
```

**Response payload:** Not documented

### `POST` `/api/v1/uploads/complete`

**Allowed roles:** SUPER_ADMIN, ADMIN, PROVIDER, or REGISTERED_USER

**Summary:** POST /api/v1/uploads/complete

**Description:** Access: SUPER_ADMIN, ADMIN, PROVIDER, or REGISTERED_USER. SUPER_ADMIN, ADMIN, PROVIDER, or REGISTERED_USER. Access is scoped to the authenticated account.

**Request payload (application/json):**
```json
{
  "$ref": "#/components/schemas/CompleteUploadDto"
}
```

**Response payload:** Not documented

### `GET` `/api/v1/uploads`

**Allowed roles:** SUPER_ADMIN, ADMIN, PROVIDER, or REGISTERED_USER

**Summary:** GET /api/v1/uploads

**Description:** Access: SUPER_ADMIN, ADMIN, PROVIDER, or REGISTERED_USER. SUPER_ADMIN, ADMIN, PROVIDER, or REGISTERED_USER. Access is scoped to the authenticated account.

**Request payload:** None

**Response payload:** Not documented

### `GET` `/api/v1/uploads/{id}`

**Allowed roles:** SUPER_ADMIN, ADMIN, PROVIDER, or REGISTERED_USER

**Summary:** GET /api/v1/uploads/{id}

**Description:** Access: SUPER_ADMIN, ADMIN, PROVIDER, or REGISTERED_USER. SUPER_ADMIN, ADMIN, PROVIDER, or REGISTERED_USER. Access is scoped to the authenticated account.

**Request payload:** None

**Response payload:** Not documented

### `DELETE` `/api/v1/uploads/{id}`

**Allowed roles:** SUPER_ADMIN, ADMIN, PROVIDER, or REGISTERED_USER

**Summary:** DELETE /api/v1/uploads/{id}

**Description:** Access: SUPER_ADMIN, ADMIN, PROVIDER, or REGISTERED_USER. SUPER_ADMIN, ADMIN, PROVIDER, or REGISTERED_USER. Access is scoped to the authenticated account.

**Request payload:** None

**Response payload:** Not documented
