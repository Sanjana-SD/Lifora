import { isNoteCategory } from '@/constants/noteCategories';
import { isNoteColorKey } from '@/constants/noteColors';
import type { Note, NoteDraft } from '@/types/note';
import { getDatabase } from '../database';

interface NoteRow {
  id: number;
  title: string;
  body: string;
  color_key: string;
  category: string | null;
  is_pinned: number;
  is_favourite: number;
  created_at: string;
  updated_at: string;
}

const NOW = "strftime('%Y-%m-%dT%H:%M:%fZ', 'now')";
const ORDER = 'ORDER BY is_pinned DESC, updated_at DESC, id DESC';

function mapRow(row: NoteRow): Note {
  return {
    id: row.id,
    title: row.title,
    body: row.body,
    colorKey: isNoteColorKey(row.color_key) ? row.color_key : 'default',
    category: row.category && isNoteCategory(row.category) ? row.category : null,
    isPinned: row.is_pinned === 1,
    isFavourite: row.is_favourite === 1,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function likePattern(search: string): string {
  return `%${search.replace(/[\\%_]/g, (c) => `\\${c}`)}%`;
}

export async function listNotes(search?: string): Promise<Note[]> {
  const db = await getDatabase();
  const term = search?.trim();
  const rows = term
    ? await db.getAllAsync<NoteRow>(
        `SELECT * FROM notes WHERE title LIKE ? ESCAPE '\\' OR body LIKE ? ESCAPE '\\' ${ORDER}`,
        [likePattern(term), likePattern(term)],
      )
    : await db.getAllAsync<NoteRow>(`SELECT * FROM notes ${ORDER}`);
  return rows.map(mapRow);
}

export async function listRecentNotes(limit: number): Promise<Note[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<NoteRow>(`SELECT * FROM notes ${ORDER} LIMIT ?`, [limit]);
  return rows.map(mapRow);
}

export async function getNote(id: number): Promise<Note | null> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<NoteRow>('SELECT * FROM notes WHERE id = ?', [id]);
  return row ? mapRow(row) : null;
}

export async function insertNote(draft: NoteDraft): Promise<Note> {
  const db = await getDatabase();
  const result = await db.runAsync(
    'INSERT INTO notes (title, body, color_key, category) VALUES (?, ?, ?, ?)',
    [draft.title, draft.body, draft.colorKey, draft.category],
  );
  const note = await getNote(result.lastInsertRowId);
  if (!note) throw new Error('Inserted note could not be read back');
  return note;
}

export async function updateNote(id: number, draft: NoteDraft): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    `UPDATE notes SET title = ?, body = ?, color_key = ?, category = ?, updated_at = ${NOW} WHERE id = ?`,
    [draft.title, draft.body, draft.colorKey, draft.category, id],
  );
}

// Pinning and favouriting are not edits, so they leave updated_at alone
// and don't reshuffle the "recent" order.
export async function setNotePinned(id: number, pinned: boolean): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('UPDATE notes SET is_pinned = ? WHERE id = ?', [pinned ? 1 : 0, id]);
}

export async function setNoteFavourite(id: number, favourite: boolean): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('UPDATE notes SET is_favourite = ? WHERE id = ?', [favourite ? 1 : 0, id]);
}

export async function deleteNote(id: number): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM notes WHERE id = ?', [id]);
}
