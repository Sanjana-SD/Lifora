import type { NoteCategory } from '@/constants/noteCategories';
import type { NoteColorKey } from '@/constants/noteColors';

export interface Note {
  id: number;
  title: string;
  body: string;
  colorKey: NoteColorKey;
  category: NoteCategory | null;
  isPinned: boolean;
  isFavourite: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface NoteDraft {
  title: string;
  body: string;
  colorKey: NoteColorKey;
  category: NoteCategory | null;
}
