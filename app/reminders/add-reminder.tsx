import { addHours, startOfHour } from 'date-fns';
import { Stack, router } from 'expo-router';
import React, { useState } from 'react';

import { ReminderForm } from '@/components/reminders/ReminderForm';
import { createReminder } from '@/services/reminderService';
import type { ReminderDraft } from '@/types/reminder';
import { NO_RECURRENCE } from '@/utils/recurrence';

export default function AddReminderScreen() {
  const [initial] = useState<ReminderDraft>(() => ({
    title: '',
    description: '',
    dueAt: startOfHour(addHours(new Date(), 1)),
    priority: 'medium',
    categoryId: null,
    recurrence: NO_RECURRENCE,
  }));

  return (
    <>
      <Stack.Screen options={{ title: 'New Reminder' }} />
      <ReminderForm
        initial={initial}
        submitLabel="Save reminder"
        onSubmit={async (draft) => {
          await createReminder(draft);
          router.back();
        }}
      />
    </>
  );
}
