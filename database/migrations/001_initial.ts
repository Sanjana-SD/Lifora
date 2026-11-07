import type { SQLiteDatabase } from 'expo-sqlite';

import { DEFAULT_CURRENCY, DEFAULT_DATE_FORMAT } from '@/constants/appConfig';
import { CREATE_APP_SETTINGS_TABLE, CREATE_CATEGORIES_TABLE } from '../schema';
import { DEFAULT_CATEGORIES } from '../seed/defaultCategories';

export const version = 1;

export async function up(db: SQLiteDatabase): Promise<void> {
  await db.execAsync(CREATE_CATEGORIES_TABLE);
  await db.execAsync(CREATE_APP_SETTINGS_TABLE);

  for (const category of DEFAULT_CATEGORIES) {
    await db.runAsync(
      `INSERT OR IGNORE INTO categories (scope, name, color_hex, is_system, sort_order)
       VALUES (?, ?, ?, 1, ?)`,
      [category.scope, category.name, category.colorHex, category.sortOrder],
    );
  }

  const defaultSettings: Record<string, string> = {
    schema_version: String(version),
    theme: 'system',
    currency: DEFAULT_CURRENCY,
    date_format: DEFAULT_DATE_FORMAT,
  };
  for (const [key, value] of Object.entries(defaultSettings)) {
    await db.runAsync('INSERT OR IGNORE INTO app_settings (key, value) VALUES (?, ?)', [key, value]);
  }
}
