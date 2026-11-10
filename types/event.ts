import type { Priority } from '@/constants/priorities';
import type { RecurrenceRule } from '@/utils/recurrence';

/** A stored event row: a one-off event, a recurring series, or an exception. */
export interface EventRecord {
  id: number;
  title: string;
  description: string;
  startAt: Date;
  endAt: Date;
  location: string;
  categoryId: number | null;
  priority: Priority;
  recurrence: RecurrenceRule;
  notificationOffsetMinutes: number | null;
  parentEventId: number | null;
  originalStartAt: Date | null;
  isException: boolean;
  isCancelled: boolean;
}

/** One concrete occurrence on the calendar. */
export interface EventOccurrence {
  /** Stable across reloads: "<seriesId>@<original start ISO>". */
  key: string;
  /** The series (or one-off event) this occurrence belongs to. */
  seriesId: number;
  /** Row holding this occurrence's data: the series, or an exception row. */
  rowId: number;
  /** The start this occurrence had in the series, used to target exceptions. */
  originalStart: Date;
  title: string;
  description: string;
  start: Date;
  end: Date;
  location: string;
  categoryId: number | null;
  priority: Priority;
  notificationOffsetMinutes: number | null;
  isRecurring: boolean;
  isException: boolean;
}

export interface EventDraft {
  title: string;
  description: string;
  startAt: Date;
  endAt: Date;
  location: string;
  categoryId: number | null;
  priority: Priority;
  recurrence: RecurrenceRule;
  notificationOffsetMinutes: number | null;
}
