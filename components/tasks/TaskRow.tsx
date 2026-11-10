import { Bell, Check } from 'lucide-react-native';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { PriorityBadge } from '@/components/common/PriorityBadge';
import { RADIUS, SPACING } from '@/constants/appConfig';
import { useTheme } from '@/hooks/useTheme';
import { isOverdue } from '@/services/taskService';
import type { Task } from '@/types/task';
import { formatDue } from '@/utils/dateUtils';

interface TaskRowProps {
  task: Task;
  onToggle: () => void;
  onPress: () => void;
  now?: Date;
}

export function deadlineLabel(task: Task, now: Date = new Date()): string | null {
  if (!task.deadline) return null;
  return `Due ${formatDue(task.deadline, now, task.deadlineHasTime)}`;
}

export function TaskRow({ task: t, onToggle, onPress, now = new Date() }: TaskRowProps) {
  const { colors } = useTheme();
  const overdue = isOverdue(t, now);
  const due = deadlineLabel(t, now);

  return (
    <View style={[styles.row, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <Pressable
        accessibilityRole="checkbox"
        accessibilityState={{ checked: t.isCompleted }}
        accessibilityLabel={t.isCompleted ? `Mark ${t.title} as not done` : `Mark ${t.title} as done`}
        onPress={onToggle}
        hitSlop={8}
        style={[
          styles.checkbox,
          {
            borderColor: t.isCompleted ? colors.accent : overdue ? colors.danger : colors.border,
            backgroundColor: t.isCompleted ? colors.accent : 'transparent',
          },
        ]}>
        {t.isCompleted ? <Check size={15} color={colors.onAccent} /> : null}
      </Pressable>
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
    borderWidth: 1,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: RADIUS.sm,
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
  due: {
    fontSize: 12.5,
  },
});
