# Production Migration Runbook

## Scope

This runbook covers production deployment for recent Gift App Prisma migrations:

- `20260519103000_harden_guest_sessions`
- `20260519111500_unify_chat_runtime`
- `20260520093000_notification_delivery_logs`

It also covers the duplicate-risk message moderation migrations:

- `20260518055500_add_message_moderation`
- `20260518060000_add_message_moderation`

## 1. Back up production database

Before any migration action, create and verify a restorable backup:

```bash
pg_dump "$DATABASE_URL" --format=custom --file=giftapp-prod-before-migrate.dump
pg_restore --list giftapp-prod-before-migrate.dump >/dev/null
```

Do not continue if backup creation or validation fails.

## 2. Run migration status

```bash
DATABASE_URL="$DATABASE_URL" npx prisma migrate status
```

Record whether Prisma reports unapplied migrations, failed migrations, or schema drift.

## 3. Inspect `_prisma_migrations`

```sql
SELECT migration_name, started_at, finished_at, rolled_back_at, checksum
FROM _prisma_migrations
ORDER BY started_at;
```

Confirm whether these migrations are already applied:

- `20260518055500_add_message_moderation`
- `20260518060000_add_message_moderation`
- `20260519103000_harden_guest_sessions`
- `20260519111500_unify_chat_runtime`
- `20260520093000_notification_delivery_logs`

## 4. Confirm duplicate message moderation state

The repository now makes `20260518060000_add_message_moderation` duplicate-safe with guarded enum/table/index/foreign-key creation. If production already applied the original migration, do **not** edit production history manually.

If a duplicate migration failed in production because objects already existed:

1. Verify the schema contains exactly:
   - `message_moderation_cases`
   - `message_moderation_logs`
   - `MessageModerationSource`
   - `MessageModerationFlagType`
   - `MessageModerationStatus`
   - `MessageModerationSeverity`
   - `MessageModerationAction`
2. Verify indexes and FK exist.
3. Only then use `npx prisma migrate resolve --applied 20260518060000_add_message_moderation`.

## 5. Apply safe migration deployment

```bash
DATABASE_URL="$DATABASE_URL" npx prisma migrate deploy
DATABASE_URL="$DATABASE_URL" npx prisma generate
```

The chat runtime migration is hardened with `to_regclass` and dynamic SQL so it works whether old `support_chats` tables exist or not.

## 6. Smoke checks

Run schema smoke check:

```bash
DATABASE_URL="$DATABASE_URL" npx ts-node scripts/db/smoke-check-schema.ts
```

Then run API smoke checks:

- guest session creation: `POST /api/v1/auth/guest/session`
- customer/guest marketplace read endpoints
- chat thread create/send/read endpoints under `08 Chat - Threads`
- notification delivery log creation via a notification-producing action
- provider payout method list endpoint

## 7. Rollback strategy

Preferred rollback is database restore from the verified backup plus redeploying the previous application image/commit.

If app rollback only is sufficient:

1. Stop traffic or put service in maintenance mode.
2. Deploy previous app commit.
3. Keep DB migrated forward if the previous app remains compatible.
4. If incompatible, restore the pre-migration backup.

Never drop migrated production tables/enums manually unless a restore plan has been tested.
