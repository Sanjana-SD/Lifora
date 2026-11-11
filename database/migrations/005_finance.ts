import type { SQLiteDatabase } from 'expo-sqlite';

import { CREATE_IMPORT_HISTORY_TABLE, CREATE_TRANSACTIONS_TABLE } from '../schema';

export const version = 5;

export async function up(db: SQLiteDatabase): Promise<void> {
  await db.execAsync(CREATE_IMPORT_HISTORY_TABLE);
  await db.execAsync(CREATE_TRANSACTIONS_TABLE);
  await db.runAsync("UPDATE app_settings SET value = ? WHERE key = 'schema_version'", [String(version)]);
}
