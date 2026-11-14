import { addDays, format, subMonths } from 'date-fns';
import type { SQLiteDatabase } from 'expo-sqlite';

import { createTestDatabase } from '../helpers/testDatabase';

let mockDb: SQLiteDatabase;
jest.mock('@/database/database', () => ({
  getDatabase: () => Promise.resolve(mockDb),
}));

import { listCategoriesByScope } from '@/database/repositories/categoryRepository';
import { CURRENT_SCHEMA_VERSION } from '@/database/schema';
import * as finance from '@/services/financeService';
import type { Category } from '@/types/category';
import { parseStatementText } from '@/utils/statementParser';

let categories: Category[];
let categoryId: Record<string, number>;
const now = new Date();
const d = (offset: number) => format(addDays(now, offset), 'dd/MM/yyyy');
const key = (offset: number) => format(addDays(now, offset), 'yyyy-MM-dd');

/** A statement in HDFC's layout, dated relative to today. */
const statement = () => `HDFC BANK Ltd.
Opening Balance 50,000.00
${d(-3)} UPI-SWIGGY-swiggy@yesb-YESB0000001-430500000001-Dinner 450.00 49,550.00
${d(-2)} NEFT-ICIC0001234-ACME SALARY NOVEMBER 85,000.00 1,34,550.00
${d(-1)} UPI-UBER INDIA-uber@hdfcbank-HDFC0000001-430500000002-Ride 220.50 1,34,329.50
${d(0)} UPI-ZOMATO-zomato@hdfc-HDFC0000002-430500000003-Lunch 99.99 1,34,229.51
${d(0)} UPI-ZOMATO-zomato@hdfc-HDFC0000002-430500000004-Snack 0.01 1,34,229.50`;

async function importText(text: string, fileName = 'statement.pdf') {
  const parsed = parseStatementText(text, now);
  const candidates = await finance.prepareImport(parsed, categories);
  return { parsed, candidates, result: await finance.commitImport({ fileName, bankName: parsed.bankName, candidates }) };
}

beforeEach(async () => {
  mockDb = await createTestDatabase();
  categories = await listCategoriesByScope('finance');
  categoryId = Object.fromEntries(categories.map((c) => [c.name, c.id]));
});

describe('finance import (integration)', () => {
  it('migrates to the current schema with transactions and import_history tables', async () => {
    const version = await mockDb.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
    expect(version?.user_version).toBe(CURRENT_SCHEMA_VERSION);
    const tables = await mockDb.getAllAsync<{ name: string }>("SELECT name FROM sqlite_master WHERE type = 'table'");
    expect(tables.map((t) => t.name)).toEqual(expect.arrayContaining(['transactions', 'import_history']));
  });

  it('imports a statement: payees, categories, references, and an import record', async () => {
    const { result } = await importText(statement());
    expect(result.imported).toBe(5);

    const saved = await finance.listTransactions();
    const swiggy = saved.find((t) => t.description === 'Swiggy')!;
    expect(swiggy).toMatchObject({
      type: 'expense',
      amountPaise: 45000,
      occurredOn: key(-3),
      categoryId: categoryId.Food,
      paymentMethod: 'bank_transfer',
      source: 'import',
      externalReference: '430500000001',
      importHistoryId: result.importId,
    });
    expect(swiggy.note).toContain('UPI-SWIGGY');
    expect(saved.find((t) => t.amountPaise === 8500000)).toMatchObject({ type: 'income', categoryId: categoryId.Salary });

    const last = await finance.getLastImport();
    expect(last).toMatchObject({ fileName: 'statement.pdf', bankName: 'HDFC Bank', importedCount: 5, skippedCount: 0 });
  });

  it('sums imported paise exactly (PRD 4.1: ₹99.99 + ₹0.01 = ₹100.00)', async () => {
    await importText(statement());
    const dash = await finance.getDashboard(now, now);
    expect(dash.spentTodayPaise).toBe(10000);
  });

  it('flags a re-imported statement as duplicates, unchecked by default (PRD 4.C.3)', async () => {
    await importText(statement());
    const again = await finance.prepareImport(parseStatementText(statement(), now), categories);
    expect(again.every((c) => c.duplicate && !c.selected)).toBe(true);
    await expect(finance.commitImport({ fileName: 'again.pdf', bankName: null, candidates: again })).rejects.toThrow(
      'Choose at least one transaction to import.',
    );
    expect(await finance.listTransactions()).toHaveLength(5);
  });

  it('still lets the user import a suspected duplicate deliberately', async () => {
    await importText(statement());
    const again = await finance.prepareImport(parseStatementText(statement(), now), categories);
    again[0].selected = true;
    await finance.commitImport({ fileName: 'again.pdf', bankName: null, candidates: again });
    const rows = await mockDb.getAllAsync<{ n: number }>('SELECT COUNT(*) AS n FROM transactions WHERE is_duplicate_reviewed = 0');
    expect(rows[0].n).toBe(1);
  });

  it('never imports a row whose direction is unknown until the user decides', async () => {
    const text = `Some Bank\n${d(-1)} Misc entry 500.00 9,500.00`;
    const parsed = parseStatementText(text, now);
    const candidates = await finance.prepareImport(parsed, categories);
    expect(candidates[0]).toMatchObject({ type: null, selected: false });
    expect(finance.canImport(candidates[0])).toBe(false);
    candidates[0].selected = true;
    await expect(finance.commitImport({ fileName: 'x.pdf', bankName: null, candidates })).rejects.toThrow();
    candidates[0].type = 'expense';
    await expect(finance.commitImport({ fileName: 'x.pdf', bankName: null, candidates })).resolves.toMatchObject({ imported: 1 });
  });

  it('writes an import all-or-nothing', async () => {
    const parsed = parseStatementText(statement(), now);
    const candidates = await finance.prepareImport(parsed, categories);
    candidates[2].categoryId = 999999; // violates the category foreign key
    await expect(finance.commitImport({ fileName: 'bad.pdf', bankName: null, candidates })).rejects.toThrow();
    expect(await finance.listTransactions()).toHaveLength(0);
    expect(await finance.getLastImport()).toBeNull();
  });

  it('lets the user correct direction, category and payee after import', async () => {
    await importText(statement());
    const uber = (await finance.listTransactions({ search: 'uber' }))[0];
    await finance.updateTransactionDetails(uber.id, { type: 'income', categoryId: categoryId.Travel, description: '  Uber refund ' });
    expect(await finance.getTransaction(uber.id)).toMatchObject({ type: 'income', categoryId: categoryId.Travel, description: 'Uber refund' });
    await expect(finance.updateTransactionDetails(uber.id, { type: 'income', categoryId: null, description: ' ' })).rejects.toThrow(
      "Payee name can't be empty.",
    );
    await finance.deleteTransaction(uber.id);
    expect(await finance.getTransaction(uber.id)).toBeNull();
  });

  it('filters history by search, type, category and date range', async () => {
    await importText(statement());
    const names = async (f: Parameters<typeof finance.listTransactions>[0]) =>
      (await finance.listTransactions(f)).map((t) => t.description);
    expect(await names({ search: 'swig' })).toEqual(['Swiggy']);
    expect(await names({ search: 'Dinner' })).toEqual(['Swiggy']); // matches the bank narration too
    expect(await names({ type: 'income' })).toEqual(['Acme Salary November']);
    expect(await names({ categoryId: categoryId.Food })).toHaveLength(3);
    expect(await names({ from: key(0), to: key(0) })).toEqual(['Zomato', 'Zomato']);
  });

  it('builds the dashboard from live data: totals, categories, payees, daily and monthly series', async () => {
    await importText(statement());
    const dash = await finance.getDashboard(now, now);
    const inMonth = (offset: number) => addDays(now, offset).getMonth() === now.getMonth();
    expect(dash.hasAnyTransactions).toBe(true);
    expect(dash.lastImport?.importedCount).toBe(5);
    if ([-3, -2, -1].every(inMonth)) {
      expect(dash.incomePaise).toBe(8500000);
      expect(dash.expensePaise).toBe(45000 + 22050 + 10000);
      expect(dash.netPaise).toBe(8500000 - 77050);
      expect(dash.topPayees[0]).toEqual({ name: 'Swiggy', totalPaise: 45000, count: 1 });
      expect(dash.topPayees.find((p) => p.name === 'Zomato')).toEqual({ name: 'Zomato', totalPaise: 10000, count: 2 });
    }
    expect(dash.daily).toHaveLength(new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate());
    expect(dash.daily.find((x) => x.date === key(0))?.expensePaise).toBe(10000);
    expect(dash.trend).toHaveLength(finance.TREND_MONTHS);
    expect(dash.trend[5].month).toBe(finance.toMonthKey(now));
    expect(dash.recent).toHaveLength(5);

    const earlier = await finance.getDashboard(subMonths(now, 3), now);
    expect(earlier.expensePaise).toBe(0);
    expect(earlier.spentTodayPaise).toBe(10000); // "today" tiles ignore the selected month
  });

  it('reports an empty dashboard honestly', async () => {
    const dash = await finance.getDashboard(now, now);
    expect(dash).toMatchObject({ hasAnyTransactions: false, lastImport: null, incomePaise: 0, expensePaise: 0, recent: [], topPayees: [] });
  });

  it("summarises today's spending by category for Home", async () => {
    await importText(statement());
    const s = await finance.getHomeSummary(now);
    expect(s.spentTodayPaise).toBe(10000);
    expect(s.todayByCategory.map((c) => c.categoryId)).toEqual([categoryId.Food]);
    expect(s.lastImport?.fileName).toBe('statement.pdf');
  });

  it('keeps transactions when their category is deleted', async () => {
    await importText(statement());
    await mockDb.runAsync('DELETE FROM categories WHERE id = ?', [categoryId.Food]);
    expect((await finance.listTransactions({ search: 'swiggy' }))[0].categoryId).toBeNull();
  });

  it('groups history into day sections with each day’s net', () => {
    const t = (id: number, occurredOn: string, type: 'income' | 'expense', amountPaise: number) =>
      ({ id, occurredOn, type, amountPaise }) as never;
    const sections = finance.groupByDay([t(1, '2026-11-11', 'expense', 500), t(2, '2026-11-11', 'income', 2000), t(3, '2026-11-10', 'expense', 100)]);
    expect(sections.map((s) => [s.date, s.netPaise, s.data.length])).toEqual([
      ['2026-11-11', 1500, 2],
      ['2026-11-10', -100, 1],
    ]);
  });

  it('matches narrations across downloads despite spacing differences', () => {
    expect(finance.similarNarration('UPI-SWIGGY-swiggy@yesb-Dinner', 'UPI - SWIGGY - swiggy@yesb - Dinner')).toBe(true);
    expect(finance.similarNarration('UPI-SWIGGY-Dinner', 'NEFT-ACME-Salary')).toBe(false);
  });
});
