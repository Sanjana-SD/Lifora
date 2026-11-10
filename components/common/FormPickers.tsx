import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { RADIUS, SPACING } from '@/constants/appConfig';
import { PRIORITIES, PRIORITY_LABELS, type Priority } from '@/constants/priorities';
import { useCategories } from '@/hooks/useCalendar';
import { useTheme } from '@/hooks/useTheme';
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

/** Calendar-scope categories (shared by events, reminders, and tasks), with their colors. */
export function CategoryPicker({ value, onChange }: { value: number | null; onChange: (id: number | null) => void }) {
  const { colors } = useTheme();
  const { categories } = useCategories('calendar');

  return (
    <View style={styles.block}>
      <FieldLabel>Category</FieldLabel>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <Chip label="None" selected={value === null} onPress={() => onChange(null)} />
        {categories.map((c) => {
          const selected = value === c.id;
          return (
            <Pressable
              key={c.id}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              accessibilityLabel={`Category: ${c.name}`}
              onPress={() => onChange(c.id)}
              style={[
                styles.categoryChip,
                {
                  backgroundColor: selected ? colors.surfaceAlt : colors.surface,
                  borderColor: selected ? c.colorHex : colors.border,
                },
              ]}>
              <View style={[styles.dot, { backgroundColor: c.colorHex }]} />
              <Text style={[styles.categoryText, { color: colors.text, fontWeight: selected ? '700' : '600' }]}>{c.name}</Text>
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
    fontSize: 12.5,
    fontWeight: '600',
    marginBottom: SPACING.xs,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minHeight: 32,
    paddingHorizontal: SPACING.md,
    borderRadius: RADIUS.lg,
    borderWidth: 1.5,
    marginRight: SPACING.sm,
  },
  dot: {
    width: 9,
    height: 9,
    borderRadius: 5,
  },
  categoryText: {
    fontSize: 13,
  },
});
