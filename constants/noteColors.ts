import type { ColorScheme } from './colors';

export const NOTE_COLOR_KEYS = ['default', 'green', 'blue', 'yellow', 'pink', 'purple'] as const;
export type NoteColorKey = (typeof NOTE_COLOR_KEYS)[number];

// Accent stripe shown on the note card and the picker swatch. Kept
// distinct from text so notes never rely on color alone (PRD 5.0).
const SWATCHES: Record<ColorScheme, Record<NoteColorKey, string>> = {
  light: {
    default: '#CBD5E1',
    green: '#2F6F4F',
    blue: '#2563EB',
    yellow: '#D97706',
    pink: '#DB2777',
    purple: '#7C3AED',
  },
  dark: {
    default: '#475569',
    green: '#4ADE80',
    blue: '#60A5FA',
    yellow: '#FBBF24',
    pink: '#F472B6',
    purple: '#A78BFA',
  },
};

export const NOTE_COLOR_LABELS: Record<NoteColorKey, string> = {
  default: 'None',
  green: 'Green',
  blue: 'Blue',
  yellow: 'Yellow',
  pink: 'Pink',
  purple: 'Purple',
};

export function noteSwatch(key: NoteColorKey, scheme: ColorScheme): string {
  return SWATCHES[scheme][key];
}

export function isNoteColorKey(value: string): value is NoteColorKey {
  return (NOTE_COLOR_KEYS as readonly string[]).includes(value);
}
