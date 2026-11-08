import { Check, X } from 'lucide-react-native';
import React, { useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import { RADIUS, SPACING } from '@/constants/appConfig';
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
      <Pressable
        accessibilityRole="checkbox"
        accessibilityState={{ checked: item.isCompleted }}
        accessibilityLabel={item.label}
        onPress={onToggle}
        hitSlop={8}
        style={[
          styles.checkbox,
          {
            borderColor: item.isCompleted ? colors.accent : colors.border,
            backgroundColor: item.isCompleted ? colors.accent : 'transparent',
          },
        ]}>
        {item.isCompleted ? <Check size={16} color={colors.onAccent} /> : null}
      </Pressable>
      <TextInput
        value={label}
        onChangeText={setLabel}
        onEndEditing={commit}
        maxLength={CHECKLIST_ITEM_MAX_LENGTH}
        accessibilityLabel={`Edit item: ${item.label}`}
        style={[
          styles.label,
          {
            color: item.isCompleted ? colors.textMuted : colors.text,
            textDecorationLine: item.isCompleted ? 'line-through' : 'none',
          },
        ]}
      />
      <Pressable accessibilityRole="button" accessibilityLabel={`Delete item: ${item.label}`} onPress={onDelete} hitSlop={8}>
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
    paddingVertical: SPACING.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: RADIUS.sm,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    flex: 1,
    fontSize: 15,
    paddingVertical: SPACING.xs,
  },
});
