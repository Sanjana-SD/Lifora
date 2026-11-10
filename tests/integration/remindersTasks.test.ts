import type { SQLiteDatabase } from 'expo-sqlite';

import { createTestDatabase } from '../helpers/testDatabase';

let mockDb: SQLiteDatabase;
jest.mock('@/database/database', () => ({ getDatabase: () => Promise.resolve(mockDb) }));
jest.mock('@/services/notificationService', () => ({ syncNotifications: jest.fn() }));

import * as reminders from '@/services/reminderService';
import * as tasks from '@/services/taskService';
import type { ReminderDraft } from '@/types/reminder';
import type { TaskDraft } from '@/types/task';
import { ValidationError } from '@/utils/validationUtils';

const NOW = new Date(2026, 10, 10, 12, 0);
const at = (d: number, h = 9) => new Date(2026, 10, d, h, 0);

const reminder = (over: Partial<ReminderDraft> = {}): ReminderDraft => ({
  title: 'Pay rent',
  description: '',
  dueAt: at(11),
  priority: 'high',
  categoryId: null,
  recurrence: { freq: 'none', interval: 1, until: null, count: null },
  ...over,
});
const task = (over: Partial<TaskDraft> = {}): TaskDraft => ({
  title: 'Submit assignment',
  description: '',
  deadline: null,
  deadlineHasTime: false,
  notify: false,
  priority: 'medium',
  categoryId: null,
  ...over,
});

beforeEach(async () => {
  mockDb = await createTestDatabase();
});

describe('reminderService (integration)', () => {
  it('rejects a reminder in the past (PRD 3.2)', async () => {
    await expect(reminders.createReminder(reminder({ dueAt: at(9) }), NOW)).rejects.toThrow('Choose a time in the future.');
  });

  it('completes a one-off reminder', async () => {
    const id = await reminders.createReminder(reminder(), NOW);
    expect((await reminders.completeReminder(id, NOW)).next).toBeNull();
    expect((await reminders.getReminder(id))!.isCompleted).toBe(true);
    await reminders.reopenReminder(id);
    expect((await reminders.getReminder(id))!.isCompleted).toBe(false);
  });

  it('rolls a repeating reminder forward instead of finishing it', async () => {
    const id = await reminders.createReminder(reminder({ recurrence: { freq: 'daily', interval: 1, until: null, count: null } }), NOW);
    const { next } = await reminders.completeReminder(id, NOW);
    expect(next).toEqual(at(12));
    const r = (await reminders.getReminder(id))!;
    expect(r.isCompleted).toBe(false);
    expect(r.dueAt).toEqual(at(12));
  });

  it('skips missed occurrences when completing an overdue repeating reminder', async () => {
    const id = await reminders.createReminder(reminder({ dueAt: at(11), recurrence: { freq: 'daily', interval: 1, until: null, count: null } }), NOW);
    const { next } = await reminders.completeReminder(id, at(14, 15));
    expect(next).toEqual(at(15));
  });

  it('finishes a repeating reminder at its end date', async () => {
    const id = await reminders.createReminder(reminder({ recurrence: { freq: 'daily', interval: 1, until: '2026-11-11', count: null } }), NOW);
    expect((await reminders.completeReminder(id, NOW)).next).toBeNull();
    expect((await reminders.getReminder(id))!.isCompleted).toBe(true);
  });

  it('snoozes without changing the due time shown', async () => {
    const id = await reminders.createReminder(reminder(), NOW);
    const until = await reminders.snoozeReminder(id, '1h', at(11, 9));
    const r = (await reminders.getReminder(id))!;
    expect(r.dueAt).toEqual(at(11));
    expect(r.snoozedUntil).toEqual(until);
    expect(until).toEqual(at(11, 10));
  });

  it('refuses to snooze a reminder that is not due yet (it would alert early)', async () => {
    const id = await reminders.createReminder(reminder({ dueAt: at(11, 13) }), NOW);
    await expect(reminders.snoozeReminder(id, '10m', NOW)).rejects.toThrow("isn't due yet");
    expect((await reminders.getReminder(id))!.snoozedUntil).toBeNull();
    expect(reminders.canSnooze({ isCompleted: false, dueAt: at(10, 9) }, NOW)).toBe(true);
    expect(reminders.canSnooze({ isCompleted: true, dueAt: at(10, 9) }, NOW)).toBe(false);
  });

  it('allows editing an overdue reminder without moving it, but not moving it into the past', async () => {
    const id = await reminders.createReminder(reminder(), NOW);
    const later = at(12);
    await reminders.updateReminder(id, reminder({ title: 'Pay rent today' }), later);
    expect((await reminders.getReminder(id))!.title).toBe('Pay rent today');
    await expect(reminders.updateReminder(id, reminder({ dueAt: at(10) }), later)).rejects.toBeInstanceOf(ValidationError);
  });

  it('flags overdue reminders', () => {
    expect(reminders.isOverdue({ isCompleted: false, dueAt: at(9) }, NOW)).toBe(true);
    expect(reminders.isOverdue({ isCompleted: true, dueAt: at(9) }, NOW)).toBe(false);
  });
});

describe('taskService (integration)', () => {
  it('stores a date-only deadline as the end of that day', async () => {
    const id = await tasks.createTask(task({ deadline: at(12, 0) }));
    const t = (await tasks.getTask(id))!;
    expect(t.deadline!.getHours()).toBe(23);
    expect(t.deadlineHasTime).toBe(false);
  });

  it('never keeps a notification on a task without a deadline', async () => {
    const id = await tasks.createTask(task({ notify: true }));
    expect((await tasks.getTask(id))!.notify).toBe(false);
  });

  it('completes and reopens tasks', async () => {
    const id = await tasks.createTask(task());
    await tasks.setTaskCompleted(id, true);
    const done = (await tasks.getTask(id))!;
    expect(done.isCompleted).toBe(true);
    expect(done.completedAt).not.toBeNull();
    await tasks.setTaskCompleted(id, false);
    expect((await tasks.getTask(id))!.completedAt).toBeNull();
  });

  it('validates the title', async () => {
    await expect(tasks.createTask(task({ title: '' }))).rejects.toBeInstanceOf(ValidationError);
  });
});
