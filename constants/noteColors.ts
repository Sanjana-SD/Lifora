import type { ColorScheme } from './colors';

export const NOTE_COLOR_KEYS = ['default', 'green', 'blue', 'yellow', 'pink', 'purple'] as const;
export type NoteColorKey = (typeof NOTE_COLOR_KEYS)[number];

// Accent stripe shown on the note card and the picker swatch. Kept
// distinct from text so notes never rely on color alone (PRD 5.0).
const SWATCHES: Record<ColorScheme, Record<NoteColorKey, string>> = {
  light: {
    default: '#D9CEC8',
    green: '#2F6F4F',
    blue: '#2563EB',
    yellow: '#D97706',
    pink: '#DB2777',
    purple: '#7C3AED',
  },
  dark: {
    default: '#5A4C4F',
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

/** Check-mark colour drawn on a selected swatch: white on the deep light-mode swatches, near-black on the pastel dark-mode ones. */
export function noteSwatchInk(key: NoteColorKey, scheme: ColorScheme): string {
  if (key === 'default') return scheme === 'dark' ? '#F5EDE8' : '#292323';
  return scheme === 'dark' ? '#161112' : '#FFFFFF';
}

export function isNoteColorKey(value: string): value is NoteColorKey {
  return (NOTE_COLOR_KEYS as readonly string[]).includes(value);
}
