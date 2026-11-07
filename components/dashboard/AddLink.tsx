import { Plus } from 'lucide-react-native';
import React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';

import { SPACING } from '@/constants/appConfig';
import { useTheme } from '@/hooks/useTheme';

interface AddLinkProps {
  label: string;
  onPress: () => void;
}

export function AddLink({ label, onPress }: AddLinkProps) {
  const { colors } = useTheme();

  return (
    <Pressable onPress={onPress} style={styles.row} accessibilityRole="button" hitSlop={6}>
      <Plus size={15} color={colors.accent} />
      <Text style={[styles.label, { color: colors.accent }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    marginTop: SPACING.sm,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
  },
});
