import { Stack, router, useLocalSearchParams } from 'expo-router';
import { CalendarX } from 'lucide-react-native';
import React, { useCallback, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { EventForm } from '@/components/calendar/EventForm';
import { EmptyState } from '@/components/common/EmptyState';
import { ScopeDialog, type EditScope } from '@/components/common/ScopeDialog';
import { useOccurrence } from '@/hooks/useCalendar';
import { useFocusedQuery } from '@/hooks/useFocusedQuery';
import { useTheme } from '@/hooks/useTheme';
import * as calendar from '@/services/calendarService';
import type { EventDraft, EventOccurrence, EventRecord } from '@/types/event';
import { ValidationError } from '@/utils/validationUtils';

const sameRule = (a: EventDraft['recurrence'], b: EventDraft['recurrence']) =>
  a.freq === b.freq && a.interval === b.interval && a.until === b.until && a.count === b.count;

/**
 * Applying an edit made on one occurrence to the whole series: the
 * series keeps its own first date and moves by however much this
 * occurrence's time was moved.
 */
function seriesDraftFrom(draft: EventDraft, occurrence: EventOccurrence, series: EventRecord): EventDraft {
  const shift = draft.startAt.getTime() - occurrence.start.getTime();
  const startAt = new Date(series.startAt.getTime() + shift);
  return { ...draft, startAt, endAt: new Date(startAt.getTime() + (draft.endAt.getTime() - draft.startAt.getTime())) };
}

export default function EditEventScreen() {
  const { colors } = useTheme();
  const params = useLocalSearchParams<{ seriesId?: string; start?: string }>();
  const seriesId = Number(params.seriesId);
  const { occurrence, loading } = useOccurrence(seriesId, params.start ? new Date(params.start) : null);
  const { data: series } = useFocusedQuery(useCallback(() => calendar.getSeries(seriesId), [seriesId]));
  const [pending, setPending] = useState<{ draft: EventDraft; resolve: () => void; reject: (e: unknown) => void } | null>(null);

  if (!occurrence || !series) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <Stack.Screen options={{ title: 'Edit Event' }} />
        {loading ? (
          <ActivityIndicator color={colors.accent} />
        ) : (
          <EmptyState icon={CalendarX} title="Event not found" description="It may have been deleted." />
        )}
      </View>
    );
  }

  const initial: EventDraft = {
    title: occurrence.title,
    description: occurrence.description,
    startAt: occurrence.start,
    endAt: occurrence.end,
    location: occurrence.location,
    categoryId: occurrence.categoryId,
    priority: occurrence.priority,
    recurrence: series.recurrence,
    notificationOffsetMinutes: occurrence.notificationOffsetMinutes,
  };

  const apply = async (draft: EventDraft, scope: EditScope) => {
    if (scope === 'this') await calendar.updateOccurrence(occurrence, draft);
    else await calendar.updateSeries(seriesId, seriesDraftFrom(draft, occurrence, series));
    router.back();
  };

  const submit = async (draft: EventDraft) => {
    // A changed repeat rule can only apply to the whole series, and a
    // one-off event has nothing to choose between.
    if (!occurrence.isRecurring) return apply(draft, 'all');
    if (!sameRule(draft.recurrence, series.recurrence)) return apply(draft, 'all');
    // Otherwise ask; the form's save button waits for the answer.
    return new Promise<void>((resolve, reject) => setPending({ draft, resolve, reject }));
  };

  const choose = async (scope: EditScope) => {
    if (!pending) return;
    const { draft, resolve, reject } = pending;
    setPending(null);
    try {
      await apply(draft, scope);
      resolve();
    } catch (e) {
      reject(e instanceof ValidationError ? e : new ValidationError("Couldn't save the event. Please try again."));
    }
  };

  return (
    <>
      <Stack.Screen options={{ title: 'Edit Event' }} />
      <EventForm initial={initial} submitLabel="Save changes" onSubmit={submit} />
      <ScopeDialog
        visible={pending !== null}
        title="Save changes to"
        onChoose={choose}
        onCancel={() => {
          pending?.resolve();
          setPending(null);
        }}
      />
    </>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: 'center',
  },
});
