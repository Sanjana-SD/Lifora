import { Stack, router, type Href } from 'expo-router';
import { BellRing } from 'lucide-react-native';
import React, { useMemo, useState } from 'react';
import { ActivityIndicator, SectionList, StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/common/Button';
import { EmptyState } from '@/components/common/EmptyState';
import { FloatingActionButton } from '@/components/common/FloatingActionButton';
import { DeliveryNote, NotificationPermissionBanner } from '@/components/common/NotificationPermissionBanner';
import { ReminderRow } from '@/components/reminders/ReminderRow';
import { SnoozeSheet } from '@/components/reminders/SnoozeSheet';
import { SPACING } from '@/constants/appConfig';
import { useReminders } from '@/hooks/useReminders';
import { useTheme } from '@/hooks/useTheme';
import * as reminderService from '@/services/reminderService';
import type { Reminder } from '@/types/reminder';

const openReminder = (id: number) => router.push(`/reminders/reminder-details?id=${id}` as Href);

export default function RemindersScreen() {
  const { colors } = useTheme();
  const { reminders, loading, error, reload } = useReminders();
  const [snoozing, setSnoozing] = useState<Reminder | null>(null);
  const now = new Date();

  const sections = useMemo(() => {
    const current = new Date();
    const overdue = reminders.filter((r) => reminderService.isOverdue(r, current));
    const upcoming = reminders.filter((r) => !r.isCompleted && !reminderService.isOverdue(r, current));
    const done = reminders.filter((r) => r.isCompleted);
    return [
      { title: 'Overdue', data: overdue },
      { title: 'Upcoming', data: upcoming },
      { title: 'Done', data: done },
    ].filter((s) => s.data.length > 0);
  }, [reminders]);

  const toggle = async (r: Reminder) => {
    if (r.isCompleted) await reminderService.reopenReminder(r.id);
    else await reminderService.completeReminder(r.id);
    await reload();
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen options={{ title: 'Reminders' }} />
      {error ? (
        <View style={styles.center}>
          <Text style={[styles.error, { color: colors.danger }]}>{"Couldn't load reminders."}</Text>
          <Button label="Try again" variant="secondary" onPress={reload} />
        </View>
      ) : loading && reminders.length === 0 ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.accent} />
        </View>
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(r) => String(r.id)}
          contentContainerStyle={styles.list}
          ListHeaderComponent={<NotificationPermissionBanner />}
          renderSectionHeader={({ section }) => (
            <Text
              accessibilityRole="header"
              style={[
                styles.sectionHeader,
                { color: section.title === 'Overdue' ? colors.danger : colors.textMuted, backgroundColor: colors.background },
              ]}>
              {section.title} · {section.data.length}
            </Text>
          )}
          renderItem={({ item }) => (
            <ReminderRow
              reminder={item}
              now={now}
              onToggle={() => toggle(item)}
              onSnooze={() => setSnoozing(item)}
              onPress={() => openReminder(item.id)}
            />
          )}
          ListEmptyComponent={
            <EmptyState
              icon={BellRing}
              title="No reminders"
              description="Never miss a bill, a call, or a deadline."
              actionLabel="Add a reminder"
              onAction={() => router.push('/reminders/add-reminder' as Href)}
            />
          }
          ListFooterComponent={reminders.length > 0 ? <DeliveryNote /> : undefined}
        />
      )}
      <FloatingActionButton accessibilityLabel="Add reminder" onPress={() => router.push('/reminders/add-reminder' as Href)} />
      <SnoozeSheet
        visible={snoozing !== null}
        title={snoozing?.title}
        onClose={() => setSnoozing(null)}
        onChoose={async (option) => {
          if (snoozing) await reminderService.snoozeReminder(snoozing.id, option);
          setSnoozing(null);
          await reload();
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  list: {
    flexGrow: 1,
    padding: SPACING.lg,
    paddingBottom: 96,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.md,
  },
  error: {
    fontSize: 14,
    fontWeight: '600',
  },
  sectionHeader: {
    fontSize: 12.5,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    paddingTop: SPACING.sm,
    paddingBottom: SPACING.sm,
  },
});
