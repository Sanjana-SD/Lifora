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

  it('renders all five quick-add actions', async () => {
    const { getByText } = await renderWithTheme(<QuickAddRow />);
    for (const label of ['Event', 'Task', 'Reminder', 'Expense', 'Note']) {
      expect(getByText(label)).toBeTruthy();
    }
  });

  it('navigates to the add-transaction stub when Expense is tapped', async () => {
    const { getByText } = await renderWithTheme(<QuickAddRow />);
    await fireEvent.press(getByText('Expense'));
    expect(router.push).toHaveBeenCalledWith('/finance/add-transaction');
  });
});
