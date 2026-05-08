# Gift App Backend

NestJS backend for the Personalized Gifting & Payments Application.

This repo is now aligned with the SRD roles: **Super Admin**, **Admin**, **Registered User**, **Guest User**, and **Provider User**.

## Base Path

`/api/v1`

## Swagger

`http://localhost:3000/docs`

## Auth / Role Model

### Roles

- `SUPER_ADMIN` — full system control; creates/manages Admins and defines policies.
- `ADMIN` — signs in directly and receives Super Admin-defined permissions; no public admin signup.
- `REGISTERED_USER` — mobile app user for gifting, payments, calendar, contacts, and profile features.
- `PROVIDER` — signs up from provider onboarding, remains pending until Super Admin approval.
- `GUEST` — intentionally not persisted as an auth role; guests access public/onboarding/shared-link flows without authentication.

### Auth APIs

Base route: `/api/v1/auth`

- `POST /users/register` — Registered User signup
- `POST /providers/register` — Provider signup with business/service-area details and verification document URLs
- `POST /guest/session` — non-authenticated guest capability payload for onboarding/explore mode
- `POST /login` — sign in for Super Admin, Admin, approved Provider, and Registered User
- `POST /admins` — Super Admin creates Admin users with permissions
- `PATCH /providers/:id/approve` — Super Admin approves Provider login access
- `PATCH /providers/:id/reject` — Super Admin rejects a Provider application
- `PATCH /users/:id/active-status` — Super Admin/Admin activates or deactivates allowed accounts
- `POST /refresh` — rotate access/refresh tokens
- `POST /logout` — revoke current refresh token
- `POST /verify-email` — verify email with OTP
- `POST /resend-otp` — registration-flow alias for resending email verification OTP with the registration bearer token
- `POST /forgot-password` — request password reset OTP
- `POST /reset-password` — reset password with OTP
- `PATCH /change-password` — change password while authenticated
- `GET /me` — current user profile/context with role-specific metadata only
- `DELETE /account` — schedule Registered User / Provider account deletion for 30 days
- `POST /cancel-deletion` — cancel scheduled account deletion

## SRD Alignment Notes

- Public signup does **not** accept arbitrary roles, preventing users from self-registering as Admin or Super Admin.
- Provider signup stores provider status as `PENDING`; login is blocked until approval.
- Admin accounts are expected to be created/approved by Super Admin flows in the admin module.
- Admin JWT payloads include `adminPermissions` so future admin APIs can enforce inherited Super Admin use cases.
- Auth responses are role-shaped: registered users do not receive null admin/provider fields.
- `isActive` means account enabled/disabled state; `isVerified` means email/OTP verification. Provider approval is returned only under `provider.approvalStatus`.
- Guest access remains unauthenticated by design, matching the SRD requirement that all roles except Guest authenticate.
- Exactly one Super Admin is bootstrapped in the database on startup: `giftapp.superadmin@yopmail.com` / `Admin@123456`. Super Admin credentials are not configured from environment variables. Any other `SUPER_ADMIN` rows are demoted to inactive `ADMIN` accounts so Super Admin APIs always resolve to this canonical account.
- Login attempts are tracked in `login_attempts`; five failed attempts within 15 minutes blocks further login attempts temporarily.
- Login requires `isVerified=true` and `isActive=true`; inactive users are blocked until reactivated by an authorized Admin/Super Admin.
- Registration returns access/refresh tokens so the frontend can call `verify-email` or `resend-otp` before normal login is allowed.
- When `EMAIL_ENABLED=true`, verification and password-reset OTPs are sent through SMTP.

### Login Attempt Tracking APIs

Base route: `/api/v1/login-attempts`

- `GET /` — Super Admin/Admin list of successful, failed, and blocked login attempts; supports `email`, `status`, `role`, `userId`, `page`, and `limit` filters.

## Tech Stack

- NestJS 11
- Prisma 7
- PostgreSQL
- JWT auth
- bcrypt password hashing
- Swagger/OpenAPI
- class-validator DTO validation

## Run Locally

```bash
npm install
cp .env.example .env
npm run prisma:generate
npm run prisma:migrate -- --name init
npm run start:dev
```

## Environment

See `.env.example`.

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/gift_app
JWT_ACCESS_SECRET=change-me-access
JWT_REFRESH_SECRET=change-me-refresh
APP_NAME="Gift App"
APP_LOGO_URL="https://<YOUR_PUBLIC_BUCKET_OR_CDN_URL>/brand/gift-app-logo.png"
APP_SUPPORT_EMAIL="support@giftapp.com"
APP_FRONTEND_URL="https://app.giftapp.com"
EMAIL_FROM_NAME="Gift App"
EMAIL_ENABLED=false
MAIL_MAILER=smtp
MAIL_HOST=
MAIL_PORT=465
MAIL_USERNAME=
MAIL_PASSWORD=
MAIL_ENCRYPTION=ssl
MAIL_FROM_ADDRESS=
```

## Email Branding

- Professional branded HTML email templates added with plain-text fallbacks preserved.
- Templates cover OTP verification, reset password, admin invite, provider approved/rejected, account suspended/status updates, and broadcast emails.
- `APP_LOGO_URL` must point to your own public S3/CDN asset, not a third-party page URL. Temporary QA logo flow: download the selected free gift-box image, upload it to `brand/gift-app-logo.png` in your AWS bucket/CDN, then set `APP_LOGO_URL` to the final public URL.
- Brand variables: `APP_NAME`, `APP_LOGO_URL`, `APP_SUPPORT_EMAIL`, `APP_FRONTEND_URL`, `EMAIL_FROM_NAME`. Sender address uses the existing SMTP `MAIL_FROM_ADDRESS`.

## Response Envelope

Success:

```json
{ "success": true, "data": {}, "message": "OK" }
```

Error:

```json
{ "success": false, "error": { "code": "BadRequestException", "message": "Invalid input" }, "meta": {} }
```

## Super Admin / Staff Management APIs

- `GET /api/v1/admins` — Super Admin list admins with `page`, `limit`, `search`, `roleId`, `role`, `status`, `sortBy`, `sortOrder`.
- `GET /api/v1/admins/:id` — Super Admin fetch admin details.
- `POST /api/v1/admins` — Super Admin create admin using `roleId`, `temporaryPassword` or `generateTemporaryPassword`, `mustChangePassword`, `avatarUrl`, `isActive`.
- `PATCH /api/v1/admins/:id` — Super Admin update admin profile, avatar, title, role, status.
- `PATCH /api/v1/admins/:id/active-status` — Super Admin enable/disable admin.
- `PATCH /api/v1/admins/:id/password` — Super Admin set/reset temporary password.
- `GET /api/v1/admin-roles` — Super Admin list reusable admin roles.
- `GET /api/v1/admin-roles/:id` — Super Admin fetch role with permissions.
- `POST /api/v1/admin-roles` — Super Admin create custom role.
- `PATCH /api/v1/admin-roles/:id` — Super Admin update role details/status.
- `PATCH /api/v1/admin-roles/:id/permissions` — Super Admin update role permissions and sync assigned admins.
- `DELETE /api/v1/admin-roles/:id` — Super Admin soft-delete custom unused role.
- `GET /api/v1/permissions/catalog` — Super Admin fetch frontend permission catalog.

## Storage APIs

- `POST /api/v1/uploads/presigned-url` — Super Admin/Admin generate S3 presigned upload URL for `admin-avatars`, `user-avatars`, or `provider-documents`.

Required storage env:

```env
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_REGION=eu-west-2
AWS_BUCKET_NAME=
AWS_PUBLIC_BASE_URL=
AWS_PRESIGNED_UPLOAD_EXPIRY_SECONDS=300
```

After pulling schema changes on a server, run `npx prisma db push` or create/apply a migration before restarting PM2.
- `GET /api/v1/audit-logs` — Super Admin fetch audit logs with `page`, `limit`, `actorId`, `targetId`, `action` filters.
