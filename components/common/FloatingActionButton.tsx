import { Plus, type LucideIcon } from 'lucide-react-native';
import React from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { RADIUS, SPACING } from '@/constants/appConfig';
import { elevation } from '@/constants/elevation';
import { useTheme } from '@/hooks/useTheme';

interface FloatingActionButtonProps {
  accessibilityLabel: string;
  onPress: () => void;
  /**
   * True on screens without a tab bar: the app draws edge-to-edge, so the
   * button must clear Android's gesture/navigation bar itself.
   */
  clearSystemBar?: boolean;
  /** Defaults to a plus sign. */
  icon?: LucideIcon;
}

/** Bottom-right primary action, in easy reach of the right thumb. */
export function FloatingActionButton({ accessibilityLabel, onPress, clearSystemBar = false, icon: Icon = Plus }: FloatingActionButtonProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
      style={({ pressed }) => [
        styles.fab,
        { backgroundColor: pressed ? colors.primaryPressed : colors.primary },
        clearSystemBar && { bottom: SPACING.lg + insets.bottom },
        elevation(2, colors),
      ]}>
      <Icon size={26} color={colors.onPrimary} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    right: SPACING.lg,
    bottom: SPACING.lg,
    width: 60,
    height: 60,
    borderRadius: RADIUS.lg + 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
