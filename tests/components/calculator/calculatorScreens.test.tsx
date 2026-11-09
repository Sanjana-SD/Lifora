import { fireEvent } from '@testing-library/react-native';
import React from 'react';

jest.mock('expo-router', () => ({
  Stack: { Screen: () => null },
  router: { push: jest.fn(), back: jest.fn() },
}));
jest.mock('expo-clipboard', () => ({ setStringAsync: jest.fn().mockResolvedValue(true) }));
jest.mock('@/services/calculationHistoryService', () => ({
  recordCalculation: jest.fn().mockResolvedValue(undefined),
}));

import * as Clipboard from 'expo-clipboard';

import BasicCalculator from '@/app/calculator/index';
import { recordCalculation } from '@/services/calculationHistoryService';
import { renderWithTheme } from '../../testUtils';

const record = recordCalculation as jest.Mock;

beforeEach(() => jest.clearAllMocks());

async function pressKeys(getByLabelText: (l: string) => unknown, labels: string[]) {
  for (const label of labels) {
    await fireEvent.press(getByLabelText(label) as never);
  }
}

describe('Basic calculator screen', () => {
  it('shows "Cannot divide by zero" instead of crashing (PRD 6.1)', async () => {
    const { getByLabelText, getByText } = await renderWithTheme(<BasicCalculator />);
    await pressKeys(getByLabelText, ['1', '0', 'Divide', '0', 'Equals']);
    expect(getByText('Cannot divide by zero')).toBeTruthy();
    expect(record).not.toHaveBeenCalled();

    // Still usable afterwards
    await pressKeys(getByLabelText, ['Delete', '4', 'Equals']);
    expect(getByLabelText('Expression').props.children).toBe('2.5');
  });

  it('shows a live preview, evaluates, and records history', async () => {
    const { getByLabelText } = await renderWithTheme(<BasicCalculator />);
    await pressKeys(getByLabelText, ['1', '2', 'Multiply', '3']);
    expect(getByLabelText('Preview').props.children).toBe('= 36');

    await pressKeys(getByLabelText, ['Equals']);
    expect(getByLabelText('Expression').props.children).toBe('36');
    expect(record).toHaveBeenCalledWith('basic', { expression: '12×3' }, '12×3 = 36', '36');
  });

  it('computes exact decimals and phone-style percent', async () => {
    const { getByLabelText } = await renderWithTheme(<BasicCalculator />);
    await pressKeys(getByLabelText, ['0', 'Decimal point', '1', 'Plus', '0', 'Decimal point', '2', 'Equals']);
    expect(getByLabelText('Expression').props.children).toBe('0.3');

    await pressKeys(getByLabelText, ['Clear', '2', '0', '0', 'Plus', '1', '0', 'Percent', 'Equals']);
    expect(getByLabelText('Expression').props.children).toBe('220');
  });

  it('copies the result', async () => {
    const { getByLabelText } = await renderWithTheme(<BasicCalculator />);
    await pressKeys(getByLabelText, ['3', 'Minus', '5', 'Equals']);
    await fireEvent.press(getByLabelText('Copy result'));
    expect(Clipboard.setStringAsync).toHaveBeenCalledWith('-2');
  });
});
