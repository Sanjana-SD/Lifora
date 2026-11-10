import { Stack, router, useLocalSearchParams } from 'expo-router';
import { ListX, Trash2 } from 'lucide-react-native';
import React, { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/common/Button';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { EmptyState } from '@/components/common/EmptyState';
import { TaskForm } from '@/components/tasks/TaskForm';
import { SPACING } from '@/constants/appConfig';
import { useTask } from '@/hooks/useTasks';
import { useTheme } from '@/hooks/useTheme';
import * as taskService from '@/services/taskService';
import { formatDue } from '@/utils/dateUtils';

export default function TaskDetailsScreen() {
  const { colors } = useTheme();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const taskId = Number(id);
  const { task, loading, reload } = useTask(taskId);
  const [deleting, setDeleting] = useState(false);

  if (!task) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <Stack.Screen options={{ title: 'Task' }} />
        {loading ? (
          <ActivityIndicator color={colors.accent} />
        ) : (
          <EmptyState icon={ListX} title="Task not found" description="It may have been deleted." />
        )}
      </View>
    );
  }

  const status = task.isCompleted
    ? `Completed${task.completedAt ? ` · ${formatDue(task.completedAt)}` : ''}`
    : taskService.isOverdue(task)
      ? 'Overdue'
      : null;

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Task',
          headerRight: () => (
            <Pressable accessibilityRole="button" accessibilityLabel="Delete task" onPress={() => setDeleting(true)} hitSlop={8} style={styles.headerIcon}>
              <Trash2 size={20} color={colors.danger} />
            </Pressable>
          ),
        }}
      />
      <TaskForm
        key={String(task.isCompleted)}
        initial={{
          title: task.title,
          description: task.description,
          deadline: task.deadline,
          deadlineHasTime: task.deadlineHasTime,
          notify: task.notify,
          priority: task.priority,
          categoryId: task.categoryId,
        }}
        submitLabel="Save changes"
        onSubmit={async (draft) => {
          await taskService.updateTask(taskId, draft);
          router.back();
        }}
        footer={
          <View style={styles.footer}>
            {status ? (
              <Text style={[styles.status, { color: status === 'Overdue' ? colors.danger : colors.textMuted }]}>{status}</Text>
            ) : null}
            <Button
              variant="secondary"
              label={task.isCompleted ? 'Mark as not done' : 'Mark as done'}
              onPress={async () => {
                await taskService.setTaskCompleted(taskId, !task.isCompleted);
                await reload();
              }}
            />
          </View>
        }
      />
      <ConfirmDialog
        visible={deleting}
        title="Delete this task?"
        message="This can't be undone."
        confirmLabel="Delete"
        destructive
        onConfirm={async () => {
          setDeleting(false);
          await taskService.deleteTask(taskId);
          router.back();
        }}
        onCancel={() => setDeleting(false)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: 'center',
  },
  headerIcon: {
    padding: SPACING.sm,
  },
  footer: {
    marginTop: SPACING.lg,
    gap: SPACING.sm,
  },
  status: {
    fontSize: 13,
    textAlign: 'center',
  },
});
