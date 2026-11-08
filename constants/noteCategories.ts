export const NOTE_CATEGORIES = ['Personal', 'Work', 'College', 'Ideas', 'Other'] as const;
export type NoteCategory = (typeof NOTE_CATEGORIES)[number];

export function isNoteCategory(value: string): value is NoteCategory {
  return (NOTE_CATEGORIES as readonly string[]).includes(value);
}
