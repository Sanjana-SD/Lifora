import { Stack, router, useLocalSearchParams } from 'expo-router';
import { BellOff, Trash2 } from 'lucide-react-native';
import React, { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/common/Button';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { EmptyState } from '@/components/common/EmptyState';
import { ReminderForm } from '@/components/reminders/ReminderForm';
import { SPACING } from '@/constants/appConfig';
import { useReminder } from '@/hooks/useReminders';
import { useTheme } from '@/hooks/useTheme';
import * as reminderService from '@/services/reminderService';
import { formatDue } from '@/utils/dateUtils';

export default function ReminderDetailsScreen() {
  const { colors } = useTheme();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const reminderId = Number(id);
  const { reminder, loading, reload } = useReminder(reminderId);
  const [deleting, setDeleting] = useState(false);

  if (!reminder) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <Stack.Screen options={{ title: 'Reminder' }} />
        {loading ? (
          <ActivityIndicator color={colors.accent} />
        ) : (
          <EmptyState icon={BellOff} title="Reminder not found" description="It may have been deleted." />
        )}
      </View>
    );
  }

  const repeating = reminder.recurrence.freq !== 'none';
  const status = reminder.isCompleted
    ? `Done${reminder.completedAt ? ` · ${formatDue(reminder.completedAt)}` : ''}`
    : reminderService.isOverdue(reminder)
      ? `Overdue since ${formatDue(reminder.dueAt)}`
      : null;

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Reminder',
          headerRight: () => (
            <Pressable accessibilityRole="button" accessibilityLabel="Delete reminder" onPress={() => setDeleting(true)} hitSlop={8} style={styles.headerIcon}>
              <Trash2 size={20} color={colors.danger} />
            </Pressable>
          ),
        }}
      />
      <ReminderForm
        // Re-mount after complete/reopen so the form shows the new due time.
        key={`${reminder.dueAt.toISOString()}-${reminder.isCompleted}`}
        initial={{
          title: reminder.title,
          description: reminder.description,
          dueAt: reminder.dueAt,
          priority: reminder.priority,
          categoryId: reminder.categoryId,
          recurrence: reminder.recurrence,
        }}
        submitLabel="Save changes"
        onSubmit={async (draft) => {
          await reminderService.updateReminder(reminderId, draft);
          router.back();
        }}
        footer={
          <View style={styles.footer}>
            {status ? <Text style={[styles.status, { color: colors.textMuted }]}>{status}</Text> : null}
            <Button
              variant="secondary"
              label={reminder.isCompleted ? 'Mark as not done' : repeating ? 'Done — move to next time' : 'Mark as done'}
              onPress={async () => {
                if (reminder.isCompleted) await reminderService.reopenReminder(reminderId);
                else await reminderService.completeReminder(reminderId);
                await reload();
              }}
            />
          </View>
        }
      />
      <ConfirmDialog
        visible={deleting}
        title="Delete this reminder?"
        message={repeating ? 'All future repeats will be removed too.' : "This can't be undone."}
        confirmLabel="Delete"
        destructive
        onConfirm={async () => {
          setDeleting(false);
          await reminderService.deleteReminder(reminderId);
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
