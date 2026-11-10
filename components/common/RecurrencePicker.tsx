import { endOfDay, format, parseISO } from 'date-fns';
import { Minus, Plus } from 'lucide-react-native';
import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { RADIUS, SPACING } from '@/constants/appConfig';
import { useTheme } from '@/hooks/useTheme';
import type { RecurrenceFreq, RecurrenceRule } from '@/utils/recurrence';
import { Chip } from './Chip';
import { DateTimeField } from './DateTimeField';
import { FieldLabel } from './FormPickers';
import { SegmentedControl } from './SegmentedControl';

const FREQS: { value: RecurrenceFreq; label: string }[] = [
  { value: 'none', label: 'Never' },
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'yearly', label: 'Yearly' },
];

type EndKind = 'never' | 'until' | 'count';

interface RecurrencePickerProps {
  value: RecurrenceRule;
  onChange: (rule: RecurrenceRule) => void;
  /** First occurrence; the "until" date defaults from it. */
  start: Date;
  /** Events can end after N occurrences; reminders only by date. */
  allowCount?: boolean;
  error?: string | null;
}

export function RecurrencePicker({ value, onChange, start, allowCount = true, error }: RecurrencePickerProps) {
  const { colors } = useTheme();
  const endKind: EndKind = value.until ? 'until' : value.count !== null ? 'count' : 'never';
  const endOptions = [
    { value: 'never' as const, label: 'Never' },
    { value: 'until' as const, label: 'On date' },
    ...(allowCount ? [{ value: 'count' as const, label: 'After' }] : []),
  ];

  const setEnd = (kind: EndKind) => {
    if (kind === 'never') onChange({ ...value, until: null, count: null });
    if (kind === 'until') onChange({ ...value, until: format(start, 'yyyy-MM-dd'), count: null });
    if (kind === 'count') onChange({ ...value, until: null, count: 10 });
  };
  const stepCount = (delta: number) =>
    onChange({ ...value, count: Math.min(999, Math.max(1, (value.count ?? 1) + delta)) });

  return (
    <View style={styles.block}>
      <FieldLabel>Repeat</FieldLabel>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        {FREQS.map((f) => (
          <Chip
            key={f.value}
            label={f.label}
            selected={value.freq === f.value}
            onPress={() => onChange(f.value === 'none' ? { freq: 'none', interval: 1, until: null, count: null } : { ...value, freq: f.value })}
          />
        ))}
      </ScrollView>

      {value.freq !== 'none' ? (
        <View style={styles.ends}>
          <FieldLabel>Ends</FieldLabel>
          <SegmentedControl options={endOptions} value={endKind} onChange={setEnd} />
          {endKind === 'until' && value.until ? (
            <View style={styles.endDetail}>
              <DateTimeField
                label="Repeat until"
                mode="date"
                value={parseISO(value.until)}
                onChange={(d) => d && onChange({ ...value, until: format(endOfDay(d), 'yyyy-MM-dd') })}
              />
            </View>
          ) : null}
          {endKind === 'count' ? (
            <View style={[styles.counter, { borderColor: colors.border }]}>
              <Pressable accessibilityRole="button" accessibilityLabel="Fewer times" onPress={() => stepCount(-1)} hitSlop={6} style={styles.counterButton}>
                <Minus size={18} color={colors.accent} />
              </Pressable>
              <Text style={[styles.counterText, { color: colors.text }]} accessibilityLabel={`${value.count} times`}>
                {value.count} {value.count === 1 ? 'time' : 'times'}
              </Text>
              <Pressable accessibilityRole="button" accessibilityLabel="More times" onPress={() => stepCount(1)} hitSlop={6} style={styles.counterButton}>
                <Plus size={18} color={colors.accent} />
              </Pressable>
            </View>
          ) : null}
        </View>
      ) : null}
      {error ? <Text style={[styles.error, { color: colors.danger }]}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  block: {
    marginBottom: SPACING.md,
  },
  ends: {
    marginTop: SPACING.md,
  },
  endDetail: {
    marginTop: SPACING.md,
  },
  counter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderRadius: RADIUS.md,
    marginTop: SPACING.md,
  },
  counterButton: {
    padding: SPACING.md,
  },
  counterText: {
    fontSize: 15,
    fontWeight: '700',
  },
  error: {
    fontSize: 12,
    marginTop: SPACING.xs,
  },
});
