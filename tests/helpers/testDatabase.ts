import type { SQLiteDatabase } from 'expo-sqlite';

import { runMigrations } from '@/database/migrations/runner';

type BindValue = string | number | null;

// Implements the subset of expo-sqlite's async API that our
// repositories use, on top of Node's built-in SQLite, so integration
// tests exercise the real migrations and real SQL rather than mocks.
export async function createTestDatabase(): Promise<SQLiteDatabase> {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { DatabaseSync } = require('node:sqlite');
  const raw = new DatabaseSync(':memory:');

  const toParams = (params?: BindValue[]) => params ?? [];
  const plain = <T>(row: unknown): T => ({ ...(row as object) }) as T;

  const adapter = {
    execAsync: async (source: string) => {
      raw.exec(source);
    },
    runAsync: async (source: string, params?: BindValue[]) => {
      const result = raw.prepare(source).run(...toParams(params));
      return { lastInsertRowId: Number(result.lastInsertRowid), changes: Number(result.changes) };
    },
    getAllAsync: async <T>(source: string, params?: BindValue[]) =>
      raw.prepare(source).all(...toParams(params)).map((row: unknown) => plain<T>(row)),
    getFirstAsync: async <T>(source: string, params?: BindValue[]) => {
      const row = raw.prepare(source).get(...toParams(params));
      return row ? plain<T>(row) : null;
    },
    withTransactionAsync: async (task: () => Promise<void>) => {
      raw.exec('BEGIN');
      try {
        await task();
        raw.exec('COMMIT');
      } catch (error) {
        raw.exec('ROLLBACK');
        throw error;
      }
    },
  } as unknown as SQLiteDatabase;

  await runMigrations(adapter);
  return adapter;
}
