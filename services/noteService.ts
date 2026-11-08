import * as noteRepository from '@/database/repositories/noteRepository';
import type { Note, NoteDraft } from '@/types/note';

export const NOTE_TITLE_MAX_LENGTH = 120;
const UNTITLED = 'Untitled Note';

export const EMPTY_DRAFT: NoteDraft = { title: '', body: '', colorKey: 'default', category: null };

export function isDraftEmpty(draft: Pick<NoteDraft, 'title' | 'body'>): boolean {
  return draft.title.trim() === '' && draft.body.trim() === '';
}

// PRD Module 5.A: an untitled note displays its first body line, or
// "Untitled Note" if there's no body either. The stored title stays
// exactly as the user typed it.
export function displayTitle(note: Pick<Note, 'title' | 'body'>): string {
  const title = note.title.trim();
  if (title) return title;
  const firstLine = note.body.split('\n').find((line) => line.trim() !== '');
  return firstLine ? firstLine.trim().slice(0, NOTE_TITLE_MAX_LENGTH) : UNTITLED;
}

export function bodySnippet(note: Pick<Note, 'title' | 'body'>, maxLength = 120): string {
  const lines = note.body.split('\n').map((l) => l.trim()).filter(Boolean);
  // When the title is derived from the first body line, don't repeat it.
  const rest = note.title.trim() ? lines : lines.slice(1);
  const text = rest.join(' ');
  return text.length > maxLength ? `${text.slice(0, maxLength - 1)}…` : text;
}

export function listNotes(search?: string): Promise<Note[]> {
  return noteRepository.listNotes(search);
}

export function listRecentNotes(limit = 3): Promise<Note[]> {
  return noteRepository.listRecentNotes(limit);
}

export function getNote(id: number): Promise<Note | null> {
  return noteRepository.getNote(id);
}

function normalize(draft: NoteDraft): NoteDraft {
  return { ...draft, title: draft.title.slice(0, NOTE_TITLE_MAX_LENGTH) };
}

/**
 * Autosave entry point. Returns the note's id after saving, or null when
 * nothing was persisted. An empty draft is never written: a brand-new
 * empty note is skipped, and an existing note is left as it was (the
 * editor deletes it on exit via discardIfEmpty instead).
 */
export async function saveNote(id: number | null, draft: NoteDraft): Promise<number | null> {
  if (isDraftEmpty(draft)) return id;
  const normalized = normalize(draft);
  if (id === null) {
    const created = await noteRepository.insertNote(normalized);
    return created.id;
  }
  await noteRepository.updateNote(id, normalized);
  return id;
}

export async function discardIfEmpty(id: number | null, draft: NoteDraft): Promise<boolean> {
  if (id === null || !isDraftEmpty(draft)) return false;
  await noteRepository.deleteNote(id);
  return true;
}

export function setPinned(id: number, pinned: boolean): Promise<void> {
  return noteRepository.setNotePinned(id, pinned);
}

export function setFavourite(id: number, favourite: boolean): Promise<void> {
  return noteRepository.setNoteFavourite(id, favourite);
}

export function deleteNote(id: number): Promise<void> {
  return noteRepository.deleteNote(id);
}
