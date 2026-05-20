# Migration Baseline Notes

## 2026-05-20 Investigation

### Required commands

- `npx prisma validate`: passed locally.
- `npx prisma migrate status` with default local URL: blocked because `postgresql://postgres:postgres@localhost:5432/gift_app` was unreachable in this environment.
- `npx prisma generate`: passed locally.
- Fresh local Postgres (`postgres:16-alpine`, `127.0.0.1:5547/giftapp_fresh`) with `DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:5547/giftapp_fresh`:
  - `npx prisma migrate deploy`: passed from an empty database.
  - `npx prisma migrate status`: clean / database schema up to date.
  - `npx ts-node scripts/db/smoke-check-schema.ts`: `SCHEMA_SMOKE_OK`.

### Baseline migration

A new baseline migration was added:

- `20260517000000_initial_baseline`

This is required because the repository previously only had incremental migrations that assumed existing core tables such as `users`, `gifts`, and `chat_threads`. A truly empty database could not run `migrate deploy` before this baseline.

For an existing production database that already has the baseline schema but does not have this migration recorded in `_prisma_migrations`, do **not** blindly run deploy. First verify schema parity, then mark the baseline as applied:

```bash
npx prisma migrate resolve --applied 20260517000000_initial_baseline
```

Only do this after backup and schema verification.

### Duplicate message moderation migrations

Duplicate-risk migrations were confirmed:

- `20260518055500_add_message_moderation`
- `20260518060000_add_message_moderation`

Both represented the same message moderation objects. To preserve migration history while making deployments safe, both now use guarded/idempotent enum/table/index/FK creation. This avoids duplicate enum/table failures on fresh and baseline deployments.

If production already applied either original migration, inspect `_prisma_migrations` before deployment. If Prisma reports checksum mismatch for an already-applied migration, stop and decide whether to use `migrate resolve` based on verified schema state.

### Chat runtime migration hardening

`20260519111500_unify_chat_runtime` was hardened:

- `ChatThreadType`, `ChatSourceType`, `ChatThreadStatus`, and `ChatParticipantRole` creation now use `pg_type` guards.
- Old support chat backfill uses `to_regclass` + dynamic SQL, avoiding parse-time failures when `support_chats` or `support_chat_messages` do not exist.
- Old support tables/types are dropped with `IF EXISTS`.
- Chat FK creation is guarded by `pg_constraint` checks.

Manual SQL tests passed for:

- support chat tables absent
- support chat tables present

### Recent migration hardening

- `20260519103000_harden_guest_sessions`: already idempotent for `GuestCapability`, `GuestSessionPlatform`, and `guest_sessions` additions.
- `20260520093000_notification_delivery_logs`: now idempotent for `NotificationDeliveryStatus`, table/indexes/FK.

### Production caution

This repository now supports fresh DB migration from zero, but production may already have schema objects created before migration history existed. Always follow `docs/production-migration-runbook.md` before production deployment.
