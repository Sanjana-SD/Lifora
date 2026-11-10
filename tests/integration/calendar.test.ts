import type { SQLiteDatabase } from 'expo-sqlite';

import { createTestDatabase } from '../helpers/testDatabase';

let mockDb: SQLiteDatabase;
jest.mock('@/database/database', () => ({ getDatabase: () => Promise.resolve(mockDb) }));
jest.mock('@/services/notificationService', () => ({ syncNotifications: jest.fn() }));

import * as calendar from '@/services/calendarService';
import type { EventDraft } from '@/types/event';
import { ValidationError } from '@/utils/validationUtils';

const HOUR = 3_600_000;
const at = (d: number, h = 18) => new Date(2026, 10, d, h, 0); // November 2026
const NOV = [new Date(2026, 10, 1), new Date(2026, 10, 30, 23, 59)] as const;

const draft = (over: Partial<EventDraft> = {}): EventDraft => ({
  title: 'Yoga',
  description: '',
  startAt: at(3),
  endAt: new Date(at(3).getTime() + HOUR),
  location: '',
  categoryId: null,
  priority: 'medium',
  recurrence: { freq: 'none', interval: 1, until: null, count: null },
  notificationOffsetMinutes: null,
  ...over,
});
const weekly = { freq: 'weekly' as const, interval: 1, until: null, count: null };
const days = (list: { start: Date }[]) => list.map((o) => o.start.getDate());

beforeEach(async () => {
  mockDb = await createTestDatabase();
});

describe('calendarService (integration)', () => {
  it('expands a weekly series across the month', async () => {
    await calendar.createEvent(draft({ recurrence: weekly }));
    expect(days(await calendar.listOccurrences(...NOV))).toEqual([3, 10, 17, 24]);
  });

  it('edits one occurrence without touching the others ("This event only")', async () => {
    const id = await calendar.createEvent(draft({ recurrence: weekly }));
    const [, second] = await calendar.listOccurrences(...NOV);
    await calendar.updateOccurrence(second, draft({ title: 'Yoga (moved)', startAt: at(11, 7), endAt: at(11, 8) }));

    const list = await calendar.listOccurrences(...NOV);
    expect(list.map((o) => `${o.start.getDate()} ${o.title}`)).toEqual(['3 Yoga', '11 Yoga (moved)', '17 Yoga', '24 Yoga']);
    expect(list[1].seriesId).toBe(id);
    expect(list[1].isException).toBe(true);
  });

  it('deletes one occurrence of a series', async () => {
    await calendar.createEvent(draft({ recurrence: weekly }));
    const [, second] = await calendar.listOccurrences(...NOV);
    await calendar.deleteOccurrence(second);
    expect(days(await calendar.listOccurrences(...NOV))).toEqual([3, 17, 24]);
    expect(await calendar.getOccurrence(second.seriesId, second.originalStart)).toBeNull();
  });

  it('keeps single-occurrence edits when only details of the series change', async () => {
    const id = await calendar.createEvent(draft({ recurrence: weekly }));
    const [, second] = await calendar.listOccurrences(...NOV);
    await calendar.updateOccurrence(second, draft({ title: 'Special', startAt: second.start, endAt: second.end }));
    await calendar.updateSeries(id, draft({ recurrence: weekly, title: 'Yoga class', location: 'Studio' }));
    const titles = (await calendar.listOccurrences(...NOV)).map((o) => o.title);
    expect(titles).toEqual(['Yoga class', 'Special', 'Yoga class', 'Yoga class']);
  });

  it('drops single-occurrence edits when the series timing changes', async () => {
    const id = await calendar.createEvent(draft({ recurrence: weekly }));
    const [, second] = await calendar.listOccurrences(...NOV);
    await calendar.deleteOccurrence(second);
    await calendar.updateSeries(id, draft({ recurrence: weekly, startAt: at(3, 7), endAt: at(3, 8) }));
    const list = await calendar.listOccurrences(...NOV);
    expect(days(list)).toEqual([3, 10, 17, 24]);
    expect(list.every((o) => o.start.getHours() === 7)).toBe(true);
  });

  it('deleting a series removes its exception rows too', async () => {
    const id = await calendar.createEvent(draft({ recurrence: weekly }));
    const [first] = await calendar.listOccurrences(...NOV);
    await calendar.deleteOccurrence(first);
    await calendar.deleteSeries(id);
    const row = await mockDb.getFirstAsync<{ n: number }>('SELECT COUNT(*) AS n FROM events');
    expect(row?.n).toBe(0);
  });

  it('shows an occurrence moved into a month before its series begins', async () => {
    await calendar.createEvent(draft({ startAt: new Date(2026, 11, 1, 9), endAt: new Date(2026, 11, 1, 10), recurrence: weekly }));
    const [december1] = await calendar.listOccurrences(new Date(2026, 11, 1), new Date(2026, 11, 1, 23));
    await calendar.updateOccurrence(december1, draft({ startAt: at(28, 9), endAt: at(28, 10) }));
    expect(days(await calendar.listOccurrences(...NOV))).toEqual([28]);
  });

  it('respects COUNT and UNTIL end conditions', async () => {
    await calendar.createEvent(draft({ recurrence: { ...weekly, count: 2 } }));
    await calendar.createEvent(draft({ title: 'Swim', recurrence: { ...weekly, until: '2026-11-17' } }));
    const list = await calendar.listOccurrences(...NOV);
    expect(list.filter((o) => o.title === 'Yoga')).toHaveLength(2);
    expect(list.filter((o) => o.title === 'Swim')).toHaveLength(3);
  });

  it('finds a one-off or recurring occurrence by series and original start', async () => {
    const id = await calendar.createEvent(draft({ recurrence: weekly }));
    const occurrence = await calendar.getOccurrence(id, at(17));
    expect(occurrence?.start).toEqual(at(17));
    expect(await calendar.getOccurrence(id, at(18))).toBeNull();
  });

  it('validates drafts', async () => {
    await expect(calendar.createEvent(draft({ title: ' ' }))).rejects.toBeInstanceOf(ValidationError);
    await expect(calendar.createEvent(draft({ endAt: at(3, 17) }))).rejects.toThrow('The end must be after the start.');
    await expect(calendar.createEvent(draft({ recurrence: { ...weekly, until: '2026-11-01' } }))).rejects.toThrow(
      'repeat end date',
    );
  });

  it('searches title, description, and location, ignoring deleted occurrences', async () => {
    await calendar.createEvent(draft({ title: 'Dentist', location: 'Apollo Clinic' }));
    expect((await calendar.searchEvents('apollo')).map((e) => e.title)).toEqual(['Dentist']);
    expect(await calendar.searchEvents('   ')).toEqual([]);
  });
});
