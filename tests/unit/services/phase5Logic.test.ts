jest.mock('@/services/notificationService', () => ({ syncNotifications: jest.fn() }));

import { filterTasks, isOverdue, sortTasks, summarizeTasks } from '@/services/taskService';
import { snoozeUntil } from '@/services/reminderService';
import type { Task } from '@/types/task';
import { buildMonthGrid, dayKey, monthGridRange } from '@/utils/calendarGrid';
import { formatDue } from '@/utils/dateUtils';

const NOW = new Date(2026, 10, 10, 12, 0); // Tue 10 Nov 2026
const at = (d: number, h = 9) => new Date(2026, 10, d, h, 0);

const task = (id: number, over: Partial<Task> = {}): Task => ({
  id,
  title: `Task ${id}`,
  description: '',
  deadline: null,
  deadlineHasTime: false,
  notify: false,
  priority: 'medium',
  categoryId: null,
  isCompleted: false,
  completedAt: null,
  ...over,
});

describe('task filters and sorting', () => {
  const tasks = [
    task(1, { deadline: at(9), priority: 'low' }),
    task(2, { deadline: at(12), priority: 'high' }),
    task(3, { priority: 'high' }),
    task(4, { isCompleted: true, completedAt: at(10, 8), deadline: at(5) }),
    task(5, { title: 'Buy saffron', description: 'from the market' }),
  ];

  it('filters by status, never counting no-deadline or completed tasks as overdue', () => {
    expect(filterTasks(tasks, 'overdue', '', NOW).map((t) => t.id)).toEqual([1]);
    expect(filterTasks(tasks, 'completed', '', NOW).map((t) => t.id)).toEqual([4]);
    expect(filterTasks(tasks, 'pending', '', NOW)).toHaveLength(4);
    expect(isOverdue(task(9), NOW)).toBe(false);
  });

  it('searches title and notes, case-insensitively', () => {
    expect(filterTasks(tasks, 'all', 'SAFFRON', NOW).map((t) => t.id)).toEqual([5]);
    expect(filterTasks(tasks, 'all', 'market', NOW).map((t) => t.id)).toEqual([5]);
  });

  it('sorts by deadline (none last) and by priority, completed always last', () => {
    expect(sortTasks(tasks, 'deadline').map((t) => t.id)).toEqual([1, 2, 3, 5, 4]);
    expect(sortTasks(tasks, 'priority').map((t) => t.id)).toEqual([2, 3, 5, 1, 4]);
  });

  it('summarizes counts for the dashboard', () => {
    expect(summarizeTasks(tasks, NOW)).toEqual({ pending: 4, overdue: 1, dueToday: 0, completedToday: 1, dueThisWeek: 2 });
  });
});

describe('snoozeUntil', () => {
  it('offers 10 minutes, 1 hour, and tomorrow morning', () => {
    expect(snoozeUntil('10m', NOW)).toEqual(new Date(2026, 10, 10, 12, 10));
    expect(snoozeUntil('1h', NOW)).toEqual(new Date(2026, 10, 10, 13, 0));
    expect(snoozeUntil('tomorrow', NOW)).toEqual(new Date(2026, 10, 11, 9, 0));
  });
});

describe('month grid', () => {
  it('covers whole weeks from Sunday, padded with adjacent months', () => {
    const weeks = buildMonthGrid(new Date(2026, 10, 1)); // Nov 2026 starts on a Sunday
    expect(weeks).toHaveLength(5);
    expect(dayKey(weeks[0][0])).toBe('2026-11-01');
    expect(dayKey(weeks[4][6])).toBe('2026-12-05');
    expect(weeks.every((w) => w.length === 7 && w[0].getDay() === 0)).toBe(true);
  });

  it('handles six-week months and returns an inclusive range', () => {
    const weeks = buildMonthGrid(new Date(2026, 7, 1)); // Aug 2026 starts on a Saturday
    expect(weeks).toHaveLength(6);
    const { start, end } = monthGridRange(new Date(2026, 7, 1));
    expect(dayKey(start)).toBe('2026-07-26');
    expect(end.getHours()).toBe(23);
  });
});

describe('formatDue', () => {
  it('uses Today / Tomorrow / Yesterday and plain dates otherwise', () => {
    expect(formatDue(at(10, 15), NOW)).toBe('Today, 3:00 PM');
    expect(formatDue(at(11), NOW)).toBe('Tomorrow, 9:00 AM');
    expect(formatDue(at(9), NOW, false)).toBe('Yesterday');
    expect(formatDue(at(20), NOW)).toBe('Fri 20 Nov, 9:00 AM');
    expect(formatDue(new Date(2027, 0, 5), NOW, false)).toBe('5 Jan 2027');
  });
});
