import { addMonths, format, getHours, getMinutes, setHours, setMinutes, startOfMonth } from 'date-fns';
import { CalendarDays, ChevronLeft, ChevronRight, Clock, Minus, Plus, X } from 'lucide-react-native';
import React, { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { RADIUS, SPACING } from '@/constants/appConfig';
import { useTheme } from '@/hooks/useTheme';
import { Button } from './Button';
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

  const pickDay = (day: Date) =>
    setDraft((d) => setMinutes(setHours(day, getHours(d)), getMinutes(d)));

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

  const Icon = mode === 'time' ? Clock : CalendarDays;

  return (
    <View style={styles.container}>
      <Text style={[styles.label, { color: colors.textMuted }]}>{label}</Text>
      <View style={styles.fieldRow}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`${label}: ${value ? format(value, DISPLAY[mode]) : 'not set'}`}
          onPress={openPicker}
          style={[
            styles.field,
            { borderColor: error ? colors.danger : colors.border, backgroundColor: colors.background },
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
            hitSlop={8}
            style={styles.clear}>
            <X size={18} color={colors.textMuted} />
          </Pressable>
        ) : null}
      </View>
      {error ? <Text style={[styles.error, { color: colors.danger }]}>{error}</Text> : null}

      <Modal visible={open} transparent animationType="slide" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)} accessibilityLabel="Close" />
        <View style={[styles.sheet, { backgroundColor: colors.background, borderColor: colors.border }]}>
          <Text style={[styles.sheetTitle, { color: colors.text }]}>{label}</Text>

          {mode !== 'time' ? (
            <>
              <View style={styles.monthHeader}>
                <Pressable accessibilityRole="button" accessibilityLabel="Previous month" onPress={() => setMonth((m) => addMonths(m, -1))} hitSlop={8}>
                  <ChevronLeft size={22} color={colors.text} />
                </Pressable>
                <Text style={[styles.monthTitle, { color: colors.text }]}>{format(month, 'MMMM yyyy')}</Text>
                <Pressable accessibilityRole="button" accessibilityLabel="Next month" onPress={() => setMonth((m) => addMonths(m, 1))} hitSlop={8}>
                  <ChevronRight size={22} color={colors.text} />
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
            <Button label="Cancel" variant="secondary" onPress={() => setOpen(false)} style={styles.action} />
            <Button
              label="Done"
              onPress={() => {
                onChange(draft);
                setOpen(false);
              }}
              style={styles.action}
            />
          </View>
        </View>
      </Modal>
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
    <View style={[styles.stepper, { borderColor: colors.border }]}>
      <Pressable accessibilityRole="button" accessibilityLabel={`Decrease ${label.toLowerCase()}`} onPress={onDecrement} hitSlop={6} style={styles.stepButton}>
        <Minus size={18} color={colors.accent} />
      </Pressable>
      <Text accessibilityLabel={`${label} ${value}`} style={[styles.stepValue, { color: colors.text }]}>
        {value}
      </Text>
      <Pressable accessibilityRole="button" accessibilityLabel={`Increase ${label.toLowerCase()}`} onPress={onIncrement} hitSlop={6} style={styles.stepButton}>
        <Plus size={18} color={colors.accent} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: SPACING.md,
  },
  label: {
    fontSize: 12.5,
    fontWeight: '600',
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
    minHeight: 46,
    borderWidth: 1,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
  },
  value: {
    fontSize: 15,
  },
  clear: {
    padding: SPACING.xs,
  },
  error: {
    fontSize: 12,
    marginTop: SPACING.xs,
  },
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
  sheetTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: SPACING.sm,
  },
  monthHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.sm,
  },
  monthTitle: {
    fontSize: 15,
    fontWeight: '700',
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
    padding: SPACING.sm,
  },
  stepValue: {
    fontSize: 18,
    fontWeight: '700',
    minWidth: 28,
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
