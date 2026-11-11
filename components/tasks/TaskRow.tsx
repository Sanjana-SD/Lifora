import { Bell } from 'lucide-react-native';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Checkbox } from '@/components/common/Checkbox';
import { PriorityBadge } from '@/components/common/PriorityBadge';
import { RADIUS, SPACING, TOUCH_TARGET, TYPE } from '@/constants/appConfig';
import { useTheme } from '@/hooks/useTheme';
import { isOverdue } from '@/services/taskService';
import type { Task } from '@/types/task';
import { formatDue } from '@/utils/dateUtils';

interface TaskRowProps {
  task: Task;
  onToggle: () => void;
  onPress: () => void;
  now?: Date;
  /** Borderless variant for use inside a dashboard card. */
  compact?: boolean;
}

export function deadlineLabel(task: Task, now: Date = new Date()): string | null {
  if (!task.deadline) return null;
  return `Due ${formatDue(task.deadline, now, task.deadlineHasTime)}`;
}

export function TaskRow({ task: t, onToggle, onPress, now = new Date(), compact = false }: TaskRowProps) {
  const { colors } = useTheme();
  const overdue = isOverdue(t, now);
  const due = deadlineLabel(t, now);

  return (
    <View
      style={[
        styles.row,
        compact ? styles.compact : [styles.card, { backgroundColor: colors.surface, borderColor: colors.border }],
      ]}>
      <Checkbox
        checked={t.isCompleted}
        overdue={overdue}
        onPress={onToggle}
        accessibilityLabel={t.isCompleted ? `Mark ${t.title} as not done` : `Mark ${t.title} as done`}
      />
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${t.title}${due ? `, ${due}` : ''}${overdue ? ', overdue' : ''}`}
        onPress={onPress}
        style={styles.body}>
        <Text
          style={[styles.title, { color: t.isCompleted ? colors.textMuted : colors.text }, t.isCompleted && styles.done]}
          numberOfLines={2}>
          {t.title}
        </Text>
        {due || t.priority !== 'medium' ? (
          <View style={styles.meta}>
            {due ? (
              <Text style={[styles.due, { color: overdue ? colors.danger : colors.textMuted }]}>
                {overdue ? `Overdue · ${due}` : due}
              </Text>
            ) : null}
            {t.notify && !t.isCompleted ? <Bell size={12} color={colors.textMuted} /> : null}
            <PriorityBadge priority={t.priority} />
          </View>
        ) : null}
      </Pressable>
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
  due: {
    ...TYPE.caption,
  },
});
