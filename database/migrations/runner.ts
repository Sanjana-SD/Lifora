import type { SQLiteDatabase } from 'expo-sqlite';

import { MIGRATIONS } from './index';

export async function runMigrations(db: SQLiteDatabase): Promise<void> {
  await db.execAsync('PRAGMA foreign_keys = ON;');

  const versionRow = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version;');
  let currentVersion = versionRow?.user_version ?? 0;

  const pending = MIGRATIONS.filter((migration) => migration.version > currentVersion);
  for (const migration of pending) {
    await db.withTransactionAsync(async () => {
      await migration.up(db);
    });
    currentVersion = migration.version;
    await db.execAsync(`PRAGMA user_version = ${currentVersion};`);
  }
}
