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
import DiscountCalculator from '@/app/calculator/discount';
import EmiCalculator from '@/app/calculator/emi';
import GstCalculator from '@/app/calculator/gst';
import SplitBill from '@/app/calculator/split-bill';
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

  it('copies the result', async () => {
    const { getByLabelText } = await renderWithTheme(<BasicCalculator />);
    await pressKeys(getByLabelText, ['3', 'Minus', '5', 'Equals']);
    await fireEvent.press(getByLabelText('Copy result'));
    expect(Clipboard.setStringAsync).toHaveBeenCalledWith('-2');
  });
});

describe('EMI calculator screen', () => {
  it('computes the PRD reference EMI from typed inputs', async () => {
    const { getByLabelText, getByText } = await renderWithTheme(<EmiCalculator />);
    await fireEvent.changeText(getByLabelText('Loan amount'), '500000');
    await fireEvent.changeText(getByLabelText('Interest rate (per year)'), '9');
    await fireEvent.changeText(getByLabelText('Loan tenure'), '5');
    expect(getByLabelText('Monthly EMI: ₹10,379.18')).toBeTruthy();
    expect(getByText('60')).toBeTruthy();
  });

  it('switches tenure units', async () => {
    const { getByLabelText, getByText } = await renderWithTheme(<EmiCalculator />);
    await fireEvent.changeText(getByLabelText('Loan amount'), '500000');
    await fireEvent.changeText(getByLabelText('Interest rate (per year)'), '9');
    await fireEvent.changeText(getByLabelText('Loan tenure'), '60');
    await fireEvent.press(getByText('Months'));
    expect(getByLabelText('Monthly EMI: ₹10,379.18')).toBeTruthy();
  });

  it('shows validation errors and no result for bad input', async () => {
    const { getByLabelText, getByText, queryByText } = await renderWithTheme(<EmiCalculator />);
    await fireEvent.changeText(getByLabelText('Loan amount'), '0');
    await fireEvent.changeText(getByLabelText('Interest rate (per year)'), '75');
    await fireEvent.changeText(getByLabelText('Loan tenure'), '2.5');
    expect(getByText('Enter an amount greater than zero.')).toBeTruthy();
    expect(getByText("Percentage can't exceed 50%.")).toBeTruthy();
    expect(getByText('Enter a whole number of years.')).toBeTruthy();
    expect(queryByText('Monthly EMI')).toBeNull();
  });

  it('saves to history with inputs', async () => {
    const { getByLabelText } = await renderWithTheme(<EmiCalculator />);
    await fireEvent.changeText(getByLabelText('Loan amount'), '500000');
    await fireEvent.changeText(getByLabelText('Interest rate (per year)'), '9');
    await fireEvent.changeText(getByLabelText('Loan tenure'), '5');
    await fireEvent.press(getByLabelText('Save to history'));
    expect(record).toHaveBeenCalledWith(
      'emi',
      { principalPaise: 50_000_000, annualRateBp: 900, months: 60 },
      expect.stringContaining('₹10,379.18'),
      '10379.18',
    );
  });
});

describe('GST calculator screen', () => {
  it('removes GST from an inclusive amount', async () => {
    const { getByLabelText, getByText } = await renderWithTheme(<GstCalculator />);
    await fireEvent.press(getByText('Remove GST'));
    await fireEvent.changeText(getByLabelText('Amount (including GST)'), '1180');
    expect(getByLabelText('Amount before GST: ₹1,000.00')).toBeTruthy();
    expect(getByText('CGST (9%)')).toBeTruthy();
  });

  it('accepts a custom rate', async () => {
    const { getByLabelText, getByText } = await renderWithTheme(<GstCalculator />);
    await fireEvent.changeText(getByLabelText('Amount (before GST)'), '1000');
    await fireEvent.press(getByText('Custom'));
    await fireEvent.changeText(getByLabelText('Custom rate'), '3');
    expect(getByLabelText('Total with GST: ₹1,030.00')).toBeTruthy();
  });
});

describe('Discount calculator screen', () => {
  it('applies a percentage and rejects a flat discount above the price', async () => {
    const { getByLabelText, getByText, queryByLabelText } = await renderWithTheme(<DiscountCalculator />);
    await fireEvent.changeText(getByLabelText('Original price'), '2499');
    await fireEvent.changeText(getByLabelText('Discount'), '20');
    expect(getByLabelText('Final price: ₹1,999.20')).toBeTruthy();

    await fireEvent.press(getByText('Amount off'));
    await fireEvent.changeText(getByLabelText('Discount amount'), '3000');
    expect(getByText("The discount can't be more than the price.")).toBeTruthy();
    expect(queryByLabelText(/Final price/)).toBeNull();
  });
});

describe('Split bill screen', () => {
  it('splits ₹1,000 three ways so the shares add up exactly (PRD 6.1)', async () => {
    const { getByLabelText, getByText } = await renderWithTheme(<SplitBill />);
    await fireEvent.changeText(getByLabelText('Total bill'), '1000');
    await fireEvent.press(getByLabelText('More people'));
    expect(getByLabelText('3 people')).toBeTruthy();
    expect(getByLabelText('Each pays: ₹333.34')).toBeTruthy();
    expect(getByText(/1 person pays ₹333.34 · 2 pay ₹333.33/)).toBeTruthy();
  });

  it('tracks remaining and over-assigned amounts in custom mode', async () => {
    const { getByLabelText, getByText } = await renderWithTheme(<SplitBill />);
    await fireEvent.changeText(getByLabelText('Total bill'), '1000');
    await fireEvent.press(getByText('Custom amounts'));
    await fireEvent.changeText(getByLabelText('Person 1'), '400');
    expect(getByText('₹600.00 left to assign')).toBeTruthy();
    await fireEvent.changeText(getByLabelText('Person 2'), '700');
    expect(getByText('Over by ₹100.00')).toBeTruthy();
    await fireEvent.changeText(getByLabelText('Person 2'), '600');
    expect(getByLabelText('Balanced: ₹1,000.00')).toBeTruthy();
  });

  it('never goes below one person', async () => {
    const { getByLabelText } = await renderWithTheme(<SplitBill />);
    await fireEvent.press(getByLabelText('Fewer people'));
    await fireEvent.press(getByLabelText('Fewer people'));
    expect(getByLabelText('1 person')).toBeTruthy();
  });
});
