import { addDays, endOfMonth, endOfWeek, format, startOfMonth, startOfWeek } from 'date-fns';

/** "2026-11-09" in local time; the key used to group things by calendar day. */
export function dayKey(date: Date): string {
  return format(date, 'yyyy-MM-dd');
}

/** Weeks (Sunday first) covering the whole month, padded with adjacent-month days. */
export function buildMonthGrid(month: Date): Date[][] {
  const first = startOfWeek(startOfMonth(month));
  const last = endOfWeek(endOfMonth(month));
  const weeks: Date[][] = [];
  for (let day = first; day <= last; day = addDays(day, 7)) {
    weeks.push(Array.from({ length: 7 }, (_, i) => addDays(day, i)));
  }
  return weeks;
}

/** Visible range of a month grid, for fetching occurrences. */
export function monthGridRange(month: Date): { start: Date; end: Date } {
  const weeks = buildMonthGrid(month);
  const lastWeek = weeks[weeks.length - 1];
  const end = new Date(lastWeek[6]);
  end.setHours(23, 59, 59, 999);
  return { start: weeks[0][0], end };
}
