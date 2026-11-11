import React from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { RADIUS, SPACING, TYPE } from '@/constants/appConfig';
import { elevation } from '@/constants/elevation';
import { useTheme } from '@/hooks/useTheme';

interface BottomSheetProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  /** Cap the sheet height (fraction of the screen) for long content. */
  maxHeight?: `${number}%`;
}

/**
 * Shared bottom sheet for quick actions and pickers: thumb-reachable,
 * dismissed by tapping outside or the Android back button, and padded
 * above the gesture/navigation bar.
 */
export function BottomSheet({ visible, onClose, title, children, maxHeight = '85%' }: BottomSheetProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <Modal visible={visible} transparent animationType="slide" statusBarTranslucent navigationBarTranslucent onRequestClose={onClose}>
      <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <Pressable
          style={[StyleSheet.absoluteFill, { backgroundColor: colors.scrim }]}
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel="Close"
        />
        <View
          accessibilityViewIsModal
          style={[
            styles.sheet,
            { backgroundColor: colors.surface, maxHeight, paddingBottom: Math.max(insets.bottom, SPACING.lg) },
            elevation(3, colors),
          ]}>
          <View style={[styles.handle, { backgroundColor: colors.border }]} />
          {title ? (
            <Text accessibilityRole="header" style={[styles.title, { color: colors.text }]} numberOfLines={1}>
              {title}
            </Text>
          ) : null}
          {children}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  sheet: {
    borderTopLeftRadius: RADIUS.xl,
    borderTopRightRadius: RADIUS.xl,
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.sm,
  },
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    marginBottom: SPACING.md,
  },
  title: {
    ...TYPE.heading,
    marginBottom: SPACING.md,
  },
});
