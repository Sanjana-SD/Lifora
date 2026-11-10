import type { Priority } from '@/constants/priorities';
import type { RecurrenceRule } from '@/utils/recurrence';

export interface Reminder {
  id: number;
  title: string;
  description: string;
  /** The current (next unfinished) occurrence. */
  dueAt: Date;
  priority: Priority;
  categoryId: number | null;
  recurrence: RecurrenceRule;
  /** First occurrence of the series; recurrence is computed from it. */
  seriesStartAt: Date;
  isCompleted: boolean;
  completedAt: Date | null;
  snoozedUntil: Date | null;
}

export interface ReminderDraft {
  title: string;
  description: string;
  dueAt: Date;
  priority: Priority;
  categoryId: number | null;
  recurrence: RecurrenceRule;
}
