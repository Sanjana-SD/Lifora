import type { TextStyle } from 'react-native';

export const APP_NAME = 'LIFORA';
export const APP_TAGLINE = 'Your everyday life, organized.';

export const DEFAULT_CURRENCY = 'INR';
export const DEFAULT_CURRENCY_SYMBOL = '₹';
export const DEFAULT_DATE_FORMAT = 'DD/MM/YYYY';

/** 4-point spacing scale; every gap and padding in the app comes from here. */
export const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

export const RADIUS = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 22,
  pill: 999,
} as const;

/** Android's recommended minimum touch target. */
export const TOUCH_TARGET = 48;

/** hitSlop that grows a control of `size` to at least TOUCH_TARGET. */
export function hitSlopFor(size: number): number {
  return Math.max(0, Math.ceil((TOUCH_TARGET - size) / 2));
}

// System font (Roboto on Android): fast, familiar, no extra download.
export const TYPE = {
  display: { fontSize: 28, lineHeight: 34, fontWeight: '800', letterSpacing: -0.4 },
  title: { fontSize: 22, lineHeight: 28, fontWeight: '700', letterSpacing: -0.2 },
  heading: { fontSize: 17, lineHeight: 22, fontWeight: '700' },
  subheading: { fontSize: 15, lineHeight: 20, fontWeight: '600' },
  body: { fontSize: 15, lineHeight: 21, fontWeight: '400' },
  bodySmall: { fontSize: 13.5, lineHeight: 19, fontWeight: '400' },
  label: { fontSize: 13, lineHeight: 17, fontWeight: '600' },
  caption: { fontSize: 12, lineHeight: 16, fontWeight: '500' },
  overline: { fontSize: 11.5, lineHeight: 15, fontWeight: '700', letterSpacing: 0.6, textTransform: 'uppercase' },
} as const satisfies Record<string, TextStyle>;
