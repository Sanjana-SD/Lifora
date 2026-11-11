import { fireEvent } from '@testing-library/react-native';
import React from 'react';

jest.mock('expo-router', () => ({ router: { push: jest.fn() } }));

import { router } from 'expo-router';

import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { renderWithTheme } from '../../testUtils';

describe('DashboardHeader', () => {
  it('renders a greeting and a formatted date', async () => {
    const { getByText } = await renderWithTheme(<DashboardHeader />);
    const greetings = ['Good morning', 'Good afternoon', 'Good evening', 'Good night'];
    const matches = greetings.filter((g) => {
      try {
        getByText(g);
        return true;
      } catch {
        return false;
      }
    });
    expect(matches.length).toBe(1);
  });

  it('has a Calculator shortcut', async () => {
    const { getByLabelText } = await renderWithTheme(<DashboardHeader />);
    await fireEvent.press(getByLabelText('Open Calculator'));
    expect(router.push).toHaveBeenCalledWith('/calculator');
  });
});
