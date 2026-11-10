import { addDays, format, isSameDay, isSameYear, isValid, parseISO, subDays } from 'date-fns';

export function formatHeaderDate(date: Date = new Date()): string {
  return format(date, 'EEEE, d MMMM');
}

// Matches the greeting bands described in the PRD (Module 1.2):
// morning / afternoon / evening / night.
export function getGreeting(date: Date = new Date()): string {
  const hour = date.getHours();
  if (hour >= 5 && hour < 12) return 'Good morning';
  if (hour >= 12 && hour < 17) return 'Good afternoon';
  if (hour >= 17 && hour < 21) return 'Good evening';
  return 'Good night';
}

// "Today, 3:42 PM" / "Yesterday" / "7 Nov" / "7 Nov 2025", in device
// local time. Stored timestamps are UTC ISO strings.
export function formatRelativeUpdated(isoTimestamp: string, now: Date = new Date()): string {
  const date = parseISO(isoTimestamp);
  if (!isValid(date)) return '';
  if (isSameDay(date, now)) return `Today, ${format(date, 'h:mm a')}`;
  if (isSameDay(date, subDays(now, 1))) return 'Yesterday';
  return isSameYear(date, now) ? format(date, 'd MMM') : format(date, 'd MMM yyyy');
}

/** "Today, 3:00 PM" / "Tomorrow" / "Yesterday" / "Wed 12 Nov, 9:00 AM" (time optional). */
export function formatDue(date: Date, now: Date = new Date(), withTime = true): string {
  const time = withTime ? `, ${format(date, 'h:mm a')}` : '';
  if (isSameDay(date, now)) return `Today${time}`;
  if (isSameDay(date, addDays(now, 1))) return `Tomorrow${time}`;
  if (isSameDay(date, subDays(now, 1))) return `Yesterday${time}`;
  const day = isSameYear(date, now) ? format(date, 'EEE d MMM') : format(date, 'd MMM yyyy');
  return `${day}${time}`;
}
