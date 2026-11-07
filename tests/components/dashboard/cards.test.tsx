import { fireEvent } from '@testing-library/react-native';
import React from 'react';

jest.mock('expo-router', () => ({
  router: { push: jest.fn() },
}));

import { router } from 'expo-router';

import { CalculatorTeaserCard } from '@/components/dashboard/CalculatorTeaserCard';
import { FinanceOverviewCard } from '@/components/dashboard/FinanceOverviewCard';
import { RecentNotesCard } from '@/components/dashboard/RecentNotesCard';
import { RemindersCard } from '@/components/dashboard/RemindersCard';
import { TasksCard } from '@/components/dashboard/TasksCard';
import { TodayEventsCard } from '@/components/dashboard/TodayEventsCard';
import { UpcomingEventsCard } from '@/components/dashboard/UpcomingEventsCard';
import { renderWithTheme } from '../../testUtils';

beforeEach(() => {
  (router.push as jest.Mock).mockClear();
});

describe('TodayEventsCard', () => {
  it('shows its empty state and add link', async () => {
    const { getByText } = await renderWithTheme(<TodayEventsCard />);
    expect(getByText("Today's Events")).toBeTruthy();
    expect(getByText(/Nothing scheduled today/)).toBeTruthy();
  });

  it('navigates to the add-event stub', async () => {
    const { getByText } = await renderWithTheme(<TodayEventsCard />);
    fireEvent.press(getByText('Add an event'));
    expect(router.push).toHaveBeenCalledWith('/calendar/add-event');
  });

  it('navigates to the Calendar tab when the header is tapped', async () => {
    const { getByText } = await renderWithTheme(<TodayEventsCard />);
    fireEvent.press(getByText("Today's Events"));
    expect(router.push).toHaveBeenCalledWith('/(tabs)/calendar');
  });
});

describe('UpcomingEventsCard', () => {
  it('shows its empty state', async () => {
    const { getByText } = await renderWithTheme(<UpcomingEventsCard />);
    expect(getByText('Upcoming')).toBeTruthy();
    expect(getByText(/No upcoming events/)).toBeTruthy();
  });
});

describe('RemindersCard', () => {
  it('shows its empty state and add link', async () => {
    const { getByText } = await renderWithTheme(<RemindersCard />);
    expect(getByText('Reminders')).toBeTruthy();
    expect(getByText('No pending reminders.')).toBeTruthy();
  });

  it('navigates to the add-reminder stub', async () => {
    const { getByText } = await renderWithTheme(<RemindersCard />);
    fireEvent.press(getByText('Add a reminder'));
    expect(router.push).toHaveBeenCalledWith('/reminders/add-reminder');
  });
});

describe('TasksCard', () => {
  it('shows its empty state and add link', async () => {
    const { getByText } = await renderWithTheme(<TasksCard />);
    expect(getByText('Tasks')).toBeTruthy();
    fireEvent.press(getByText('Add a task'));
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
    fireEvent.press(getByText('Add an expense'));
    expect(router.push).toHaveBeenCalledWith('/finance/add-transaction');
  });
});

describe('CalculatorTeaserCard', () => {
  it('navigates to the calculator stub when tapped', async () => {
    const { getByText } = await renderWithTheme(<CalculatorTeaserCard />);
    fireEvent.press(getByText('Calculator'));
    expect(router.push).toHaveBeenCalledWith('/calculator/index');
  });
});

describe('RecentNotesCard', () => {
  it('shows its empty state and add link', async () => {
    const { getByText } = await renderWithTheme(<RecentNotesCard />);
    expect(getByText('Recent Notes')).toBeTruthy();
    fireEvent.press(getByText('Create a note'));
    expect(router.push).toHaveBeenCalledWith('/notes/create-note');
  });
});
