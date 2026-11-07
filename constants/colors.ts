export type ColorScheme = 'light' | 'dark';
export type ThemePreference = ColorScheme | 'system';

export interface ThemeColors {
  background: string;
  surface: string;
  surfaceAlt: string;
  border: string;
  text: string;
  textMuted: string;
  accent: string;
  accentDark: string;
  onAccent: string;
  danger: string;
  dangerSurface: string;
  warning: string;
  tabBarBackground: string;
  tabBarInactive: string;
}

export const LightColors: ThemeColors = {
  background: '#FFFFFF',
  surface: '#F8FAFC',
  surfaceAlt: '#F1F5F9',
  border: '#CBD5E1',
  text: '#1F2937',
  textMuted: '#475569',
  accent: '#2F6F4F',
  accentDark: '#1F4D37',
  onAccent: '#FFFFFF',
  danger: '#B91C1C',
  dangerSurface: '#FEE2E2',
  warning: '#B45309',
  tabBarBackground: '#FFFFFF',
  tabBarInactive: '#94A3B8',
};

export const DarkColors: ThemeColors = {
  background: '#0F172A',
  surface: '#1E293B',
  surfaceAlt: '#16213A',
  border: '#334155',
  text: '#E2E8F0',
  textMuted: '#94A3B8',
  accent: '#4ADE80',
  accentDark: '#86EFAC',
  onAccent: '#052E16',
  danger: '#F87171',
  dangerSurface: '#450A0A',
  warning: '#FBBF24',
  tabBarBackground: '#0F172A',
  tabBarInactive: '#64748B',
};

export function colorsFor(scheme: ColorScheme): ThemeColors {
  return scheme === 'dark' ? DarkColors : LightColors;
}
