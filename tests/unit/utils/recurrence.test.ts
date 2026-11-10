import {
  NO_RECURRENCE,
  describeRecurrence,
  expandOccurrences,
  nextOccurrenceAfter,
  type RecurrenceRule,
} from '@/utils/recurrence';

const rule = (r: Partial<RecurrenceRule>): RecurrenceRule => ({ ...NO_RECURRENCE, ...r });
const HOUR = 60 * 60 * 1000;
const local = (y: number, m: number, d: number, h = 9, min = 0) => new Date(y, m - 1, d, h, min);
const iso = (dates: Date[]) => dates.map((d) => `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()} ${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`);

describe('expandOccurrences', () => {
  it('returns a one-off event only when it overlaps the range', () => {
    const start = local(2026, 11, 12, 10);
    expect(expandOccurrences(start, HOUR, NO_RECURRENCE, local(2026, 11, 1, 0), local(2026, 11, 30, 23))).toEqual([start]);
    expect(expandOccurrences(start, HOUR, NO_RECURRENCE, local(2026, 12, 1, 0), local(2026, 12, 31, 23))).toEqual([]);
  });

  it('includes a multi-day event that started before the range', () => {
    const start = local(2026, 10, 30, 9);
    const threeDays = 72 * HOUR;
    expect(expandOccurrences(start, threeDays, NO_RECURRENCE, local(2026, 11, 1, 0), local(2026, 11, 30, 23))).toHaveLength(1);
  });

  it('expands daily, keeping the wall-clock time', () => {
    const out = expandOccurrences(local(2026, 11, 1, 7, 30), HOUR, rule({ freq: 'daily' }), local(2026, 11, 5, 0), local(2026, 11, 7, 23, 59));
    expect(iso(out)).toEqual(['2026-11-5 7:30', '2026-11-6 7:30', '2026-11-7 7:30']);
  });

  it('expands weekly on the same weekday, with an interval', () => {
    const start = local(2026, 11, 3, 18); // Tuesday
    const out = expandOccurrences(start, HOUR, rule({ freq: 'weekly', interval: 2 }), local(2026, 11, 1, 0), local(2026, 12, 31, 23));
    expect(iso(out)).toEqual(['2026-11-3 18:00', '2026-11-17 18:00', '2026-12-1 18:00', '2026-12-15 18:00', '2026-12-29 18:00']);
    expect(out.every((d) => d.getDay() === 2)).toBe(true);
  });

  it('clamps monthly occurrences to the month end without drifting', () => {
    const start = local(2026, 1, 31);
    const out = expandOccurrences(start, HOUR, rule({ freq: 'monthly' }), local(2026, 1, 1, 0), local(2026, 5, 31, 23));
    expect(iso(out)).toEqual(['2026-1-31 9:00', '2026-2-28 9:00', '2026-3-31 9:00', '2026-4-30 9:00', '2026-5-31 9:00']);
  });

  it('handles yearly birthdays, including 29 February', () => {
    const out = expandOccurrences(local(2024, 2, 29), HOUR, rule({ freq: 'yearly' }), local(2025, 1, 1, 0), local(2028, 12, 31, 23));
    expect(iso(out)).toEqual(['2025-2-28 9:00', '2026-2-28 9:00', '2027-2-28 9:00', '2028-2-29 9:00']);
  });

  it('stops at an inclusive UNTIL date', () => {
    const out = expandOccurrences(local(2026, 11, 1), HOUR, rule({ freq: 'daily', until: '2026-11-03' }), local(2026, 11, 1, 0), local(2026, 11, 30, 23));
    expect(out).toHaveLength(3);
  });

  it('stops after COUNT occurrences, counted from the series start', () => {
    const r = rule({ freq: 'daily', count: 5 });
    expect(expandOccurrences(local(2026, 11, 1), HOUR, r, local(2026, 11, 4, 0), local(2026, 11, 30, 23))).toHaveLength(2);
  });

  it('starts efficiently from far in the future without materializing the past', () => {
    const out = expandOccurrences(local(2000, 1, 1), HOUR, rule({ freq: 'daily' }), local(2026, 11, 1, 0), local(2026, 11, 3, 23, 59));
    expect(iso(out)).toEqual(['2026-11-1 9:00', '2026-11-2 9:00', '2026-11-3 9:00']);
  });

  it('never returns occurrences before the series start', () => {
    const out = expandOccurrences(local(2026, 11, 15), HOUR, rule({ freq: 'daily' }), local(2026, 11, 1, 0), local(2026, 11, 16, 23));
    expect(iso(out)).toEqual(['2026-11-15 9:00', '2026-11-16 9:00']);
  });
});

describe('nextOccurrenceAfter', () => {
  it('finds the next occurrence strictly after a moment', () => {
    const start = local(2026, 11, 1, 9);
    const r = rule({ freq: 'daily' });
    expect(nextOccurrenceAfter(start, r, local(2026, 11, 10, 9))).toEqual(local(2026, 11, 11, 9));
    expect(nextOccurrenceAfter(start, r, local(2026, 11, 10, 8))).toEqual(local(2026, 11, 10, 9));
  });

  it('returns null once the series has ended', () => {
    const start = local(2026, 11, 1);
    expect(nextOccurrenceAfter(start, rule({ freq: 'weekly', count: 2 }), local(2026, 11, 8, 10))).toBeNull();
    expect(nextOccurrenceAfter(start, rule({ freq: 'daily', until: '2026-11-02' }), local(2026, 11, 2, 10))).toBeNull();
    expect(nextOccurrenceAfter(start, NO_RECURRENCE, local(2026, 11, 1, 10))).toBeNull();
  });
});

describe('describeRecurrence', () => {
  const tue = local(2026, 11, 3);
  it('describes rules in plain language', () => {
    expect(describeRecurrence(NO_RECURRENCE, tue)).toBe('Does not repeat');
    expect(describeRecurrence(rule({ freq: 'weekly' }), tue)).toBe('Weekly on Tuesday');
    expect(describeRecurrence(rule({ freq: 'monthly', until: '2027-01-31' }), tue)).toBe('Monthly on day 3, until 31 Jan 2027');
    expect(describeRecurrence(rule({ freq: 'daily', count: 10 }), tue)).toBe('Daily, 10 times');
    expect(describeRecurrence(rule({ freq: 'yearly' }), tue)).toBe('Yearly on 3 November');
  });
});
