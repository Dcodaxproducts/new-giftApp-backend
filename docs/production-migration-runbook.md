# Production Migration Runbook

Applies to the recent migration hardening set:

- `20260519103000_harden_guest_sessions`
- `20260519111500_unify_chat_runtime`
- `20260520093000_notification_delivery_logs`

## 1. Backup

1. Confirm the production `DATABASE_URL` points to the intended database.
2. Take a logical backup before deploying migrations:

```bash
BACKUP_FILE="giftapp-$(date +%Y%m%d-%H%M%S).dump"
pg_dump "$DATABASE_URL" --format=custom --file="$BACKUP_FILE"
pg_restore --list "$BACKUP_FILE" >/dev/null
```

3. Store the backup in the approved secure backup location.

## 2. Pre-deploy validation

```bash
npx prisma validate
npx prisma generate
npx prisma migrate status
```

Expected result: Prisma schema is valid and migration status does not report drift or failed migrations.

## 3. Deploy migrations

```bash
npx prisma migrate deploy
```

Notes:

- The targeted migrations are guarded for production re-runs.
- Legacy support chat table reads are wrapped in `to_regclass` checks and dynamic SQL.
- Duplicate message moderation migrations are duplicate-safe through `IF NOT EXISTS` guards.

## 4. Post-deploy verification

Run Prisma status and build verification:

```bash
npx prisma migrate status
npm run build
```

## 5. Rollback plan

Prisma migrations are forward-only. If deployment fails:

1. Stop application rollout / keep previous app version running.
2. Capture the error output and current migration status:

```bash
npx prisma migrate status
```

3. If schema/data was partially changed and cannot be safely forward-fixed, restore the pre-deploy backup to a clean database:

```bash
pg_restore --clean --if-exists --dbname="$DATABASE_URL" "$BACKUP_FILE"
```

4. Re-run Prisma status and build verification against restored DB.
5. Prefer a forward fix migration when production data has already accepted writes after migration start.

## 6. Success criteria

- `npx prisma migrate deploy` exits 0.
- `npx prisma migrate status` reports database schema is up to date.
- `npm run build` exits 0.
