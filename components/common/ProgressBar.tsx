import React from 'react';
import { StyleSheet, View } from 'react-native';

import { useTheme } from '@/hooks/useTheme';

interface ProgressBarProps {
  percent: number;
  color?: string;
}

export function ProgressBar({ percent, color }: ProgressBarProps) {
  const { colors } = useTheme();
  const clamped = Math.max(0, Math.min(100, percent));

  return (
    <View
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: 100, now: clamped }}
      style={[styles.track, { backgroundColor: colors.surfaceAlt, borderColor: colors.border }]}>
      <View style={[styles.fill, { width: `${clamped}%`, backgroundColor: color ?? colors.accent }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    height: 8,
    borderRadius: 4,
    borderWidth: 1,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 4,
  },
});
