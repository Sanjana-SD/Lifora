import { isPriority } from '@/constants/priorities';
import type { Reminder, ReminderDraft } from '@/types/reminder';
import type { RecurrenceFreq } from '@/utils/recurrence';
import { getDatabase } from '../database';

interface ReminderRow {
  id: number;
  title: string;
  description: string;
  due_at: string;
  priority: string;
  category_id: number | null;
  recurrence_freq: RecurrenceFreq;
  recurrence_interval: number;
  recurrence_until: string | null;
  series_start_at: string;
  is_completed: number;
  completed_at: string | null;
  snoozed_until: string | null;
}

const NOW = "strftime('%Y-%m-%dT%H:%M:%fZ', 'now')";
const toDate = (value: string | null) => (value ? new Date(value) : null);

function mapRow(row: ReminderRow): Reminder {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    dueAt: new Date(row.due_at),
    priority: isPriority(row.priority) ? row.priority : 'medium',
    categoryId: row.category_id,
    recurrence: { freq: row.recurrence_freq, interval: row.recurrence_interval, until: row.recurrence_until, count: null },
    seriesStartAt: new Date(row.series_start_at),
    isCompleted: row.is_completed === 1,
    completedAt: toDate(row.completed_at),
    snoozedUntil: toDate(row.snoozed_until),
  };
}

export async function listReminders(): Promise<Reminder[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<ReminderRow>(
    'SELECT * FROM reminders ORDER BY is_completed ASC, CASE WHEN is_completed = 1 THEN completed_at END DESC, due_at ASC',
  );
  return rows.map(mapRow);
}

export async function listPendingReminders(): Promise<Reminder[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<ReminderRow>('SELECT * FROM reminders WHERE is_completed = 0 ORDER BY due_at ASC');
  return rows.map(mapRow);
}

export async function getReminder(id: number): Promise<Reminder | null> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<ReminderRow>('SELECT * FROM reminders WHERE id = ?', [id]);
  return row ? mapRow(row) : null;
}

export async function insertReminder(draft: ReminderDraft): Promise<number> {
  const db = await getDatabase();
  const due = draft.dueAt.toISOString();
  const result = await db.runAsync(
    `INSERT INTO reminders (title, description, due_at, priority, category_id, recurrence_freq, recurrence_interval, recurrence_until, series_start_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [draft.title, draft.description, due, draft.priority, draft.categoryId, draft.recurrence.freq, draft.recurrence.interval, draft.recurrence.until, due],
  );
  return result.lastInsertRowId;
}

/** Editing restarts the series at the new due time and clears any snooze/completion. */
export async function updateReminder(id: number, draft: ReminderDraft): Promise<void> {
  const db = await getDatabase();
  const due = draft.dueAt.toISOString();
  await db.runAsync(
    `UPDATE reminders SET title = ?, description = ?, due_at = ?, priority = ?, category_id = ?,
       recurrence_freq = ?, recurrence_interval = ?, recurrence_until = ?, series_start_at = ?,
       is_completed = 0, completed_at = NULL, snoozed_until = NULL, updated_at = ${NOW}
     WHERE id = ?`,
    [draft.title, draft.description, due, draft.priority, draft.categoryId, draft.recurrence.freq, draft.recurrence.interval, draft.recurrence.until, due, id],
  );
}

export async function advanceReminder(id: number, nextDueAt: Date): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(`UPDATE reminders SET due_at = ?, snoozed_until = NULL, updated_at = ${NOW} WHERE id = ?`, [
    nextDueAt.toISOString(),
    id,
  ]);
}

export async function setReminderCompleted(id: number, completed: boolean): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    `UPDATE reminders SET is_completed = ?, completed_at = ${completed ? NOW : 'NULL'}, snoozed_until = NULL, updated_at = ${NOW} WHERE id = ?`,
    [completed ? 1 : 0, id],
  );
}

export async function setReminderSnooze(id: number, until: Date | null): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(`UPDATE reminders SET snoozed_until = ?, updated_at = ${NOW} WHERE id = ?`, [
    until ? until.toISOString() : null,
    id,
  ]);
}

export async function deleteReminder(id: number): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM reminders WHERE id = ?', [id]);
}
