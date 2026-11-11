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

  it('renders the five quick actions, with no action leading to an unbuilt screen', async () => {
    const { getByText, queryByText } = await renderWithTheme(<QuickAddRow />);
    for (const label of ['Event', 'Task', 'Reminder', 'Note', 'Calculate']) {
      expect(getByText(label)).toBeTruthy();
    }
    expect(queryByText('Expense')).toBeNull();
  });

  it.each([
    ['Add Event', '/calendar/add-event'],
    ['Add Task', '/tasks/add-task'],
    ['Add Reminder', '/reminders/add-reminder'],
    ['Add Note', '/notes/create-note'],
    ['Open Calculator', '/calculator'],
  ])('%s navigates to %s', async (label, href) => {
    const { getByLabelText } = await renderWithTheme(<QuickAddRow />);
    await fireEvent.press(getByLabelText(label));
    expect(router.push).toHaveBeenCalledWith(href);
    // The target is a real route file, not a typo or a removed screen.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { existsSync } = require('node:fs');
    const appDir = `${process.cwd()}/app`;
    expect(existsSync(`${appDir}${href}.tsx`) || existsSync(`${appDir}${href}/index.tsx`)).toBe(true);
  });
});
