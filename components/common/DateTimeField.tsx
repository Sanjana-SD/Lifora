import { addDays, addMonths, format, getHours, getMinutes, isSameDay, setHours, setMinutes, startOfMonth } from 'date-fns';
import { CalendarDays, ChevronLeft, ChevronRight, Clock, Minus, Plus, X } from 'lucide-react-native';
import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { RADIUS, SPACING, TOUCH_TARGET, TYPE } from '@/constants/appConfig';
import { useTheme } from '@/hooks/useTheme';
import { BottomSheet } from './BottomSheet';
import { Button } from './Button';
import { Chip } from './Chip';
import { MonthGrid } from './MonthGrid';
import { SegmentedControl } from './SegmentedControl';

export type DateTimeMode = 'date' | 'datetime' | 'time';

interface DateTimeFieldProps {
  label: string;
  value: Date | null;
  onChange: (value: Date | null) => void;
  mode?: DateTimeMode;
  placeholder?: string;
  error?: string | null;
  /** Shows an "x" to clear the value (for optional fields). */
  clearable?: boolean;
  /** One-tap day chips above the month grid; defaults to Today / Tomorrow / Next week. */
  quickDays?: { label: string; day: Date }[];
}

const DISPLAY: Record<DateTimeMode, string> = {
  date: 'EEE, d MMM yyyy',
  datetime: 'EEE, d MMM yyyy · h:mm a',
  time: 'h:mm a',
};

const MERIDIEMS = [
  { value: 'am', label: 'AM' },
  { value: 'pm', label: 'PM' },
] as const;

function defaultValue(): Date {
  const now = new Date();
  // Next whole hour: a sensible starting point for new items.
  return setMinutes(setHours(now, getHours(now) + 1), 0);
}

export function DateTimeField({
  label,
  value,
  onChange,
  mode = 'datetime',
  placeholder = 'Choose',
  error,
  clearable = false,
  quickDays: quickDaysProp,
}: DateTimeFieldProps) {
  const { colors } = useTheme();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<Date>(value ?? defaultValue());
  const [month, setMonth] = useState<Date>(startOfMonth(value ?? new Date()));

  const openPicker = () => {
    const initial = value ?? defaultValue();
    setDraft(initial);
    setMonth(startOfMonth(initial));
    setOpen(true);
  };

  const pickDay = (day: Date) => {
    setDraft((d) => setMinutes(setHours(day, getHours(d)), getMinutes(d)));
    setMonth(startOfMonth(day));
  };

  const hours24 = getHours(draft);
  const hour12 = hours24 % 12 === 0 ? 12 : hours24 % 12;
  const minute = getMinutes(draft);
  const meridiem = hours24 >= 12 ? 'pm' : 'am';

  const stepHour = (delta: number) => setDraft((d) => setHours(d, (getHours(d) + delta + 24) % 24));
  const stepMinute = (delta: number) =>
    setDraft((d) => {
      const snapped = Math.floor(getMinutes(d) / 5) * 5;
      return setMinutes(d, (snapped + delta * 5 + 60) % 60);
    });
  const setMeridiem = (m: 'am' | 'pm') =>
    setDraft((d) => {
      const h = getHours(d);
      if (m === 'pm' && h < 12) return setHours(d, h + 12);
      if (m === 'am' && h >= 12) return setHours(d, h - 12);
      return d;
    });

  const today = new Date();
  const quickDays = quickDaysProp ?? [
    { label: 'Today', day: today },
    { label: 'Tomorrow', day: addDays(today, 1) },
    { label: 'Next week', day: addDays(today, 7) },
  ];

  const Icon = mode === 'time' ? Clock : CalendarDays;
  const close = () => setOpen(false);

  return (
    <View style={styles.container}>
      <Text style={[styles.label, { color: colors.textMuted }]}>{label}</Text>
      <View style={styles.fieldRow}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`${label}: ${value ? format(value, DISPLAY[mode]) : 'not set'}`}
          onPress={openPicker}
          style={({ pressed }) => [
            styles.field,
            {
              borderColor: error ? colors.danger : colors.borderStrong,
              backgroundColor: pressed ? colors.accentSoft : colors.surface,
            },
          ]}>
          <Icon size={18} color={colors.accent} />
          <Text style={[styles.value, { color: value ? colors.text : colors.textMuted }]}>
            {value ? format(value, DISPLAY[mode]) : placeholder}
          </Text>
        </Pressable>
        {clearable && value ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Clear ${label}`}
            onPress={() => onChange(null)}
            hitSlop={12}
            style={styles.clear}>
            <X size={20} color={colors.textMuted} />
          </Pressable>
        ) : null}
      </View>
      {error ? <Text style={[styles.error, { color: colors.danger }]}>{error}</Text> : null}

      <BottomSheet visible={open} onClose={close} title={label} maxHeight="92%">
        <ScrollView keyboardShouldPersistTaps="handled">
          {mode !== 'time' ? (
            <>
              <View style={styles.quick}>
                {quickDays.map((q) => (
                  <Chip key={q.label} label={q.label} selected={isSameDay(draft, q.day)} onPress={() => pickDay(q.day)} />
                ))}
              </View>
              <View style={styles.monthHeader}>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Previous month"
                  onPress={() => setMonth((m) => addMonths(m, -1))}
                  hitSlop={12}
                  style={styles.navButton}>
                  <ChevronLeft size={22} color={colors.accent} />
                </Pressable>
                <Text style={[styles.monthTitle, { color: colors.text }]}>{format(month, 'MMMM yyyy')}</Text>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Next month"
                  onPress={() => setMonth((m) => addMonths(m, 1))}
                  hitSlop={12}
                  style={styles.navButton}>
                  <ChevronRight size={22} color={colors.accent} />
                </Pressable>
              </View>
              <MonthGrid month={month} selected={draft} onSelect={pickDay} />
            </>
          ) : null}

          {mode !== 'date' ? (
            <View style={styles.timeRow}>
              <Stepper label="Hour" value={String(hour12)} onDecrement={() => stepHour(-1)} onIncrement={() => stepHour(1)} />
              <Text style={[styles.colon, { color: colors.text }]}>:</Text>
              <Stepper
                label="Minute"
                value={String(minute).padStart(2, '0')}
                onDecrement={() => stepMinute(-1)}
                onIncrement={() => stepMinute(1)}
              />
              <View style={styles.meridiem}>
                <SegmentedControl options={MERIDIEMS} value={meridiem} onChange={setMeridiem} />
              </View>
            </View>
          ) : null}

          <View style={styles.actions}>
            <Button label="Cancel" variant="secondary" onPress={close} style={styles.action} />
            <Button
              label="Done"
              onPress={() => {
                onChange(draft);
                close();
              }}
              style={styles.action}
            />
          </View>
        </ScrollView>
      </BottomSheet>
    </View>
  );
}

function Stepper({
  label,
  value,
  onDecrement,
  onIncrement,
}: {
  label: string;
  value: string;
  onDecrement: () => void;
  onIncrement: () => void;
}) {
  const { colors } = useTheme();
  return (
    <View style={[styles.stepper, { borderColor: colors.borderStrong }]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Decrease ${label.toLowerCase()}`}
        onPress={onDecrement}
        hitSlop={4}
        style={styles.stepButton}>
        <Minus size={18} color={colors.accent} />
      </Pressable>
      <Text accessibilityLabel={`${label} ${value}`} style={[styles.stepValue, { color: colors.text }]}>
        {value}
      </Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Increase ${label.toLowerCase()}`}
        onPress={onIncrement}
        hitSlop={4}
        style={styles.stepButton}>
        <Plus size={18} color={colors.accent} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: SPACING.lg,
  },
  label: {
    ...TYPE.label,
    marginBottom: SPACING.xs,
  },
  fieldRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  field: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    minHeight: TOUCH_TARGET,
    borderWidth: 1,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
  },
  value: {
    ...TYPE.body,
  },
  clear: {
    padding: SPACING.xs,
  },
  error: {
    ...TYPE.caption,
    marginTop: SPACING.xs,
  },
  quick: {
    flexDirection: 'row',
    marginBottom: SPACING.md,
  },
  monthHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.xs,
  },
  navButton: {
    padding: SPACING.sm,
  },
  monthTitle: {
    ...TYPE.subheading,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginTop: SPACING.md,
  },
  colon: {
    fontSize: 20,
    fontWeight: '700',
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: RADIUS.md,
  },
  stepButton: {
    width: 40,
    height: TOUCH_TARGET,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepValue: {
    fontSize: 18,
    fontWeight: '700',
    minWidth: 26,
    textAlign: 'center',
  },
  meridiem: {
    flex: 1,
  },
  actions: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginTop: SPACING.lg,
  },
  action: {
    flex: 1,
  },
});
