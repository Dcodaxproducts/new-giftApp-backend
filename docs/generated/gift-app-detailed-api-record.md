# Gift App Backend — Detailed API Record

Generated: 2026-05-09 13:30 UTC

Base URL: `/api/v1`

All protected APIs use:

```txt
Authorization: Bearer <accessToken>
```

> Secrets are intentionally omitted. Stripe/AWS/JWT/SMTP secret values are not documented here.

## Contents

- Auth
- Login Attempts
- Admin Staff Management
- Admin Roles / RBAC
- User Management
- Provider Management
- Provider Inventory
- Provider Promotional Offers
- Promotional Offers Management
- Gift Categories
- Gift Management
- Gift Moderation
- Customer Marketplace
- Customer Wishlist
- Customer Addresses
- Customer Contacts
- Customer Events
- Customer Event Reminder Settings
- Customer Cart
- Customer Orders
- Customer Recurring Payments
- Customer Transactions
- Payments
- Notifications
- Broadcast Notifications
- Subscription Plans
- Coupons
- Storage
- Audit Logs

## Auth

| Method | Path | Roles | Summary |
|---|---|---|---|
| `DELETE` | `/auth/account` | AUTHENTICATED |  |
| `POST` | `/auth/cancel-deletion` | AUTHENTICATED |  |
| `PATCH` | `/auth/change-password` | AUTHENTICATED |  |
| `POST` | `/auth/forgot-password` | PUBLIC |  |
| `POST` | `/auth/guest/session` | PUBLIC |  |
| `POST` | `/auth/login` | PUBLIC |  |
| `POST` | `/auth/logout` | AUTHENTICATED |  |
| `GET` | `/auth/me` | AUTHENTICATED |  |
| `POST` | `/auth/providers/register` | PUBLIC |  |
| `POST` | `/auth/refresh` | PUBLIC |  |
| `POST` | `/auth/resend-otp` | AUTHENTICATED |  |
| `POST` | `/auth/reset-password` | PUBLIC |  |
| `POST` | `/auth/users/register` | PUBLIC |  |
| `POST` | `/auth/verify-email` | AUTHENTICATED |  |
| `POST` | `/auth/verify-reset-otp` | PUBLIC |  |

### DELETE /auth/account

**Allowed role(s):** AUTHENTICATED

**Swagger tag:** Auth

**Summary:** —

**Parameters:** None

**Common failure responses:** `400` validation/business rule failure, `401` missing/invalid token, `403` role/permission denied, `404` missing owned record.

### POST /auth/cancel-deletion

**Allowed role(s):** AUTHENTICATED

**Swagger tag:** Auth

**Summary:** —

**Parameters:** None

**Request payload:** None

**Example response:**

```json
{
  "success": true,
  "data": {},
  "message": "Request completed successfully"
}
```

**Common failure responses:** `400` validation/business rule failure, `401` missing/invalid token, `403` role/permission denied, `404` missing owned record.

### PATCH /auth/change-password

**Allowed role(s):** AUTHENTICATED

**Swagger tag:** Auth

**Summary:** —

**Parameters:** None

**Request DTO:** `ChangePasswordDto`

**Request payload example:**

```json
{
  "currentPassword": "example",
  "newPassword": "example"
}
```

**Common failure responses:** `400` validation/business rule failure, `401` missing/invalid token, `403` role/permission denied, `404` missing owned record.

### POST /auth/forgot-password

**Allowed role(s):** PUBLIC

**Swagger tag:** Auth

**Summary:** —

**Parameters:** None

**Request DTO:** `ForgotPasswordDto`

**Request payload example:**

```json
{
  "email": "user@example.com"
}
```

**Example response:**

```json
{
  "success": true,
  "data": {},
  "message": "Request completed successfully"
}
```

**Common failure responses:** `400` validation/business rule failure, `401` missing/invalid token, `403` role/permission denied, `404` missing owned record.

### POST /auth/guest/session

**Allowed role(s):** PUBLIC

**Swagger tag:** Auth

**Summary:** —

**Parameters:** None

**Request DTO:** `GuestSessionDto`

**Request payload example:**

```json
{
  "capabilities": [
    "example"
  ]
}
```

**Example response:**

```json
{
  "success": true,
  "data": {},
  "message": "Request completed successfully"
}
```

**Common failure responses:** `400` validation/business rule failure, `401` missing/invalid token, `403` role/permission denied, `404` missing owned record.

### POST /auth/login

**Allowed role(s):** PUBLIC

**Swagger tag:** Auth

**Summary:** —

**Parameters:** None

**Request DTO:** `LoginDto`

**Request payload example:**

```json
{
  "email": "example",
  "password": "example"
}
```

**Example response:**

```json
{
  "success": true,
  "data": {},
  "message": "Request completed successfully"
}
```

**Common failure responses:** `400` validation/business rule failure, `401` missing/invalid token, `403` role/permission denied, `404` missing owned record.

### POST /auth/logout

**Allowed role(s):** AUTHENTICATED

**Swagger tag:** Auth

**Summary:** —

**Parameters:** None

**Request payload:** None

**Example response:**

```json
{
  "success": true,
  "data": {},
  "message": "Request completed successfully"
}
```

**Common failure responses:** `400` validation/business rule failure, `401` missing/invalid token, `403` role/permission denied, `404` missing owned record.

### GET /auth/me

**Allowed role(s):** AUTHENTICATED

**Swagger tag:** Auth

**Summary:** —

**Parameters:** None

**Example response:**

```json
{
  "success": true,
  "data": {},
  "message": "Request completed successfully"
}
```

**Common failure responses:** `401` missing/invalid token, `403` role/permission denied, `404` missing owned record when applicable.

### POST /auth/providers/register

**Allowed role(s):** PUBLIC

**Swagger tag:** Auth

**Summary:** —

**Parameters:** None

**Request DTO:** `RegisterProviderDto`

**Request payload example:**

```json
{
  "email": "example",
  "password": "example",
  "firstName": "example",
  "lastName": "example",
  "phone": "example",
  "businessName": "example",
  "businessCategoryId": "example",
  "taxId": "example",
  "businessAddress": "example",
  "fulfillmentMethods": [
    "PICKUP"
  ],
  "autoAcceptOrders": true
}
```

**Example response:**

```json
{
  "success": true,
  "data": {},
  "message": "Request completed successfully"
}
```

**Common failure responses:** `400` validation/business rule failure, `401` missing/invalid token, `403` role/permission denied, `404` missing owned record.

### POST /auth/refresh

**Allowed role(s):** PUBLIC

**Swagger tag:** Auth

**Summary:** —

**Parameters:** None

**Request DTO:** `RefreshDto`

**Request payload example:**

```json
{
  "refreshToken": "example"
}
```

**Example response:**

```json
{
  "success": true,
  "data": {},
  "message": "Request completed successfully"
}
```

**Common failure responses:** `400` validation/business rule failure, `401` missing/invalid token, `403` role/permission denied, `404` missing owned record.

### POST /auth/resend-otp

**Allowed role(s):** AUTHENTICATED

**Swagger tag:** Auth

**Summary:** —

**Parameters:** None

**Request payload:** None

**Example response:**

```json
{
  "success": true,
  "data": {},
  "message": "Request completed successfully"
}
```

**Common failure responses:** `400` validation/business rule failure, `401` missing/invalid token, `403` role/permission denied, `404` missing owned record.

### POST /auth/reset-password

**Allowed role(s):** PUBLIC

**Swagger tag:** Auth

**Summary:** —

**Parameters:** None

**Request DTO:** `ResetPasswordDto`

**Request payload example:**

```json
{
  "email": "user@example.com",
  "otp": "334018",
  "newPassword": "NewPassword@123"
}
```

**Example response:**

```json
{
  "success": true,
  "data": {},
  "message": "Request completed successfully"
}
```

**Common failure responses:** `400` validation/business rule failure, `401` missing/invalid token, `403` role/permission denied, `404` missing owned record.

### POST /auth/users/register

**Allowed role(s):** PUBLIC

**Swagger tag:** Auth

**Summary:** —

**Parameters:** None

**Request DTO:** `RegisterUserDto`

**Request payload example:**

```json
{
  "email": "example",
  "password": "example",
  "firstName": "example",
  "lastName": "example",
  "phone": "example"
}
```

**Example response:**

```json
{
  "success": true,
  "data": {},
  "message": "Request completed successfully"
}
```

**Common failure responses:** `400` validation/business rule failure, `401` missing/invalid token, `403` role/permission denied, `404` missing owned record.

### POST /auth/verify-email

**Allowed role(s):** AUTHENTICATED

**Swagger tag:** Auth

**Summary:** —

**Parameters:** None

**Request DTO:** `VerifyEmailDto`

**Request payload example:**

```json
{
  "otp": "example"
}
```

**Example response:**

```json
{
  "success": true,
  "data": {},
  "message": "Request completed successfully"
}
```

**Common failure responses:** `400` validation/business rule failure, `401` missing/invalid token, `403` role/permission denied, `404` missing owned record.

### POST /auth/verify-reset-otp

**Allowed role(s):** PUBLIC

**Swagger tag:** Auth

**Summary:** —

**Parameters:** None

**Request DTO:** `VerifyResetOtpDto`

**Request payload example:**

```json
{
  "email": "user@example.com",
  "otp": "334018"
}
```

**Example response:**

```json
{
  "success": true,
  "data": {},
  "message": "Request completed successfully"
}
```

**Common failure responses:** `400` validation/business rule failure, `401` missing/invalid token, `403` role/permission denied, `404` missing owned record.

## Login Attempts

| Method | Path | Roles | Summary |
|---|---|---|---|
| `GET` | `/login-attempts` | SUPER_ADMIN, ADMIN |  |
| `GET` | `/login-attempts/export` | SUPER_ADMIN, ADMIN |  |
| `GET` | `/login-attempts/stats` | SUPER_ADMIN, ADMIN |  |

### GET /login-attempts

**Allowed role(s):** SUPER_ADMIN, ADMIN

**Swagger tag:** Login Attempts

**Summary:** —

**Parameters:** `email` (query, optional), `status` (query, optional), `role` (query, optional), `page` (query, optional), `limit` (query, optional), `userId` (query, optional), `from` (query, optional), `to` (query, optional)

**Example response:**

```json
{
  "success": true,
  "data": {},
  "message": "Request completed successfully"
}
```

**Common failure responses:** `401` missing/invalid token, `403` role/permission denied, `404` missing owned record when applicable.

### GET /login-attempts/export

**Allowed role(s):** SUPER_ADMIN, ADMIN

**Swagger tag:** Login Attempts

**Summary:** —

**Parameters:** `email` (query, optional), `status` (query, optional), `role` (query, optional), `page` (query, optional), `limit` (query, optional), `userId` (query, optional), `from` (query, optional), `to` (query, optional)

**Example response:**

```json
{
  "success": true,
  "data": {},
  "message": "Request completed successfully"
}
```

**Common failure responses:** `401` missing/invalid token, `403` role/permission denied, `404` missing owned record when applicable.

### GET /login-attempts/stats

**Allowed role(s):** SUPER_ADMIN, ADMIN

**Swagger tag:** Login Attempts

**Summary:** —

**Parameters:** `email` (query, optional), `status` (query, optional), `role` (query, optional), `page` (query, optional), `limit` (query, optional), `userId` (query, optional), `from` (query, optional), `to` (query, optional)

**Example response:**

```json
{
  "success": true,
  "data": {},
  "message": "Request completed successfully"
}
```

**Common failure responses:** `401` missing/invalid token, `403` role/permission denied, `404` missing owned record when applicable.

## Admin Staff Management

| Method | Path | Roles | Summary |
|---|---|---|---|
| `GET` | `/admins` | SUPER_ADMIN |  |
| `POST` | `/admins` | SUPER_ADMIN | Create admin staff user |
| `GET` | `/admins/{id}` | SUPER_ADMIN |  |
| `PATCH` | `/admins/{id}` | SUPER_ADMIN |  |
| `PATCH` | `/admins/{id}/active-status` | SUPER_ADMIN |  |
| `PATCH` | `/admins/{id}/password` | SUPER_ADMIN |  |

### GET /admins

**Allowed role(s):** SUPER_ADMIN

**Swagger tag:** Admin Staff Management

**Summary:** —

**Parameters:** `page` (query, optional), `limit` (query, optional), `search` (query, optional), `roleId` (query, optional), `role` (query, optional), `status` (query, optional), `sortBy` (query, optional), `sortOrder` (query, optional)

**Example response:**

```json
{
  "success": true,
  "data": {},
  "message": "Request completed successfully"
}
```

**Common failure responses:** `401` missing/invalid token, `403` role/permission denied, `404` missing owned record when applicable.

### POST /admins

**Allowed role(s):** SUPER_ADMIN

**Swagger tag:** Admin Staff Management

**Summary:** Create admin staff user

**Description:** Creates an ADMIN staff user under Super Admin. The roleId field is the AdminRole ID that controls this staff user's permissions. This endpoint cannot create SUPER_ADMIN, REGISTERED_USER, PROVIDER, or GUEST_USER accounts.

**Parameters:** None

**Request payload example:**

```json
{
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
```

**Example response:**

```json
{
  "success": true,
  "data": {},
  "message": "Request completed successfully"
}
```

**Common failure responses:** `400` validation/business rule failure, `401` missing/invalid token, `403` role/permission denied, `404` missing owned record.

### GET /admins/{id}

**Allowed role(s):** SUPER_ADMIN

**Swagger tag:** Admin Staff Management

**Summary:** —

**Parameters:** `id` (path, required)

**Example response:**

```json
{
  "success": true,
  "data": {},
  "message": "Request completed successfully"
}
```

**Common failure responses:** `401` missing/invalid token, `403` role/permission denied, `404` missing owned record when applicable.

### PATCH /admins/{id}

**Allowed role(s):** SUPER_ADMIN

**Swagger tag:** Admin Staff Management

**Summary:** —

**Parameters:** `id` (path, required)

**Request DTO:** `UpdateAdminDto`

**Request payload example:**

```json
{
  "firstName": "example",
  "lastName": "example",
  "phone": "example",
  "avatarUrl": "example",
  "title": "example",
  "roleId": "example",
  "isActive": true
}
```

**Common failure responses:** `400` validation/business rule failure, `401` missing/invalid token, `403` role/permission denied, `404` missing owned record.

### PATCH /admins/{id}/active-status

**Allowed role(s):** SUPER_ADMIN

**Swagger tag:** Admin Staff Management

**Summary:** —

**Parameters:** `id` (path, required)

**Request DTO:** `UpdateAdminActiveStatusDto`

**Request payload example:**

```json
{
  "isActive": true
}
```

**Common failure responses:** `400` validation/business rule failure, `401` missing/invalid token, `403` role/permission denied, `404` missing owned record.

### PATCH /admins/{id}/password

**Allowed role(s):** SUPER_ADMIN

**Swagger tag:** Admin Staff Management

**Summary:** —

**Parameters:** `id` (path, required)

**Request DTO:** `ResetAdminPasswordDto`

**Request payload example:**

```json
{
  "temporaryPassword": "example",
  "generateTemporaryPassword": true,
  "mustChangePassword": true,
  "sendEmail": true
}
```

**Common failure responses:** `400` validation/business rule failure, `401` missing/invalid token, `403` role/permission denied, `404` missing owned record.

## Admin Roles / RBAC

| Method | Path | Roles | Summary |
|---|---|---|---|
| `GET` | `/admin-roles` | SUPER_ADMIN |  |
| `POST` | `/admin-roles` | SUPER_ADMIN |  |
| `GET` | `/permissions/catalog` | SUPER_ADMIN |  |
| `GET` | `/admin-roles/{id}` | SUPER_ADMIN |  |
| `PATCH` | `/admin-roles/{id}` | SUPER_ADMIN |  |
| `DELETE` | `/admin-roles/{id}` | SUPER_ADMIN |  |
| `PATCH` | `/admin-roles/{id}/permissions` | SUPER_ADMIN |  |

### GET /admin-roles

**Allowed role(s):** SUPER_ADMIN

**Swagger tag:** Admin Roles / RBAC

**Summary:** —

**Description:** Admin Roles / RBAC manages permission roles for ADMIN staff users only. SUPER_ADMIN has full immutable access and does not depend on AdminRole permissions.

**Parameters:** `search` (query, optional), `isSystem` (query, optional), `isActive` (query, optional)

**Example response:**

```json
{
  "success": true,
  "data": {},
  "message": "Request completed successfully"
}
```

**Common failure responses:** `401` missing/invalid token, `403` role/permission denied, `404` missing owned record when applicable.

### POST /admin-roles

**Allowed role(s):** SUPER_ADMIN

**Swagger tag:** Admin Roles / RBAC

**Summary:** —

**Parameters:** None

**Request DTO:** `CreateAdminRoleDto`

**Request payload example:**

```json
{
  "name": "example",
  "description": "example",
  "permissions": {}
}
```

**Example response:**

```json
{
  "success": true,
  "data": {},
  "message": "Request completed successfully"
}
```

**Common failure responses:** `400` validation/business rule failure, `401` missing/invalid token, `403` role/permission denied, `404` missing owned record.

### GET /permissions/catalog

**Allowed role(s):** SUPER_ADMIN

**Swagger tag:** Admin Roles / RBAC

**Summary:** —

**Description:** Read-only list of backend-supported permission keys that can be assigned to admin roles.

**Parameters:** None

**Example response:**

```json
{
  "success": true,
  "data": {},
  "message": "Request completed successfully"
}
```

**Common failure responses:** `401` missing/invalid token, `403` role/permission denied, `404` missing owned record when applicable.

### GET /admin-roles/{id}

**Allowed role(s):** SUPER_ADMIN

**Swagger tag:** Admin Roles / RBAC

**Summary:** —

**Parameters:** `id` (path, required)

**Example response:**

```json
{
  "success": true,
  "data": {},
  "message": "Request completed successfully"
}
```

**Common failure responses:** `401` missing/invalid token, `403` role/permission denied, `404` missing owned record when applicable.

### PATCH /admin-roles/{id}

**Allowed role(s):** SUPER_ADMIN

**Swagger tag:** Admin Roles / RBAC

**Summary:** —

**Parameters:** `id` (path, required)

**Request DTO:** `UpdateAdminRoleDto`

**Request payload example:**

```json
{
  "name": "example",
  "description": "example",
  "isActive": true
}
```

**Common failure responses:** `400` validation/business rule failure, `401` missing/invalid token, `403` role/permission denied, `404` missing owned record.

### DELETE /admin-roles/{id}

**Allowed role(s):** SUPER_ADMIN

**Swagger tag:** Admin Roles / RBAC

**Summary:** —

**Parameters:** `id` (path, required)

**Common failure responses:** `400` validation/business rule failure, `401` missing/invalid token, `403` role/permission denied, `404` missing owned record.

### PATCH /admin-roles/{id}/permissions

**Allowed role(s):** SUPER_ADMIN

**Swagger tag:** Admin Roles / RBAC

**Summary:** —

**Parameters:** `id` (path, required)

**Request DTO:** `UpdateRolePermissionsDto`

**Request payload example:**

```json
{
  "permissions": {}
}
```

**Common failure responses:** `400` validation/business rule failure, `401` missing/invalid token, `403` role/permission denied, `404` missing owned record.

## User Management

| Method | Path | Roles | Summary |
|---|---|---|---|
| `GET` | `/users` | SUPER_ADMIN, ADMIN | List registered users |
| `GET` | `/users/export` | SUPER_ADMIN, ADMIN |  |
| `GET` | `/users/{id}` | SUPER_ADMIN, ADMIN |  |
| `PATCH` | `/users/{id}` | SUPER_ADMIN, ADMIN |  |
| `GET` | `/users/{id}/activity` | SUPER_ADMIN, ADMIN |  |
| `POST` | `/users/{id}/reset-password` | SUPER_ADMIN, ADMIN |  |
| `GET` | `/users/{id}/stats` | SUPER_ADMIN, ADMIN |  |
| `PATCH` | `/users/{id}/status` | SUPER_ADMIN, ADMIN |  |
| `POST` | `/users/{id}/suspend` | SUPER_ADMIN, ADMIN |  |
| `POST` | `/users/{id}/unsuspend` | SUPER_ADMIN, ADMIN |  |

### GET /users

**Allowed role(s):** SUPER_ADMIN, ADMIN

**Swagger tag:** User Management

**Summary:** List registered users

**Description:** SUPER_ADMIN/ADMIN with users.read permission.

**Parameters:** `page` (query, optional), `limit` (query, optional), `search` (query, optional), `status` (query, optional), `registrationFrom` (query, optional), `registrationTo` (query, optional), `sortBy` (query, optional), `sortOrder` (query, optional)

**Example response:**

```json
{
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
```

**Common failure responses:** `401` missing/invalid token, `403` role/permission denied, `404` missing owned record when applicable.

### GET /users/export

**Allowed role(s):** SUPER_ADMIN, ADMIN

**Swagger tag:** User Management

**Summary:** —

**Parameters:** `search` (query, optional), `status` (query, optional), `registrationFrom` (query, optional), `registrationTo` (query, optional), `format` (query, optional)

**Example response:**

```json
{
  "success": true,
  "data": {},
  "message": "Request completed successfully"
}
```

**Common failure responses:** `401` missing/invalid token, `403` role/permission denied, `404` missing owned record when applicable.

### GET /users/{id}

**Allowed role(s):** SUPER_ADMIN, ADMIN

**Swagger tag:** User Management

**Summary:** —

**Parameters:** `id` (path, required)

**Example response:**

```json
{
  "success": true,
  "data": {},
  "message": "Request completed successfully"
}
```

**Common failure responses:** `401` missing/invalid token, `403` role/permission denied, `404` missing owned record when applicable.

### PATCH /users/{id}

**Allowed role(s):** SUPER_ADMIN, ADMIN

**Swagger tag:** User Management

**Summary:** —

**Parameters:** `id` (path, required)

**Request DTO:** `UpdateRegisteredUserDto`

**Request payload example:**

```json
{
  "firstName": "Alex",
  "lastName": "Johnson",
  "phone": "+15552345678",
  "avatarUrl": "https://<YOUR_PUBLIC_BUCKET_OR_CDN_URL>/user-avatars/avatar.jpg",
  "location": "New York, USA"
}
```

**Common failure responses:** `400` validation/business rule failure, `401` missing/invalid token, `403` role/permission denied, `404` missing owned record.

### GET /users/{id}/activity

**Allowed role(s):** SUPER_ADMIN, ADMIN

**Swagger tag:** User Management

**Summary:** —

**Parameters:** `id` (path, required), `page` (query, optional), `limit` (query, optional), `type` (query, optional)

**Example response:**

```json
{
  "success": true,
  "data": {},
  "message": "Request completed successfully"
}
```

**Common failure responses:** `401` missing/invalid token, `403` role/permission denied, `404` missing owned record when applicable.

### POST /users/{id}/reset-password

**Allowed role(s):** SUPER_ADMIN, ADMIN

**Swagger tag:** User Management

**Summary:** —

**Parameters:** `id` (path, required)

**Request DTO:** `ResetRegisteredUserPasswordDto`

**Request payload example:**

```json
{
  "sendEmail": true
}
```

**Example response:**

```json
{
  "success": true,
  "data": {},
  "message": "Request completed successfully"
}
```

**Common failure responses:** `400` validation/business rule failure, `401` missing/invalid token, `403` role/permission denied, `404` missing owned record.

### GET /users/{id}/stats

**Allowed role(s):** SUPER_ADMIN, ADMIN

**Swagger tag:** User Management

**Summary:** —

**Parameters:** `id` (path, required)

**Example response:**

```json
{
  "success": true,
  "data": {},
  "message": "Request completed successfully"
}
```

**Common failure responses:** `401` missing/invalid token, `403` role/permission denied, `404` missing owned record when applicable.

### PATCH /users/{id}/status

**Allowed role(s):** SUPER_ADMIN, ADMIN

**Swagger tag:** User Management

**Summary:** —

**Parameters:** `id` (path, required)

**Request DTO:** `UpdateRegisteredUserStatusDto`

**Request payload example:**

```json
{
  "status": "ACTIVE",
  "reason": "POLICY_VIOLATION",
  "comment": "Suspicious activity detected on this account.",
  "notifyUser": true
}
```

**Common failure responses:** `400` validation/business rule failure, `401` missing/invalid token, `403` role/permission denied, `404` missing owned record.

### POST /users/{id}/suspend

**Allowed role(s):** SUPER_ADMIN, ADMIN

**Swagger tag:** User Management

**Summary:** —

**Parameters:** `id` (path, required)

**Request DTO:** `SuspendRegisteredUserDto`

**Request payload example:**

```json
{
  "reason": "POLICY_VIOLATION",
  "comment": "Suspicious account activity.",
  "notifyUser": true
}
```

**Example response:**

```json
{
  "success": true,
  "data": {},
  "message": "Request completed successfully"
}
```

**Common failure responses:** `400` validation/business rule failure, `401` missing/invalid token, `403` role/permission denied, `404` missing owned record.

### POST /users/{id}/unsuspend

**Allowed role(s):** SUPER_ADMIN, ADMIN

**Swagger tag:** User Management

**Summary:** —

**Parameters:** `id` (path, required)

**Request DTO:** `UnsuspendRegisteredUserDto`

**Request payload example:**

```json
{
  "comment": "Account reviewed and restored.",
  "notifyUser": true
}
```

**Example response:**

```json
{
  "success": true,
  "data": {},
  "message": "Request completed successfully"
}
```

**Common failure responses:** `400` validation/business rule failure, `401` missing/invalid token, `403` role/permission denied, `404` missing owned record.

## Provider Management

| Method | Path | Roles | Summary |
|---|---|---|---|
| `GET` | `/provider-business-categories` | PUBLIC/UNSPECIFIED | List active provider business categories |
| `POST` | `/provider-business-categories` | SUPER_ADMIN, ADMIN | Create provider business category |
| `GET` | `/providers` | SUPER_ADMIN, ADMIN | List providers |
| `POST` | `/providers` | SUPER_ADMIN, ADMIN |  |
| `GET` | `/providers/export` | SUPER_ADMIN, ADMIN |  |
| `GET` | `/providers/lookup` | SUPER_ADMIN, ADMIN |  |
| `GET` | `/providers/stats` | SUPER_ADMIN, ADMIN |  |
| `GET` | `/provider-business-categories/{id}` | SUPER_ADMIN, ADMIN | Fetch provider business category details |
| `PATCH` | `/provider-business-categories/{id}` | SUPER_ADMIN, ADMIN | Update provider business category |
| `DELETE` | `/provider-business-categories/{id}` | SUPER_ADMIN, ADMIN | Soft-delete provider business category |
| `GET` | `/providers/{id}` | SUPER_ADMIN, ADMIN |  |
| `PATCH` | `/providers/{id}` | SUPER_ADMIN, ADMIN |  |
| `GET` | `/providers/{id}/activity` | SUPER_ADMIN, ADMIN |  |
| `PATCH` | `/providers/{id}/approve` | SUPER_ADMIN, ADMIN |  |
| `GET` | `/providers/{id}/items` | SUPER_ADMIN, ADMIN |  |
| `POST` | `/providers/{id}/message` | SUPER_ADMIN, ADMIN |  |
| `PATCH` | `/providers/{id}/reject` | SUPER_ADMIN, ADMIN |  |
| `PATCH` | `/providers/{id}/status` | SUPER_ADMIN, ADMIN |  |
| `POST` | `/providers/{id}/suspend` | SUPER_ADMIN, ADMIN |  |
| `POST` | `/providers/{id}/unsuspend` | SUPER_ADMIN, ADMIN |  |

### GET /provider-business-categories

**Allowed role(s):** PUBLIC/UNSPECIFIED

**Swagger tag:** Provider Management

**Summary:** List active provider business categories

**Description:** Public signup dropdown. Returns active, non-deleted provider business categories only.

**Parameters:** `page` (query, optional), `limit` (query, optional), `search` (query, optional), `isActive` (query, optional)

**Example response:**

```json
{
  "success": true,
  "data": {},
  "message": "Request completed successfully"
}
```

**Common failure responses:** `401` missing/invalid token, `403` role/permission denied, `404` missing owned record when applicable.

### POST /provider-business-categories

**Allowed role(s):** SUPER_ADMIN, ADMIN

**Swagger tag:** Provider Management

**Summary:** Create provider business category

**Description:** SUPER_ADMIN or ADMIN with providerBusinessCategories.create permission only.

**Parameters:** None

**Request DTO:** `CreateProviderBusinessCategoryDto`

**Request payload example:**

```json
{
  "name": "example",
  "description": "example",
  "iconKey": "example",
  "sortOrder": 100,
  "isActive": true
}
```

**Example response:**

```json
{
  "success": true,
  "data": {},
  "message": "Request completed successfully"
}
```

**Common failure responses:** `400` validation/business rule failure, `401` missing/invalid token, `403` role/permission denied, `404` missing owned record.

### GET /providers

**Allowed role(s):** SUPER_ADMIN, ADMIN

**Swagger tag:** Provider Management

**Summary:** List providers

**Description:** SUPER_ADMIN/ADMIN with providers.read permission.

**Parameters:** `page` (query, optional), `limit` (query, optional), `search` (query, optional), `status` (query, optional), `approvalStatus` (query, optional), `sortBy` (query, optional), `sortOrder` (query, optional)

**Example response:**

```json
{
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
```

**Common failure responses:** `401` missing/invalid token, `403` role/permission denied, `404` missing owned record when applicable.

### POST /providers

**Allowed role(s):** SUPER_ADMIN, ADMIN

**Swagger tag:** Provider Management

**Summary:** —

**Parameters:** None

**Request DTO:** `CreateProviderDto`

**Request payload example:**

```json
{
  "businessName": "Gifts & Blooms Co. Ltd",
  "email": "contact@giftsandblooms.com",
  "phone": "+15551234567",
  "serviceArea": "New York, USA",
  "headquarters": "New York, USA",
  "documentUrls": [
    "example"
  ],
  "generateTemporaryPassword": true,
  "mustChangePassword": true,
  "approvalStatus": "PENDING",
  "isActive": true
}
```

**Example response:**

```json
{
  "success": true,
  "data": {},
  "message": "Request completed successfully"
}
```

**Common failure responses:** `400` validation/business rule failure, `401` missing/invalid token, `403` role/permission denied, `404` missing owned record.

### GET /providers/export

**Allowed role(s):** SUPER_ADMIN, ADMIN

**Swagger tag:** Provider Management

**Summary:** —

**Parameters:** `search` (query, optional), `status` (query, optional), `approvalStatus` (query, optional), `format` (query, optional)

**Example response:**

```json
{
  "success": true,
  "data": {},
  "message": "Request completed successfully"
}
```

**Common failure responses:** `401` missing/invalid token, `403` role/permission denied, `404` missing owned record when applicable.

### GET /providers/lookup

**Allowed role(s):** SUPER_ADMIN, ADMIN

**Swagger tag:** Provider Management

**Summary:** —

**Parameters:** `search` (query, optional), `approvalStatus` (query, optional), `isActive` (query, optional), `limit` (query, optional)

**Example response:**

```json
{
  "success": true,
  "data": {},
  "message": "Request completed successfully"
}
```

**Common failure responses:** `401` missing/invalid token, `403` role/permission denied, `404` missing owned record when applicable.

### GET /providers/stats

**Allowed role(s):** SUPER_ADMIN, ADMIN

**Swagger tag:** Provider Management

**Summary:** —

**Parameters:** None

**Example response:**

```json
{
  "success": true,
  "data": {},
  "message": "Request completed successfully"
}
```

**Common failure responses:** `401` missing/invalid token, `403` role/permission denied, `404` missing owned record when applicable.

### GET /provider-business-categories/{id}

**Allowed role(s):** SUPER_ADMIN, ADMIN

**Swagger tag:** Provider Management

**Summary:** Fetch provider business category details

**Description:** SUPER_ADMIN or ADMIN with providerBusinessCategories.read permission only.

**Parameters:** `id` (path, required)

**Example response:**

```json
{
  "success": true,
  "data": {},
  "message": "Request completed successfully"
}
```

**Common failure responses:** `401` missing/invalid token, `403` role/permission denied, `404` missing owned record when applicable.

### PATCH /provider-business-categories/{id}

**Allowed role(s):** SUPER_ADMIN, ADMIN

**Swagger tag:** Provider Management

**Summary:** Update provider business category

**Description:** SUPER_ADMIN or ADMIN with providerBusinessCategories.update permission only.

**Parameters:** `id` (path, required)

**Request DTO:** `UpdateProviderBusinessCategoryDto`

**Request payload example:**

```json
{
  "name": "example",
  "description": "example",
  "iconKey": "example",
  "sortOrder": 100,
  "isActive": true
}
```

**Common failure responses:** `400` validation/business rule failure, `401` missing/invalid token, `403` role/permission denied, `404` missing owned record.

### DELETE /provider-business-categories/{id}

**Allowed role(s):** SUPER_ADMIN, ADMIN

**Swagger tag:** Provider Management

**Summary:** Soft-delete provider business category

**Description:** SUPER_ADMIN or ADMIN with providerBusinessCategories.delete permission only. Refuses deletion when active providers are attached.

**Parameters:** `id` (path, required)

**Common failure responses:** `400` validation/business rule failure, `401` missing/invalid token, `403` role/permission denied, `404` missing owned record.

### GET /providers/{id}

**Allowed role(s):** SUPER_ADMIN, ADMIN

**Swagger tag:** Provider Management

**Summary:** —

**Parameters:** `id` (path, required)

**Example response:**

```json
{
  "success": true,
  "data": {},
  "message": "Request completed successfully"
}
```

**Common failure responses:** `401` missing/invalid token, `403` role/permission denied, `404` missing owned record when applicable.

### PATCH /providers/{id}

**Allowed role(s):** SUPER_ADMIN, ADMIN

**Swagger tag:** Provider Management

**Summary:** —

**Parameters:** `id` (path, required)

**Request DTO:** `UpdateProviderDto`

**Request payload example:**

```json
{
  "businessName": "Gifts & Blooms Co. Ltd",
  "phone": "+15551234567",
  "serviceArea": "New York, USA",
  "headquarters": "New York, USA",
  "avatarUrl": "https://<YOUR_PUBLIC_BUCKET_OR_CDN_URL>/provider-logos/logo.png",
  "documentUrls": [
    "example"
  ]
}
```

**Common failure responses:** `400` validation/business rule failure, `401` missing/invalid token, `403` role/permission denied, `404` missing owned record.

### GET /providers/{id}/activity

**Allowed role(s):** SUPER_ADMIN, ADMIN

**Swagger tag:** Provider Management

**Summary:** —

**Parameters:** `id` (path, required), `page` (query, optional), `limit` (query, optional), `type` (query, optional)

**Example response:**

```json
{
  "success": true,
  "data": {},
  "message": "Request completed successfully"
}
```

**Common failure responses:** `401` missing/invalid token, `403` role/permission denied, `404` missing owned record when applicable.

### PATCH /providers/{id}/approve

**Allowed role(s):** SUPER_ADMIN, ADMIN

**Swagger tag:** Provider Management

**Summary:** —

**Parameters:** `id` (path, required)

**Request DTO:** `ApproveProviderDto`

**Request payload example:**

```json
{
  "comment": "Documents verified successfully.",
  "notifyProvider": true
}
```

**Common failure responses:** `400` validation/business rule failure, `401` missing/invalid token, `403` role/permission denied, `404` missing owned record.

### GET /providers/{id}/items

**Allowed role(s):** SUPER_ADMIN, ADMIN

**Swagger tag:** Provider Management

**Summary:** —

**Parameters:** `id` (path, required), `page` (query, optional), `limit` (query, optional), `search` (query, optional), `status` (query, optional), `sortBy` (query, optional), `sortOrder` (query, optional)

**Example response:**

```json
{
  "success": true,
  "data": {},
  "message": "Request completed successfully"
}
```

**Common failure responses:** `401` missing/invalid token, `403` role/permission denied, `404` missing owned record when applicable.

### POST /providers/{id}/message

**Allowed role(s):** SUPER_ADMIN, ADMIN

**Swagger tag:** Provider Management

**Summary:** —

**Parameters:** `id` (path, required)

**Request DTO:** `MessageProviderDto`

**Request payload example:**

```json
{
  "subject": "Account update",
  "message": "Please update your business documents.",
  "channel": "EMAIL"
}
```

**Example response:**

```json
{
  "success": true,
  "data": {},
  "message": "Request completed successfully"
}
```

**Common failure responses:** `400` validation/business rule failure, `401` missing/invalid token, `403` role/permission denied, `404` missing owned record.

### PATCH /providers/{id}/reject

**Allowed role(s):** SUPER_ADMIN, ADMIN

**Swagger tag:** Provider Management

**Summary:** —

**Parameters:** `id` (path, required)

**Request DTO:** `RejectProviderDto`

**Request payload example:**

```json
{
  "reason": "INCOMPLETE_DOCUMENTS",
  "comment": "Business license document is missing.",
  "notifyProvider": true
}
```

**Common failure responses:** `400` validation/business rule failure, `401` missing/invalid token, `403` role/permission denied, `404` missing owned record.

### PATCH /providers/{id}/status

**Allowed role(s):** SUPER_ADMIN, ADMIN

**Swagger tag:** Provider Management

**Summary:** —

**Parameters:** `id` (path, required)

**Request DTO:** `UpdateProviderStatusDto`

**Request payload example:**

```json
{
  "status": "ACTIVE",
  "reason": "POLICY_VIOLATION",
  "comment": "Provider violated platform policy.",
  "notifyProvider": true
}
```

**Common failure responses:** `400` validation/business rule failure, `401` missing/invalid token, `403` role/permission denied, `404` missing owned record.

### POST /providers/{id}/suspend

**Allowed role(s):** SUPER_ADMIN, ADMIN

**Swagger tag:** Provider Management

**Summary:** —

**Parameters:** `id` (path, required)

**Request DTO:** `UpdateProviderStatusDto`

**Request payload example:**

```json
{
  "status": "ACTIVE",
  "reason": "POLICY_VIOLATION",
  "comment": "Provider violated platform policy.",
  "notifyProvider": true
}
```

**Example response:**

```json
{
  "success": true,
  "data": {},
  "message": "Request completed successfully"
}
```

**Common failure responses:** `400` validation/business rule failure, `401` missing/invalid token, `403` role/permission denied, `404` missing owned record.

### POST /providers/{id}/unsuspend

**Allowed role(s):** SUPER_ADMIN, ADMIN

**Swagger tag:** Provider Management

**Summary:** —

**Parameters:** `id` (path, required)

**Request DTO:** `UpdateProviderStatusDto`

**Request payload example:**

```json
{
  "status": "ACTIVE",
  "reason": "POLICY_VIOLATION",
  "comment": "Provider violated platform policy.",
  "notifyProvider": true
}
```

**Example response:**

```json
{
  "success": true,
  "data": {},
  "message": "Request completed successfully"
}
```

**Common failure responses:** `400` validation/business rule failure, `401` missing/invalid token, `403` role/permission denied, `404` missing owned record.

## Provider Inventory

| Method | Path | Roles | Summary |
|---|---|---|---|
| `GET` | `/provider/inventory` | PROVIDER | List provider inventory items |
| `POST` | `/provider/inventory` | PROVIDER | Create provider inventory item with optional nested variants |
| `GET` | `/provider/inventory/lookup` | PROVIDER | Lookup active approved provider inventory items |
| `GET` | `/provider/inventory/stats` | PROVIDER | Fetch provider inventory stats |
| `GET` | `/provider/inventory/{id}` | PROVIDER | Fetch own provider inventory item details |
| `PATCH` | `/provider/inventory/{id}` | PROVIDER | Update own provider inventory item and upsert variants |
| `DELETE` | `/provider/inventory/{id}` | PROVIDER | Soft-delete own inventory item |
| `PATCH` | `/provider/inventory/{id}/availability` | PROVIDER | Update own inventory availability |

### GET /provider/inventory

**Allowed role(s):** PROVIDER

**Swagger tag:** Provider Inventory

**Summary:** List provider inventory items

**Description:** PROVIDER only. Returns only inventory owned by the authenticated provider.

**Parameters:** `page` (query, optional), `limit` (query, optional), `search` (query, optional), `status` (query, optional), `categoryId` (query, optional), `sortBy` (query, optional), `sortOrder` (query, optional)

**Example response:**

```json
{
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
```

**Common failure responses:** `401` missing/invalid token, `403` role/permission denied, `404` missing owned record when applicable.

### POST /provider/inventory

**Allowed role(s):** PROVIDER

**Swagger tag:** Provider Inventory

**Summary:** Create provider inventory item with optional nested variants

**Description:** PROVIDER only. providerId is derived from JWT; provider cannot approve/publish variants directly.

**Parameters:** None

**Request DTO:** `CreateProviderInventoryItemDto`

**Request payload example:**

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

**Example response:**

```json
{
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
```

**Common failure responses:** `400` validation/business rule failure, `401` missing/invalid token, `403` role/permission denied, `404` missing owned record.

### GET /provider/inventory/lookup

**Allowed role(s):** PROVIDER

**Swagger tag:** Provider Inventory

**Summary:** Lookup active approved provider inventory items

**Parameters:** None

**Example response:**

```json
{
  "success": true,
  "data": {},
  "message": "Request completed successfully"
}
```

**Common failure responses:** `401` missing/invalid token, `403` role/permission denied, `404` missing owned record when applicable.

### GET /provider/inventory/stats

**Allowed role(s):** PROVIDER

**Swagger tag:** Provider Inventory

**Summary:** Fetch provider inventory stats

**Parameters:** None

**Example response:**

```json
{
  "success": true,
  "data": {},
  "message": "Request completed successfully"
}
```

**Common failure responses:** `401` missing/invalid token, `403` role/permission denied, `404` missing owned record when applicable.

### GET /provider/inventory/{id}

**Allowed role(s):** PROVIDER

**Swagger tag:** Provider Inventory

**Summary:** Fetch own provider inventory item details

**Parameters:** `id` (path, required)

**Example response:**

```json
{
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
```

**Common failure responses:** `401` missing/invalid token, `403` role/permission denied, `404` missing owned record when applicable.

### PATCH /provider/inventory/{id}

**Allowed role(s):** PROVIDER

**Swagger tag:** Provider Inventory

**Summary:** Update own provider inventory item and upsert variants

**Description:** Variant id must belong to the provider-owned gift. Material variant changes re-submit approved gifts for moderation; stock-only changes do not.

**Parameters:** `id` (path, required)

**Request DTO:** `UpdateProviderInventoryItemDto`

**Request payload example:**

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

**Common failure responses:** `400` validation/business rule failure, `401` missing/invalid token, `403` role/permission denied, `404` missing owned record.

### DELETE /provider/inventory/{id}

**Allowed role(s):** PROVIDER

**Swagger tag:** Provider Inventory

**Summary:** Soft-delete own inventory item

**Parameters:** `id` (path, required)

**Common failure responses:** `400` validation/business rule failure, `401` missing/invalid token, `403` role/permission denied, `404` missing owned record.

### PATCH /provider/inventory/{id}/availability

**Allowed role(s):** PROVIDER

**Swagger tag:** Provider Inventory

**Summary:** Update own inventory availability

**Parameters:** `id` (path, required)

**Request DTO:** `UpdateProviderAvailabilityDto`

**Request payload example:**

```json
{
  "isAvailable": true
}
```

**Common failure responses:** `400` validation/business rule failure, `401` missing/invalid token, `403` role/permission denied, `404` missing owned record.

## Provider Promotional Offers

| Method | Path | Roles | Summary |
|---|---|---|---|
| `GET` | `/provider/offers` | PROVIDER |  |
| `POST` | `/provider/offers` | PROVIDER |  |
| `GET` | `/provider/offers/{id}` | PROVIDER |  |
| `PATCH` | `/provider/offers/{id}` | PROVIDER |  |
| `DELETE` | `/provider/offers/{id}` | PROVIDER |  |
| `PATCH` | `/provider/offers/{id}/status` | PROVIDER |  |

### GET /provider/offers

**Allowed role(s):** PROVIDER

**Swagger tag:** Provider Promotional Offers

**Summary:** —

**Parameters:** `page` (query, optional), `limit` (query, optional), `search` (query, optional), `status` (query, optional), `itemId` (query, optional), `sortBy` (query, optional), `sortOrder` (query, optional)

**Example response:**

```json
{
  "success": true,
  "data": {},
  "message": "Request completed successfully"
}
```

**Common failure responses:** `401` missing/invalid token, `403` role/permission denied, `404` missing owned record when applicable.

### POST /provider/offers

**Allowed role(s):** PROVIDER

**Swagger tag:** Provider Promotional Offers

**Summary:** —

**Parameters:** None

**Request DTO:** `CreateProviderOfferDto`

**Request payload example:**

```json
{
  "itemId": "example",
  "title": "example",
  "description": "example",
  "discountType": "PERCENTAGE",
  "discountValue": 100,
  "startDate": "example",
  "endDate": "example",
  "eligibilityRules": "example",
  "isActive": true
}
```

**Example response:**

```json
{
  "success": true,
  "data": {},
  "message": "Request completed successfully"
}
```

**Common failure responses:** `400` validation/business rule failure, `401` missing/invalid token, `403` role/permission denied, `404` missing owned record.

### GET /provider/offers/{id}

**Allowed role(s):** PROVIDER

**Swagger tag:** Provider Promotional Offers

**Summary:** —

**Parameters:** `id` (path, required)

**Example response:**

```json
{
  "success": true,
  "data": {},
  "message": "Request completed successfully"
}
```

**Common failure responses:** `401` missing/invalid token, `403` role/permission denied, `404` missing owned record when applicable.

### PATCH /provider/offers/{id}

**Allowed role(s):** PROVIDER

**Swagger tag:** Provider Promotional Offers

**Summary:** —

**Parameters:** `id` (path, required)

**Request DTO:** `UpdatePromotionalOfferDto`

**Request payload example:**

```json
{
  "title": "example",
  "description": "example",
  "discountType": "PERCENTAGE",
  "discountValue": 100,
  "startDate": "example",
  "endDate": "example",
  "eligibilityRules": "example",
  "isActive": true
}
```

**Common failure responses:** `400` validation/business rule failure, `401` missing/invalid token, `403` role/permission denied, `404` missing owned record.

### DELETE /provider/offers/{id}

**Allowed role(s):** PROVIDER

**Swagger tag:** Provider Promotional Offers

**Summary:** —

**Parameters:** `id` (path, required)

**Common failure responses:** `400` validation/business rule failure, `401` missing/invalid token, `403` role/permission denied, `404` missing owned record.

### PATCH /provider/offers/{id}/status

**Allowed role(s):** PROVIDER

**Swagger tag:** Provider Promotional Offers

**Summary:** —

**Parameters:** `id` (path, required)

**Request DTO:** `UpdateOfferStatusDto`

**Request payload example:**

```json
{
  "isActive": true,
  "reason": "example"
}
```

**Common failure responses:** `400` validation/business rule failure, `401` missing/invalid token, `403` role/permission denied, `404` missing owned record.

## Promotional Offers Management

| Method | Path | Roles | Summary |
|---|---|---|---|
| `GET` | `/promotional-offers` | SUPER_ADMIN, ADMIN |  |
| `POST` | `/promotional-offers` | SUPER_ADMIN, ADMIN |  |
| `GET` | `/promotional-offers/export` | SUPER_ADMIN, ADMIN |  |
| `GET` | `/promotional-offers/stats` | SUPER_ADMIN, ADMIN |  |
| `GET` | `/promotional-offers/{id}` | SUPER_ADMIN, ADMIN |  |
| `PATCH` | `/promotional-offers/{id}` | SUPER_ADMIN, ADMIN |  |
| `DELETE` | `/promotional-offers/{id}` | SUPER_ADMIN, ADMIN |  |
| `PATCH` | `/promotional-offers/{id}/approve` | SUPER_ADMIN, ADMIN |  |
| `PATCH` | `/promotional-offers/{id}/reject` | SUPER_ADMIN, ADMIN |  |
| `PATCH` | `/promotional-offers/{id}/status` | SUPER_ADMIN, ADMIN |  |

### GET /promotional-offers

**Allowed role(s):** SUPER_ADMIN, ADMIN

**Swagger tag:** Promotional Offers Management

**Summary:** —

**Parameters:** `page` (query, optional), `limit` (query, optional), `search` (query, optional), `status` (query, optional), `itemId` (query, optional), `sortBy` (query, optional), `sortOrder` (query, optional), `providerId` (query, optional), `approvalStatus` (query, optional), `discountType` (query, optional), `startFrom` (query, optional), `startTo` (query, optional)

**Example response:**

```json
{
  "success": true,
  "data": {},
  "message": "Request completed successfully"
}
```

**Common failure responses:** `401` missing/invalid token, `403` role/permission denied, `404` missing owned record when applicable.

### POST /promotional-offers

**Allowed role(s):** SUPER_ADMIN, ADMIN

**Swagger tag:** Promotional Offers Management

**Summary:** —

**Parameters:** None

**Request DTO:** `CreateAdminOfferDto`

**Request payload example:**

```json
{
  "itemId": "example",
  "title": "example",
  "description": "example",
  "discountType": "PERCENTAGE",
  "discountValue": 100,
  "startDate": "example",
  "endDate": "example",
  "eligibilityRules": "example",
  "isActive": true,
  "providerId": "example",
  "approvalStatus": "PENDING"
}
```

**Example response:**

```json
{
  "success": true,
  "data": {},
  "message": "Request completed successfully"
}
```

**Common failure responses:** `400` validation/business rule failure, `401` missing/invalid token, `403` role/permission denied, `404` missing owned record.

### GET /promotional-offers/export

**Allowed role(s):** SUPER_ADMIN, ADMIN

**Swagger tag:** Promotional Offers Management

**Summary:** —

**Parameters:** `page` (query, optional), `limit` (query, optional), `search` (query, optional), `status` (query, optional), `itemId` (query, optional), `sortBy` (query, optional), `sortOrder` (query, optional), `providerId` (query, optional), `approvalStatus` (query, optional), `discountType` (query, optional), `startFrom` (query, optional), `startTo` (query, optional)

**Example response:**

```json
{
  "success": true,
  "data": {},
  "message": "Request completed successfully"
}
```

**Common failure responses:** `401` missing/invalid token, `403` role/permission denied, `404` missing owned record when applicable.

### GET /promotional-offers/stats

**Allowed role(s):** SUPER_ADMIN, ADMIN

**Swagger tag:** Promotional Offers Management

**Summary:** —

**Parameters:** None

**Example response:**

```json
{
  "success": true,
  "data": {},
  "message": "Request completed successfully"
}
```

**Common failure responses:** `401` missing/invalid token, `403` role/permission denied, `404` missing owned record when applicable.

### GET /promotional-offers/{id}

**Allowed role(s):** SUPER_ADMIN, ADMIN

**Swagger tag:** Promotional Offers Management

**Summary:** —

**Parameters:** `id` (path, required)

**Example response:**

```json
{
  "success": true,
  "data": {},
  "message": "Request completed successfully"
}
```

**Common failure responses:** `401` missing/invalid token, `403` role/permission denied, `404` missing owned record when applicable.

### PATCH /promotional-offers/{id}

**Allowed role(s):** SUPER_ADMIN, ADMIN

**Swagger tag:** Promotional Offers Management

**Summary:** —

**Parameters:** `id` (path, required)

**Request DTO:** `UpdatePromotionalOfferDto`

**Request payload example:**

```json
{
  "title": "example",
  "description": "example",
  "discountType": "PERCENTAGE",
  "discountValue": 100,
  "startDate": "example",
  "endDate": "example",
  "eligibilityRules": "example",
  "isActive": true
}
```

**Common failure responses:** `400` validation/business rule failure, `401` missing/invalid token, `403` role/permission denied, `404` missing owned record.

### DELETE /promotional-offers/{id}

**Allowed role(s):** SUPER_ADMIN, ADMIN

**Swagger tag:** Promotional Offers Management

**Summary:** —

**Parameters:** `id` (path, required)

**Common failure responses:** `400` validation/business rule failure, `401` missing/invalid token, `403` role/permission denied, `404` missing owned record.

### PATCH /promotional-offers/{id}/approve

**Allowed role(s):** SUPER_ADMIN, ADMIN

**Swagger tag:** Promotional Offers Management

**Summary:** —

**Parameters:** `id` (path, required)

**Request DTO:** `ApproveOfferDto`

**Request payload example:**

```json
{
  "comment": "example",
  "notifyProvider": true
}
```

**Common failure responses:** `400` validation/business rule failure, `401` missing/invalid token, `403` role/permission denied, `404` missing owned record.

### PATCH /promotional-offers/{id}/reject

**Allowed role(s):** SUPER_ADMIN, ADMIN

**Swagger tag:** Promotional Offers Management

**Summary:** —

**Parameters:** `id` (path, required)

**Request DTO:** `RejectOfferDto`

**Request payload example:**

```json
{
  "reason": "INVALID_DISCOUNT",
  "comment": "example",
  "notifyProvider": true
}
```

**Common failure responses:** `400` validation/business rule failure, `401` missing/invalid token, `403` role/permission denied, `404` missing owned record.

### PATCH /promotional-offers/{id}/status

**Allowed role(s):** SUPER_ADMIN, ADMIN

**Swagger tag:** Promotional Offers Management

**Summary:** —

**Parameters:** `id` (path, required)

**Request DTO:** `UpdateOfferStatusDto`

**Request payload example:**

```json
{
  "isActive": true,
  "reason": "example"
}
```

**Common failure responses:** `400` validation/business rule failure, `401` missing/invalid token, `403` role/permission denied, `404` missing owned record.

## Gift Categories

| Method | Path | Roles | Summary |
|---|---|---|---|
| `GET` | `/gift-categories` | SUPER_ADMIN, ADMIN | List gift categories |
| `POST` | `/gift-categories` | SUPER_ADMIN, ADMIN | Create gift category |
| `GET` | `/gift-categories/lookup` | PUBLIC/UNSPECIFIED | Lookup active gift categories |
| `GET` | `/gift-categories/stats` | SUPER_ADMIN, ADMIN | Fetch gift category stats |
| `GET` | `/gift-categories/{id}` | SUPER_ADMIN, ADMIN | Fetch gift category details |
| `PATCH` | `/gift-categories/{id}` | SUPER_ADMIN, ADMIN | Update gift category |
| `DELETE` | `/gift-categories/{id}` | SUPER_ADMIN, ADMIN | Soft-delete gift category |

### GET /gift-categories

**Allowed role(s):** SUPER_ADMIN, ADMIN

**Swagger tag:** Gift Categories

**Summary:** List gift categories

**Description:** RBAC permission: giftCategories.read. Returns soft-delete-filtered categories with gift counts and category media fields.

**Parameters:** `page` (query, optional), `limit` (query, optional), `search` (query, optional), `isActive` (query, optional), `sortBy` (query, optional), `sortOrder` (query, optional)

**Example response:**

```json
{
  "success": true,
  "data": {},
  "message": "Gift categories fetched successfully"
}
```

**Common failure responses:** `401` missing/invalid token, `403` role/permission denied, `404` missing owned record when applicable.

### POST /gift-categories

**Allowed role(s):** SUPER_ADMIN, ADMIN

**Swagger tag:** Gift Categories

**Summary:** Create gift category

**Description:** RBAC permission: giftCategories.create. Slug is auto-generated and unique. backgroundColor defaults to #F3E8FF; color remains a backward-compatible alias.

**Parameters:** None

**Request DTO:** `CreateGiftCategoryDto`

**Request payload example:**

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

**Example response:**

```json
{
  "success": true,
  "data": {},
  "message": "Gift category created successfully"
}
```

**Common failure responses:** `400` validation/business rule failure, `401` missing/invalid token, `403` role/permission denied, `404` missing owned record.

### GET /gift-categories/lookup

**Allowed role(s):** PUBLIC/UNSPECIFIED

**Swagger tag:** Gift Categories

**Summary:** Lookup active gift categories

**Description:** Public lookup under Gift Categories. Returns active category identifiers and media fields for lightweight selectors.

**Parameters:** None

**Example response:**

```json
{
  "success": true,
  "data": {},
  "message": "Gift category lookup fetched successfully"
}
```

**Common failure responses:** `401` missing/invalid token, `403` role/permission denied, `404` missing owned record when applicable.

### GET /gift-categories/stats

**Allowed role(s):** SUPER_ADMIN, ADMIN

**Swagger tag:** Gift Categories

**Summary:** Fetch gift category stats

**Description:** RBAC permission: giftCategories.read. Returns admin category inventory counters.

**Parameters:** None

**Example response:**

```json
{
  "success": true,
  "data": {},
  "message": "Request completed successfully"
}
```

**Common failure responses:** `401` missing/invalid token, `403` role/permission denied, `404` missing owned record when applicable.

### GET /gift-categories/{id}

**Allowed role(s):** SUPER_ADMIN, ADMIN

**Swagger tag:** Gift Categories

**Summary:** Fetch gift category details

**Description:** RBAC permission: giftCategories.read. Includes backgroundColor and imageUrl for customer app design support.

**Parameters:** `id` (path, required)

**Example response:**

```json
{
  "success": true,
  "data": {},
  "message": "Gift category details fetched successfully"
}
```

**Common failure responses:** `401` missing/invalid token, `403` role/permission denied, `404` missing owned record when applicable.

### PATCH /gift-categories/{id}

**Allowed role(s):** SUPER_ADMIN, ADMIN

**Swagger tag:** Gift Categories

**Summary:** Update gift category

**Description:** RBAC permission: giftCategories.update. Slug is regenerated when name changes. Soft-deleted categories are not updated.

**Parameters:** `id` (path, required)

**Request DTO:** `UpdateGiftCategoryDto`

**Request payload example:**

```json
{
  "backgroundColor": "#F3E8FF",
  "imageUrl": "https://<YOUR_PUBLIC_BUCKET_OR_CDN_URL>/gift-category-images/perfumes.png",
  "isActive": true
}
```

**Common failure responses:** `400` validation/business rule failure, `401` missing/invalid token, `403` role/permission denied, `404` missing owned record.

### DELETE /gift-categories/{id}

**Allowed role(s):** SUPER_ADMIN, ADMIN

**Swagger tag:** Gift Categories

**Summary:** Soft-delete gift category

**Description:** RBAC permission: giftCategories.delete. Categories with attached gifts cannot be deleted; delete writes an audit log.

**Parameters:** `id` (path, required)

**Common failure responses:** `400` validation/business rule failure, `401` missing/invalid token, `403` role/permission denied, `404` missing owned record.

## Gift Management

| Method | Path | Roles | Summary |
|---|---|---|---|
| `GET` | `/gifts` | SUPER_ADMIN, ADMIN | List admin gifts |
| `POST` | `/gifts` | SUPER_ADMIN, ADMIN | Create admin gift with optional nested variants |
| `GET` | `/gifts/export` | SUPER_ADMIN, ADMIN | Export gift inventory |
| `GET` | `/gifts/stats` | SUPER_ADMIN, ADMIN | Fetch gift inventory stats |
| `GET` | `/gifts/{id}` | SUPER_ADMIN, ADMIN | Fetch admin gift details with variants |
| `PATCH` | `/gifts/{id}` | SUPER_ADMIN, ADMIN | Update admin gift and upsert nested variants |
| `DELETE` | `/gifts/{id}` | SUPER_ADMIN, ADMIN | Soft-delete gift |
| `PATCH` | `/gifts/{id}/status` | SUPER_ADMIN, ADMIN | Update gift status |

### GET /gifts

**Allowed role(s):** SUPER_ADMIN, ADMIN

**Swagger tag:** Gift Management

**Summary:** List admin gifts

**Description:** SUPER_ADMIN/ADMIN with gifts.read. Supports category/provider/status/moderation filters.

**Parameters:** `page` (query, optional), `limit` (query, optional), `search` (query, optional), `categoryId` (query, optional), `providerId` (query, optional), `status` (query, optional), `moderationStatus` (query, optional), `isPublished` (query, optional), `sortBy` (query, optional), `sortOrder` (query, optional)

**Example response:**

```json
{
  "success": true,
  "data": {},
  "message": "Request completed successfully"
}
```

**Common failure responses:** `401` missing/invalid token, `403` role/permission denied, `404` missing owned record when applicable.

### POST /gifts

**Allowed role(s):** SUPER_ADMIN, ADMIN

**Swagger tag:** Gift Management

**Summary:** Create admin gift with optional nested variants

**Description:** SUPER_ADMIN/ADMIN with gifts.create. Nested variants are created in the same transaction and stored in GiftVariant.

**Parameters:** None

**Request DTO:** `CreateGiftDto`

**Request payload example:**

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

**Example response:**

```json
{
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
```

**Common failure responses:** `400` validation/business rule failure, `401` missing/invalid token, `403` role/permission denied, `404` missing owned record.

### GET /gifts/export

**Allowed role(s):** SUPER_ADMIN, ADMIN

**Swagger tag:** Gift Management

**Summary:** Export gift inventory

**Parameters:** `page` (query, optional), `limit` (query, optional), `search` (query, optional), `categoryId` (query, optional), `providerId` (query, optional), `status` (query, optional), `moderationStatus` (query, optional), `isPublished` (query, optional), `sortBy` (query, optional), `sortOrder` (query, optional), `format` (query, optional)

**Example response:**

```json
{
  "success": true,
  "data": {},
  "message": "Request completed successfully"
}
```

**Common failure responses:** `401` missing/invalid token, `403` role/permission denied, `404` missing owned record when applicable.

### GET /gifts/stats

**Allowed role(s):** SUPER_ADMIN, ADMIN

**Swagger tag:** Gift Management

**Summary:** Fetch gift inventory stats

**Parameters:** None

**Example response:**

```json
{
  "success": true,
  "data": {},
  "message": "Request completed successfully"
}
```

**Common failure responses:** `401` missing/invalid token, `403` role/permission denied, `404` missing owned record when applicable.

### GET /gifts/{id}

**Allowed role(s):** SUPER_ADMIN, ADMIN

**Swagger tag:** Gift Management

**Summary:** Fetch admin gift details with variants

**Parameters:** `id` (path, required)

**Example response:**

```json
{
  "success": true,
  "data": {},
  "message": "Request completed successfully"
}
```

**Common failure responses:** `401` missing/invalid token, `403` role/permission denied, `404` missing owned record when applicable.

### PATCH /gifts/{id}

**Allowed role(s):** SUPER_ADMIN, ADMIN

**Swagger tag:** Gift Management

**Summary:** Update admin gift and upsert nested variants

**Description:** If replaceVariants=true, omitted variants are soft-deleted. Only one default variant is allowed.

**Parameters:** `id` (path, required)

**Request DTO:** `UpdateGiftDto`

**Request payload example:**

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

**Common failure responses:** `400` validation/business rule failure, `401` missing/invalid token, `403` role/permission denied, `404` missing owned record.

### DELETE /gifts/{id}

**Allowed role(s):** SUPER_ADMIN, ADMIN

**Swagger tag:** Gift Management

**Summary:** Soft-delete gift

**Parameters:** `id` (path, required)

**Common failure responses:** `400` validation/business rule failure, `401` missing/invalid token, `403` role/permission denied, `404` missing owned record.

### PATCH /gifts/{id}/status

**Allowed role(s):** SUPER_ADMIN, ADMIN

**Swagger tag:** Gift Management

**Summary:** Update gift status

**Parameters:** `id` (path, required)

**Request DTO:** `UpdateGiftStatusDto`

**Request payload example:**

```json
{
  "status": "ACTIVE",
  "reason": "example"
}
```

**Common failure responses:** `400` validation/business rule failure, `401` missing/invalid token, `403` role/permission denied, `404` missing owned record.

## Gift Moderation

| Method | Path | Roles | Summary |
|---|---|---|---|
| `GET` | `/gift-moderation` | SUPER_ADMIN, ADMIN |  |
| `PATCH` | `/gift-moderation/{id}/approve` | SUPER_ADMIN, ADMIN |  |
| `PATCH` | `/gift-moderation/{id}/flag` | SUPER_ADMIN, ADMIN |  |
| `PATCH` | `/gift-moderation/{id}/reject` | SUPER_ADMIN, ADMIN |  |

### GET /gift-moderation

**Allowed role(s):** SUPER_ADMIN, ADMIN

**Swagger tag:** Gift Moderation

**Summary:** —

**Parameters:** `page` (query, optional), `limit` (query, optional), `status` (query, optional), `search` (query, optional), `providerId` (query, optional), `view` (query, optional), `sortBy` (query, optional), `sortOrder` (query, optional)

**Example response:**

```json
{
  "success": true,
  "data": {},
  "message": "Request completed successfully"
}
```

**Common failure responses:** `401` missing/invalid token, `403` role/permission denied, `404` missing owned record when applicable.

### PATCH /gift-moderation/{id}/approve

**Allowed role(s):** SUPER_ADMIN, ADMIN

**Swagger tag:** Gift Moderation

**Summary:** —

**Parameters:** `id` (path, required)

**Request DTO:** `ApproveGiftDto`

**Request payload example:**

```json
{
  "comment": "example",
  "publishNow": true,
  "notifyProvider": true
}
```

**Common failure responses:** `400` validation/business rule failure, `401` missing/invalid token, `403` role/permission denied, `404` missing owned record.

### PATCH /gift-moderation/{id}/flag

**Allowed role(s):** SUPER_ADMIN, ADMIN

**Swagger tag:** Gift Moderation

**Summary:** —

**Parameters:** `id` (path, required)

**Request DTO:** `FlagGiftDto`

**Request payload example:**

```json
{
  "reason": "NEEDS_MANUAL_REVIEW",
  "comment": "example"
}
```

**Common failure responses:** `400` validation/business rule failure, `401` missing/invalid token, `403` role/permission denied, `404` missing owned record.

### PATCH /gift-moderation/{id}/reject

**Allowed role(s):** SUPER_ADMIN, ADMIN

**Swagger tag:** Gift Moderation

**Summary:** —

**Parameters:** `id` (path, required)

**Request DTO:** `RejectGiftDto`

**Request payload example:**

```json
{
  "reason": "INCOMPLETE_INFORMATION",
  "comment": "example",
  "notifyProvider": true
}
```

**Common failure responses:** `400` validation/business rule failure, `401` missing/invalid token, `403` role/permission denied, `404` missing owned record.

## Customer Marketplace

| Method | Path | Roles | Summary |
|---|---|---|---|
| `GET` | `/customer/categories` | REGISTERED_USER | List customer marketplace categories |
| `GET` | `/customer/gifts` | REGISTERED_USER | List customer marketplace gifts |
| `GET` | `/customer/gifts/discounted` | REGISTERED_USER | List discounted customer gifts |
| `GET` | `/customer/gifts/filter-options` | REGISTERED_USER | Fetch marketplace gift filter options |
| `GET` | `/customer/home` | REGISTERED_USER | Fetch customer app home |
| `GET` | `/customer/gifts/{id}` | REGISTERED_USER | Fetch customer-safe gift details |

### GET /customer/categories

**Allowed role(s):** REGISTERED_USER

**Swagger tag:** Customer Marketplace

**Summary:** List customer marketplace categories

**Description:** REGISTERED_USER only. Returns active categories that have available approved gifts.

**Parameters:** None

**Example response:**

```json
{
  "success": true,
  "data": {},
  "message": "Customer categories fetched successfully"
}
```

**Common failure responses:** `401` missing/invalid token, `403` role/permission denied, `404` missing owned record when applicable.

### GET /customer/gifts

**Allowed role(s):** REGISTERED_USER

**Swagger tag:** Customer Marketplace

**Summary:** List customer marketplace gifts

**Description:** REGISTERED_USER only. Only approved, published, active, in-stock gifts from approved active providers are returned. Active offers are calculated by the backend.

**Parameters:** `page` (query, optional), `limit` (query, optional), `search` (query, optional), `categoryId` (query, optional), `categorySlug` (query, optional), `providerId` (query, optional), `offerOnly` (query, optional), `minPrice` (query, optional), `maxPrice` (query, optional), `minRating` (query, optional), `brand` (query, optional), `deliveryOption` (query, optional), `sortBy` (query, optional)

**Example response:**

```json
{
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
```

**Common failure responses:** `401` missing/invalid token, `403` role/permission denied, `404` missing owned record when applicable.

### GET /customer/gifts/discounted

**Allowed role(s):** REGISTERED_USER

**Swagger tag:** Customer Marketplace

**Summary:** List discounted customer gifts

**Description:** REGISTERED_USER only. Reuses marketplace gift filters with offerOnly=true.

**Parameters:** `page` (query, optional), `limit` (query, optional), `search` (query, optional), `categoryId` (query, optional), `categorySlug` (query, optional), `providerId` (query, optional), `offerOnly` (query, optional), `minPrice` (query, optional), `maxPrice` (query, optional), `minRating` (query, optional), `brand` (query, optional), `deliveryOption` (query, optional), `sortBy` (query, optional)

**Example response:**

```json
{
  "success": true,
  "data": {},
  "message": "Discounted gifts fetched successfully"
}
```

**Common failure responses:** `401` missing/invalid token, `403` role/permission denied, `404` missing owned record when applicable.

### GET /customer/gifts/filter-options

**Allowed role(s):** REGISTERED_USER

**Swagger tag:** Customer Marketplace

**Summary:** Fetch marketplace gift filter options

**Description:** REGISTERED_USER only. Brands are derived from approved active provider business names.

**Parameters:** None

**Example response:**

```json
{
  "success": true,
  "data": {},
  "message": "Gift filter options fetched successfully"
}
```

**Common failure responses:** `401` missing/invalid token, `403` role/permission denied, `404` missing owned record when applicable.

### GET /customer/home

**Allowed role(s):** REGISTERED_USER

**Swagger tag:** Customer Marketplace

**Summary:** Fetch customer app home

**Description:** REGISTERED_USER only. Returns safe marketplace categories, discounted gifts, default address, and upcoming reminder.

**Parameters:** None

**Example response:**

```json
{
  "success": true,
  "data": {},
  "message": "Customer home fetched successfully"
}
```

**Common failure responses:** `401` missing/invalid token, `403` role/permission denied, `404` missing owned record when applicable.

### GET /customer/gifts/{id}

**Allowed role(s):** REGISTERED_USER

**Swagger tag:** Customer Marketplace

**Summary:** Fetch customer-safe gift details

**Description:** REGISTERED_USER only. Hidden/admin-only gift records are never returned.

**Parameters:** `id` (path, required)

**Example response:**

```json
{
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
```

**Common failure responses:** `401` missing/invalid token, `403` role/permission denied, `404` missing owned record when applicable.

## Customer Wishlist

| Method | Path | Roles | Summary |
|---|---|---|---|
| `GET` | `/customer/wishlist` | REGISTERED_USER | List wishlist gifts |
| `POST` | `/customer/wishlist/{giftId}` | REGISTERED_USER | Add gift to wishlist |
| `DELETE` | `/customer/wishlist/{giftId}` | REGISTERED_USER | Remove gift from wishlist |

### GET /customer/wishlist

**Allowed role(s):** REGISTERED_USER

**Swagger tag:** Customer Wishlist

**Summary:** List wishlist gifts

**Description:** REGISTERED_USER only. Returns customer-safe available gifts.

**Parameters:** None

**Example response:**

```json
{
  "success": true,
  "data": {},
  "message": "Request completed successfully"
}
```

**Common failure responses:** `401` missing/invalid token, `403` role/permission denied, `404` missing owned record when applicable.

### POST /customer/wishlist/{giftId}

**Allowed role(s):** REGISTERED_USER

**Swagger tag:** Customer Wishlist

**Summary:** Add gift to wishlist

**Description:** REGISTERED_USER only. Gift must be active, approved, published, and in stock. Duplicate wishlist entries are ignored.

**Parameters:** `giftId` (path, required)

**Request payload:** None

**Example response:**

```json
{
  "success": true,
  "data": {},
  "message": "Request completed successfully"
}
```

**Common failure responses:** `400` validation/business rule failure, `401` missing/invalid token, `403` role/permission denied, `404` missing owned record.

### DELETE /customer/wishlist/{giftId}

**Allowed role(s):** REGISTERED_USER

**Swagger tag:** Customer Wishlist

**Summary:** Remove gift from wishlist

**Description:** REGISTERED_USER only. Removes only the current customer wishlist row.

**Parameters:** `giftId` (path, required)

**Common failure responses:** `400` validation/business rule failure, `401` missing/invalid token, `403` role/permission denied, `404` missing owned record.

## Customer Addresses

| Method | Path | Roles | Summary |
|---|---|---|---|
| `GET` | `/customer/addresses` | REGISTERED_USER | List customer addresses |
| `POST` | `/customer/addresses` | REGISTERED_USER | Create customer address |
| `GET` | `/customer/addresses/{id}` | REGISTERED_USER | Fetch customer address |
| `PATCH` | `/customer/addresses/{id}` | REGISTERED_USER | Update customer address |
| `DELETE` | `/customer/addresses/{id}` | REGISTERED_USER | Soft-delete customer address |
| `PATCH` | `/customer/addresses/{id}/default` | REGISTERED_USER | Set default customer address |

### GET /customer/addresses

**Allowed role(s):** REGISTERED_USER

**Swagger tag:** Customer Addresses

**Summary:** List customer addresses

**Description:** REGISTERED_USER only. Customers can only view their own non-deleted addresses.

**Parameters:** None

**Example response:**

```json
{
  "success": true,
  "data": {},
  "message": "Request completed successfully"
}
```

**Common failure responses:** `401` missing/invalid token, `403` role/permission denied, `404` missing owned record when applicable.

### POST /customer/addresses

**Allowed role(s):** REGISTERED_USER

**Swagger tag:** Customer Addresses

**Summary:** Create customer address

**Description:** REGISTERED_USER only. Maintains one default address per customer.

**Parameters:** None

**Request DTO:** `CreateCustomerAddressDto`

**Request payload example:**

```json
{
  "label": "Home",
  "fullName": "Sarah Khan",
  "phone": "+923001234567",
  "line1": "House 12, Street 4, F-8/2",
  "line2": "Near Centaurus Mall",
  "city": "Islamabad",
  "state": "Islamabad Capital Territory",
  "country": "Pakistan",
  "postalCode": "44000",
  "latitude": 33.6844,
  "longitude": 73.0479,
  "deliveryInstructions": "Leave at reception."
}
```

**Example response:**

```json
{
  "success": true,
  "data": {},
  "message": "Request completed successfully"
}
```

**Common failure responses:** `400` validation/business rule failure, `401` missing/invalid token, `403` role/permission denied, `404` missing owned record.

### GET /customer/addresses/{id}

**Allowed role(s):** REGISTERED_USER

**Swagger tag:** Customer Addresses

**Summary:** Fetch customer address

**Description:** REGISTERED_USER only. Address must belong to the current customer.

**Parameters:** `id` (path, required)

**Example response:**

```json
{
  "success": true,
  "data": {},
  "message": "Request completed successfully"
}
```

**Common failure responses:** `401` missing/invalid token, `403` role/permission denied, `404` missing owned record when applicable.

### PATCH /customer/addresses/{id}

**Allowed role(s):** REGISTERED_USER

**Swagger tag:** Customer Addresses

**Summary:** Update customer address

**Description:** REGISTERED_USER only. Maintains one default address per customer.

**Parameters:** `id` (path, required)

**Request DTO:** `UpdateCustomerAddressDto`

**Request payload example:**

```json
{
  "label": "Home",
  "fullName": "Sarah Khan",
  "phone": "+923001234567",
  "line1": "House 12, Street 4, F-8/2",
  "line2": "Near Centaurus Mall",
  "city": "Islamabad",
  "state": "Islamabad Capital Territory",
  "country": "Pakistan",
  "postalCode": "44000",
  "latitude": 33.6844,
  "longitude": 73.0479,
  "deliveryInstructions": "Leave at reception."
}
```

**Common failure responses:** `400` validation/business rule failure, `401` missing/invalid token, `403` role/permission denied, `404` missing owned record.

### DELETE /customer/addresses/{id}

**Allowed role(s):** REGISTERED_USER

**Swagger tag:** Customer Addresses

**Summary:** Soft-delete customer address

**Description:** REGISTERED_USER only. Address is soft deleted and removed from default status.

**Parameters:** `id` (path, required)

**Common failure responses:** `400` validation/business rule failure, `401` missing/invalid token, `403` role/permission denied, `404` missing owned record.

### PATCH /customer/addresses/{id}/default

**Allowed role(s):** REGISTERED_USER

**Swagger tag:** Customer Addresses

**Summary:** Set default customer address

**Description:** REGISTERED_USER only. Clears default flag from all other customer addresses.

**Parameters:** `id` (path, required)

**Request payload:** None

**Common failure responses:** `400` validation/business rule failure, `401` missing/invalid token, `403` role/permission denied, `404` missing owned record.

## Customer Contacts

| Method | Path | Roles | Summary |
|---|---|---|---|
| `GET` | `/customer/contacts` | REGISTERED_USER | List customer contacts |
| `POST` | `/customer/contacts` | REGISTERED_USER | Create customer contact |
| `GET` | `/customer/contacts/{id}` | REGISTERED_USER | Fetch customer contact |
| `PATCH` | `/customer/contacts/{id}` | REGISTERED_USER | Update customer contact |
| `DELETE` | `/customer/contacts/{id}` | REGISTERED_USER | Soft-delete customer contact |

### GET /customer/contacts

**Allowed role(s):** REGISTERED_USER

**Swagger tag:** Customer Contacts

**Summary:** List customer contacts

**Description:** REGISTERED_USER only. Lists only contacts owned by the authenticated customer.

**Parameters:** `page` (query, optional), `limit` (query, optional), `search` (query, optional), `relationship` (query, optional), `sortBy` (query, optional), `sortOrder` (query, optional)

**Example response:**

```json
{
  "success": true,
  "data": {},
  "message": "Contacts fetched successfully"
}
```

**Common failure responses:** `401` missing/invalid token, `403` role/permission denied, `404` missing owned record when applicable.

### POST /customer/contacts

**Allowed role(s):** REGISTERED_USER

**Swagger tag:** Customer Contacts

**Summary:** Create customer contact

**Description:** REGISTERED_USER only. Creates a personal gift contact owned by the authenticated customer. Requires at least one contact method: phone, email, or address.

**Parameters:** None

**Request DTO:** `CreateCustomerContactDto`

**Request payload example:**

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

**Example response:**

```json
{
  "success": true,
  "data": {},
  "message": "Contact created successfully"
}
```

**Common failure responses:** `400` validation/business rule failure, `401` missing/invalid token, `403` role/permission denied, `404` missing owned record.

### GET /customer/contacts/{id}

**Allowed role(s):** REGISTERED_USER

**Swagger tag:** Customer Contacts

**Summary:** Fetch customer contact

**Description:** REGISTERED_USER only. Contact must belong to the authenticated customer.

**Parameters:** `id` (path, required)

**Example response:**

```json
{
  "success": true,
  "data": {},
  "message": "Contact fetched successfully"
}
```

**Common failure responses:** `401` missing/invalid token, `403` role/permission denied, `404` missing owned record when applicable.

### PATCH /customer/contacts/{id}

**Allowed role(s):** REGISTERED_USER

**Swagger tag:** Customer Contacts

**Summary:** Update customer contact

**Description:** REGISTERED_USER only. Updates only contacts owned by the authenticated customer.

**Parameters:** `id` (path, required)

**Request DTO:** `UpdateCustomerContactDto`

**Request payload example:**

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

**Common failure responses:** `400` validation/business rule failure, `401` missing/invalid token, `403` role/permission denied, `404` missing owned record.

### DELETE /customer/contacts/{id}

**Allowed role(s):** REGISTERED_USER

**Swagger tag:** Customer Contacts

**Summary:** Soft-delete customer contact

**Description:** REGISTERED_USER only. Soft deletes only contacts owned by the authenticated customer.

**Parameters:** `id` (path, required)

**Common failure responses:** `400` validation/business rule failure, `401` missing/invalid token, `403` role/permission denied, `404` missing owned record.

## Customer Events

| Method | Path | Roles | Summary |
|---|---|---|---|
| `GET` | `/customer/events` | REGISTERED_USER | List customer events |
| `POST` | `/customer/events` | REGISTERED_USER | Create customer event |
| `GET` | `/customer/events/calendar` | REGISTERED_USER | Fetch monthly calendar events |
| `GET` | `/customer/events/upcoming` | REGISTERED_USER | Fetch upcoming customer events |
| `GET` | `/customer/events/{id}` | REGISTERED_USER | Fetch customer event details |
| `PATCH` | `/customer/events/{id}` | REGISTERED_USER | Update customer event |
| `DELETE` | `/customer/events/{id}` | REGISTERED_USER | Soft-delete customer event |

### GET /customer/events

**Allowed role(s):** REGISTERED_USER

**Swagger tag:** Customer Events

**Summary:** List customer events

**Description:** REGISTERED_USER only. Lists only events owned by the authenticated customer.

**Parameters:** `page` (query, optional), `limit` (query, optional), `search` (query, optional), `eventType` (query, optional), `fromDate` (query, optional), `toDate` (query, optional), `recipientId` (query, optional), `sortBy` (query, optional), `sortOrder` (query, optional)

**Example response:**

```json
{
  "success": true,
  "data": {},
  "message": "Events fetched successfully"
}
```

**Common failure responses:** `401` missing/invalid token, `403` role/permission denied, `404` missing owned record when applicable.

### POST /customer/events

**Allowed role(s):** REGISTERED_USER

**Swagger tag:** Customer Events

**Summary:** Create customer event

**Description:** REGISTERED_USER only. recipientId must belong to the authenticated customer.

**Parameters:** None

**Request DTO:** `CreateCustomerEventDto`

**Request payload example:**

```json
{
  "eventType": "BIRTHDAY",
  "title": "Sarah's Birthday",
  "recipientId": "cmf0contactmary001",
  "eventDate": "2026-01-31T00:00:00.000Z",
  "reminderTiming": "ON_THE_DAY",
  "reminderFrequency": "ONE_TIME",
  "customAlertTime": "09:00",
  "channels": [
    "EMAIL",
    "SMS"
  ],
  "notes": "Send a birthday gift.",
  "isActive": true
}
```

**Example response:**

```json
{
  "success": true,
  "data": {},
  "message": "Event created successfully"
}
```

**Common failure responses:** `400` validation/business rule failure, `401` missing/invalid token, `403` role/permission denied, `404` missing owned record.

### GET /customer/events/calendar

**Allowed role(s):** REGISTERED_USER

**Swagger tag:** Customer Events

**Summary:** Fetch monthly calendar events

**Description:** REGISTERED_USER only. Returns marked dates and own events.

**Parameters:** `month` (query, required), `year` (query, required), `eventType` (query, optional)

**Example response:**

```json
{
  "success": true,
  "data": {},
  "message": "Request completed successfully"
}
```

**Common failure responses:** `401` missing/invalid token, `403` role/permission denied, `404` missing owned record when applicable.

### GET /customer/events/upcoming

**Allowed role(s):** REGISTERED_USER

**Swagger tag:** Customer Events

**Summary:** Fetch upcoming customer events

**Description:** REGISTERED_USER only. Defaults to 10 events within 30 days.

**Parameters:** `limit` (query, optional), `daysAhead` (query, optional), `eventType` (query, optional)

**Example response:**

```json
{
  "success": true,
  "data": {},
  "message": "Request completed successfully"
}
```

**Common failure responses:** `401` missing/invalid token, `403` role/permission denied, `404` missing owned record when applicable.

### GET /customer/events/{id}

**Allowed role(s):** REGISTERED_USER

**Swagger tag:** Customer Events

**Summary:** Fetch customer event details

**Description:** REGISTERED_USER only. Event must belong to the authenticated customer.

**Parameters:** `id` (path, required)

**Example response:**

```json
{
  "success": true,
  "data": {},
  "message": "Request completed successfully"
}
```

**Common failure responses:** `401` missing/invalid token, `403` role/permission denied, `404` missing owned record when applicable.

### PATCH /customer/events/{id}

**Allowed role(s):** REGISTERED_USER

**Swagger tag:** Customer Events

**Summary:** Update customer event

**Description:** REGISTERED_USER only. Event and recipient contact must belong to the authenticated customer.

**Parameters:** `id` (path, required)

**Request DTO:** `UpdateCustomerEventDto`

**Request payload example:**

```json
{
  "eventType": "ANNIVERSARY",
  "title": "Sarah's Anniversary",
  "recipientId": "cmf0contactmary001",
  "eventDate": "2026-01-31T00:00:00.000Z",
  "reminderTiming": "THREE_DAYS_BEFORE",
  "reminderFrequency": "YEARLY",
  "customAlertTime": "09:00",
  "channels": [
    "PUSH",
    "EMAIL"
  ],
  "notes": "Send flowers.",
  "isActive": true
}
```

**Common failure responses:** `400` validation/business rule failure, `401` missing/invalid token, `403` role/permission denied, `404` missing owned record.

### DELETE /customer/events/{id}

**Allowed role(s):** REGISTERED_USER

**Swagger tag:** Customer Events

**Summary:** Soft-delete customer event

**Description:** REGISTERED_USER only. Soft deletes only own event and cancels pending reminder jobs.

**Parameters:** `id` (path, required)

**Common failure responses:** `400` validation/business rule failure, `401` missing/invalid token, `403` role/permission denied, `404` missing owned record.

## Customer Event Reminder Settings

| Method | Path | Roles | Summary |
|---|---|---|---|
| `GET` | `/customer/events/{id}/reminder-settings` | REGISTERED_USER | Fetch event reminder settings |
| `PATCH` | `/customer/events/{id}/reminder-settings` | REGISTERED_USER | Update event reminder settings |

### GET /customer/events/{id}/reminder-settings

**Allowed role(s):** REGISTERED_USER

**Swagger tag:** Customer Event Reminder Settings

**Summary:** Fetch event reminder settings

**Description:** REGISTERED_USER only. Event must belong to the authenticated customer.

**Parameters:** `id` (path, required)

**Example response:**

```json
{
  "success": true,
  "data": {},
  "message": "Request completed successfully"
}
```

**Common failure responses:** `401` missing/invalid token, `403` role/permission denied, `404` missing owned record when applicable.

### PATCH /customer/events/{id}/reminder-settings

**Allowed role(s):** REGISTERED_USER

**Swagger tag:** Customer Event Reminder Settings

**Summary:** Update event reminder settings

**Description:** REGISTERED_USER only. Event must belong to the authenticated customer.

**Parameters:** `id` (path, required)

**Request DTO:** `UpdateReminderSettingsDto`

**Request payload example:**

```json
{
  "reminderFrequency": "YEARLY",
  "reminderTiming": "ONE_DAY_BEFORE",
  "customAlertTime": "09:00",
  "channels": {
    "push": true,
    "email": true,
    "sms": false
  }
}
```

**Common failure responses:** `400` validation/business rule failure, `401` missing/invalid token, `403` role/permission denied, `404` missing owned record.

## Customer Cart

| Method | Path | Roles | Summary |
|---|---|---|---|
| `GET` | `/customer/cart` | REGISTERED_USER | Fetch active cart |
| `DELETE` | `/customer/cart` | REGISTERED_USER | Clear active cart |
| `POST` | `/customer/cart/items` | REGISTERED_USER | Add item to cart |
| `PATCH` | `/customer/cart/items/{id}` | REGISTERED_USER | Update cart item |
| `DELETE` | `/customer/cart/items/{id}` | REGISTERED_USER | Delete cart item |

### GET /customer/cart

**Allowed role(s):** REGISTERED_USER

**Swagger tag:** Customer Cart

**Summary:** Fetch active cart

**Description:** REGISTERED_USER only. Totals are backend calculated from price snapshots.

**Parameters:** None

**Example response:**

```json
{
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
```

**Common failure responses:** `401` missing/invalid token, `403` role/permission denied, `404` missing owned record when applicable.

### DELETE /customer/cart

**Allowed role(s):** REGISTERED_USER

**Swagger tag:** Customer Cart

**Summary:** Clear active cart

**Description:** REGISTERED_USER only. Removes all items from active cart.

**Parameters:** None

**Common failure responses:** `400` validation/business rule failure, `401` missing/invalid token, `403` role/permission denied, `404` missing owned record.

### POST /customer/cart/items

**Allowed role(s):** REGISTERED_USER

**Swagger tag:** Customer Cart

**Summary:** Add item to cart

**Description:** REGISTERED_USER only. Backend calculates unit price, active offer discount, final price, subtotal, delivery fee placeholder, and total.

**Parameters:** None

**Request DTO:** `AddCartItemDto`

**Request payload example:**

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

**Example response:**

```json
{
  "success": true,
  "data": {},
  "message": "Request completed successfully"
}
```

**Common failure responses:** `400` validation/business rule failure, `401` missing/invalid token, `403` role/permission denied, `404` missing owned record.

### PATCH /customer/cart/items/{id}

**Allowed role(s):** REGISTERED_USER

**Swagger tag:** Customer Cart

**Summary:** Update cart item

**Description:** REGISTERED_USER only. Validates ownership through the active customer cart.

**Parameters:** `id` (path, required)

**Request DTO:** `UpdateCartItemDto`

**Request payload example:**

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

**Common failure responses:** `400` validation/business rule failure, `401` missing/invalid token, `403` role/permission denied, `404` missing owned record.

### DELETE /customer/cart/items/{id}

**Allowed role(s):** REGISTERED_USER

**Swagger tag:** Customer Cart

**Summary:** Delete cart item

**Description:** REGISTERED_USER only. Deletes only items in the current customer active cart.

**Parameters:** `id` (path, required)

**Common failure responses:** `400` validation/business rule failure, `401` missing/invalid token, `403` role/permission denied, `404` missing owned record.

## Customer Orders

| Method | Path | Roles | Summary |
|---|---|---|---|
| `GET` | `/customer/orders` | REGISTERED_USER | List customer orders |
| `POST` | `/customer/orders` | REGISTERED_USER | Create order from active cart |
| `GET` | `/customer/orders/{id}` | REGISTERED_USER | Fetch customer order |

### GET /customer/orders

**Allowed role(s):** REGISTERED_USER

**Swagger tag:** Customer Orders

**Summary:** List customer orders

**Description:** REGISTERED_USER only. Returns orders owned by the current customer.

**Parameters:** `page` (query, optional), `limit` (query, optional), `type` (query, optional), `status` (query, optional), `fromDate` (query, optional), `toDate` (query, optional)

**Example response:**

```json
{
  "success": true,
  "data": {},
  "message": "Request completed successfully"
}
```

**Common failure responses:** `401` missing/invalid token, `403` role/permission denied, `404` missing owned record when applicable.

### POST /customer/orders

**Allowed role(s):** REGISTERED_USER

**Swagger tag:** Customer Orders

**Summary:** Create order from active cart

**Description:** REGISTERED_USER only. Prices are backend-calculated from cart/payment snapshots. STRIPE_CARD requires a successful owned paymentId; COD stays pending; PLACEHOLDER is for development only. Multiple providers are split into provider sub-orders.

**Parameters:** None

**Request DTO:** `CreateOrderDto`

**Request payload example:**

```json
{
  "cartId": "cart_id",
  "paymentId": "payment_id",
  "deliveryAddressId": "address_id",
  "paymentMethod": "STRIPE_CARD"
}
```

**Example response:**

```json
{
  "success": true,
  "data": {},
  "message": "Request completed successfully"
}
```

**Common failure responses:** `400` validation/business rule failure, `401` missing/invalid token, `403` role/permission denied, `404` missing owned record.

### GET /customer/orders/{id}

**Allowed role(s):** REGISTERED_USER

**Swagger tag:** Customer Orders

**Summary:** Fetch customer order

**Description:** REGISTERED_USER only. Order must belong to the current customer.

**Parameters:** `id` (path, required)

**Example response:**

```json
{
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
```

**Common failure responses:** `401` missing/invalid token, `403` role/permission denied, `404` missing owned record when applicable.

## Customer Recurring Payments

| Method | Path | Roles | Summary |
|---|---|---|---|
| `GET` | `/customer/payment-methods/saved` | REGISTERED_USER | List saved payment methods |
| `POST` | `/customer/payment-methods/setup-intent` | REGISTERED_USER | Create Stripe setup intent for saving card |
| `GET` | `/customer/recurring-payments` | REGISTERED_USER | List own recurring payments |
| `POST` | `/customer/recurring-payments` | REGISTERED_USER | Create recurring payment |
| `GET` | `/customer/recurring-payments/summary` | REGISTERED_USER | Fetch recurring payment summary counts |
| `DELETE` | `/customer/payment-methods/{id}` | REGISTERED_USER | Delete own saved payment method |
| `GET` | `/customer/recurring-payments/{id}` | REGISTERED_USER | Fetch own recurring payment details |
| `PATCH` | `/customer/recurring-payments/{id}` | REGISTERED_USER | Update own recurring payment |
| `POST` | `/customer/recurring-payments/{id}/cancel` | REGISTERED_USER | Cancel own recurring payment |
| `GET` | `/customer/recurring-payments/{id}/history` | REGISTERED_USER | List own recurring payment billing history |
| `POST` | `/customer/recurring-payments/{id}/pause` | REGISTERED_USER | Pause own active recurring payment |
| `POST` | `/customer/recurring-payments/{id}/resume` | REGISTERED_USER | Resume own paused recurring payment |

### GET /customer/payment-methods/saved

**Allowed role(s):** REGISTERED_USER

**Swagger tag:** Customer Recurring Payments

**Summary:** List saved payment methods

**Description:** REGISTERED_USER only. Returns saved Stripe cards owned by the logged-in customer.

**Parameters:** None

**Example response:**

```json
{
  "success": true,
  "data": [
    {
      "id": "pm_xxx",
      "type": "CARD",
      "brand": "visa",
      "last4": "4242",
      "expiryMonth": 12,
      "expiryYear": 2026,
      "isDefault": true
    }
  ],
  "message": "Saved payment methods fetched successfully."
}
```

**Common failure responses:** `401` missing/invalid token, `403` role/permission denied, `404` missing owned record when applicable.

### POST /customer/payment-methods/setup-intent

**Allowed role(s):** REGISTERED_USER

**Swagger tag:** Customer Recurring Payments

**Summary:** Create Stripe setup intent for saving card

**Description:** REGISTERED_USER only. Uses Stripe SetupIntent; secret keys are never exposed.

**Parameters:** None

**Request payload:** None

**Example response:**

```json
{
  "success": true,
  "data": {
    "setupIntentId": "seti_xxx",
    "clientSecret": "seti_xxx_secret_xxx",
    "publishableKey": "pk_test_xxx"
  },
  "message": "Setup intent created successfully."
}
```

**Common failure responses:** `400` validation/business rule failure, `401` missing/invalid token, `403` role/permission denied, `404` missing owned record.

### GET /customer/recurring-payments

**Allowed role(s):** REGISTERED_USER

**Swagger tag:** Customer Recurring Payments

**Summary:** List own recurring payments

**Description:** REGISTERED_USER only. Returns recurring money/gift payment subscriptions owned by the logged-in customer.

**Parameters:** `page` (query, optional), `limit` (query, optional), `search` (query, optional), `status` (query, optional), `frequency` (query, optional), `recipientContactId` (query, optional), `sortBy` (query, optional), `sortOrder` (query, optional)

**Example response:**

```json
{
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
```

**Common failure responses:** `401` missing/invalid token, `403` role/permission denied, `404` missing owned record when applicable.

### POST /customer/recurring-payments

**Allowed role(s):** REGISTERED_USER

**Swagger tag:** Customer Recurring Payments

**Summary:** Create recurring payment

**Description:** REGISTERED_USER only. Recipient contact and saved Stripe payment method must both belong to the logged-in customer. Stripe card recurring payments require a saved payment method.

**Parameters:** None

**Request DTO:** `CreateRecurringPaymentDto`

**Request payload example:**

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

**Example response:**

```json
{
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
```

**Common failure responses:** `400` validation/business rule failure, `401` missing/invalid token, `403` role/permission denied, `404` missing owned record.

### GET /customer/recurring-payments/summary

**Allowed role(s):** REGISTERED_USER

**Swagger tag:** Customer Recurring Payments

**Summary:** Fetch recurring payment summary counts

**Description:** Must stay before /customer/recurring-payments/:id route.

**Parameters:** None

**Example response:**

```json
{
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
```

**Common failure responses:** `401` missing/invalid token, `403` role/permission denied, `404` missing owned record when applicable.

### DELETE /customer/payment-methods/{id}

**Allowed role(s):** REGISTERED_USER

**Swagger tag:** Customer Recurring Payments

**Summary:** Delete own saved payment method

**Description:** Cannot delete a payment method used by an active/paused recurring payment unless recurring payments are changed first.

**Parameters:** `id` (path, required)

**Common failure responses:** `400` validation/business rule failure, `401` missing/invalid token, `403` role/permission denied, `404` missing owned record.

### GET /customer/recurring-payments/{id}

**Allowed role(s):** REGISTERED_USER

**Swagger tag:** Customer Recurring Payments

**Summary:** Fetch own recurring payment details

**Description:** REGISTERED_USER only. Customer cannot access another user’s recurring payment.

**Parameters:** `id` (path, required)

**Example response:**

```json
{
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
```

**Common failure responses:** `401` missing/invalid token, `403` role/permission denied, `404` missing owned record when applicable.

### PATCH /customer/recurring-payments/{id}

**Allowed role(s):** REGISTERED_USER

**Swagger tag:** Customer Recurring Payments

**Summary:** Update own recurring payment

**Description:** Cannot edit CANCELLED recurring payments. Changes apply from the next billing cycle and nextBillingAt is recalculated.

**Parameters:** `id` (path, required)

**Request DTO:** `UpdateRecurringPaymentDto`

**Request payload example:**

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

**Common failure responses:** `400` validation/business rule failure, `401` missing/invalid token, `403` role/permission denied, `404` missing owned record.

### POST /customer/recurring-payments/{id}/cancel

**Allowed role(s):** REGISTERED_USER

**Swagger tag:** Customer Recurring Payments

**Summary:** Cancel own recurring payment

**Description:** IMMEDIATELY cancels future processing. AFTER_CURRENT_BILLING_CYCLE sets cancelAtPeriodEnd and cancelAt.

**Parameters:** `id` (path, required)

**Request DTO:** `CancelRecurringPaymentDto`

**Request payload example:**

```json
{
  "cancelMode": "IMMEDIATELY",
  "reason": "No longer needed."
}
```

**Example response:**

```json
{
  "success": true,
  "data": {
    "id": "recurring_payment_id",
    "status": "CANCELLED",
    "cancelMode": "IMMEDIATELY"
  },
  "message": "Recurring payment cancelled successfully."
}
```

**Common failure responses:** `400` validation/business rule failure, `401` missing/invalid token, `403` role/permission denied, `404` missing owned record.

### GET /customer/recurring-payments/{id}/history

**Allowed role(s):** REGISTERED_USER

**Swagger tag:** Customer Recurring Payments

**Summary:** List own recurring payment billing history

**Parameters:** `id` (path, required), `page` (query, optional), `limit` (query, optional), `status` (query, optional)

**Example response:**

```json
{
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
```

**Common failure responses:** `401` missing/invalid token, `403` role/permission denied, `404` missing owned record when applicable.

### POST /customer/recurring-payments/{id}/pause

**Allowed role(s):** REGISTERED_USER

**Swagger tag:** Customer Recurring Payments

**Summary:** Pause own active recurring payment

**Parameters:** `id` (path, required)

**Request DTO:** `PauseRecurringPaymentDto`

**Request payload example:**

```json
{
  "reason": "User paused recurring payment."
}
```

**Example response:**

```json
{
  "success": true,
  "data": {},
  "message": "Request completed successfully"
}
```

**Common failure responses:** `400` validation/business rule failure, `401` missing/invalid token, `403` role/permission denied, `404` missing owned record.

### POST /customer/recurring-payments/{id}/resume

**Allowed role(s):** REGISTERED_USER

**Swagger tag:** Customer Recurring Payments

**Summary:** Resume own paused recurring payment

**Parameters:** `id` (path, required)

**Request payload:** None

**Example response:**

```json
{
  "success": true,
  "data": {},
  "message": "Request completed successfully"
}
```

**Common failure responses:** `400` validation/business rule failure, `401` missing/invalid token, `403` role/permission denied, `404` missing owned record.

## Customer Transactions

| Method | Path | Roles | Summary |
|---|---|---|---|
| `GET` | `/customer/transactions` | REGISTERED_USER | List own customer transactions |
| `GET` | `/customer/transactions/export` | REGISTERED_USER | Export own transactions |
| `GET` | `/customer/transactions/summary` | REGISTERED_USER | Fetch own transaction summary |
| `GET` | `/customer/transactions/{id}` | REGISTERED_USER | Fetch own transaction details |
| `GET` | `/customer/transactions/{id}/receipt` | REGISTERED_USER | Download own transaction receipt |

### GET /customer/transactions

**Allowed role(s):** REGISTERED_USER

**Swagger tag:** Customer Transactions

**Summary:** List own customer transactions

**Description:** REGISTERED_USER only. Normalizes backend Payment, Order, MoneyGift, and RecurringPayment occurrence records owned by the logged-in customer.

**Parameters:** `page` (query, optional), `limit` (query, optional), `search` (query, optional), `fromDate` (query, optional), `toDate` (query, optional), `type` (query, optional), `status` (query, optional), `paymentMethod` (query, optional), `minAmount` (query, optional), `maxAmount` (query, optional), `sortBy` (query, optional), `sortOrder` (query, optional)

**Example response:**

```json
{
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
```

**Common failure responses:** `401` missing/invalid token, `403` role/permission denied, `404` missing owned record when applicable.

### GET /customer/transactions/export

**Allowed role(s):** REGISTERED_USER

**Swagger tag:** Customer Transactions

**Summary:** Export own transactions

**Description:** CSV is supported and returned as a file. Export is scoped to the logged-in customer only.

**Parameters:** `page` (query, optional), `limit` (query, optional), `search` (query, optional), `fromDate` (query, optional), `toDate` (query, optional), `type` (query, optional), `status` (query, optional), `paymentMethod` (query, optional), `minAmount` (query, optional), `maxAmount` (query, optional), `sortBy` (query, optional), `sortOrder` (query, optional), `format` (query, optional)

**Example response:**

```json
{
  "success": true,
  "data": {},
  "message": "Transaction export file."
}
```

**Common failure responses:** `401` missing/invalid token, `403` role/permission denied, `404` missing owned record when applicable.

### GET /customer/transactions/summary

**Allowed role(s):** REGISTERED_USER

**Swagger tag:** Customer Transactions

**Summary:** Fetch own transaction summary

**Description:** Defaults to current month when no date range is provided. Uses backend-calculated payment records only.

**Parameters:** `fromDate` (query, optional), `toDate` (query, optional)

**Example response:**

```json
{
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
```

**Common failure responses:** `401` missing/invalid token, `403` role/permission denied, `404` missing owned record when applicable.

### GET /customer/transactions/{id}

**Allowed role(s):** REGISTERED_USER

**Swagger tag:** Customer Transactions

**Summary:** Fetch own transaction details

**Description:** Includes order, money gift, recurring payment, and payment gateway references when available. Billing address returns null until available.

**Parameters:** `id` (path, required)

**Example response:**

```json
{
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
```

**Common failure responses:** `401` missing/invalid token, `403` role/permission denied, `404` missing owned record when applicable.

### GET /customer/transactions/{id}/receipt

**Allowed role(s):** REGISTERED_USER

**Swagger tag:** Customer Transactions

**Summary:** Download own transaction receipt

**Description:** Receipt is generated only for the transaction owner and never exposes Stripe secret data.

**Parameters:** `id` (path, required)

**Example response:**

```json
{
  "success": true,
  "data": {},
  "message": "Receipt PDF file for the authenticated transaction owner. Includes app name, transaction ID, customer, recipient, references, totals, currency, status, and support email."
}
```

**Common failure responses:** `401` missing/invalid token, `403` role/permission denied, `404` missing owned record when applicable.

## Payments

| Method | Path | Roles | Summary |
|---|---|---|---|
| `GET` | `/customer/money-gifts` | REGISTERED_USER | List own money gifts |
| `POST` | `/customer/money-gifts` | REGISTERED_USER | Send payment as gift |
| `GET` | `/customer/payment-methods` | REGISTERED_USER | List supported customer payment methods |
| `POST` | `/customer/payments/confirm` | REGISTERED_USER | Confirm Stripe payment |
| `POST` | `/customer/payments/create-intent` | REGISTERED_USER | Create payment intent from active cart |
| `POST` | `/payments/stripe/webhook` | PUBLIC/WEBHOOK | Stripe webhook endpoint |
| `GET` | `/customer/money-gifts/{id}` | REGISTERED_USER | Fetch own money gift details |
| `GET` | `/customer/payments/{id}` | REGISTERED_USER | Fetch own payment details |

### GET /customer/money-gifts

**Allowed role(s):** REGISTERED_USER

**Swagger tag:** Payments

**Summary:** List own money gifts

**Parameters:** None

**Example response:**

```json
{
  "success": true,
  "data": {
    "id": "cmf0moneygift001",
    "amount": 100,
    "currency": "PKR",
    "recipientContactId": "cmf0contactmary001",
    "message": "Hope this helps. Enjoy your day!",
    "messageMediaUrls": [],
    "deliveryDate": "2026-12-24T00:00:00.000Z",
    "repeatAnnually": false,
    "status": "PAYMENT_PENDING"
  },
  "message": "Request completed successfully"
}
```

**Common failure responses:** `401` missing/invalid token, `403` role/permission denied, `404` missing owned record when applicable.

### POST /customer/money-gifts

**Allowed role(s):** REGISTERED_USER

**Swagger tag:** Payments

**Summary:** Send payment as gift

**Description:** Creates a customer-to-recipient money gift record and Stripe PaymentIntent for STRIPE_CARD.

**Parameters:** None

**Request DTO:** `CreateMoneyGiftDto`

**Request payload example:**

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

**Example response:**

```json
{
  "success": true,
  "data": {
    "id": "cmf0moneygift001",
    "amount": 100,
    "currency": "PKR",
    "recipientContactId": "cmf0contactmary001",
    "message": "Hope this helps. Enjoy your day!",
    "messageMediaUrls": [],
    "deliveryDate": "2026-12-24T00:00:00.000Z",
    "repeatAnnually": false,
    "status": "PAYMENT_PENDING"
  },
  "message": "Request completed successfully"
}
```

**Common failure responses:** `400` validation/business rule failure, `401` missing/invalid token, `403` role/permission denied, `404` missing owned record.

### GET /customer/payment-methods

**Allowed role(s):** REGISTERED_USER

**Swagger tag:** Payments

**Summary:** List supported customer payment methods

**Parameters:** None

**Example response:**

```json
{
  "success": true,
  "data": [
    {
      "key": "STRIPE_CARD",
      "label": "Card",
      "provider": "STRIPE",
      "isOnline": true,
      "isAvailable": true
    },
    {
      "key": "COD",
      "label": "Cash on Delivery",
      "provider": "MANUAL",
      "isOnline": false,
      "isAvailable": true
    }
  ],
  "message": "Payment methods fetched successfully."
}
```

**Common failure responses:** `401` missing/invalid token, `403` role/permission denied, `404` missing owned record when applicable.

### POST /customer/payments/confirm

**Allowed role(s):** REGISTERED_USER

**Swagger tag:** Payments

**Summary:** Confirm Stripe payment

**Description:** REGISTERED_USER only. Retrieves Stripe PaymentIntent server-side before updating local payment status.

**Parameters:** None

**Request DTO:** `ConfirmPaymentDto`

**Request payload example:**

```json
{
  "paymentId": "cmf0payment001",
  "stripePaymentIntentId": "pi_3Pxxxxxxxxxxxxxxxx"
}
```

**Example response:**

```json
{
  "success": true,
  "data": {
    "paymentId": "cmf0payment001",
    "status": "SUCCEEDED"
  },
  "message": "Request completed successfully"
}
```

**Common failure responses:** `400` validation/business rule failure, `401` missing/invalid token, `403` role/permission denied, `404` missing owned record.

### POST /customer/payments/create-intent

**Allowed role(s):** REGISTERED_USER

**Swagger tag:** Payments

**Summary:** Create payment intent from active cart

**Description:** REGISTERED_USER only. Amount is calculated from backend cart totals; frontend amount is never accepted.

**Parameters:** None

**Request DTO:** `CreatePaymentIntentDto`

**Request payload example:**

```json
{
  "cartId": "cmf0cartactive001",
  "paymentMethod": "STRIPE_CARD"
}
```

**Example response:**

```json
{
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
```

**Common failure responses:** `400` validation/business rule failure, `401` missing/invalid token, `403` role/permission denied, `404` missing owned record.

### POST /payments/stripe/webhook

**Allowed role(s):** PUBLIC/WEBHOOK

**Swagger tag:** Payments

**Summary:** Stripe webhook endpoint

**Description:** Verifies Stripe-Signature using the configured webhook secret before processing events.

**Parameters:** None

**Request payload:** None

**Example response:**

```json
{
  "success": true,
  "data": {},
  "message": "Request completed successfully"
}
```

**Common failure responses:** `400` validation/business rule failure, `401` missing/invalid token, `403` role/permission denied, `404` missing owned record.

### GET /customer/money-gifts/{id}

**Allowed role(s):** REGISTERED_USER

**Swagger tag:** Payments

**Summary:** Fetch own money gift details

**Parameters:** `id` (path, required)

**Example response:**

```json
{
  "success": true,
  "data": {
    "id": "cmf0moneygift001",
    "amount": 100,
    "currency": "PKR",
    "recipientContactId": "cmf0contactmary001",
    "message": "Hope this helps. Enjoy your day!",
    "messageMediaUrls": [],
    "deliveryDate": "2026-12-24T00:00:00.000Z",
    "repeatAnnually": false,
    "status": "PAYMENT_PENDING"
  },
  "message": "Request completed successfully"
}
```

**Common failure responses:** `401` missing/invalid token, `403` role/permission denied, `404` missing owned record when applicable.

### GET /customer/payments/{id}

**Allowed role(s):** REGISTERED_USER

**Swagger tag:** Payments

**Summary:** Fetch own payment details

**Parameters:** `id` (path, required)

**Example response:**

```json
{
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
```

**Common failure responses:** `401` missing/invalid token, `403` role/permission denied, `404` missing owned record when applicable.

## Notifications

| Method | Path | Roles | Summary |
|---|---|---|---|
| `GET` | `/notifications` | SUPER_ADMIN, ADMIN, PROVIDER, REGISTERED_USER | List notifications |
| `POST` | `/notifications/device-tokens` | SUPER_ADMIN, ADMIN, PROVIDER, REGISTERED_USER | Save device token |
| `GET` | `/notifications/preferences` | SUPER_ADMIN, ADMIN, PROVIDER, REGISTERED_USER | Fetch notification preferences |
| `PATCH` | `/notifications/preferences` | SUPER_ADMIN, ADMIN, PROVIDER, REGISTERED_USER | Update notification preferences |
| `PATCH` | `/notifications/read-all` | SUPER_ADMIN, ADMIN, PROVIDER, REGISTERED_USER | Mark all own notifications as read |
| `GET` | `/notifications/summary` | SUPER_ADMIN, ADMIN, PROVIDER, REGISTERED_USER | Fetch notification summary |
| `DELETE` | `/notifications/device-tokens/{id}` | SUPER_ADMIN, ADMIN, PROVIDER, REGISTERED_USER | Disable device token |
| `POST` | `/notifications/{id}/action` | SUPER_ADMIN, ADMIN, PROVIDER, REGISTERED_USER | Process notification action |
| `PATCH` | `/notifications/{id}/read` | SUPER_ADMIN, ADMIN, PROVIDER, REGISTERED_USER | Mark notification as read |

### GET /notifications

**Allowed role(s):** SUPER_ADMIN, ADMIN, PROVIDER, REGISTERED_USER

**Swagger tag:** Notifications

**Summary:** List notifications

**Description:** JWT auth. Returns only notifications belonging to the logged-in account. Supports All, Unread, Birthdays, Deliveries, and New Contacts filters. No group gift notifications are supported.

**Parameters:** `page` (query, optional), `limit` (query, optional), `filter` (query, optional), `type` (query, optional), `isRead` (query, optional), `groupByDate` (query, optional), `sortOrder` (query, optional)

**Example response:**

```json
{
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
```

**Common failure responses:** `401` missing/invalid token, `403` role/permission denied, `404` missing owned record when applicable.

### POST /notifications/device-tokens

**Allowed role(s):** SUPER_ADMIN, ADMIN, PROVIDER, REGISTERED_USER

**Swagger tag:** Notifications

**Summary:** Save device token

**Description:** JWT auth. Token belongs only to logged-in account. Duplicate deviceId updates existing record.

**Parameters:** None

**Request DTO:** `DeviceTokenDto`

**Request payload example:**

```json
{
  "token": "ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]",
  "platform": "IOS",
  "deviceId": "ios-iphone-15-pro-device-id"
}
```

**Example response:**

```json
{
  "success": true,
  "data": {},
  "message": "Request completed successfully"
}
```

**Common failure responses:** `400` validation/business rule failure, `401` missing/invalid token, `403` role/permission denied, `404` missing owned record.

### GET /notifications/preferences

**Allowed role(s):** SUPER_ADMIN, ADMIN, PROVIDER, REGISTERED_USER

**Swagger tag:** Notifications

**Summary:** Fetch notification preferences

**Description:** JWT auth. Preferences belong only to the logged-in account.

**Parameters:** None

**Example response:**

```json
{
  "success": true,
  "data": {},
  "message": "Request completed successfully"
}
```

**Common failure responses:** `401` missing/invalid token, `403` role/permission denied, `404` missing owned record when applicable.

### PATCH /notifications/preferences

**Allowed role(s):** SUPER_ADMIN, ADMIN, PROVIDER, REGISTERED_USER

**Swagger tag:** Notifications

**Summary:** Update notification preferences

**Description:** JWT auth. Push toggle does not delete device tokens. No group gift preference exists.

**Parameters:** None

**Request DTO:** `UpdateNotificationPreferencesDto`

**Request payload example:**

```json
{
  "pushEnabled": true,
  "emailEnabled": true,
  "smsEnabled": false,
  "dealUpdatesEnabled": true,
  "birthdayRemindersEnabled": true,
  "deliveryUpdatesEnabled": true,
  "newContactAlertsEnabled": true
}
```

**Common failure responses:** `400` validation/business rule failure, `401` missing/invalid token, `403` role/permission denied, `404` missing owned record.

### PATCH /notifications/read-all

**Allowed role(s):** SUPER_ADMIN, ADMIN, PROVIDER, REGISTERED_USER

**Swagger tag:** Notifications

**Summary:** Mark all own notifications as read

**Description:** JWT auth. Marks only notifications belonging to the logged-in account.

**Parameters:** None

**Request payload:** None

**Common failure responses:** `400` validation/business rule failure, `401` missing/invalid token, `403` role/permission denied, `404` missing owned record.

### GET /notifications/summary

**Allowed role(s):** SUPER_ADMIN, ADMIN, PROVIDER, REGISTERED_USER

**Swagger tag:** Notifications

**Summary:** Fetch notification summary

**Description:** JWT auth. Counts only notifications belonging to the logged-in account.

**Parameters:** None

**Example response:**

```json
{
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
```

**Common failure responses:** `401` missing/invalid token, `403` role/permission denied, `404` missing owned record when applicable.

### DELETE /notifications/device-tokens/{id}

**Allowed role(s):** SUPER_ADMIN, ADMIN, PROVIDER, REGISTERED_USER

**Swagger tag:** Notifications

**Summary:** Disable device token

**Description:** JWT auth. Users can disable only their own device tokens.

**Parameters:** `id` (path, required)

**Common failure responses:** `400` validation/business rule failure, `401` missing/invalid token, `403` role/permission denied, `404` missing owned record.

### POST /notifications/{id}/action

**Allowed role(s):** SUPER_ADMIN, ADMIN, PROVIDER, REGISTERED_USER

**Swagger tag:** Notifications

**Summary:** Process notification action

**Description:** JWT auth. Supports SEND_GIFT, REMIND_ME_LATER, VIEW_ORDER, VIEW_CONTACT. Group gift actions are not supported.

**Parameters:** `id` (path, required)

**Request DTO:** `NotificationActionRequestDto`

**Request payload example:**

```json
{
  "action": "SEND_GIFT"
}
```

**Example response:**

```json
{
  "success": true,
  "data": {},
  "message": "Request completed successfully"
}
```

**Common failure responses:** `400` validation/business rule failure, `401` missing/invalid token, `403` role/permission denied, `404` missing owned record.

### PATCH /notifications/{id}/read

**Allowed role(s):** SUPER_ADMIN, ADMIN, PROVIDER, REGISTERED_USER

**Swagger tag:** Notifications

**Summary:** Mark notification as read

**Description:** JWT auth. Notification must belong to the logged-in account.

**Parameters:** `id` (path, required)

**Request payload:** None

**Common failure responses:** `400` validation/business rule failure, `401` missing/invalid token, `403` role/permission denied, `404` missing owned record.

## Broadcast Notifications

| Method | Path | Roles | Summary |
|---|---|---|---|
| `GET` | `/broadcasts` | SUPER_ADMIN, ADMIN |  |
| `POST` | `/broadcasts` | SUPER_ADMIN, ADMIN |  |
| `POST` | `/broadcasts/estimate-reach` | SUPER_ADMIN, ADMIN |  |
| `GET` | `/broadcasts/{id}` | SUPER_ADMIN, ADMIN |  |
| `PATCH` | `/broadcasts/{id}` | SUPER_ADMIN, ADMIN |  |
| `POST` | `/broadcasts/{id}/cancel` | SUPER_ADMIN, ADMIN |  |
| `GET` | `/broadcasts/{id}/recipients` | SUPER_ADMIN, ADMIN |  |
| `GET` | `/broadcasts/{id}/report` | SUPER_ADMIN, ADMIN |  |
| `PATCH` | `/broadcasts/{id}/schedule` | SUPER_ADMIN, ADMIN |  |
| `PATCH` | `/broadcasts/{id}/targeting` | SUPER_ADMIN, ADMIN |  |

### GET /broadcasts

**Allowed role(s):** SUPER_ADMIN, ADMIN

**Swagger tag:** Broadcast Notifications

**Summary:** —

**Parameters:** `page` (query, optional), `limit` (query, optional), `search` (query, optional), `status` (query, optional), `channel` (query, optional), `priority` (query, optional), `createdFrom` (query, optional), `createdTo` (query, optional), `scheduledFrom` (query, optional), `scheduledTo` (query, optional), `sortBy` (query, optional), `sortOrder` (query, optional)

**Example response:**

```json
{
  "success": true,
  "data": {},
  "message": "Request completed successfully"
}
```

**Common failure responses:** `401` missing/invalid token, `403` role/permission denied, `404` missing owned record when applicable.

### POST /broadcasts

**Allowed role(s):** SUPER_ADMIN, ADMIN

**Swagger tag:** Broadcast Notifications

**Summary:** —

**Parameters:** None

**Request DTO:** `CreateBroadcastDto`

**Request payload example:**

```json
{
  "title": "example",
  "message": "example",
  "imageUrl": "example",
  "ctaLabel": "example",
  "ctaUrl": "example",
  "channels": [
    "EMAIL"
  ],
  "priority": "LOW"
}
```

**Example response:**

```json
{
  "success": true,
  "data": {},
  "message": "Request completed successfully"
}
```

**Common failure responses:** `400` validation/business rule failure, `401` missing/invalid token, `403` role/permission denied, `404` missing owned record.

### POST /broadcasts/estimate-reach

**Allowed role(s):** SUPER_ADMIN, ADMIN

**Swagger tag:** Broadcast Notifications

**Summary:** —

**Parameters:** None

**Request DTO:** `EstimateReachDto`

**Request payload example:**

```json
{
  "channels": [
    "EMAIL"
  ],
  "targeting": {
    "mode": "ALL_USERS",
    "roles": [
      "ADMIN"
    ],
    "filters": {
      "location": "example",
      "onlyVerifiedEmails": true,
      "excludeUnsubscribed": true,
      "excludeSuspended": true
    }
  }
}
```

**Example response:**

```json
{
  "success": true,
  "data": {},
  "message": "Request completed successfully"
}
```

**Common failure responses:** `400` validation/business rule failure, `401` missing/invalid token, `403` role/permission denied, `404` missing owned record.

### GET /broadcasts/{id}

**Allowed role(s):** SUPER_ADMIN, ADMIN

**Swagger tag:** Broadcast Notifications

**Summary:** —

**Parameters:** `id` (path, required)

**Example response:**

```json
{
  "success": true,
  "data": {},
  "message": "Request completed successfully"
}
```

**Common failure responses:** `401` missing/invalid token, `403` role/permission denied, `404` missing owned record when applicable.

### PATCH /broadcasts/{id}

**Allowed role(s):** SUPER_ADMIN, ADMIN

**Swagger tag:** Broadcast Notifications

**Summary:** —

**Parameters:** `id` (path, required)

**Request DTO:** `UpdateBroadcastDto`

**Request payload example:**

```json
{
  "title": "example",
  "message": "example",
  "imageUrl": "example",
  "ctaLabel": "example",
  "ctaUrl": "example",
  "channels": [
    "EMAIL"
  ],
  "priority": "LOW"
}
```

**Common failure responses:** `400` validation/business rule failure, `401` missing/invalid token, `403` role/permission denied, `404` missing owned record.

### POST /broadcasts/{id}/cancel

**Allowed role(s):** SUPER_ADMIN, ADMIN

**Swagger tag:** Broadcast Notifications

**Summary:** —

**Parameters:** `id` (path, required)

**Request DTO:** `CancelBroadcastDto`

**Request payload example:**

```json
{
  "reason": "example"
}
```

**Example response:**

```json
{
  "success": true,
  "data": {},
  "message": "Request completed successfully"
}
```

**Common failure responses:** `400` validation/business rule failure, `401` missing/invalid token, `403` role/permission denied, `404` missing owned record.

### GET /broadcasts/{id}/recipients

**Allowed role(s):** SUPER_ADMIN, ADMIN

**Swagger tag:** Broadcast Notifications

**Summary:** —

**Parameters:** `id` (path, required), `page` (query, optional), `limit` (query, optional), `channel` (query, optional), `status` (query, optional), `search` (query, optional)

**Example response:**

```json
{
  "success": true,
  "data": {},
  "message": "Request completed successfully"
}
```

**Common failure responses:** `401` missing/invalid token, `403` role/permission denied, `404` missing owned record when applicable.

### GET /broadcasts/{id}/report

**Allowed role(s):** SUPER_ADMIN, ADMIN

**Swagger tag:** Broadcast Notifications

**Summary:** —

**Parameters:** `id` (path, required)

**Example response:**

```json
{
  "success": true,
  "data": {},
  "message": "Request completed successfully"
}
```

**Common failure responses:** `401` missing/invalid token, `403` role/permission denied, `404` missing owned record when applicable.

### PATCH /broadcasts/{id}/schedule

**Allowed role(s):** SUPER_ADMIN, ADMIN

**Swagger tag:** Broadcast Notifications

**Summary:** —

**Parameters:** `id` (path, required)

**Request DTO:** `ScheduleBroadcastDto`

**Request payload example:**

```json
{
  "sendMode": "NOW",
  "scheduledAt": "example",
  "timezone": "example",
  "isRecurring": true,
  "recurrence": {}
}
```

**Common failure responses:** `400` validation/business rule failure, `401` missing/invalid token, `403` role/permission denied, `404` missing owned record.

### PATCH /broadcasts/{id}/targeting

**Allowed role(s):** SUPER_ADMIN, ADMIN

**Swagger tag:** Broadcast Notifications

**Summary:** —

**Parameters:** `id` (path, required)

**Request DTO:** `BroadcastTargetingDto`

**Request payload example:**

```json
{
  "mode": "ALL_USERS",
  "roles": [
    "ADMIN"
  ],
  "filters": {
    "location": "example",
    "onlyVerifiedEmails": true,
    "excludeUnsubscribed": true,
    "excludeSuspended": true
  }
}
```

**Common failure responses:** `400` validation/business rule failure, `401` missing/invalid token, `403` role/permission denied, `404` missing owned record.

## Subscription Plans

| Method | Path | Roles | Summary |
|---|---|---|---|
| `GET` | `/plan-features` | SUPER_ADMIN, ADMIN |  |
| `POST` | `/plan-features` | SUPER_ADMIN, ADMIN |  |
| `GET` | `/plan-features/catalog` | SUPER_ADMIN, ADMIN |  |
| `GET` | `/subscription-plans` | SUPER_ADMIN, ADMIN |  |
| `POST` | `/subscription-plans` | SUPER_ADMIN, ADMIN |  |
| `GET` | `/subscription-plans/stats` | SUPER_ADMIN, ADMIN |  |
| `GET` | `/plan-features/{id}` | SUPER_ADMIN, ADMIN |  |
| `PATCH` | `/plan-features/{id}` | SUPER_ADMIN, ADMIN |  |
| `DELETE` | `/plan-features/{id}` | SUPER_ADMIN, ADMIN |  |
| `GET` | `/subscription-plans/{id}` | SUPER_ADMIN, ADMIN |  |
| `PATCH` | `/subscription-plans/{id}` | SUPER_ADMIN, ADMIN |  |
| `DELETE` | `/subscription-plans/{id}` | SUPER_ADMIN, ADMIN |  |
| `GET` | `/subscription-plans/{id}/analytics` | SUPER_ADMIN, ADMIN |  |
| `PATCH` | `/subscription-plans/{id}/status` | SUPER_ADMIN, ADMIN |  |
| `PATCH` | `/subscription-plans/{id}/visibility` | SUPER_ADMIN, ADMIN |  |

### GET /plan-features

**Allowed role(s):** SUPER_ADMIN, ADMIN

**Swagger tag:** Subscription Plans

**Summary:** —

**Parameters:** `page` (query, optional), `limit` (query, optional), `search` (query, optional), `isActive` (query, optional)

**Example response:**

```json
{
  "success": true,
  "data": {},
  "message": "Request completed successfully"
}
```

**Common failure responses:** `401` missing/invalid token, `403` role/permission denied, `404` missing owned record when applicable.

### POST /plan-features

**Allowed role(s):** SUPER_ADMIN, ADMIN

**Swagger tag:** Subscription Plans

**Summary:** —

**Parameters:** None

**Request DTO:** `CreatePlanFeatureDto`

**Request payload example:**

```json
{
  "key": "example",
  "label": "example",
  "description": "example",
  "type": "BOOLEAN",
  "isActive": true,
  "sortOrder": 100
}
```

**Example response:**

```json
{
  "success": true,
  "data": {},
  "message": "Request completed successfully"
}
```

**Common failure responses:** `400` validation/business rule failure, `401` missing/invalid token, `403` role/permission denied, `404` missing owned record.

### GET /plan-features/catalog

**Allowed role(s):** SUPER_ADMIN, ADMIN

**Swagger tag:** Subscription Plans

**Summary:** —

**Parameters:** None

**Example response:**

```json
{
  "success": true,
  "data": {},
  "message": "Request completed successfully"
}
```

**Common failure responses:** `401` missing/invalid token, `403` role/permission denied, `404` missing owned record when applicable.

### GET /subscription-plans

**Allowed role(s):** SUPER_ADMIN, ADMIN

**Swagger tag:** Subscription Plans

**Summary:** —

**Parameters:** `page` (query, optional), `limit` (query, optional), `search` (query, optional), `status` (query, optional), `visibility` (query, optional), `billingCycle` (query, optional), `sortBy` (query, optional), `sortOrder` (query, optional)

**Example response:**

```json
{
  "success": true,
  "data": {},
  "message": "Request completed successfully"
}
```

**Common failure responses:** `401` missing/invalid token, `403` role/permission denied, `404` missing owned record when applicable.

### POST /subscription-plans

**Allowed role(s):** SUPER_ADMIN, ADMIN

**Swagger tag:** Subscription Plans

**Summary:** —

**Parameters:** None

**Request DTO:** `CreateSubscriptionPlanDto`

**Request payload example:**

```json
{
  "name": "example",
  "description": "example",
  "monthlyPrice": 100,
  "yearlyPrice": 100,
  "currency": "USD",
  "visibility": "PUBLIC",
  "status": "ACTIVE",
  "isPopular": true,
  "features": {},
  "limits": {
    "maxGiftsPerMonth": 100,
    "maxGroupGiftingEvents": 100,
    "maxTeamMembers": 100,
    "storageGb": 100
  }
}
```

**Example response:**

```json
{
  "success": true,
  "data": {},
  "message": "Request completed successfully"
}
```

**Common failure responses:** `400` validation/business rule failure, `401` missing/invalid token, `403` role/permission denied, `404` missing owned record.

### GET /subscription-plans/stats

**Allowed role(s):** SUPER_ADMIN, ADMIN

**Swagger tag:** Subscription Plans

**Summary:** —

**Parameters:** None

**Example response:**

```json
{
  "success": true,
  "data": {},
  "message": "Request completed successfully"
}
```

**Common failure responses:** `401` missing/invalid token, `403` role/permission denied, `404` missing owned record when applicable.

### GET /plan-features/{id}

**Allowed role(s):** SUPER_ADMIN, ADMIN

**Swagger tag:** Subscription Plans

**Summary:** —

**Parameters:** `id` (path, required)

**Example response:**

```json
{
  "success": true,
  "data": {},
  "message": "Request completed successfully"
}
```

**Common failure responses:** `401` missing/invalid token, `403` role/permission denied, `404` missing owned record when applicable.

### PATCH /plan-features/{id}

**Allowed role(s):** SUPER_ADMIN, ADMIN

**Swagger tag:** Subscription Plans

**Summary:** —

**Parameters:** `id` (path, required)

**Request DTO:** `UpdatePlanFeatureDto`

**Request payload example:**

```json
{
  "key": "example",
  "label": "example",
  "description": "example",
  "type": "BOOLEAN",
  "isActive": true,
  "sortOrder": 100
}
```

**Common failure responses:** `400` validation/business rule failure, `401` missing/invalid token, `403` role/permission denied, `404` missing owned record.

### DELETE /plan-features/{id}

**Allowed role(s):** SUPER_ADMIN, ADMIN

**Swagger tag:** Subscription Plans

**Summary:** —

**Parameters:** `id` (path, required)

**Common failure responses:** `400` validation/business rule failure, `401` missing/invalid token, `403` role/permission denied, `404` missing owned record.

### GET /subscription-plans/{id}

**Allowed role(s):** SUPER_ADMIN, ADMIN

**Swagger tag:** Subscription Plans

**Summary:** —

**Parameters:** `id` (path, required)

**Example response:**

```json
{
  "success": true,
  "data": {},
  "message": "Request completed successfully"
}
```

**Common failure responses:** `401` missing/invalid token, `403` role/permission denied, `404` missing owned record when applicable.

### PATCH /subscription-plans/{id}

**Allowed role(s):** SUPER_ADMIN, ADMIN

**Swagger tag:** Subscription Plans

**Summary:** —

**Parameters:** `id` (path, required)

**Request DTO:** `UpdateSubscriptionPlanDto`

**Request payload example:**

```json
{
  "name": "example",
  "description": "example",
  "monthlyPrice": 100,
  "yearlyPrice": 100,
  "currency": "example",
  "visibility": "PUBLIC",
  "status": "ACTIVE",
  "isPopular": true,
  "features": {},
  "limits": {
    "maxGiftsPerMonth": 100,
    "maxGroupGiftingEvents": 100,
    "maxTeamMembers": 100,
    "storageGb": 100
  }
}
```

**Common failure responses:** `400` validation/business rule failure, `401` missing/invalid token, `403` role/permission denied, `404` missing owned record.

### DELETE /subscription-plans/{id}

**Allowed role(s):** SUPER_ADMIN, ADMIN

**Swagger tag:** Subscription Plans

**Summary:** —

**Parameters:** `id` (path, required)

**Common failure responses:** `400` validation/business rule failure, `401` missing/invalid token, `403` role/permission denied, `404` missing owned record.

### GET /subscription-plans/{id}/analytics

**Allowed role(s):** SUPER_ADMIN, ADMIN

**Swagger tag:** Subscription Plans

**Summary:** —

**Parameters:** `id` (path, required)

**Example response:**

```json
{
  "success": true,
  "data": {},
  "message": "Request completed successfully"
}
```

**Common failure responses:** `401` missing/invalid token, `403` role/permission denied, `404` missing owned record when applicable.

### PATCH /subscription-plans/{id}/status

**Allowed role(s):** SUPER_ADMIN, ADMIN

**Swagger tag:** Subscription Plans

**Summary:** —

**Parameters:** `id` (path, required)

**Request DTO:** `UpdatePlanStatusDto`

**Request payload example:**

```json
{
  "status": "ACTIVE",
  "reason": "example"
}
```

**Common failure responses:** `400` validation/business rule failure, `401` missing/invalid token, `403` role/permission denied, `404` missing owned record.

### PATCH /subscription-plans/{id}/visibility

**Allowed role(s):** SUPER_ADMIN, ADMIN

**Swagger tag:** Subscription Plans

**Summary:** —

**Parameters:** `id` (path, required)

**Request DTO:** `UpdatePlanVisibilityDto`

**Request payload example:**

```json
{
  "visibility": "PUBLIC"
}
```

**Common failure responses:** `400` validation/business rule failure, `401` missing/invalid token, `403` role/permission denied, `404` missing owned record.

## Coupons

| Method | Path | Roles | Summary |
|---|---|---|---|
| `GET` | `/coupons` | SUPER_ADMIN, ADMIN |  |
| `POST` | `/coupons` | SUPER_ADMIN, ADMIN |  |
| `GET` | `/coupons/{id}` | SUPER_ADMIN, ADMIN |  |
| `PATCH` | `/coupons/{id}` | SUPER_ADMIN, ADMIN |  |
| `DELETE` | `/coupons/{id}` | SUPER_ADMIN, ADMIN |  |
| `PATCH` | `/coupons/{id}/status` | SUPER_ADMIN, ADMIN |  |

### GET /coupons

**Allowed role(s):** SUPER_ADMIN, ADMIN

**Swagger tag:** Coupons

**Summary:** —

**Parameters:** `page` (query, optional), `limit` (query, optional), `search` (query, optional), `status` (query, optional), `planId` (query, optional)

**Example response:**

```json
{
  "success": true,
  "data": {},
  "message": "Request completed successfully"
}
```

**Common failure responses:** `401` missing/invalid token, `403` role/permission denied, `404` missing owned record when applicable.

### POST /coupons

**Allowed role(s):** SUPER_ADMIN, ADMIN

**Swagger tag:** Coupons

**Summary:** —

**Parameters:** None

**Request DTO:** `CreateCouponDto`

**Request payload example:**

```json
{
  "code": "example",
  "description": "example",
  "discountType": "PERCENTAGE",
  "discountValue": 100,
  "planIds": [
    "example"
  ],
  "startsAt": "example",
  "expiresAt": "example",
  "maxRedemptions": 100,
  "isActive": true
}
```

**Example response:**

```json
{
  "success": true,
  "data": {},
  "message": "Request completed successfully"
}
```

**Common failure responses:** `400` validation/business rule failure, `401` missing/invalid token, `403` role/permission denied, `404` missing owned record.

### GET /coupons/{id}

**Allowed role(s):** SUPER_ADMIN, ADMIN

**Swagger tag:** Coupons

**Summary:** —

**Parameters:** `id` (path, required)

**Example response:**

```json
{
  "success": true,
  "data": {},
  "message": "Request completed successfully"
}
```

**Common failure responses:** `401` missing/invalid token, `403` role/permission denied, `404` missing owned record when applicable.

### PATCH /coupons/{id}

**Allowed role(s):** SUPER_ADMIN, ADMIN

**Swagger tag:** Coupons

**Summary:** —

**Parameters:** `id` (path, required)

**Request DTO:** `UpdateCouponDto`

**Request payload example:**

```json
{
  "code": "example",
  "description": "example",
  "discountType": "PERCENTAGE",
  "discountValue": 100,
  "planIds": [
    "example"
  ],
  "startsAt": "example",
  "expiresAt": "example",
  "maxRedemptions": 100,
  "isActive": true
}
```

**Common failure responses:** `400` validation/business rule failure, `401` missing/invalid token, `403` role/permission denied, `404` missing owned record.

### DELETE /coupons/{id}

**Allowed role(s):** SUPER_ADMIN, ADMIN

**Swagger tag:** Coupons

**Summary:** —

**Parameters:** `id` (path, required)

**Common failure responses:** `400` validation/business rule failure, `401` missing/invalid token, `403` role/permission denied, `404` missing owned record.

### PATCH /coupons/{id}/status

**Allowed role(s):** SUPER_ADMIN, ADMIN

**Swagger tag:** Coupons

**Summary:** —

**Parameters:** `id` (path, required)

**Request DTO:** `UpdateCouponStatusDto`

**Request payload example:**

```json
{
  "status": "ACTIVE",
  "reason": "example"
}
```

**Common failure responses:** `400` validation/business rule failure, `401` missing/invalid token, `403` role/permission denied, `404` missing owned record.

## Storage

| Method | Path | Roles | Summary |
|---|---|---|---|
| `GET` | `/uploads` | SUPER_ADMIN, ADMIN, REGISTERED_USER, PROVIDER |  |
| `POST` | `/uploads/complete` | SUPER_ADMIN, ADMIN, REGISTERED_USER, PROVIDER |  |
| `POST` | `/uploads/presigned-url` | SUPER_ADMIN, ADMIN, REGISTERED_USER, PROVIDER |  |
| `GET` | `/uploads/{id}` | SUPER_ADMIN, ADMIN, REGISTERED_USER, PROVIDER |  |
| `DELETE` | `/uploads/{id}` | SUPER_ADMIN, ADMIN, REGISTERED_USER, PROVIDER |  |

### GET /uploads

**Allowed role(s):** SUPER_ADMIN, ADMIN, REGISTERED_USER, PROVIDER

**Swagger tag:** Storage

**Summary:** —

**Parameters:** `page` (query, optional), `limit` (query, optional), `folder` (query, optional), `ownerId` (query, optional)

**Example response:**

```json
{
  "success": true,
  "data": {},
  "message": "Request completed successfully"
}
```

**Common failure responses:** `401` missing/invalid token, `403` role/permission denied, `404` missing owned record when applicable.

### POST /uploads/complete

**Allowed role(s):** SUPER_ADMIN, ADMIN, REGISTERED_USER, PROVIDER

**Swagger tag:** Storage

**Summary:** —

**Parameters:** None

**Request DTO:** `CompleteUploadDto`

**Request payload example:**

```json
{
  "uploadId": "example",
  "sizeBytes": 100
}
```

**Example response:**

```json
{
  "success": true,
  "data": {},
  "message": "Request completed successfully"
}
```

**Common failure responses:** `400` validation/business rule failure, `401` missing/invalid token, `403` role/permission denied, `404` missing owned record.

### POST /uploads/presigned-url

**Allowed role(s):** SUPER_ADMIN, ADMIN, REGISTERED_USER, PROVIDER

**Swagger tag:** Storage

**Summary:** —

**Parameters:** None

**Request DTO:** `CreatePresignedUploadDto`

**Request payload example:**

```json
{
  "folder": "admin-avatars",
  "fileName": "avatar.png",
  "contentType": "image/png",
  "sizeBytes": 1048576,
  "targetAccountId": "target_account_id",
  "giftId": "gift_id"
}
```

**Example response:**

```json
{
  "success": true,
  "data": {},
  "message": "Request completed successfully"
}
```

**Common failure responses:** `400` validation/business rule failure, `401` missing/invalid token, `403` role/permission denied, `404` missing owned record.

### GET /uploads/{id}

**Allowed role(s):** SUPER_ADMIN, ADMIN, REGISTERED_USER, PROVIDER

**Swagger tag:** Storage

**Summary:** —

**Parameters:** `id` (path, required)

**Example response:**

```json
{
  "success": true,
  "data": {},
  "message": "Request completed successfully"
}
```

**Common failure responses:** `401` missing/invalid token, `403` role/permission denied, `404` missing owned record when applicable.

### DELETE /uploads/{id}

**Allowed role(s):** SUPER_ADMIN, ADMIN, REGISTERED_USER, PROVIDER

**Swagger tag:** Storage

**Summary:** —

**Parameters:** `id` (path, required)

**Common failure responses:** `400` validation/business rule failure, `401` missing/invalid token, `403` role/permission denied, `404` missing owned record.

## Audit Logs

| Method | Path | Roles | Summary |
|---|---|---|---|
| `GET` | `/audit-logs` | SUPER_ADMIN |  |
| `GET` | `/audit-logs/export` | SUPER_ADMIN |  |
| `GET` | `/audit-logs/{id}` | SUPER_ADMIN |  |

### GET /audit-logs

**Allowed role(s):** SUPER_ADMIN

**Swagger tag:** Audit Logs

**Summary:** —

**Parameters:** `page` (query, optional), `limit` (query, optional), `actorId` (query, optional), `targetId` (query, optional), `action` (query, optional), `targetType` (query, optional), `module` (query, optional), `from` (query, optional), `to` (query, optional), `sortBy` (query, optional), `sortOrder` (query, optional)

**Example response:**

```json
{
  "success": true,
  "data": {},
  "message": "Request completed successfully"
}
```

**Common failure responses:** `401` missing/invalid token, `403` role/permission denied, `404` missing owned record when applicable.

### GET /audit-logs/export

**Allowed role(s):** SUPER_ADMIN

**Swagger tag:** Audit Logs

**Summary:** —

**Parameters:** `page` (query, optional), `limit` (query, optional), `actorId` (query, optional), `targetId` (query, optional), `action` (query, optional), `targetType` (query, optional), `module` (query, optional), `from` (query, optional), `to` (query, optional), `sortBy` (query, optional), `sortOrder` (query, optional)

**Example response:**

```json
{
  "success": true,
  "data": {},
  "message": "Request completed successfully"
}
```

**Common failure responses:** `401` missing/invalid token, `403` role/permission denied, `404` missing owned record when applicable.

### GET /audit-logs/{id}

**Allowed role(s):** SUPER_ADMIN

**Swagger tag:** Audit Logs

**Summary:** —

**Parameters:** `id` (path, required)

**Example response:**

```json
{
  "success": true,
  "data": {},
  "message": "Request completed successfully"
}
```

**Common failure responses:** `401` missing/invalid token, `403` role/permission denied, `404` missing owned record when applicable.
