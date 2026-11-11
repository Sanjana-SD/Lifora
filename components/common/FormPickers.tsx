import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { RADIUS, SPACING, TYPE } from '@/constants/appConfig';
import { PRIORITIES, PRIORITY_LABELS, type Priority } from '@/constants/priorities';
import { useCategories } from '@/hooks/useCalendar';
import { useTheme } from '@/hooks/useTheme';
import type { CategoryScope } from '@/types/category';
import { Chip } from './Chip';
import { SegmentedControl } from './SegmentedControl';

export function FieldLabel({ children }: { children: string }) {
  const { colors } = useTheme();
  return <Text style={[styles.label, { color: colors.textMuted }]}>{children}</Text>;
}

const PRIORITY_OPTIONS = PRIORITIES.map((p) => ({ value: p, label: PRIORITY_LABELS[p] }));

export function PriorityPicker({ value, onChange }: { value: Priority; onChange: (p: Priority) => void }) {
  return (
    <View style={styles.block}>
      <FieldLabel>Priority</FieldLabel>
      <SegmentedControl options={PRIORITY_OPTIONS} value={value} onChange={onChange} />
    </View>
  );
}

interface CategoryPickerProps {
  value: number | null;
  onChange: (id: number | null) => void;
  /** Calendar categories are shared by events, reminders, and tasks; finance has its own set. */
  scope?: CategoryScope;
  /** Offer a "None" chip (calendar items); finance requires a category. */
  allowNone?: boolean;
  /** Shown under the label, e.g. "Suggested from the description". */
  hint?: string | null;
}

export function CategoryPicker({ value, onChange, scope = 'calendar', allowNone = true, hint }: CategoryPickerProps) {
  const { colors } = useTheme();
  const { categories } = useCategories(scope);

  return (
    <View style={styles.block}>
      <FieldLabel>Category</FieldLabel>
      {hint ? <Text style={[styles.hint, { color: colors.accent }]}>{hint}</Text> : null}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        {allowNone ? <Chip label="None" selected={value === null} onPress={() => onChange(null)} /> : null}
        {categories.map((c) => {
          const selected = value === c.id;
          return (
            <Pressable
              key={c.id}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              accessibilityLabel={`Category: ${c.name}`}
              onPress={() => onChange(c.id)}
              hitSlop={{ top: 6, bottom: 6 }}
              style={[
                styles.categoryChip,
                {
                  backgroundColor: selected ? colors.accentSoft : colors.surface,
                  borderColor: selected ? colors.accent : colors.border,
                },
              ]}>
              <View style={[styles.dot, { backgroundColor: c.colorHex }]} />
              <Text style={[styles.categoryText, { color: selected ? colors.accent : colors.text, fontWeight: selected ? '700' : '600' }]}>
                {c.name}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

export const NOTIFICATION_OFFSETS: { minutes: number | null; label: string }[] = [
  { minutes: null, label: 'None' },
  { minutes: 0, label: 'At start' },
  { minutes: 10, label: '10 min before' },
  { minutes: 60, label: '1 hour before' },
  { minutes: 1440, label: '1 day before' },
];

export function NotificationOffsetPicker({
  value,
  onChange,
}: {
  value: number | null;
  onChange: (minutes: number | null) => void;
}) {
  return (
    <View style={styles.block}>
      <FieldLabel>Notification</FieldLabel>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        {NOTIFICATION_OFFSETS.map((o) => (
          <Chip key={o.label} label={o.label} selected={value === o.minutes} onPress={() => onChange(o.minutes)} />
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  block: {
    marginBottom: SPACING.md,
  },
  label: {
    ...TYPE.label,
    marginBottom: SPACING.xs,
  },
  hint: {
    ...TYPE.caption,
    marginTop: -2,
    marginBottom: SPACING.xs,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 36,
    paddingHorizontal: SPACING.md,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
    marginRight: SPACING.sm,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  categoryText: {
    ...TYPE.label,
  },
});
