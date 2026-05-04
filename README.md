# Gift App Backend

NestJS backend for the Gift App. This repository starts with the first production-ready authentication API slice.

## Base Path

`/api/v1`

## Swagger

`http://localhost:3000/docs`

## Auth APIs

Base route: `/api/v1/auth`

- `POST /register` — create customer/admin account and issue auth tokens
- `POST /login` — login with email/password
- `POST /refresh` — rotate access/refresh tokens
- `POST /logout` — revoke current refresh token
- `POST /verify-email` — verify email with OTP
- `POST /resend-verification` — issue a new verification OTP
- `POST /forgot-password` — request password reset OTP
- `POST /reset-password` — reset password with OTP
- `PATCH /change-password` — change password while authenticated
- `GET /me` — current user profile/context
- `DELETE /account` — schedule account deletion for 30 days
- `POST /cancel-deletion` — cancel scheduled account deletion

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
