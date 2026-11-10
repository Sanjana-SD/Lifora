import { isPriority } from '@/constants/priorities';
import type { EventDraft, EventRecord } from '@/types/event';
import type { RecurrenceFreq } from '@/utils/recurrence';
import { getDatabase } from '../database';

interface EventRow {
  id: number;
  title: string;
  description: string;
  start_at: string;
  end_at: string;
  location: string;
  category_id: number | null;
  priority: string;
  recurrence_freq: RecurrenceFreq;
  recurrence_interval: number;
  recurrence_until: string | null;
  recurrence_count: number | null;
  notification_offset_minutes: number | null;
  parent_event_id: number | null;
  original_start_at: string | null;
  is_exception: number;
  is_cancelled: number;
}

const NOW = "strftime('%Y-%m-%dT%H:%M:%fZ', 'now')";

function mapRow(row: EventRow): EventRecord {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    startAt: new Date(row.start_at),
    endAt: new Date(row.end_at),
    location: row.location,
    categoryId: row.category_id,
    priority: isPriority(row.priority) ? row.priority : 'medium',
    recurrence: {
      freq: row.recurrence_freq,
      interval: row.recurrence_interval,
      until: row.recurrence_until,
      count: row.recurrence_count,
    },
    notificationOffsetMinutes: row.notification_offset_minutes,
    parentEventId: row.parent_event_id,
    originalStartAt: row.original_start_at ? new Date(row.original_start_at) : null,
    isException: row.is_exception === 1,
    isCancelled: row.is_cancelled === 1,
  };
}

function draftParams(draft: EventDraft) {
  return [
    draft.title,
    draft.description,
    draft.startAt.toISOString(),
    draft.endAt.toISOString(),
    draft.location,
    draft.categoryId,
    draft.priority,
    draft.recurrence.freq,
    draft.recurrence.interval,
    draft.recurrence.until,
    draft.recurrence.count,
    draft.notificationOffsetMinutes,
  ];
}

const DRAFT_COLUMNS =
  'title, description, start_at, end_at, location, category_id, priority, recurrence_freq, recurrence_interval, recurrence_until, recurrence_count, notification_offset_minutes';
const DRAFT_ASSIGNMENTS = DRAFT_COLUMNS.split(', ')
  .map((c) => `${c} = ?`)
  .join(', ');

/** Series and one-off events that could have an occurrence in the range. */
export async function listSeriesForRange(rangeStart: Date, rangeEnd: Date): Promise<EventRecord[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<EventRow>(
    `SELECT * FROM events
      WHERE is_exception = 0
        AND start_at <= ?
        AND (recurrence_freq != 'none' OR end_at >= ?)
      ORDER BY start_at`,
    [rangeEnd.toISOString(), rangeStart.toISOString()],
  );
  return rows.map(mapRow);
}

/**
 * Exceptions that matter for a range: every exception of the given
 * series (to suppress the occurrences they replace), plus any exception
 * moved into the range from a series that isn't otherwise visible.
 */
export async function listExceptions(parentIds: number[], rangeStart: Date, rangeEnd: Date): Promise<EventRecord[]> {
  const db = await getDatabase();
  const byParent = parentIds.length > 0 ? `parent_event_id IN (${parentIds.map(() => '?').join(', ')}) OR ` : '';
  const rows = await db.getAllAsync<EventRow>(
    `SELECT * FROM events WHERE is_exception = 1 AND (${byParent}(start_at <= ? AND end_at >= ?))`,
    [...parentIds, rangeEnd.toISOString(), rangeStart.toISOString()],
  );
  return rows.map(mapRow);
}

export async function getException(parentId: number, originalStart: Date): Promise<EventRecord | null> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<EventRow>(
    'SELECT * FROM events WHERE is_exception = 1 AND parent_event_id = ? AND original_start_at = ?',
    [parentId, originalStart.toISOString()],
  );
  return row ? mapRow(row) : null;
}

export async function getEvent(id: number): Promise<EventRecord | null> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<EventRow>('SELECT * FROM events WHERE id = ?', [id]);
  return row ? mapRow(row) : null;
}

export async function insertEvent(draft: EventDraft): Promise<number> {
  const db = await getDatabase();
  const result = await db.runAsync(
    `INSERT INTO events (${DRAFT_COLUMNS}) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    draftParams(draft),
  );
  return result.lastInsertRowId;
}

export async function updateEvent(id: number, draft: EventDraft): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(`UPDATE events SET ${DRAFT_ASSIGNMENTS}, updated_at = ${NOW} WHERE id = ?`, [
    ...draftParams(draft),
    id,
  ]);
}

export async function deleteEvent(id: number): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM events WHERE id = ?', [id]);
}

/** Creates or replaces the exception row overriding one occurrence of a series. */
export async function upsertException(
  parentId: number,
  originalStart: Date,
  draft: EventDraft,
  cancelled: boolean,
): Promise<void> {
  const db = await getDatabase();
  const original = originalStart.toISOString();
  const single = { ...draft, recurrence: { freq: 'none' as const, interval: 1, until: null, count: null } };
  await db.withTransactionAsync(async () => {
    await db.runAsync('DELETE FROM events WHERE is_exception = 1 AND parent_event_id = ? AND original_start_at = ?', [
      parentId,
      original,
    ]);
    await db.runAsync(
      `INSERT INTO events (${DRAFT_COLUMNS}, parent_event_id, original_start_at, is_exception, is_cancelled)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?)`,
      [...draftParams(single), parentId, original, cancelled ? 1 : 0],
    );
  });
}

export async function deleteExceptions(parentId: number): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM events WHERE is_exception = 1 AND parent_event_id = ?', [parentId]);
}

function likePattern(search: string): string {
  return `%${search.replace(/[\\%_]/g, (c) => `\\${c}`)}%`;
}

export async function searchEvents(term: string): Promise<EventRecord[]> {
  const db = await getDatabase();
  const pattern = likePattern(term.trim());
  const rows = await db.getAllAsync<EventRow>(
    `SELECT * FROM events
      WHERE is_cancelled = 0
        AND (title LIKE ? ESCAPE '\\' OR description LIKE ? ESCAPE '\\' OR location LIKE ? ESCAPE '\\')
      ORDER BY start_at`,
    [pattern, pattern, pattern],
  );
  return rows.map(mapRow);
}
