import React from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';

import { RADIUS, SPACING } from '@/constants/appConfig';
import { elevation } from '@/constants/elevation';
import { useTheme } from '@/hooks/useTheme';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  testID?: string;
}

/** White card on the ivory page: a hairline edge plus a soft warm lift. */
export function Card({ children, style, testID }: CardProps) {
  const { colors } = useTheme();
  return (
    <View
      testID={testID}
      style={[styles.base, { backgroundColor: colors.surface, borderColor: colors.border }, elevation(1, colors), style]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: RADIUS.lg,
    borderWidth: StyleSheet.hairlineWidth,
    padding: SPACING.lg,
  },
});
