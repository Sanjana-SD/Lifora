import type { EventOccurrence, EventRecord } from '@/types/event';
import { expandOccurrences } from './recurrence';

export function occurrenceKey(seriesId: number, originalStart: Date): string {
  return `${seriesId}@${originalStart.toISOString()}`;
}

function fromRecord(
  record: EventRecord,
  seriesId: number,
  originalStart: Date,
  start: Date,
  end: Date,
  isRecurring: boolean,
): EventOccurrence {
  return {
    key: occurrenceKey(seriesId, originalStart),
    seriesId,
    rowId: record.id,
    originalStart,
    title: record.title,
    description: record.description,
    start,
    end,
    location: record.location,
    categoryId: record.categoryId,
    priority: record.priority,
    notificationOffsetMinutes: record.notificationOffsetMinutes,
    isRecurring,
    isException: record.isException,
  };
}

/**
 * Concrete occurrences overlapping [rangeStart, rangeEnd], sorted by
 * start. An exception row replaces the series occurrence it targets
 * (or removes it, when cancelled) and appears at its own, possibly
 * moved, time.
 */
export function buildOccurrences(
  series: EventRecord[],
  exceptions: EventRecord[],
  rangeStart: Date,
  rangeEnd: Date,
): EventOccurrence[] {
  const replaced = new Set(
    exceptions
      .filter((e) => e.parentEventId !== null && e.originalStartAt !== null)
      .map((e) => occurrenceKey(e.parentEventId!, e.originalStartAt!)),
  );

  const result: EventOccurrence[] = [];
  for (const record of series) {
    const duration = record.endAt.getTime() - record.startAt.getTime();
    const isRecurring = record.recurrence.freq !== 'none';
    for (const start of expandOccurrences(record.startAt, duration, record.recurrence, rangeStart, rangeEnd)) {
      if (replaced.has(occurrenceKey(record.id, start))) continue;
      result.push(fromRecord(record, record.id, start, start, new Date(start.getTime() + duration), isRecurring));
    }
  }

  for (const exception of exceptions) {
    if (exception.isCancelled || exception.parentEventId === null || exception.originalStartAt === null) continue;
    if (exception.startAt > rangeEnd || exception.endAt < rangeStart) continue;
    result.push(
      fromRecord(exception, exception.parentEventId, exception.originalStartAt, exception.startAt, exception.endAt, true),
    );
  }

  return result.sort((a, b) => a.start.getTime() - b.start.getTime() || a.title.localeCompare(b.title));
}
