import { addDays } from 'date-fns';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import * as eventRepository from '@/database/repositories/eventRepository';
import * as reminderRepository from '@/database/repositories/reminderRepository';
import * as taskRepository from '@/database/repositories/taskRepository';
import { buildOccurrences } from '@/utils/eventOccurrences';
import { NOTIFICATION_PREFIX, diffSchedule, planNotifications, type NotificationChannel } from '@/utils/notificationPlanner';

// The single owner of OS-level scheduling (PRD Section 9.2). The database
// is the source of truth: every sync re-plans from it and diffs against
// what the OS has scheduled, so edits, deletes, completions, reboots, and
// timezone changes all converge the same way.

export type PermissionState = 'granted' | 'denied' | 'undetermined' | 'unsupported';

export const EVENT_LOOKAHEAD_DAYS = 30;

const CHANNELS: Record<NotificationChannel, string> = {
  reminders: 'Reminders',
  tasks: 'Tasks',
  events: 'Calendar events',
};

const supported = Platform.OS !== 'web';
let initialized = false;
let syncChain: Promise<void> = Promise.resolve();

export async function initializeNotifications(): Promise<void> {
  if (!supported || initialized) return;
  initialized = true;
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
  // Channels must exist before Android 13+ will show the permission prompt.
  if (Platform.OS === 'android') {
    for (const [id, name] of Object.entries(CHANNELS)) {
      await Notifications.setNotificationChannelAsync(id, {
        name,
        importance: Notifications.AndroidImportance.HIGH,
      });
    }
  }
}

export async function getPermissionState(): Promise<PermissionState> {
  if (!supported) return 'unsupported';
  const { status } = await Notifications.getPermissionsAsync();
  return status as PermissionState;
}

/**
 * Android 12+ only delivers alarms on time when the app may schedule exact
 * alarms; otherwise the OS batches them and they can arrive late. Android
 * 14+ denies this by default, so the user grants it once in Settings
 * ("Alarms & reminders"). expo-notifications then uses
 * setExactAndAllowWhileIdle, which fires on time even in Doze.
 */
export async function getExactAlarmState(): Promise<'granted' | 'denied' | 'unsupported'> {
  if (Platform.OS !== 'android') return 'unsupported';
  try {
    const { granted } = await Notifications.getExactAlarmPermissionsAsync();
    return granted ? 'granted' : 'denied';
  } catch {
    return 'unsupported';
  }
}

/** Opens the system "Alarms & reminders" screen; re-syncs on return so alarms become exact. */
export async function requestExactAlarms(): Promise<boolean> {
  if (Platform.OS !== 'android') return true;
  try {
    const { granted } = await Notifications.requestExactAlarmPermissionsAsync();
    // Alarms already scheduled stay inexact; cancel and re-add them now.
    if (granted) await resyncAll();
    return granted;
  } catch {
    return false;
  }
}

/** A real notification in a few seconds, so the user can confirm alerts reach them. */
export async function sendTestNotification(): Promise<PermissionState> {
  const state = await ensurePermission();
  if (state !== 'granted') return state;
  await Notifications.scheduleNotificationAsync({
    identifier: 'test-notification',
    content: { title: 'LIFORA notifications work', body: 'Reminders and events will alert you like this.' },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: 5,
      channelId: 'reminders',
    },
  });
  return 'granted';
}

/** Cancels everything LIFORA scheduled and plans it again from the database. */
async function resyncAll(): Promise<void> {
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  for (const n of scheduled) {
    if (n.identifier.startsWith(NOTIFICATION_PREFIX)) await Notifications.cancelScheduledNotificationAsync(n.identifier);
  }
  await syncNotifications();
}

/** Asks only when the OS still allows asking; never nags after a denial. */
export async function ensurePermission(): Promise<PermissionState> {
  if (!supported) return 'unsupported';
  await initializeNotifications();
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return 'granted';
  if (!current.canAskAgain) return 'denied';
  const requested = await Notifications.requestPermissionsAsync();
  return requested.granted ? 'granted' : 'denied';
}

async function syncNow(now: Date): Promise<void> {
  if (!supported) return;
  await initializeNotifications();
  if ((await getPermissionState()) !== 'granted') return;

  const horizon = addDays(now, EVENT_LOOKAHEAD_DAYS);
  const series = await eventRepository.listSeriesForRange(now, horizon);
  const exceptions = await eventRepository.listExceptions(
    series.map((s) => s.id),
    now,
    horizon,
  );
  const plans = planNotifications({
    now,
    occurrences: buildOccurrences(series, exceptions, now, horizon),
    reminders: await reminderRepository.listPendingReminders(),
    tasks: await taskRepository.listTasks(),
  });

  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  const { toCancel, toSchedule } = diffSchedule(
    scheduled.map((n) => n.identifier),
    plans,
  );
  for (const id of toCancel) {
    await Notifications.cancelScheduledNotificationAsync(id);
  }
  for (const plan of toSchedule) {
    await Notifications.scheduleNotificationAsync({
      identifier: plan.id,
      content: { title: plan.title, body: plan.body, data: { route: plan.route } },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: plan.fireAt,
        channelId: plan.channel,
      },
    });
  }
}

/**
 * Re-plans and reschedules. Calls are serialized so overlapping syncs
 * can't double-schedule. Failures are swallowed: notifications are best
 * effort and must never block saving data.
 */
export function syncNotifications(now?: Date): Promise<void> {
  syncChain = syncChain.then(() => syncNow(now ?? new Date())).catch(() => {});
  return syncChain;
}
