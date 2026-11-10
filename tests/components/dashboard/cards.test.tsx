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
  useCategoryMap: () => new Map(),
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

import { CalculatorTeaserCard } from '@/components/dashboard/CalculatorTeaserCard';
import { FinanceOverviewCard } from '@/components/dashboard/FinanceOverviewCard';
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

  it('shows its empty state', async () => {
    const { getByText } = await renderWithTheme(<UpcomingEventsCard />);
    expect(getByText(/No upcoming events/)).toBeTruthy();
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

  it('shows its empty state and add link', async () => {
    const { getByText } = await renderWithTheme(<RemindersCard />);
    expect(getByText('No pending reminders.')).toBeTruthy();
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

  it('shows its empty state and add link', async () => {
    const { getByText } = await renderWithTheme(<TasksCard />);
    expect(getByText(/No tasks yet/)).toBeTruthy();
    await fireEvent.press(getByText('Add a task'));
    expect(router.push).toHaveBeenCalledWith('/tasks/add-task');
  });
});

describe('FinanceOverviewCard', () => {
  it('shows the PRD empty-state copy and three summary rows', async () => {
    const { getByText, getAllByText } = await renderWithTheme(<FinanceOverviewCard />);
    expect(getByText('No expenses logged yet this month.')).toBeTruthy();
    expect(getByText('Today')).toBeTruthy();
    expect(getByText('This Month')).toBeTruthy();
    expect(getByText('Net Balance')).toBeTruthy();
    expect(getAllByText('₹0').length).toBe(3);
  });

  it('navigates to the add-transaction stub', async () => {
    const { getByText } = await renderWithTheme(<FinanceOverviewCard />);
    await fireEvent.press(getByText('Add an expense'));
    expect(router.push).toHaveBeenCalledWith('/finance/add-transaction');
  });
});

describe('CalculatorTeaserCard', () => {
  it('navigates to the calculator when tapped', async () => {
    const { getByText } = await renderWithTheme(<CalculatorTeaserCard />);
    await fireEvent.press(getByText('Calculator'));
    expect(router.push).toHaveBeenCalledWith('/calculator/index');
  });
});

describe('RecentNotesCard', () => {
  beforeEach(() => {
    mockRecentNotes.notes = [];
    mockRecentNotes.error = null;
  });

  it('shows its empty state and add link', async () => {
    const { getByText } = await renderWithTheme(<RecentNotesCard />);
    expect(getByText('Recent Notes')).toBeTruthy();
    expect(getByText(/Your notes will show up here/)).toBeTruthy();
    await fireEvent.press(getByText('Create a note'));
    expect(router.push).toHaveBeenCalledWith('/notes/create-note');
  });

  it('lists recent notes, using the untitled fallback, and opens them', async () => {
    mockRecentNotes.notes = [
      { id: 7, title: 'Trip plan', body: '', isPinned: true, updatedAt: new Date().toISOString() },
      { id: 8, title: '', body: 'Call the bank', isPinned: false, updatedAt: new Date().toISOString() },
    ];
    const { getByText, queryByText } = await renderWithTheme(<RecentNotesCard />);
    expect(getByText('Trip plan')).toBeTruthy();
    expect(getByText('Call the bank')).toBeTruthy();
    expect(queryByText(/Your notes will show up here/)).toBeNull();
    await fireEvent.press(getByText('Trip plan'));
    expect(router.push).toHaveBeenCalledWith('/notes/edit-note?id=7');
  });

  it('shows an error state instead of crashing when loading fails', async () => {
    mockRecentNotes.error = new Error('db locked');
    const { getByText } = await renderWithTheme(<RecentNotesCard />);
    expect(getByText("Couldn't load notes.")).toBeTruthy();
  });
});
