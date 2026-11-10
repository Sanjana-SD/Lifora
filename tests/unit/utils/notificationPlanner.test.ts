import type { EventOccurrence } from '@/types/event';
import type { Reminder } from '@/types/reminder';
import type { Task } from '@/types/task';
import {
  MAX_SCHEDULED,
  diffSchedule,
  planNotifications,
  taskAlertTime,
  type PlannedNotification,
} from '@/utils/notificationPlanner';

const NOW = new Date(2026, 10, 10, 12, 0);
const at = (d: number, h = 9, m = 0) => new Date(2026, 10, d, h, m);
const NONE = { freq: 'none' as const, interval: 1, until: null, count: null };

const occurrence = (over: Partial<EventOccurrence> = {}): EventOccurrence => ({
  key: `1@${at(11, 15).toISOString()}`,
  seriesId: 1,
  rowId: 1,
  originalStart: at(11, 15),
  title: 'Team sync',
  description: '',
  start: at(11, 15),
  end: at(11, 16),
  location: 'Room 4',
  categoryId: null,
  priority: 'medium',
  notificationOffsetMinutes: 10,
  isRecurring: false,
  isException: false,
  ...over,
});
const reminder = (over: Partial<Reminder> = {}): Reminder => ({
  id: 5,
  title: 'Pay rent',
  description: '',
  dueAt: at(11),
  priority: 'high',
  categoryId: null,
  recurrence: NONE,
  seriesStartAt: at(11),
  isCompleted: false,
  completedAt: null,
  snoozedUntil: null,
  ...over,
});
const task = (over: Partial<Task> = {}): Task => ({
  id: 9,
  title: 'Submit report',
  description: '',
  deadline: at(12, 17),
  deadlineHasTime: true,
  notify: true,
  priority: 'medium',
  categoryId: null,
  isCompleted: false,
  completedAt: null,
  ...over,
});

const plan = (input: Partial<Parameters<typeof planNotifications>[0]>) =>
  planNotifications({ now: NOW, occurrences: [], reminders: [], tasks: [], ...input });

describe('planNotifications', () => {
  it('fires events at start minus their offset, with time and location', () => {
    const [p] = plan({ occurrences: [occurrence()] });
    expect(p.fireAt).toEqual(at(11, 14, 50));
    expect(p.channel).toBe('events');
    expect(p.body).toBe('Wed 11 Nov, 3:00 PM · Room 4');
    expect(p.route).toContain('/calendar/event-details?seriesId=1');
  });

  it('skips events without a notification, or whose alert time has passed', () => {
    expect(plan({ occurrences: [occurrence({ notificationOffsetMinutes: null })] })).toEqual([]);
    expect(plan({ occurrences: [occurrence({ start: at(10, 12, 5) })] })).toEqual([]);
  });

  it('uses the snooze time for snoozed reminders and ignores completed ones', () => {
    expect(plan({ reminders: [reminder({ snoozedUntil: at(11, 10) })] })[0].fireAt).toEqual(at(11, 10));
    expect(plan({ reminders: [reminder({ isCompleted: true })] })).toEqual([]);
  });

  it('alerts date-only tasks at 9:00 AM on the day, and only when asked', () => {
    expect(taskAlertTime({ deadline: at(12, 23), deadlineHasTime: false })).toEqual(at(12, 9));
    expect(plan({ tasks: [task({ notify: false })] })).toEqual([]);
    expect(plan({ tasks: [task({ deadline: null })] })).toEqual([]);
  });

  it('gives each item a stable id that changes when its time changes', () => {
    const a = plan({ reminders: [reminder()] })[0].id;
    expect(plan({ reminders: [reminder()] })[0].id).toBe(a);
    expect(plan({ reminders: [reminder({ snoozedUntil: at(11, 10) })] })[0].id).not.toBe(a);
  });

  it(`keeps only the soonest ${MAX_SCHEDULED}, in time order`, () => {
    const many = Array.from({ length: 80 }, (_, i) => reminder({ id: i, dueAt: new Date(at(11).getTime() + i * 60_000) }));
    const plans = plan({ reminders: [...many].reverse() });
    expect(plans).toHaveLength(MAX_SCHEDULED);
    expect(plans[0].fireAt).toEqual(at(11));
  });
});

describe('diffSchedule', () => {
  const p = (id: string) => ({ id }) as PlannedNotification;

  it('cancels stale ids, schedules new ones, and leaves unchanged ones alone', () => {
    const result = diffSchedule(['lifora:a', 'lifora:b'], [p('lifora:b'), p('lifora:c')]);
    expect(result.toCancel).toEqual(['lifora:a']);
    expect(result.toSchedule.map((x) => x.id)).toEqual(['lifora:c']);
  });

  it("never touches notifications it didn't create", () => {
    expect(diffSchedule(['other-app-thing'], []).toCancel).toEqual([]);
  });
});
