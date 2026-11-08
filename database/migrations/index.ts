import type { SQLiteDatabase } from 'expo-sqlite';

import * as migration001 from './001_initial';
import * as migration002 from './002_notes_checklists';

export interface Migration {
  version: number;
  up: (db: SQLiteDatabase) => Promise<void>;
}

// New migrations are appended here as later phases add tables
// (see Lifora_Complete_PRD.md, Section 8.4).
export const MIGRATIONS: Migration[] = [migration001, migration002].sort((a, b) => a.version - b.version);
