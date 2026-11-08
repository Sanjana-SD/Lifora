import type { SQLiteDatabase } from 'expo-sqlite';

import { CREATE_CHECKLIST_ITEMS_TABLE, CREATE_CHECKLISTS_TABLE, CREATE_NOTES_TABLE } from '../schema';

export const version = 2;

export async function up(db: SQLiteDatabase): Promise<void> {
  await db.execAsync(CREATE_NOTES_TABLE);
  await db.execAsync(CREATE_CHECKLISTS_TABLE);
  await db.execAsync(CREATE_CHECKLIST_ITEMS_TABLE);
  await db.runAsync("UPDATE app_settings SET value = ? WHERE key = 'schema_version'", [String(version)]);
}
