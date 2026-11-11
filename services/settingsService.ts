import type { ThemePreference } from '@/constants/colors';
import * as settingsRepository from '@/database/repositories/settingsRepository';

const THEME_KEY = 'theme';
const THEME_PREFERENCES: readonly ThemePreference[] = ['system', 'light', 'dark'];

export function isThemePreference(value: unknown): value is ThemePreference {
  return typeof value === 'string' && (THEME_PREFERENCES as readonly string[]).includes(value);
}

/** Falls back to following the system for a missing or unrecognised value. */
export async function getThemePreference(): Promise<ThemePreference> {
  const stored = await settingsRepository.getSetting(THEME_KEY);
  return isThemePreference(stored) ? stored : 'system';
}

export async function setThemePreference(preference: ThemePreference): Promise<void> {
  await settingsRepository.setSetting(THEME_KEY, preference);
}
