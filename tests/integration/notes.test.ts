import type { SQLiteDatabase } from 'expo-sqlite';

import { createTestDatabase } from '../helpers/testDatabase';

let mockDb: SQLiteDatabase;
jest.mock('@/database/database', () => ({
  getDatabase: () => Promise.resolve(mockDb),
}));

import * as noteService from '@/services/noteService';
import { runMigrations } from '@/database/migrations/runner';
import type { NoteDraft } from '@/types/note';

const draft = (overrides: Partial<NoteDraft> = {}): NoteDraft => ({
  ...noteService.EMPTY_DRAFT,
  ...overrides,
});

beforeEach(async () => {
  mockDb = await createTestDatabase();
});

describe('migrations', () => {
  it('reach the current schema version and keep Phase 1 seed data', async () => {
    const version = await mockDb.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
    expect(version?.user_version).toBe(2);
    const categories = await mockDb.getFirstAsync<{ n: number }>('SELECT COUNT(*) AS n FROM categories');
    expect(categories?.n).toBeGreaterThan(0);
  });

  it('are idempotent when run again', async () => {
    await runMigrations(mockDb);
    const version = await mockDb.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
    expect(version?.user_version).toBe(2);
  });
});

describe('noteService (integration)', () => {
  it('never persists an empty new note', async () => {
    const id = await noteService.saveNote(null, draft({ title: '   ', body: '\n' }));
    expect(id).toBeNull();
    expect(await noteService.listNotes()).toHaveLength(0);
  });

  it('supports create -> edit -> search end to end', async () => {
    const id = await noteService.saveNote(null, draft({ title: 'Groceries', body: 'buy milk' }));
    expect(id).not.toBeNull();

    await noteService.saveNote(id, draft({ title: 'Groceries', body: 'buy milk and saffron' }));

    const results = await noteService.listNotes('saffron');
    expect(results).toHaveLength(1);
    expect(results[0].body).toBe('buy milk and saffron');
    expect(await noteService.listNotes('nothing-like-this')).toHaveLength(0);
  });

  it('finds notes whose body matches even when the title does not (PRD 5.2)', async () => {
    await noteService.saveNote(null, draft({ title: 'Meeting', body: 'Discuss the quarterly budget' }));
    const results = await noteService.listNotes('quarterly');
    expect(results.map((n) => n.title)).toEqual(['Meeting']);
  });

  it('treats % and _ in a search literally', async () => {
    await noteService.saveNote(null, draft({ title: 'Plain note' }));
    await noteService.saveNote(null, draft({ title: '50% off' }));
    const results = await noteService.listNotes('%');
    expect(results.map((n) => n.title)).toEqual(['50% off']);
  });

  it('lists pinned notes first', async () => {
    const a = await noteService.saveNote(null, draft({ title: 'A' }));
    await noteService.saveNote(null, draft({ title: 'B' }));
    await noteService.setPinned(a!, true);
    const notes = await noteService.listNotes();
    expect(notes[0].title).toBe('A');
    expect(notes[0].isPinned).toBe(true);
  });

  it('does not bump updated_at when pinning or favouriting', async () => {
    const id = await noteService.saveNote(null, draft({ title: 'Stable' }));
    const before = (await noteService.getNote(id!))!.updatedAt;
    await noteService.setPinned(id!, true);
    await noteService.setFavourite(id!, true);
    const after = await noteService.getNote(id!);
    expect(after!.updatedAt).toBe(before);
    expect(after!.isFavourite).toBe(true);
  });

  it('deletes an existing note that was cleared to empty', async () => {
    const id = await noteService.saveNote(null, draft({ title: 'Temp' }));
    expect(await noteService.discardIfEmpty(id, draft())).toBe(true);
    expect(await noteService.getNote(id!)).toBeNull();
  });

  it('keeps the last non-empty content if autosave sees an empty draft', async () => {
    const id = await noteService.saveNote(null, draft({ title: 'Keep me' }));
    await noteService.saveNote(id, draft());
    expect((await noteService.getNote(id!))!.title).toBe('Keep me');
  });

  it('limits recent notes', async () => {
    for (const title of ['1', '2', '3', '4']) {
      await noteService.saveNote(null, draft({ title }));
    }
    expect(await noteService.listRecentNotes(3)).toHaveLength(3);
  });
});
