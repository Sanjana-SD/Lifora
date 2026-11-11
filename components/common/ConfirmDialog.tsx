import React from 'react';
import { StyleSheet, View } from 'react-native';

import { SPACING } from '@/constants/appConfig';
import { Button } from './Button';
import { Dialog } from './Dialog';

interface ConfirmDialogProps {
  visible: boolean;
  title: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  visible,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  destructive = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <Dialog visible={visible} title={title} message={message} onRequestClose={onCancel}>
      <View style={styles.row}>
        <Button label={cancelLabel} variant="secondary" onPress={onCancel} style={styles.action} />
        <Button label={confirmLabel} variant={destructive ? 'danger' : 'primary'} onPress={onConfirm} style={styles.action} />
      </View>
    </Dialog>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  action: {
    flex: 1,
    paddingHorizontal: SPACING.md,
  },
});
