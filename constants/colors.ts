export type ColorScheme = 'light' | 'dark';
export type ThemePreference = ColorScheme | 'system';

// LIFORA brand: Burgundy (#800020) and Ivory (#FFFFF0). Every pairing
// below was checked against WCAG: 4.5:1 for text, 3:1 for icons and
// control edges. Where a requested color couldn't meet that in a role,
// a nearby accessible value is used for that role only (noted inline).
export interface ThemeColors {
  /** Page background. */
  background: string;
  /** Cards and sheets. */
  surface: string;
  /** Subtle fills: segmented tracks, keypad function keys, icon wells. */
  surfaceAlt: string;
  /** Decorative edges: card outlines, dividers. */
  border: string;
  /** Edges that identify a control: text fields, checkboxes (≥3:1). */
  borderStrong: string;
  text: string;
  textMuted: string;
  /** Brand color for text, icons, and selected states. */
  accent: string;
  /** Tinted background behind selected items (tab pill, selected chip). */
  accentSoft: string;
  /** Brand fill for primary buttons, FAB, selected day. */
  primary: string;
  /** Pressed state of primary fills. */
  primaryPressed: string;
  onPrimary: string;
  success: string;
  onSuccess: string;
  danger: string;
  dangerSurface: string;
  /** Warning text and icons (≥4.5:1). */
  warning: string;
  /** Decorative warm fill, e.g. a favourite star. */
  warningFill: string;
  tabBarBackground: string;
  tabBarInactive: string;
  /** Dim layer behind sheets and dialogs. */
  scrim: string;
  /**
   * Money-out / money-in chart fills. Validated as a colour-blind-safe pair
   * (they differ in lightness as well as hue); never used for text.
   */
  chartOut: string;
  chartIn: string;
  shadow: string;
}

export const LightColors: ThemeColors = {
  background: '#FFFFF0', // Ivory
  surface: '#FFFFFF',
  surfaceAlt: '#FFFDF5', // Soft Ivory
  border: '#E9DFD9',
  borderStrong: '#8E7F79', // #E9DFD9 is 1.3:1 on ivory, too faint for a control edge
  text: '#292323',
  textMuted: '#77716F',
  accent: '#800020', // Burgundy, 10.7:1 on ivory
  accentSoft: '#F6E7EB',
  primary: '#800020',
  primaryPressed: '#5C0017', // Deep Burgundy
  onPrimary: '#FFFFF0',
  success: '#36845B',
  onSuccess: '#FFFFFF',
  danger: '#C0392B',
  dangerSurface: '#FBEAE7',
  warning: '#8F5B0E', // #D69B35 is 2.4:1 as text on ivory
  warningFill: '#D69B35',
  tabBarBackground: '#FFFFFF',
  tabBarInactive: '#77716F',
  scrim: 'rgba(41, 35, 35, 0.45)',
  chartOut: '#8E2944',
  chartIn: '#66BB8A',
  shadow: '#5C0017',
};

export const DarkColors: ThemeColors = {
  background: '#161112',
  surface: '#211A1C',
  surfaceAlt: '#2B2225',
  border: '#3A2E31',
  borderStrong: '#8A797D',
  text: '#F5EDE8',
  textMuted: '#B8ABA8',
  accent: '#E8899E', // burgundy-rose; #800020 is 1.7:1 on this background
  accentSoft: '#3D1F28',
  primary: '#A3435D', // Light Burgundy, keeps buttons recognisably burgundy
  primaryPressed: '#8E2944',
  onPrimary: '#FFFFF0',
  success: '#6CC495',
  onSuccess: '#10261A',
  danger: '#F2877A',
  dangerSurface: '#3A1A18',
  warning: '#E8B455',
  warningFill: '#E8B455',
  tabBarBackground: '#1B1517',
  tabBarInactive: '#A0938F',
  scrim: 'rgba(0, 0, 0, 0.6)',
  chartOut: '#D36D86',
  chartIn: '#227848',
  shadow: '#000000',
};

export function colorsFor(scheme: ColorScheme): ThemeColors {
  return scheme === 'dark' ? DarkColors : LightColors;
}
