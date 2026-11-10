import {
  addDays,
  addMonths,
  addWeeks,
  addYears,
  differenceInCalendarDays,
  differenceInCalendarMonths,
  differenceInCalendarYears,
  endOfDay,
  format,
  parseISO,
} from 'date-fns';

// Simplified RFC 5545 RRULE subset (PRD Module 2.4): FREQ, INTERVAL, and
// an end condition (UNTIL date or COUNT). Occurrences keep the start's
// local wall-clock time. Monthly/yearly occurrences are always computed
// from the original start (start + k·interval) so they never drift; when
// a month lacks the day (e.g. the 31st) the occurrence falls on that
// month's last day.

export type RecurrenceFreq = 'none' | 'daily' | 'weekly' | 'monthly' | 'yearly';

export interface RecurrenceRule {
  freq: RecurrenceFreq;
  interval: number;
  /** Local calendar date "YYYY-MM-DD", inclusive. */
  until: string | null;
  /** Total occurrences including the first. */
  count: number | null;
}

export const NO_RECURRENCE: RecurrenceRule = { freq: 'none', interval: 1, until: null, count: null };

const MAX_OCCURRENCES = 1000;

function occurrenceAt(start: Date, rule: RecurrenceRule, k: number): Date {
  const n = k * Math.max(1, rule.interval);
  switch (rule.freq) {
    case 'daily':
      return addDays(start, n);
    case 'weekly':
      return addWeeks(start, n);
    case 'monthly':
      return addMonths(start, n);
    case 'yearly':
      return addYears(start, n);
    default:
      return start;
  }
}

/** A safe lower bound for the first occurrence index at or after `from`. */
function firstIndexNear(start: Date, rule: RecurrenceRule, from: Date): number {
  if (from <= start) return 0;
  const interval = Math.max(1, rule.interval);
  let units: number;
  switch (rule.freq) {
    case 'daily':
      units = differenceInCalendarDays(from, start);
      break;
    case 'weekly':
      units = Math.floor(differenceInCalendarDays(from, start) / 7);
      break;
    case 'monthly':
      units = differenceInCalendarMonths(from, start);
      break;
    case 'yearly':
      units = differenceInCalendarYears(from, start);
      break;
    default:
      return 0;
  }
  return Math.max(0, Math.floor(units / interval) - 1);
}

function untilBoundary(rule: RecurrenceRule): Date | null {
  return rule.until ? endOfDay(parseISO(rule.until)) : null;
}

function isWithinEnd(rule: RecurrenceRule, k: number, occurrence: Date, until: Date | null): boolean {
  if (rule.count !== null && k >= rule.count) return false;
  if (until && occurrence > until) return false;
  return true;
}

/**
 * Start times of every occurrence whose [start, start + duration] overlaps
 * [rangeStart, rangeEnd]. Only the visible range is ever materialized
 * (PRD 8.1: no pre-generated rows for future occurrences).
 */
export function expandOccurrences(
  start: Date,
  durationMs: number,
  rule: RecurrenceRule,
  rangeStart: Date,
  rangeEnd: Date,
): Date[] {
  const overlaps = (s: Date) => s <= rangeEnd && s.getTime() + durationMs >= rangeStart.getTime();
  if (rule.freq === 'none') return overlaps(start) ? [start] : [];

  const until = untilBoundary(rule);
  const results: Date[] = [];
  const from = new Date(rangeStart.getTime() - durationMs);
  for (let k = firstIndexNear(start, rule, from); results.length < MAX_OCCURRENCES; k++) {
    const occurrence = occurrenceAt(start, rule, k);
    if (occurrence > rangeEnd || !isWithinEnd(rule, k, occurrence, until)) break;
    if (overlaps(occurrence)) results.push(occurrence);
  }
  return results;
}

/** The first occurrence strictly after `after`, or null if the series has ended. */
export function nextOccurrenceAfter(start: Date, rule: RecurrenceRule, after: Date): Date | null {
  if (rule.freq === 'none') return start > after ? start : null;
  const until = untilBoundary(rule);
  for (let k = firstIndexNear(start, rule, after), guard = 0; guard < MAX_OCCURRENCES; k++, guard++) {
    const occurrence = occurrenceAt(start, rule, k);
    if (!isWithinEnd(rule, k, occurrence, until)) return null;
    if (occurrence > after) return occurrence;
  }
  return null;
}

export function describeRecurrence(rule: RecurrenceRule, start: Date): string {
  if (rule.freq === 'none') return 'Does not repeat';
  const every = rule.interval > 1 ? `Every ${rule.interval} ` : '';
  const base = {
    daily: rule.interval > 1 ? `${every}days` : 'Daily',
    weekly: `${rule.interval > 1 ? `${every}weeks` : 'Weekly'} on ${format(start, 'EEEE')}`,
    monthly: `${rule.interval > 1 ? `${every}months` : 'Monthly'} on day ${format(start, 'd')}`,
    yearly: `${rule.interval > 1 ? `${every}years` : 'Yearly'} on ${format(start, 'd MMMM')}`,
  }[rule.freq];
  if (rule.until) return `${base}, until ${format(parseISO(rule.until), 'd MMM yyyy')}`;
  if (rule.count !== null) return `${base}, ${rule.count} times`;
  return base;
}
