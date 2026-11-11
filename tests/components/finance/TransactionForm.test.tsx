import { fireEvent } from '@testing-library/react-native';
import React from 'react';

const CATEGORIES = [
  { id: 1, scope: 'finance', name: 'Food', colorHex: '#D97706', iconKey: null, isSystem: true, sortOrder: 0 },
  { id: 2, scope: 'finance', name: 'Transportation', colorHex: '#2563EB', iconKey: null, isSystem: true, sortOrder: 1 },
  { id: 3, scope: 'finance', name: 'Salary', colorHex: '#2F6F4F', iconKey: null, isSystem: true, sortOrder: 2 },
];
jest.mock('@/hooks/useCalendar', () => ({
  useCategories: () => ({ categories: CATEGORIES }),
}));

import { TransactionForm } from '@/components/finance/TransactionForm';
import type { TransactionDraft } from '@/types/transaction';
import { ValidationError } from '@/utils/validationUtils';
import { renderWithTheme } from '../../testUtils';

const blank: TransactionDraft = {
  type: 'expense',
  amount: '',
  date: new Date(),
  categoryId: null,
  paymentMethod: null,
  description: '',
  note: '',
};

async function setup(initial: TransactionDraft = blank, onSubmit = jest.fn().mockResolvedValue(undefined)) {
  const utils = await renderWithTheme(<TransactionForm initial={initial} submitLabel="Save transaction" onSubmit={onSubmit} />);
  return { ...utils, onSubmit };
}

describe('TransactionForm', () => {
  it('suggests a category from the description and saves with it (PRD 4.D)', async () => {
    const { getByLabelText, getByText, onSubmit } = await setup();
    await fireEvent.changeText(getByLabelText('Amount'), '149.50');
    await fireEvent.changeText(getByLabelText('Description'), 'Swiggy dinner');
    expect(getByText(/Suggested from the description/)).toBeTruthy();
    await fireEvent.press(getByText('Cash'));
    await fireEvent.press(getByText('Save transaction'));
    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({ amount: '149.50', description: 'Swiggy dinner', categoryId: 1, paymentMethod: 'cash' }),
    );
  });

  it('stops following the description once the user picks a category', async () => {
    const { getByLabelText, getByText, queryByText, onSubmit } = await setup();
    await fireEvent.changeText(getByLabelText('Amount'), '80');
    await fireEvent.changeText(getByLabelText('Description'), 'Swiggy');
    await fireEvent.press(getByLabelText('Category: Transportation'));
    expect(queryByText(/Suggested from the description/)).toBeNull();
    await fireEvent.changeText(getByLabelText('Description'), 'Zomato');
    await fireEvent.press(getByText('Cash'));
    await fireEvent.press(getByText('Save transaction'));
    expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({ categoryId: 2 }));
  });

  it('only accepts digits and one decimal point with two places in the amount', async () => {
    const { getByLabelText } = await setup();
    await fireEvent.changeText(getByLabelText('Amount'), '₹1,2a3.456');
    expect(getByLabelText('Amount').props.value).toBe('123.45');
  });

  it('switches the payment label and suggestions for income', async () => {
    const { getByLabelText, getByText, onSubmit } = await setup();
    await fireEvent.press(getByText('Income'));
    expect(getByText('Received via')).toBeTruthy();
    await fireEvent.changeText(getByLabelText('Amount'), '50000');
    await fireEvent.changeText(getByLabelText('Description'), 'Salary November');
    await fireEvent.press(getByText('Bank Transfer'));
    await fireEvent.press(getByText('Save transaction'));
    expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({ type: 'income', categoryId: 3, paymentMethod: 'bank_transfer' }));
  });

  it("shows the service's validation message", async () => {
    const onSubmit = jest.fn().mockRejectedValue(new ValidationError('Choose a category.'));
    const { getByText } = await setup(blank, onSubmit);
    await fireEvent.press(getByText('Save transaction'));
    expect(getByText('Choose a category.')).toBeTruthy();
  });

  it('keeps an existing category when editing', async () => {
    const { getByText, queryByText, onSubmit } = await setup({ ...blank, amount: '220', description: 'Swiggy', categoryId: 2, paymentMethod: 'paytm' });
    expect(queryByText(/Suggested from the description/)).toBeNull();
    await fireEvent.press(getByText('Save transaction'));
    expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({ categoryId: 2, paymentMethod: 'paytm', amount: '220' }));
  });
});
