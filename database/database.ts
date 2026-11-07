import { openDatabaseAsync, type SQLiteDatabase } from 'expo-sqlite';

import { MIGRATIONS } from './migrations';

const DATABASE_NAME = 'lifora.db';

let readyPromise: Promise<SQLiteDatabase> | null = null;

async function runMigrations(db: SQLiteDatabase): Promise<void> {
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

// The only entry point every repository uses to reach the database
// (see docs/Lifora_Complete_PRD.md, Section 9.1). Lazily opens the
// connection once, runs any pending migrations, then reuses the same
// instance for the lifetime of the app.
export function getDatabase(): Promise<SQLiteDatabase> {
  if (!readyPromise) {
    readyPromise = openDatabaseAsync(DATABASE_NAME).then(async (db) => {
      await runMigrations(db);
      return db;
    });
  }
  return readyPromise;
}
