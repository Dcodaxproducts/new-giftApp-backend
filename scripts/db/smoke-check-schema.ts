import 'dotenv/config';
import { Client } from 'pg';

const requiredTables = [
  'chat_threads',
  'chat_participants',
  'chat_messages',
  'chat_message_read_receipts',
  'chat_attachments',
  'chat_audit_logs',
  'notification_delivery_logs',
  'message_moderation_cases',
  'message_moderation_logs',
];

const requiredEnums = [
  'ChatThreadType',
  'ChatSourceType',
  'ChatThreadStatus',
  'ChatParticipantRole',
  'NotificationDeliveryStatus',
  'MessageModerationSource',
  'MessageModerationStatus',
];

const removedSupportTables = ['support_chats', 'support_chat_messages'];

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL is required');
  const client = new Client({ connectionString: url });
  await client.connect();
  try {
    const tables = await client.query<{ table_name: string }>(
      `SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name = ANY($1::text[])`,
      [[...requiredTables, ...removedSupportTables]],
    );
    const tableSet = new Set(tables.rows.map((row) => row.table_name));
    const missingTables = requiredTables.filter((table) => !tableSet.has(table));
    if (missingTables.length) throw new Error(`Missing required tables: ${missingTables.join(', ')}`);
    const oldTables = removedSupportTables.filter((table) => tableSet.has(table));
    if (oldTables.length) throw new Error(`Old support chat tables still exist after unified chat migration: ${oldTables.join(', ')}`);

    const enums = await client.query<{ typname: string }>(
      `SELECT typname FROM pg_type WHERE typnamespace = 'public'::regnamespace AND typname = ANY($1::text[])`,
      [requiredEnums],
    );
    const enumSet = new Set(enums.rows.map((row) => row.typname));
    const missingEnums = requiredEnums.filter((type) => !enumSet.has(type));
    if (missingEnums.length) throw new Error(`Missing required enums: ${missingEnums.join(', ')}`);
    console.log('SCHEMA_SMOKE_OK');
  } finally {
    await client.end();
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
