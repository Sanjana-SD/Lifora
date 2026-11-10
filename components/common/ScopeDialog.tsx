import React from 'react';
import { Modal, StyleSheet, Text, View } from 'react-native';

import { RADIUS, SPACING } from '@/constants/appConfig';
import { useTheme } from '@/hooks/useTheme';
import { Button } from './Button';

export type EditScope = 'this' | 'all';

interface ScopeDialogProps {
  visible: boolean;
  title: string;
  destructive?: boolean;
  onChoose: (scope: EditScope) => void;
  onCancel: () => void;
}

/** "This event" vs "All events in the series" for recurring events (PRD 2.4). */
export function ScopeDialog({ visible, title, destructive = false, onChoose, onCancel }: ScopeDialogProps) {
  const { colors } = useTheme();
  const variant = destructive ? 'danger' : 'primary';

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={styles.backdrop}>
        <View style={[styles.dialog, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.message, { color: colors.textMuted }]}>This is a repeating event.</Text>
          <View style={styles.actions}>
            <Button label="This event only" variant={variant} onPress={() => onChoose('this')} />
            <Button label="All events in the series" variant={variant} onPress={() => onChoose('all')} />
            <Button label="Cancel" variant="secondary" onPress={onCancel} />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.xl,
  },
  dialog: {
    width: '100%',
    maxWidth: 360,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    padding: SPACING.lg,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
  },
  message: {
    fontSize: 13.5,
    marginTop: SPACING.xs,
  },
  actions: {
    gap: SPACING.sm,
    marginTop: SPACING.lg,
  },
});
