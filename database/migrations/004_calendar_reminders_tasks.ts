import type { SQLiteDatabase } from 'expo-sqlite';

import { CREATE_EVENTS_TABLE, CREATE_REMINDERS_TABLE, CREATE_TASKS_TABLE } from '../schema';

export const version = 4;

export async function up(db: SQLiteDatabase): Promise<void> {
  await db.execAsync(CREATE_EVENTS_TABLE);
  await db.execAsync(CREATE_REMINDERS_TABLE);
  await db.execAsync(CREATE_TASKS_TABLE);
  await db.runAsync("UPDATE app_settings SET value = ? WHERE key = 'schema_version'", [String(version)]);
}
