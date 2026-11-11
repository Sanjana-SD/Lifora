import React from 'react';
import { Modal, StyleSheet, Text, View } from 'react-native';

import { RADIUS, SPACING, TYPE } from '@/constants/appConfig';
import { elevation } from '@/constants/elevation';
import { useTheme } from '@/hooks/useTheme';

interface DialogProps {
  visible: boolean;
  title: string;
  message?: string;
  onRequestClose: () => void;
  children: React.ReactNode;
}

/** Shared frame for confirmations: centered card over a dimmed screen. */
export function Dialog({ visible, title, message, onRequestClose, children }: DialogProps) {
  const { colors } = useTheme();

  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent onRequestClose={onRequestClose}>
      <View style={[styles.backdrop, { backgroundColor: colors.scrim }]}>
        <View
          accessibilityViewIsModal
          style={[styles.dialog, { backgroundColor: colors.surface }, elevation(3, colors)]}>
          <Text accessibilityRole="header" style={[styles.title, { color: colors.text }]}>
            {title}
          </Text>
          {message ? <Text style={[styles.message, { color: colors.textMuted }]}>{message}</Text> : null}
          <View style={styles.actions}>{children}</View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.xl,
  },
  dialog: {
    width: '100%',
    maxWidth: 380,
    borderRadius: RADIUS.xl,
    padding: SPACING.xl,
  },
  title: {
    ...TYPE.heading,
  },
  message: {
    ...TYPE.bodySmall,
    marginTop: SPACING.sm,
  },
  actions: {
    marginTop: SPACING.xl,
    gap: SPACING.sm,
  },
});
