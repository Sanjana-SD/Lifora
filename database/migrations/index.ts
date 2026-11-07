import type { SQLiteDatabase } from 'expo-sqlite';

import * as migration001 from './001_initial';

export interface Migration {
  version: number;
  up: (db: SQLiteDatabase) => Promise<void>;
}

// New migrations are appended here as later phases add tables
// (see docs/Lifora_Complete_PRD.md, Section 8.4).
export const MIGRATIONS: Migration[] = [migration001].sort((a, b) => a.version - b.version);
