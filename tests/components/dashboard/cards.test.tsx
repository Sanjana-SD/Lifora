import { addDays, addHours, format, startOfDay, subDays } from 'date-fns';
import { fireEvent } from '@testing-library/react-native';
import React from 'react';

jest.mock('expo-router', () => ({
  router: { push: jest.fn() },
}));

const mockRecentNotes = { notes: [] as unknown[], error: null as Error | null };
jest.mock('@/hooks/useNotes', () => ({
  useRecentNotes: () => mockRecentNotes,
}));

const mockCalendar = { today: [] as unknown[], upcoming: [] as unknown[] };
jest.mock('@/hooks/useCalendar', () => ({
  useOccurrences: () => ({ occurrences: mockCalendar.today, error: null }),
  useUpcomingEvents: () => ({ occurrences: mockCalendar.upcoming, error: null }),
  useCategoryMap: () =>
    new Map([
      [1, { id: 1, name: 'Food' }],
      [2, { id: 2, name: 'Transportation' }],
    ]),
}));

const mockFinance = { summary: null as unknown, error: null as Error | null };
jest.mock('@/hooks/useFinance', () => ({
  useFinanceHomeSummary: () => mockFinance,
}));

const mockReminders = { list: [] as unknown[], reload: jest.fn() };
jest.mock('@/hooks/useReminders', () => ({
  usePendingReminders: () => ({ reminders: mockReminders.list, error: null, reload: mockReminders.reload }),
}));

const mockTasks = { list: [] as unknown[], reload: jest.fn() };
jest.mock('@/hooks/useTasks', () => ({
  useTasks: () => ({ tasks: mockTasks.list, error: null, reload: mockTasks.reload }),
}));

jest.mock('@/services/notificationService', () => ({ syncNotifications: jest.fn() }));
jest.mock('@/services/reminderService', () => ({
  ...jest.requireActual('@/services/reminderService'),
  completeReminder: jest.fn().mockResolvedValue({ next: null }),
}));
jest.mock('@/services/taskService', () => ({
  ...jest.requireActual('@/services/taskService'),
  setTaskCompleted: jest.fn().mockResolvedValue(undefined),
}));

import { router } from 'expo-router';

import { FinanceCard } from '@/components/dashboard/FinanceCard';
import { RecentNotesCard } from '@/components/dashboard/RecentNotesCard';
import { RemindersCard } from '@/components/dashboard/RemindersCard';
import { TasksCard } from '@/components/dashboard/TasksCard';
import { TodayEventsCard } from '@/components/dashboard/TodayEventsCard';
import { UpcomingEventsCard } from '@/components/dashboard/UpcomingEventsCard';
import { completeReminder } from '@/services/reminderService';
import { setTaskCompleted } from '@/services/taskService';
import { renderWithTheme } from '../../testUtils';

const NONE = { freq: 'none', interval: 1, until: null, count: null };
const now = new Date();
const today = (h: number) => addHours(startOfDay(now), h);

const occurrence = (title: string, start: Date) => ({
  key: `${title}@${start.toISOString()}`,
  seriesId: 1,
  rowId: 1,
  originalStart: start,
  title,
  description: '',
  start,
  end: addHours(start, 1),
  location: '',
  categoryId: null,
  priority: 'medium',
  notificationOffsetMinutes: null,
  isRecurring: false,
  isException: false,
});
const reminder = (id: number, title: string, dueAt: Date) => ({
  id,
  title,
  description: '',
  dueAt,
  priority: 'medium',
  categoryId: null,
  recurrence: NONE,
  seriesStartAt: dueAt,
  isCompleted: false,
  completedAt: null,
  snoozedUntil: null,
});
const task = (id: number, title: string, deadline: Date | null, isCompleted = false) => ({
  id,
  title,
  description: '',
  deadline,
  deadlineHasTime: true,
  notify: false,
  priority: 'medium',
  categoryId: null,
  isCompleted,
  completedAt: isCompleted ? now : null,
});

beforeEach(() => {
  jest.clearAllMocks();
  mockCalendar.today = [];
  mockCalendar.upcoming = [];
  mockReminders.list = [];
  mockTasks.list = [];
});

describe('TodayEventsCard', () => {
  it('shows its empty state, and adds an event for today', async () => {
    const { getByText } = await renderWithTheme(<TodayEventsCard />);
    expect(getByText(/Nothing scheduled today/)).toBeTruthy();
    await fireEvent.press(getByText('Add an event'));
    expect(router.push).toHaveBeenCalledWith(`/calendar/add-event?date=${format(now, 'yyyy-MM-dd')}`);
  });

  it("lists today's events with times, capped with a count of the rest", async () => {
    mockCalendar.today = ['Standup', 'Lunch', 'Gym', 'Call'].map((t, i) => occurrence(t, today(9 + i)));
    const { getByText, queryByText } = await renderWithTheme(<TodayEventsCard />);
    expect(getByText('Standup')).toBeTruthy();
    expect(getByText('9:00 AM')).toBeTruthy();
    expect(queryByText('Call')).toBeNull();
    expect(getByText('+1 more today')).toBeTruthy();
  });

  it('opens an event and the Calendar tab', async () => {
    mockCalendar.today = [occurrence('Standup', today(9))];
    const { getByText } = await renderWithTheme(<TodayEventsCard />);
    await fireEvent.press(getByText('Standup'));
    expect(router.push).toHaveBeenCalledWith(expect.stringContaining('/calendar/event-details?seriesId=1'));
    await fireEvent.press(getByText("Today's Events"));
    expect(router.push).toHaveBeenCalledWith('/(tabs)/calendar');
  });
});

describe('UpcomingEventsCard', () => {
  it('shows only events after today', async () => {
    mockCalendar.upcoming = [occurrence('Later today', addHours(now, 0.01)), occurrence('Trip', addDays(today(10), 2))];
    const { getByText, queryByText } = await renderWithTheme(<UpcomingEventsCard />);
    expect(getByText('Trip')).toBeTruthy();
    expect(queryByText('Later today')).toBeNull();
  });

  it('hides itself when nothing is coming up', async () => {
    const { queryByText } = await renderWithTheme(<UpcomingEventsCard />);
    expect(queryByText('Upcoming')).toBeNull();
    expect(queryByText('See all')).toBeNull();
  });
});

describe('RemindersCard', () => {
  it('shows reminders due today or overdue, and completes one in place', async () => {
    mockReminders.list = [
      reminder(1, 'Pay rent', subDays(now, 1)),
      reminder(2, 'Call mom', addHours(startOfDay(now), 23)),
      reminder(3, 'Renew passport', addDays(now, 5)),
    ];
    const { getByText, queryByText, getByLabelText } = await renderWithTheme(<RemindersCard />);
    expect(getByText('Pay rent')).toBeTruthy();
    expect(getByText(/^Overdue/)).toBeTruthy();
    expect(queryByText('Renew passport')).toBeNull();

    await fireEvent.press(getByLabelText('Mark Pay rent as done'));
    expect(completeReminder).toHaveBeenCalledWith(1);
    expect(mockReminders.reload).toHaveBeenCalled();
  });

  it('says how many are coming up when nothing is due today', async () => {
    mockReminders.list = [reminder(3, 'Renew passport', addDays(now, 5))];
    const { getByText } = await renderWithTheme(<RemindersCard />);
    expect(getByText('Nothing due today · 1 coming up')).toBeTruthy();
  });

  it('hides itself when there are no pending reminders', async () => {
    const { queryByText } = await renderWithTheme(<RemindersCard />);
    expect(queryByText('Reminders due')).toBeNull();
    expect(queryByText('See all')).toBeNull();
  });

  it('keeps an add link', async () => {
    mockReminders.list = [reminder(3, 'Renew passport', addDays(now, 5))];
    const { getByText } = await renderWithTheme(<RemindersCard />);
    await fireEvent.press(getByText('Add a reminder'));
    expect(router.push).toHaveBeenCalledWith('/reminders/add-reminder');
  });
});

describe('TasksCard', () => {
  it('shows pending, overdue, and done-today counts plus the most urgent tasks', async () => {
    mockTasks.list = [
      task(1, 'Late report', subDays(now, 1)),
      task(2, 'Groceries', addDays(now, 1)),
      task(3, 'Filed taxes', null, true),
    ];
    const { getByLabelText, getByText, queryByText } = await renderWithTheme(<TasksCard />);
    expect(getByLabelText('2 pending')).toBeTruthy();
    expect(getByLabelText('1 overdue')).toBeTruthy();
    expect(getByLabelText('1 done today')).toBeTruthy();
    expect(getByText('Late report')).toBeTruthy();
    expect(queryByText('Filed taxes')).toBeNull();

    await fireEvent.press(getByLabelText('Mark Late report as done'));
    expect(setTaskCompleted).toHaveBeenCalledWith(1, true);
  });

  it('hides itself when there are no tasks', async () => {
    const { queryByText } = await renderWithTheme(<TasksCard />);
    expect(queryByText('Tasks')).toBeNull();
    expect(queryByText('See all')).toBeNull();
  });

  it('keeps an add link', async () => {
    mockTasks.list = [task(2, 'Groceries', addDays(now, 1))];
    const { getByText } = await renderWithTheme(<TasksCard />);
    await fireEvent.press(getByText('Add a task'));
    expect(router.push).toHaveBeenCalledWith('/tasks/add-task');
  });
});

describe('RecentNotesCard', () => {
  beforeEach(() => {
    mockRecentNotes.notes = [];
    mockRecentNotes.error = null;
  });

  it('hides itself when there are no notes', async () => {
    const { queryByText } = await renderWithTheme(<RecentNotesCard />);
    expect(queryByText('Recent Notes')).toBeNull();
    expect(queryByText('See all')).toBeNull();
  });

  it('lists recent notes, using the untitled fallback, and opens them', async () => {
    mockRecentNotes.notes = [
      { id: 7, title: 'Trip plan', body: '', isPinned: true, updatedAt: new Date().toISOString() },
      { id: 8, title: '', body: 'Call the bank', isPinned: false, updatedAt: new Date().toISOString() },
    ];
    const { getByText } = await renderWithTheme(<RecentNotesCard />);
    expect(getByText('Trip plan')).toBeTruthy();
    expect(getByText('Call the bank')).toBeTruthy();
    await fireEvent.press(getByText('Trip plan'));
    expect(router.push).toHaveBeenCalledWith('/notes/edit-note?id=7');
    await fireEvent.press(getByText('Create a note'));
    expect(router.push).toHaveBeenCalledWith('/notes/create-note');
  });

  it('shows an error state instead of crashing when loading fails', async () => {
    mockRecentNotes.error = new Error('db locked');
    const { getByText } = await renderWithTheme(<RecentNotesCard />);
    expect(getByText("Couldn't load notes.")).toBeTruthy();
  });
});

describe('FinanceCard', () => {
  beforeEach(() => {
    mockFinance.summary = null;
    mockFinance.error = null;
  });

  it('hides itself until the first transaction exists (no placeholder ₹0)', async () => {
    mockFinance.summary = { hasAnyTransactions: false, spentTodayPaise: 0, todayByCategory: [], monthExpensePaise: 0, monthIncomePaise: 0 };
    const { queryByText } = await renderWithTheme(<FinanceCard />);
    expect(queryByText("Today's spending")).toBeNull();
    expect(queryByText(/₹0/)).toBeNull();
  });

  it("shows today's spending with a category breakdown, and this month's totals", async () => {
    mockFinance.summary = {
      hasAnyTransactions: true,
      spentTodayPaise: 35000,
      todayByCategory: [
        { categoryId: 1, totalPaise: 20000, count: 2 },
        { categoryId: 2, totalPaise: 15000, count: 1 },
      ],
      monthExpensePaise: 1234500,
      monthIncomePaise: 5000000,
    };
    const { getByText, getByLabelText } = await renderWithTheme(<FinanceCard />);
    expect(getByText('₹350')).toBeTruthy();
    expect(getByText('Food ₹200 · Transportation ₹150')).toBeTruthy();
    expect(getByLabelText('Spent this month: ₹12,345.00')).toBeTruthy();
    expect(getByLabelText('Income this month: ₹50,000.00')).toBeTruthy();
    await fireEvent.press(getByText('Import a newer statement'));
    expect(router.push).toHaveBeenCalledWith('/finance/import');
    await fireEvent.press(getByText("Today's spending"));
    expect(router.push).toHaveBeenCalledWith('/(tabs)/finance');
  });

  it('says when nothing has been spent today', async () => {
    mockFinance.summary = { hasAnyTransactions: true, spentTodayPaise: 0, todayByCategory: [], monthExpensePaise: 50000, monthIncomePaise: 0 };
    const { getByText } = await renderWithTheme(<FinanceCard />);
    expect(getByText('Nothing spent yet today.')).toBeTruthy();
  });

  it('shows an error state instead of hiding a failure', async () => {
    mockFinance.error = new Error('db locked');
    const { getByText } = await renderWithTheme(<FinanceCard />);
    expect(getByText("Couldn't load your finances.")).toBeTruthy();
  });
});
