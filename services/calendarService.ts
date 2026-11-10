import { addDays, endOfDay, parseISO, startOfDay } from 'date-fns';

import * as eventRepository from '@/database/repositories/eventRepository';
import type { EventDraft, EventOccurrence, EventRecord } from '@/types/event';
import { buildOccurrences } from '@/utils/eventOccurrences';
import { requireText, ValidationError } from '@/utils/validationUtils';
import { syncNotifications } from './notificationService';

export const EVENT_TITLE_MAX_LENGTH = 120;
export const MAX_RECURRENCE_COUNT = 999;
export const UPCOMING_DAYS = 30;

export function validateEventDraft(draft: EventDraft): EventDraft {
  const title = requireText(draft.title, 'Title', EVENT_TITLE_MAX_LENGTH);
  if (draft.endAt < draft.startAt) throw new ValidationError('The end must be after the start.');
  const { recurrence } = draft;
  if (recurrence.freq !== 'none') {
    if (recurrence.until && endOfDay(parseISO(recurrence.until)) < draft.startAt) {
      throw new ValidationError('The repeat end date must be after the event starts.');
    }
    if (recurrence.count !== null && (recurrence.count < 1 || recurrence.count > MAX_RECURRENCE_COUNT)) {
      throw new ValidationError(`Repeat between 1 and ${MAX_RECURRENCE_COUNT} times.`);
    }
  }
  return {
    ...draft,
    title,
    description: draft.description.trim(),
    location: draft.location.trim(),
    recurrence: draft.recurrence.freq === 'none' ? { freq: 'none', interval: 1, until: null, count: null } : draft.recurrence,
  };
}

export async function listOccurrences(rangeStart: Date, rangeEnd: Date): Promise<EventOccurrence[]> {
  const series = await eventRepository.listSeriesForRange(rangeStart, rangeEnd);
  const exceptions = await eventRepository.listExceptions(
    series.map((s) => s.id),
    rangeStart,
    rangeEnd,
  );
  return buildOccurrences(series, exceptions, rangeStart, rangeEnd);
}

/** Occurrences from the start of today through the next 30 days. */
export function listUpcoming(now: Date = new Date(), days = UPCOMING_DAYS): Promise<EventOccurrence[]> {
  return listOccurrences(startOfDay(now), endOfDay(addDays(now, days)));
}

/** One occurrence, identified by its series and original start. */
export async function getOccurrence(seriesId: number, originalStart: Date): Promise<EventOccurrence | null> {
  const series = await eventRepository.getEvent(seriesId);
  if (!series || series.isException) return null;
  const exception = await eventRepository.getException(seriesId, originalStart);
  if (exception) {
    if (exception.isCancelled) return null;
    return buildOccurrences([], [exception], exception.startAt, exception.endAt)[0] ?? null;
  }
  const duration = series.endAt.getTime() - series.startAt.getTime();
  const end = new Date(originalStart.getTime() + duration);
  const match = buildOccurrences([series], [], originalStart, end).find(
    (o) => o.originalStart.getTime() === originalStart.getTime(),
  );
  return match ?? null;
}

export function getSeries(seriesId: number): Promise<EventRecord | null> {
  return eventRepository.getEvent(seriesId);
}

export async function createEvent(draft: EventDraft): Promise<number> {
  const id = await eventRepository.insertEvent(validateEventDraft(draft));
  void syncNotifications();
  return id;
}

const sameTiming = (a: EventRecord, b: EventDraft) =>
  a.startAt.getTime() === b.startAt.getTime() &&
  a.endAt.getTime() === b.endAt.getTime() &&
  a.recurrence.freq === b.recurrence.freq &&
  a.recurrence.interval === b.recurrence.interval &&
  a.recurrence.until === b.recurrence.until &&
  a.recurrence.count === b.recurrence.count;

/**
 * Edits a one-off event, or every occurrence of a series. Changing a
 * series' timing or repeat rule drops its single-occurrence edits, since
 * they target occurrences that may no longer exist.
 */
export async function updateSeries(seriesId: number, draft: EventDraft): Promise<void> {
  const existing = await eventRepository.getEvent(seriesId);
  if (!existing || existing.isException) throw new ValidationError('This event no longer exists.');
  const clean = validateEventDraft(draft);
  if (!sameTiming(existing, clean)) await eventRepository.deleteExceptions(seriesId);
  await eventRepository.updateEvent(seriesId, clean);
  void syncNotifications();
}

/** Edits just this occurrence ("This event only"). */
export async function updateOccurrence(occurrence: EventOccurrence, draft: EventDraft): Promise<void> {
  const clean = validateEventDraft({ ...draft, recurrence: { freq: 'none', interval: 1, until: null, count: null } });
  if (!occurrence.isRecurring) {
    await eventRepository.updateEvent(occurrence.seriesId, clean);
  } else {
    await eventRepository.upsertException(occurrence.seriesId, occurrence.originalStart, clean, false);
  }
  void syncNotifications();
}

/** Deletes just this occurrence, or the whole event when it doesn't repeat. */
export async function deleteOccurrence(occurrence: EventOccurrence): Promise<void> {
  if (!occurrence.isRecurring) {
    await eventRepository.deleteEvent(occurrence.seriesId);
  } else {
    const draft: EventDraft = {
      title: occurrence.title,
      description: occurrence.description,
      startAt: occurrence.start,
      endAt: occurrence.end,
      location: occurrence.location,
      categoryId: occurrence.categoryId,
      priority: occurrence.priority,
      recurrence: { freq: 'none', interval: 1, until: null, count: null },
      notificationOffsetMinutes: occurrence.notificationOffsetMinutes,
    };
    await eventRepository.upsertException(occurrence.seriesId, occurrence.originalStart, draft, true);
  }
  void syncNotifications();
}

export async function deleteSeries(seriesId: number): Promise<void> {
  await eventRepository.deleteEvent(seriesId);
  void syncNotifications();
}

export function searchEvents(term: string): Promise<EventRecord[]> {
  if (!term.trim()) return Promise.resolve([]);
  return eventRepository.searchEvents(term);
}
