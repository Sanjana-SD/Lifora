import { AlarmClock } from 'lucide-react-native';
import React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';

import { BottomSheet } from '@/components/common/BottomSheet';
import { Button } from '@/components/common/Button';
import { RADIUS, SPACING, TOUCH_TARGET, TYPE } from '@/constants/appConfig';
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
    <BottomSheet visible={visible} onClose={onClose} title={`Snooze${title ? `: ${title}` : ''}`}>
      {(Object.keys(SNOOZE_LABELS) as SnoozeOption[]).map((option) => (
        <Pressable
          key={option}
          accessibilityRole="button"
          accessibilityLabel={`Snooze for ${SNOOZE_LABELS[option]}`}
          onPress={() => onChoose(option)}
          style={({ pressed }) => [
            styles.option,
            { borderColor: colors.border, backgroundColor: pressed ? colors.accentSoft : colors.surface },
          ]}>
          <AlarmClock size={20} color={colors.accent} />
          <Text style={[styles.optionText, { color: colors.text }]}>{SNOOZE_LABELS[option]}</Text>
        </Pressable>
      ))}
      <Button label="Cancel" variant="ghost" onPress={onClose} style={styles.cancel} />
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    minHeight: TOUCH_TARGET + 8,
    borderWidth: 1,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.sm,
  },
  optionText: {
    ...TYPE.subheading,
  },
  cancel: {
    marginTop: SPACING.xs,
  },
});
