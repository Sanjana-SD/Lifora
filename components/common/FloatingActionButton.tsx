import { Plus } from 'lucide-react-native';
import React from 'react';
import { Pressable, StyleSheet } from 'react-native';

import { useTheme } from '@/hooks/useTheme';

interface FloatingActionButtonProps {
  accessibilityLabel: string;
  onPress: () => void;
}

export function FloatingActionButton({ accessibilityLabel, onPress }: FloatingActionButtonProps) {
  const { colors } = useTheme();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
      style={({ pressed }) => [styles.fab, { backgroundColor: colors.accent, opacity: pressed ? 0.85 : 1 }]}>
      <Plus size={26} color={colors.onAccent} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
  },
});
