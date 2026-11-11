import { fireEvent } from '@testing-library/react-native';
import React from 'react';

jest.mock('expo-router', () => ({
  router: { push: jest.fn() },
}));

import { router } from 'expo-router';

import { QuickAddRow } from '@/components/dashboard/QuickAddRow';
import { renderWithTheme } from '../../testUtils';

describe('QuickAddRow', () => {
  beforeEach(() => {
    (router.push as jest.Mock).mockClear();
  });

  it('renders the five PRD quick-add actions', async () => {
    const { getByText } = await renderWithTheme(<QuickAddRow />);
    for (const label of ['Event', 'Task', 'Reminder', 'Expense', 'Note']) {
      expect(getByText(label)).toBeTruthy();
    }
  });

  it.each([
    ['Add Event', '/calendar/add-event'],
    ['Add Task', '/tasks/add-task'],
    ['Add Reminder', '/reminders/add-reminder'],
    ['Add Expense', '/finance/add-transaction?type=expense'],
    ['Add Note', '/notes/create-note'],
  ])('%s navigates to %s', async (label, href) => {
    const { getByLabelText } = await renderWithTheme(<QuickAddRow />);
    await fireEvent.press(getByLabelText(label));
    expect(router.push).toHaveBeenCalledWith(href);
    // The target is a real route file, not a typo or a removed screen.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { existsSync } = require('node:fs');
    const appDir = `${process.cwd()}/app`;
    const route = href.split('?')[0];
    expect(existsSync(`${appDir}${route}.tsx`) || existsSync(`${appDir}${route}/index.tsx`)).toBe(true);
  });
});
