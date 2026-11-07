import { format } from 'date-fns';

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
