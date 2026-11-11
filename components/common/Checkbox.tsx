import { Check } from 'lucide-react-native';
import React from 'react';
import { Pressable, StyleSheet } from 'react-native';

import { RADIUS, hitSlopFor } from '@/constants/appConfig';
import { useTheme } from '@/hooks/useTheme';

interface CheckboxProps {
  checked: boolean;
  onPress: () => void;
  accessibilityLabel: string;
  /** Red edge for an overdue, unfinished item. */
  overdue?: boolean;
  shape?: 'square' | 'circle';
}

const SIZE = 26;

/**
 * The one checkbox used for checklist items, tasks, and reminders, so
 * completed (green check), pending (neutral edge), and overdue (red edge)
 * look the same everywhere.
 */
export function Checkbox({ checked, onPress, accessibilityLabel, overdue = false, shape = 'square' }: CheckboxProps) {
  const { colors } = useTheme();
  const edge = checked ? colors.success : overdue ? colors.danger : colors.borderStrong;

  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityState={{ checked }}
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
      hitSlop={hitSlopFor(SIZE)}
      style={[
        styles.box,
        {
          borderRadius: shape === 'circle' ? SIZE / 2 : RADIUS.sm,
          borderColor: edge,
          backgroundColor: checked ? colors.success : 'transparent',
        },
      ]}>
      {checked ? <Check size={16} strokeWidth={3} color={colors.onSuccess} /> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  box: {
    width: SIZE,
    height: SIZE,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
