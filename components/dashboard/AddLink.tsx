import { Plus } from 'lucide-react-native';
import React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';

import { SPACING, TOUCH_TARGET, TYPE } from '@/constants/appConfig';
import { useTheme } from '@/hooks/useTheme';

interface AddLinkProps {
  label: string;
  onPress: () => void;
}

/** Text-style "+ Add …" action at the foot of a dashboard card, still a full 48dp target. */
export function AddLink({ label, onPress }: AddLinkProps) {
  const { colors } = useTheme();

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={({ pressed }) => [styles.row, pressed && { opacity: 0.6 }]}>
      <Plus size={16} color={colors.accent} />
      <Text style={[styles.label, { color: colors.accent }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: SPACING.xs,
    minHeight: TOUCH_TARGET,
    paddingRight: SPACING.md,
  },
  label: {
    ...TYPE.label,
  },
});
