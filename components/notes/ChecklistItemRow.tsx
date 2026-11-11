import { X } from 'lucide-react-native';
import React, { useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import { Checkbox } from '@/components/common/Checkbox';
import { SPACING, TOUCH_TARGET, TYPE } from '@/constants/appConfig';
import { useTheme } from '@/hooks/useTheme';
import { CHECKLIST_ITEM_MAX_LENGTH } from '@/services/checklistService';
import type { ChecklistItem } from '@/types/checklist';

interface ChecklistItemRowProps {
  item: ChecklistItem;
  onToggle: () => void;
  onRename: (label: string) => void;
  onDelete: () => void;
}

export function ChecklistItemRow({ item, onToggle, onRename, onDelete }: ChecklistItemRowProps) {
  const { colors } = useTheme();
  const [label, setLabel] = useState(item.label);
  // Resync the editable text when the saved label changes underneath
  // (React's "adjust state during render" pattern, instead of an effect).
  const [syncedLabel, setSyncedLabel] = useState(item.label);
  if (item.label !== syncedLabel) {
    setSyncedLabel(item.label);
    setLabel(item.label);
  }

  const commit = () => {
    const trimmed = label.trim();
    // Clearing a label reverts it rather than silently deleting the item;
    // deletion is always the explicit X button.
    if (!trimmed) {
      setLabel(item.label);
      return;
    }
    if (trimmed !== item.label) onRename(trimmed);
  };

  return (
    <View style={[styles.row, { borderColor: colors.border }]}>
      <Checkbox checked={item.isCompleted} onPress={onToggle} accessibilityLabel={item.label} />
      <TextInput
        value={label}
        onChangeText={setLabel}
        onEndEditing={commit}
        maxLength={CHECKLIST_ITEM_MAX_LENGTH}
        accessibilityLabel={`Edit item: ${item.label}`}
        selectionColor={colors.accent}
        style={[
          styles.label,
          {
            color: item.isCompleted ? colors.textMuted : colors.text,
            textDecorationLine: item.isCompleted ? 'line-through' : 'none',
          },
        ]}
      />
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Delete item: ${item.label}`}
        onPress={onDelete}
        hitSlop={14}
        style={styles.delete}>
        <X size={18} color={colors.textMuted} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    minHeight: TOUCH_TARGET + 4,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  label: {
    flex: 1,
    ...TYPE.body,
    paddingVertical: SPACING.sm,
  },
  delete: {
    padding: SPACING.xs,
  },
});
