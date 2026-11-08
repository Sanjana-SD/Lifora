import { openDatabaseAsync, type SQLiteDatabase } from 'expo-sqlite';

import { runMigrations } from './migrations/runner';

const DATABASE_NAME = 'lifora.db';

let readyPromise: Promise<SQLiteDatabase> | null = null;

// The only entry point every repository uses to reach the database
// (see Lifora_Complete_PRD.md, Section 9.1). Lazily opens the
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
