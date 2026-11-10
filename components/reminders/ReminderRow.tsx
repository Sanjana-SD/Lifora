import { format } from 'date-fns';
import { AlarmClock, Check, Repeat } from 'lucide-react-native';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { PriorityBadge } from '@/components/common/PriorityBadge';
import { RADIUS, SPACING } from '@/constants/appConfig';
import { useTheme } from '@/hooks/useTheme';
import { canSnooze, isOverdue } from '@/services/reminderService';
import type { Reminder } from '@/types/reminder';
import { formatDue } from '@/utils/dateUtils';

interface ReminderRowProps {
  reminder: Reminder;
  onToggle: () => void;
  onSnooze?: () => void;
  onPress: () => void;
  now?: Date;
}

export function ReminderRow({ reminder: r, onToggle, onSnooze, onPress, now = new Date() }: ReminderRowProps) {
  const { colors } = useTheme();
  const overdue = isOverdue(r, now);
  const snoozed = !r.isCompleted && r.snoozedUntil !== null && r.snoozedUntil > now;
  const repeating = r.recurrence.freq !== 'none';

  let when = formatDue(r.dueAt, now);
  if (r.isCompleted && r.completedAt) when = `Done ${formatDue(r.completedAt, now)}`;
  else if (overdue) when = `Overdue · ${when}`;

  return (
    <View style={[styles.row, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <Pressable
        accessibilityRole="checkbox"
        accessibilityState={{ checked: r.isCompleted }}
        accessibilityLabel={
          r.isCompleted ? `Mark ${r.title} as not done` : repeating ? `Done for now: ${r.title}` : `Mark ${r.title} as done`
        }
        onPress={onToggle}
        hitSlop={8}
        style={[
          styles.checkbox,
          {
            borderColor: r.isCompleted ? colors.accent : overdue ? colors.danger : colors.border,
            backgroundColor: r.isCompleted ? colors.accent : 'transparent',
          },
        ]}>
        {r.isCompleted ? <Check size={15} color={colors.onAccent} /> : null}
      </Pressable>
      <Pressable accessibilityRole="button" accessibilityLabel={`${r.title}, ${when}`} onPress={onPress} style={styles.body}>
        <Text
          style={[
            styles.title,
            { color: r.isCompleted ? colors.textMuted : colors.text },
            r.isCompleted && styles.done,
          ]}
          numberOfLines={2}>
          {r.title}
        </Text>
        <View style={styles.meta}>
          <Text style={[styles.when, { color: overdue ? colors.danger : colors.textMuted }]}>{when}</Text>
          {repeating ? <Repeat size={12} color={colors.textMuted} /> : null}
          <PriorityBadge priority={r.priority} />
        </View>
        {snoozed ? (
          <Text style={[styles.snoozed, { color: colors.warning }]}>Snoozed until {format(r.snoozedUntil!, 'h:mm a, d MMM')}</Text>
        ) : null}
      </Pressable>
      {onSnooze && canSnooze(r, now) ? (
        <Pressable accessibilityRole="button" accessibilityLabel={`Snooze ${r.title}`} onPress={onSnooze} hitSlop={8} style={styles.snooze}>
          <AlarmClock size={20} color={colors.textMuted} />
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    borderWidth: 1,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    flex: 1,
  },
  title: {
    fontSize: 15,
    fontWeight: '600',
  },
  done: {
    textDecorationLine: 'line-through',
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginTop: 2,
  },
  when: {
    fontSize: 12.5,
  },
  snoozed: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
  snooze: {
    padding: SPACING.xs,
  },
});
