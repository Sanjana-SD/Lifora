import type { SQLiteDatabase } from 'expo-sqlite';

import { CREATE_CALCULATION_HISTORY_TABLE } from '../schema';

export const version = 3;

export async function up(db: SQLiteDatabase): Promise<void> {
  await db.execAsync(CREATE_CALCULATION_HISTORY_TABLE);
  await db.runAsync("UPDATE app_settings SET value = ? WHERE key = 'schema_version'", [String(version)]);
}
