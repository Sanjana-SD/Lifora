import { addDays, addHours, addMinutes, setHours, setMinutes, startOfDay } from 'date-fns';

import * as reminderRepository from '@/database/repositories/reminderRepository';
import type { Reminder, ReminderDraft } from '@/types/reminder';
import { nextOccurrenceAfter } from '@/utils/recurrence';
import { requireText, ValidationError } from '@/utils/validationUtils';
import { syncNotifications } from './notificationService';

export const REMINDER_TITLE_MAX_LENGTH = 120;

export type SnoozeOption = '10m' | '1h' | 'tomorrow';

export const SNOOZE_LABELS: Record<SnoozeOption, string> = {
  '10m': '10 minutes',
  '1h': '1 hour',
  tomorrow: 'Tomorrow, 9:00 AM',
};

export function snoozeUntil(option: SnoozeOption, now: Date = new Date()): Date {
  if (option === '10m') return addMinutes(now, 10);
  if (option === '1h') return addHours(now, 1);
  return setMinutes(setHours(startOfDay(addDays(now, 1)), 9), 0);
}

export function isOverdue(reminder: Pick<Reminder, 'isCompleted' | 'dueAt'>, now: Date = new Date()): boolean {
  return !reminder.isCompleted && reminder.dueAt < now;
}

function validate(draft: ReminderDraft): ReminderDraft {
  return {
    ...draft,
    title: requireText(draft.title, 'Title', REMINDER_TITLE_MAX_LENGTH),
    description: draft.description.trim(),
    recurrence: { ...draft.recurrence, count: null },
  };
}

export function listReminders(): Promise<Reminder[]> {
  return reminderRepository.listReminders();
}

export function listPendingReminders(): Promise<Reminder[]> {
  return reminderRepository.listPendingReminders();
}

export function getReminder(id: number): Promise<Reminder | null> {
  return reminderRepository.getReminder(id);
}

export async function createReminder(draft: ReminderDraft, now: Date = new Date()): Promise<number> {
  const clean = validate(draft);
  if (clean.dueAt <= now) throw new ValidationError('Choose a time in the future.');
  const id = await reminderRepository.insertReminder(clean);
  void syncNotifications();
  return id;
}

/** A changed time must be in the future; other edits to an overdue reminder are fine (PRD 3.A). */
export async function updateReminder(id: number, draft: ReminderDraft, now: Date = new Date()): Promise<void> {
  const existing = await reminderRepository.getReminder(id);
  if (!existing) throw new ValidationError('This reminder no longer exists.');
  const clean = validate(draft);
  if (clean.dueAt.getTime() !== existing.dueAt.getTime() && clean.dueAt <= now) {
    throw new ValidationError('Choose a time in the future.');
  }
  await reminderRepository.updateReminder(id, clean);
  void syncNotifications();
}

/**
 * Completes the current occurrence. A repeating reminder rolls forward to
 * its next occurrence after now (skipping any it missed); one that has
 * reached its end date, or doesn't repeat, is marked done.
 */
export async function completeReminder(
  id: number,
  now: Date = new Date(),
): Promise<{ next: Date | null }> {
  const reminder = await reminderRepository.getReminder(id);
  if (!reminder) throw new ValidationError('This reminder no longer exists.');
  const after = reminder.dueAt > now ? reminder.dueAt : now;
  const next =
    reminder.recurrence.freq === 'none' ? null : nextOccurrenceAfter(reminder.seriesStartAt, reminder.recurrence, after);
  if (next) {
    await reminderRepository.advanceReminder(id, next);
  } else {
    await reminderRepository.setReminderCompleted(id, true);
  }
  void syncNotifications();
  return { next };
}

export async function reopenReminder(id: number): Promise<void> {
  await reminderRepository.setReminderCompleted(id, false);
  void syncNotifications();
}

/** Snooze delays an alert that has come due; before then there's nothing to delay. */
export function canSnooze(reminder: Pick<Reminder, 'isCompleted' | 'dueAt'>, now: Date = new Date()): boolean {
  return !reminder.isCompleted && reminder.dueAt <= now;
}

/** Re-alerts later without changing the due time shown (PRD 3.A). */
export async function snoozeReminder(id: number, option: SnoozeOption, now: Date = new Date()): Promise<Date> {
  const reminder = await reminderRepository.getReminder(id);
  if (!reminder || !canSnooze(reminder, now)) {
    // Snoozing from "now" before the due time would make it alert early.
    throw new ValidationError("This reminder isn't due yet, so there's nothing to snooze.");
  }
  const until = snoozeUntil(option, now);
  await reminderRepository.setReminderSnooze(id, until);
  void syncNotifications();
  return until;
}

export async function deleteReminder(id: number): Promise<void> {
  await reminderRepository.deleteReminder(id);
  void syncNotifications();
}
