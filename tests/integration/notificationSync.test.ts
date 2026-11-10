import type { SQLiteDatabase } from 'expo-sqlite';

import { createTestDatabase } from '../helpers/testDatabase';

let mockDb: SQLiteDatabase;
jest.mock('@/database/database', () => ({ getDatabase: () => Promise.resolve(mockDb) }));

// A fake OS scheduler: what would actually be pending on the device.
const mockScheduled = new Map<string, { channelId?: string; date: Date }>();
const mockPermission = { granted: true, canAskAgain: true };
jest.mock('expo-notifications', () => ({
  SchedulableTriggerInputTypes: { DATE: 'date' },
  AndroidImportance: { HIGH: 6 },
  setNotificationHandler: jest.fn(),
  setNotificationChannelAsync: jest.fn(),
  getPermissionsAsync: jest.fn(async () => ({
    ...mockPermission,
    status: mockPermission.granted ? 'granted' : 'denied',
  })),
  requestPermissionsAsync: jest.fn(async () => ({ granted: false, status: 'denied', canAskAgain: false })),
  getAllScheduledNotificationsAsync: jest.fn(async () => [...mockScheduled.keys()].map((identifier) => ({ identifier }))),
  cancelScheduledNotificationAsync: jest.fn(async (id: string) => {
    mockScheduled.delete(id);
  }),
  scheduleNotificationAsync: jest.fn(async ({ identifier, trigger }) => {
    mockScheduled.set(identifier, { channelId: trigger.channelId, date: trigger.date });
    return identifier;
  }),
}));

import { addDays, addHours } from 'date-fns';

import * as calendar from '@/services/calendarService';
import { ensurePermission, syncNotifications } from '@/services/notificationService';
import * as reminders from '@/services/reminderService';
import * as tasks from '@/services/taskService';

const now = new Date();
const soon = (h: number) => addHours(now, h);
const NONE = { freq: 'none' as const, interval: 1, until: null, count: null };

beforeEach(async () => {
  mockDb = await createTestDatabase();
  mockScheduled.clear();
  mockPermission.granted = true;
  mockPermission.canAskAgain = true;
});

async function seed() {
  const reminderId = await reminders.createReminder({
    title: 'Call bank',
    description: '',
    dueAt: soon(2),
    priority: 'medium',
    categoryId: null,
    recurrence: NONE,
  });
  await calendar.createEvent({
    title: 'Dentist',
    description: '',
    startAt: soon(5),
    endAt: soon(6),
    location: '',
    categoryId: null,
    priority: 'medium',
    recurrence: NONE,
    notificationOffsetMinutes: 60,
  });
  const taskId = await tasks.createTask({
    title: 'Report',
    description: '',
    deadline: soon(8),
    deadlineHasTime: true,
    notify: true,
    priority: 'high',
    categoryId: null,
  });
  await syncNotifications();
  return { reminderId, taskId };
}

const channels = () => [...mockScheduled.values()].map((v) => v.channelId).sort();

describe('notificationService.syncNotifications (integration)', () => {
  it('schedules one notification per item on the right channel', async () => {
    await seed();
    expect(channels()).toEqual(['events', 'reminders', 'tasks']);
    const event = [...mockScheduled.values()].find((v) => v.channelId === 'events')!;
    expect(event.date).toEqual(soon(4));
  });

  it('cancels the alert when a reminder is completed or a task is deleted', async () => {
    const { reminderId, taskId } = await seed();
    await reminders.completeReminder(reminderId);
    await tasks.deleteTask(taskId);
    await syncNotifications();
    expect(channels()).toEqual(['events']);
  });

  it('reschedules a snoozed reminder instead of keeping both alerts', async () => {
    const { reminderId } = await seed();
    await reminders.snoozeReminder(reminderId, 'tomorrow', soon(3)); // after it came due
    await syncNotifications();
    const reminderAlerts = [...mockScheduled.entries()].filter(([, v]) => v.channelId === 'reminders');
    expect(reminderAlerts).toHaveLength(1);
    expect(reminderAlerts[0][1].date > addDays(now, 0)).toBe(true);
  });

  it('is idempotent: syncing again changes nothing', async () => {
    await seed();
    const before = [...mockScheduled.keys()].sort();
    await syncNotifications();
    await syncNotifications();
    expect([...mockScheduled.keys()].sort()).toEqual(before);
  });

  it('schedules nothing without permission, and does not re-prompt after denial', async () => {
    mockPermission.granted = false;
    mockPermission.canAskAgain = false;
    await seed();
    expect(mockScheduled.size).toBe(0);
    expect(await ensurePermission()).toBe('denied');
  });
});
