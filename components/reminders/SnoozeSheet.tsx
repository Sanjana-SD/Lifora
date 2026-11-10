import { AlarmClock } from 'lucide-react-native';
import React from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/common/Button';
import { RADIUS, SPACING } from '@/constants/appConfig';
import { useTheme } from '@/hooks/useTheme';
import { SNOOZE_LABELS, type SnoozeOption } from '@/services/reminderService';

interface SnoozeSheetProps {
  visible: boolean;
  title?: string;
  onChoose: (option: SnoozeOption) => void;
  onClose: () => void;
}

export function SnoozeSheet({ visible, title, onChoose, onClose }: SnoozeSheetProps) {
  const { colors } = useTheme();

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} accessibilityLabel="Close" />
      <View style={[styles.sheet, { backgroundColor: colors.background, borderColor: colors.border }]}>
        <Text style={[styles.heading, { color: colors.text }]} numberOfLines={1}>
          Snooze{title ? `: ${title}` : ''}
        </Text>
        {(Object.keys(SNOOZE_LABELS) as SnoozeOption[]).map((option) => (
          <Pressable
            key={option}
            accessibilityRole="button"
            accessibilityLabel={`Snooze for ${SNOOZE_LABELS[option]}`}
            onPress={() => onChoose(option)}
            style={({ pressed }) => [
              styles.option,
              { borderColor: colors.border, backgroundColor: pressed ? colors.surfaceAlt : colors.surface },
            ]}>
            <AlarmClock size={18} color={colors.accent} />
            <Text style={[styles.optionText, { color: colors.text }]}>{SNOOZE_LABELS[option]}</Text>
          </Pressable>
        ))}
        <Button label="Cancel" variant="secondary" onPress={onClose} style={styles.cancel} />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
  },
  sheet: {
    borderTopLeftRadius: RADIUS.lg,
    borderTopRightRadius: RADIUS.lg,
    borderWidth: 1,
    padding: SPACING.lg,
  },
  heading: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: SPACING.md,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    borderWidth: 1,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
  },
  optionText: {
    fontSize: 15,
    fontWeight: '600',
  },
  cancel: {
    marginTop: SPACING.sm,
  },
});
