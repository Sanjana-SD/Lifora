import { formatHeaderDate, formatRelativeUpdated, getGreeting } from '@/utils/dateUtils';

function atHour(hour: number): Date {
  const d = new Date(2026, 10, 7);
  d.setHours(hour, 0, 0, 0);
  return d;
}

describe('getGreeting', () => {
  it('returns Good morning for early hours', () => {
    expect(getGreeting(atHour(5))).toBe('Good morning');
    expect(getGreeting(atHour(11))).toBe('Good morning');
  });

  it('returns Good afternoon for midday hours', () => {
    expect(getGreeting(atHour(12))).toBe('Good afternoon');
    expect(getGreeting(atHour(16))).toBe('Good afternoon');
  });

  it('returns Good evening for evening hours', () => {
    expect(getGreeting(atHour(17))).toBe('Good evening');
    expect(getGreeting(atHour(20))).toBe('Good evening');
  });

  it('returns Good night for late/overnight hours', () => {
    expect(getGreeting(atHour(21))).toBe('Good night');
    expect(getGreeting(atHour(4))).toBe('Good night');
    expect(getGreeting(atHour(0))).toBe('Good night');
  });
});

describe('formatHeaderDate', () => {
  it('formats as weekday, day month', () => {
    const date = new Date(2026, 10, 7); // Saturday, 7 November 2026
    expect(formatHeaderDate(date)).toBe('Saturday, 7 November');
  });
});

describe('formatRelativeUpdated', () => {
  const now = new Date(2026, 10, 8, 18, 0, 0);
  const iso = (d: Date) => d.toISOString();

  it('shows the time for edits made today', () => {
    expect(formatRelativeUpdated(iso(new Date(2026, 10, 8, 15, 42)), now)).toBe('Today, 3:42 PM');
  });

  it('shows Yesterday for the previous calendar day', () => {
    expect(formatRelativeUpdated(iso(new Date(2026, 10, 7, 23, 59)), now)).toBe('Yesterday');
  });

  it('shows day and month earlier this year, and the year otherwise', () => {
    expect(formatRelativeUpdated(iso(new Date(2026, 2, 3)), now)).toBe('3 Mar');
    expect(formatRelativeUpdated(iso(new Date(2025, 2, 3)), now)).toBe('3 Mar 2025');
  });

  it('returns an empty string for an unparseable timestamp', () => {
    expect(formatRelativeUpdated('not a date', now)).toBe('');
  });
});
