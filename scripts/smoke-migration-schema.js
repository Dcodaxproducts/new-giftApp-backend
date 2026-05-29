#!/usr/bin/env node
const { Client } = require('pg');

const REQUIRED_TABLES = [
  'guest_sessions',
  'chat_threads',
  'chat_messages',
  'chat_participants',
  'notification_delivery_logs',
];

const REQUIRED_ENUMS = [
  'GuestCapability',
  'GuestSessionPlatform',
  'ChatThreadType',
  'ChatSourceType',
  'ChatThreadStatus',
  'ChatParticipantRole',
  'ChatSenderType',
  'ChatMessageType',
  'MessageVisibilityStatus',
  'NotificationDeliveryStatus',
];

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error('DATABASE_URL is required');

  const client = new Client({ connectionString });
  await client.connect();
  try {
    const tableResult = await client.query(
      `SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name = ANY($1::text[])`,
      [REQUIRED_TABLES],
    );
    const enumResult = await client.query(
      `SELECT typname FROM pg_type WHERE typname = ANY($1::text[])`,
      [REQUIRED_ENUMS],
    );

    const tables = new Set(tableResult.rows.map((row) => row.table_name));
    const enums = new Set(enumResult.rows.map((row) => row.typname));
    const missingTables = REQUIRED_TABLES.filter((table) => !tables.has(table));
    const missingEnums = REQUIRED_ENUMS.filter((enumName) => !enums.has(enumName));

    if (missingTables.length || missingEnums.length) {
      console.error(JSON.stringify({ ok: false, missingTables, missingEnums }, null, 2));
      process.exitCode = 1;
      return;
    }

    console.log(JSON.stringify({ ok: true, tables: REQUIRED_TABLES, enums: REQUIRED_ENUMS }, null, 2));
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
