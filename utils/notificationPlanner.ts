import { format, isSameDay, setHours, setMinutes, startOfDay } from 'date-fns';

import type { EventOccurrence } from '@/types/event';
import type { Reminder } from '@/types/reminder';
import type { Task } from '@/types/task';

export type NotificationChannel = 'events' | 'reminders' | 'tasks';

export interface PlannedNotification {
  /** Deterministic: the same item at the same time always has the same id, so syncing can diff. */
  id: string;
  channel: NotificationChannel;
  fireAt: Date;
  title: string;
  body: string;
  route: string;
}

/**
 * Well under Android's and iOS's per-app pending-alarm limits. Only the
 * soonest are scheduled; the rest are picked up by later syncs.
 */
export const MAX_SCHEDULED = 50;
export const NOTIFICATION_PREFIX = 'lifora:';
export const DATE_ONLY_TASK_HOUR = 9;

function whenLabel(date: Date, now: Date): string {
  return isSameDay(date, now) ? `Today, ${format(date, 'h:mm a')}` : format(date, 'EEE d MMM, h:mm a');
}

export function taskAlertTime(task: Pick<Task, 'deadline' | 'deadlineHasTime'>): Date | null {
  if (!task.deadline) return null;
  if (task.deadlineHasTime) return task.deadline;
  return setMinutes(setHours(startOfDay(task.deadline), DATE_ONLY_TASK_HOUR), 0);
}

export function reminderAlertTime(reminder: Pick<Reminder, 'dueAt' | 'snoozedUntil'>): Date {
  return reminder.snoozedUntil ?? reminder.dueAt;
}

export function planNotifications(input: {
  now: Date;
  occurrences: EventOccurrence[];
  reminders: Reminder[];
  tasks: Task[];
}): PlannedNotification[] {
  const { now } = input;
  const plans: PlannedNotification[] = [];

  for (const o of input.occurrences) {
    if (o.notificationOffsetMinutes === null) continue;
    const fireAt = new Date(o.start.getTime() - o.notificationOffsetMinutes * 60_000);
    if (fireAt <= now) continue;
    plans.push({
      id: `${NOTIFICATION_PREFIX}event:${o.key}`,
      channel: 'events',
      fireAt,
      title: o.title,
      body: [whenLabel(o.start, now), o.location].filter(Boolean).join(' · '),
      route: `/calendar/event-details?seriesId=${o.seriesId}&start=${encodeURIComponent(o.originalStart.toISOString())}`,
    });
  }

  for (const r of input.reminders) {
    if (r.isCompleted) continue;
    const fireAt = reminderAlertTime(r);
    if (fireAt <= now) continue;
    plans.push({
      id: `${NOTIFICATION_PREFIX}reminder:${r.id}:${fireAt.toISOString()}`,
      channel: 'reminders',
      fireAt,
      title: r.title,
      body: r.description || 'Reminder',
      route: `/reminders/reminder-details?id=${r.id}`,
    });
  }

  for (const t of input.tasks) {
    if (t.isCompleted || !t.notify) continue;
    const fireAt = taskAlertTime(t);
    if (!fireAt || fireAt <= now) continue;
    plans.push({
      id: `${NOTIFICATION_PREFIX}task:${t.id}:${fireAt.toISOString()}`,
      channel: 'tasks',
      fireAt,
      title: t.title,
      body: t.deadlineHasTime ? `Due ${whenLabel(t.deadline!, now)}` : 'Due today',
      route: `/tasks/task-details?id=${t.id}`,
    });
  }

  return plans.sort((a, b) => a.fireAt.getTime() - b.fireAt.getTime()).slice(0, MAX_SCHEDULED);
}

/** Which scheduled ids to cancel and which plans to add, to move from `scheduledIds` to `plans`. */
export function diffSchedule(
  scheduledIds: string[],
  plans: PlannedNotification[],
): { toCancel: string[]; toSchedule: PlannedNotification[] } {
  const ours = scheduledIds.filter((id) => id.startsWith(NOTIFICATION_PREFIX));
  const desired = new Set(plans.map((p) => p.id));
  const existing = new Set(ours);
  return {
    toCancel: ours.filter((id) => !desired.has(id)),
    toSchedule: plans.filter((p) => !existing.has(p.id)),
  };
}
