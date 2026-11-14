import { fireEvent, waitFor } from '@testing-library/react-native';
import React from 'react';

jest.mock('expo-router', () => ({
  Stack: { Screen: () => null },
  router: { push: jest.fn(), back: jest.fn(), dismissTo: jest.fn() },
}));
jest.mock('expo-document-picker', () => ({
  getDocumentAsync: jest.fn().mockResolvedValue({ canceled: false, assets: [{ uri: 'file:///cache/hdfc.pdf', name: 'hdfc.pdf' }] }),
}));

const mockCategories = ['Food', 'Transportation', 'Salary', 'Uncategorized'].map((name, i) => ({
  id: i + 1,
  scope: 'finance',
  name,
  colorHex: '#800020',
  iconKey: null,
  isSystem: true,
  sortOrder: i,
}));
jest.mock('@/hooks/useCalendar', () => ({ useCategories: () => ({ categories: mockCategories }) }));

jest.mock('@/database/repositories/transactionRepository', () => ({
  insertImportBatch: jest.fn(() => Promise.resolve(7)),
  listTransactions: jest.fn(() => Promise.resolve([])),
}));

const STATEMENT = `HDFC BANK Ltd.
Opening Balance 10,000.00
01/11/2026 UPI-SWIGGY-swiggy@yesb-YESB0000001-430500000001-Dinner 450.00 9,550.00
02/11/2026 NEFT-ICIC0001234-ACME SALARY 50,000.00 59,550.00
03/11/2026 Misc entry 100.00 70,000.00`;

const mockRead = jest.fn();
jest.mock('@/services/documentTextService', () => {
  const actual = jest.requireActual('@/services/documentTextService');
  return { ...actual, canReadPdfs: () => true, readPdfText: (...args: unknown[]) => mockRead(...args) };
});

import { DocumentReadError } from '@/services/documentTextService';
import ImportStatementScreen from '@/app/finance/import';
import { renderWithTheme } from '../../testUtils';

const mockRepo = jest.requireMock('@/database/repositories/transactionRepository') as { insertImportBatch: jest.Mock };

beforeEach(() => {
  jest.clearAllMocks();
  mockRead.mockResolvedValue(STATEMENT);
});

describe('Import statement screen', () => {
  it('reads a PDF, shows payees for review, and imports the chosen rows', async () => {
    const { getByText, getAllByText, findByText, getByLabelText, queryByText } = await renderWithTheme(<ImportStatementScreen />);
    await fireEvent.press(getByText('Choose statement PDF'));

    expect(await findByText('Swiggy')).toBeTruthy();
    expect(getByText('Acme Salary')).toBeTruthy();
    expect(getByText('HDFC Bank')).toBeTruthy();
    // The unclassifiable row asks the user instead of guessing, and starts unticked.
    expect(getByText("Couldn't tell if this is money in or out")).toBeTruthy();
    expect(getByText('Import 2 transactions')).toBeTruthy();

    // Deciding its direction includes it.
    // The toggle on the review row (the summary card also says "Money out").
    const toggles = getAllByText('Money out');
    await fireEvent.press(toggles[toggles.length - 1]);
    expect(getByText('Import 3 transactions')).toBeTruthy();

    // Unticking one leaves it out.
    await fireEvent.press(getByLabelText('Import Swiggy, ₹450.00'));
    await fireEvent.press(getByText('Import 2 transactions'));

    await waitFor(() => expect(mockRepo.insertImportBatch).toHaveBeenCalled());
    const batch = mockRepo.insertImportBatch.mock.calls[0][0];
    expect(batch).toMatchObject({ fileName: 'hdfc.pdf', bankName: 'HDFC Bank', skippedCount: 1 });
    expect(batch.records.map((r: { description: string; type: string }) => [r.description, r.type])).toEqual([
      ['Acme Salary', 'income'],
      ['Misc Entry', 'expense'],
    ]);
    expect(await findByText('Imported 2 transactions')).toBeTruthy();
    expect(queryByText('Choose statement PDF')).toBeNull();
  });

  it('asks for the password of a locked PDF and retries with it', async () => {
    mockRead.mockRejectedValueOnce(new DocumentReadError('password_required')).mockResolvedValueOnce(STATEMENT);
    const { getByText, findByText, getByLabelText } = await renderWithTheme(<ImportStatementScreen />);
    await fireEvent.press(getByText('Choose statement PDF'));
    expect(await findByText('This PDF is locked')).toBeTruthy();
    await fireEvent.changeText(getByLabelText('PDF password'), 'RAVI0101');
    await fireEvent.press(getByText('Unlock'));
    expect(await findByText('Swiggy')).toBeTruthy();
    expect(mockRead).toHaveBeenLastCalledWith('file:///cache/hdfc.pdf', 'RAVI0101');
  });

  it('explains a wrong password', async () => {
    mockRead.mockRejectedValueOnce(new DocumentReadError('password_required')).mockRejectedValueOnce(new DocumentReadError('incorrect_password'));
    const { getByText, findByText, getByLabelText } = await renderWithTheme(<ImportStatementScreen />);
    await fireEvent.press(getByText('Choose statement PDF'));
    await findByText('This PDF is locked');
    await fireEvent.changeText(getByLabelText('PDF password'), 'wrong');
    await fireEvent.press(getByText('Unlock'));
    expect(await findByText("That password didn't open the PDF. Check it and try again.")).toBeTruthy();
  });

  it('explains scanned PDFs and files with no transactions', async () => {
    mockRead.mockRejectedValueOnce(new DocumentReadError('no_text'));
    const { getByText, findByText } = await renderWithTheme(<ImportStatementScreen />);
    await fireEvent.press(getByText('Choose statement PDF'));
    expect(await findByText(/no readable text/)).toBeTruthy();

    mockRead.mockResolvedValueOnce('Just a letter, no transactions.');
    await fireEvent.press(getByText('Choose statement PDF'));
    expect(await findByText(/No transactions were found/)).toBeTruthy();
  });
});
