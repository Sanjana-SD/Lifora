import type { ViewStyle } from 'react-native';

import type { ThemeColors } from './colors';

/**
 * Soft, warm shadows. Android uses `elevation`; iOS/web use the shadow
 * props. Level 1 lifts cards off the ivory page, level 2 is for floating
 * controls (FAB, selected segment), level 3 for sheets and dialogs.
 */
export function elevation(level: 1 | 2 | 3, colors: ThemeColors): ViewStyle {
  const config = {
    1: { elevation: 1, opacity: 0.06, radius: 6, y: 2 },
    2: { elevation: 4, opacity: 0.14, radius: 10, y: 4 },
    3: { elevation: 12, opacity: 0.2, radius: 24, y: 8 },
  }[level];
  return {
    elevation: config.elevation,
    shadowColor: colors.shadow,
    shadowOpacity: config.opacity,
    shadowRadius: config.radius,
    shadowOffset: { width: 0, height: config.y },
  };
}
