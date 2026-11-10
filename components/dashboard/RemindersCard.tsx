import { endOfDay } from 'date-fns';
import { router, type Href } from 'expo-router';
import { BellRing } from 'lucide-react-native';
import React from 'react';
import { StyleSheet, Text } from 'react-native';

import { ReminderRow } from '@/components/reminders/ReminderRow';
import { usePendingReminders } from '@/hooks/useReminders';
import { useTheme } from '@/hooks/useTheme';
import { completeReminder } from '@/services/reminderService';
import { AddLink } from './AddLink';
import { DashboardSection } from './DashboardSection';

const SHOWN = 3;

export function RemindersCard() {
  const { colors } = useTheme();
  const { reminders, error, reload } = usePendingReminders();
  const now = new Date();
  // PRD 1.2: reminders due today or overdue.
  const due = reminders.filter((r) => r.dueAt <= endOfDay(now));
  const later = reminders.length - due.length;

  return (
    <DashboardSection icon={BellRing} title="Reminders" onPress={() => router.push('/reminders/index' as Href)}>
      {error ? (
        <Text style={[styles.empty, { color: colors.danger }]}>{"Couldn't load reminders."}</Text>
      ) : due.length === 0 ? (
        <Text style={[styles.empty, { color: colors.textMuted }]}>
          {later > 0 ? `Nothing due today · ${later} coming up` : 'No pending reminders.'}
        </Text>
      ) : (
        <>
          {due.slice(0, SHOWN).map((r) => (
            <ReminderRow
              key={r.id}
              reminder={r}
              now={now}
              onToggle={async () => {
                await completeReminder(r.id);
                await reload();
              }}
              onPress={() => router.push(`/reminders/reminder-details?id=${r.id}` as Href)}
            />
          ))}
          {due.length > SHOWN ? (
            <Text style={[styles.empty, { color: colors.textMuted }]}>+{due.length - SHOWN} more due</Text>
          ) : null}
        </>
      )}
      <AddLink label="Add a reminder" onPress={() => router.push('/reminders/add-reminder' as Href)} />
    </DashboardSection>
  );
}

const styles = StyleSheet.create({
  empty: {
    fontSize: 13,
    lineHeight: 18,
  },
});
