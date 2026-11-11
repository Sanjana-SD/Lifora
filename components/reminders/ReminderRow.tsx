import { format } from 'date-fns';
import { AlarmClock, Repeat } from 'lucide-react-native';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Checkbox } from '@/components/common/Checkbox';
import { PriorityBadge } from '@/components/common/PriorityBadge';
import { RADIUS, SPACING, TOUCH_TARGET, TYPE } from '@/constants/appConfig';
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
  /** Borderless variant for use inside a dashboard card. */
  compact?: boolean;
}

export function ReminderRow({ reminder: r, onToggle, onSnooze, onPress, now = new Date(), compact = false }: ReminderRowProps) {
  const { colors } = useTheme();
  const overdue = isOverdue(r, now);
  const snoozed = !r.isCompleted && r.snoozedUntil !== null && r.snoozedUntil > now;
  const repeating = r.recurrence.freq !== 'none';

  let when = formatDue(r.dueAt, now);
  if (r.isCompleted && r.completedAt) when = `Done ${formatDue(r.completedAt, now)}`;
  else if (overdue) when = `Overdue · ${when}`;

  return (
    <View
      style={[
        styles.row,
        compact ? styles.compact : [styles.card, { backgroundColor: colors.surface, borderColor: colors.border }],
      ]}>
      <Checkbox
        shape="circle"
        checked={r.isCompleted}
        overdue={overdue}
        onPress={onToggle}
        accessibilityLabel={
          r.isCompleted ? `Mark ${r.title} as not done` : repeating ? `Done for now: ${r.title}` : `Mark ${r.title} as done`
        }
      />
      <Pressable accessibilityRole="button" accessibilityLabel={`${r.title}, ${when}`} onPress={onPress} style={styles.body}>
        <Text
          style={[styles.title, { color: r.isCompleted ? colors.textMuted : colors.text }, r.isCompleted && styles.done]}
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
        <Pressable accessibilityRole="button" accessibilityLabel={`Snooze ${r.title}`} onPress={onSnooze} hitSlop={10} style={styles.snooze}>
          <AlarmClock size={22} color={colors.accent} />
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
    minHeight: TOUCH_TARGET + 8,
  },
  card: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: RADIUS.lg,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    marginBottom: SPACING.sm,
  },
  compact: {
    paddingVertical: SPACING.xs,
  },
  body: {
    flex: 1,
    justifyContent: 'center',
    minHeight: TOUCH_TARGET,
  },
  title: {
    ...TYPE.subheading,
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
    ...TYPE.caption,
  },
  snoozed: {
    ...TYPE.caption,
    fontWeight: '700',
    marginTop: 2,
  },
  snooze: {
    padding: SPACING.xs,
  },
});
