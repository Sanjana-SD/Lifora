import { addHours, isToday, parseISO, setHours, setMinutes, startOfHour } from 'date-fns';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import React, { useState } from 'react';

import { EventForm } from '@/components/calendar/EventForm';
import { createEvent } from '@/services/calendarService';
import type { EventDraft } from '@/types/event';
import { NO_RECURRENCE } from '@/utils/recurrence';

/** Today: the next whole hour. Another day: 9:00 AM that day. */
function defaultStart(day: Date | null, now: Date = new Date()): Date {
  if (!day || isToday(day)) return startOfHour(addHours(now, 1));
  return setMinutes(setHours(day, 9), 0);
}

export default function AddEventScreen() {
  const { date } = useLocalSearchParams<{ date?: string }>();
  const [initial] = useState<EventDraft>(() => {
    const parsed = date ? parseISO(date) : null;
    const start = defaultStart(parsed && !Number.isNaN(parsed.getTime()) ? parsed : null);
    return {
      title: '',
      description: '',
      startAt: start,
      endAt: addHours(start, 1),
      location: '',
      categoryId: null,
      priority: 'medium',
      recurrence: NO_RECURRENCE,
      // Events alert by default; "None" is still one tap away.
      notificationOffsetMinutes: 10,
    };
  });

  return (
    <>
      <Stack.Screen options={{ title: 'New Event' }} />
      <EventForm
        initial={initial}
        submitLabel="Save event"
        onSubmit={async (draft) => {
          await createEvent(draft);
          router.back();
        }}
      />
    </>
  );
}
