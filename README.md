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
- `POST /login` — sign in for Super Admin, Admin, approved Provider, and Registered User
- `POST /refresh` — rotate access/refresh tokens
- `POST /logout` — revoke current refresh token
- `POST /verify-email` — verify email with OTP
- `POST /resend-verification` — issue a new verification OTP
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
- In development, OTP is exposed in the API response. Real email delivery requires adding SMTP/email-provider configuration in the next mailer slice.

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
```

## Response Envelope

Success:

```json
{ "success": true, "data": {}, "message": "OK" }
```

Error:

```json
{ "success": false, "error": { "code": "BadRequestException", "message": "Invalid input" }, "meta": {} }
```
