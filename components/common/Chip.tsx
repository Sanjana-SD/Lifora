import React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';

import { RADIUS, SPACING, TYPE, hitSlopFor } from '@/constants/appConfig';
import { useTheme } from '@/hooks/useTheme';

interface ChipProps {
  label: string;
  selected?: boolean;
  onPress: () => void;
}

const HEIGHT = 36;

/** Filter/choice chip: burgundy tint when selected, white with an edge otherwise. */
export function Chip({ label, selected = false, onPress }: ChipProps) {
  const { colors } = useTheme();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      hitSlop={{ top: hitSlopFor(HEIGHT), bottom: hitSlopFor(HEIGHT) }}
      style={({ pressed }) => [
        styles.chip,
        {
          backgroundColor: selected ? colors.accentSoft : pressed ? colors.surfaceAlt : colors.surface,
          borderColor: selected ? colors.accent : colors.border,
        },
      ]}>
      <Text style={[styles.label, { color: selected ? colors.accent : colors.text, fontWeight: selected ? '700' : '600' }]}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    minHeight: HEIGHT,
    paddingHorizontal: SPACING.lg,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.sm,
  },
  label: {
    ...TYPE.label,
  },
});
