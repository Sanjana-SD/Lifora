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
import type { TransactionDraft } from '@/types/transaction';

let categoryId: Record<string, number>;
const now = new Date();
const key = (d: Date) => format(d, 'yyyy-MM-dd');

const draft = (overrides: Partial<TransactionDraft> = {}): TransactionDraft => ({
  type: 'expense',
  amount: '100',
  date: now,
  categoryId: categoryId.Food,
  paymentMethod: 'cash',
  description: '',
  note: '',
  ...overrides,
});

beforeEach(async () => {
  mockDb = await createTestDatabase();
  const categories = await listCategoriesByScope('finance');
  categoryId = Object.fromEntries(categories.map((c) => [c.name, c.id]));
});

describe('finance (integration)', () => {
  it('migrates to the current schema with transactions and import_history tables', async () => {
    const version = await mockDb.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
    expect(version?.user_version).toBe(CURRENT_SCHEMA_VERSION);
    const tables = await mockDb.getAllAsync<{ name: string }>("SELECT name FROM sqlite_master WHERE type = 'table'");
    expect(tables.map((t) => t.name)).toEqual(expect.arrayContaining(['transactions', 'import_history']));
  });

  it('stores amounts as integer paise and sums them exactly (PRD 4.1: ₹99.99 + ₹0.01 = ₹100.00)', async () => {
    await finance.createTransaction(draft({ amount: '99.99' }));
    await finance.createTransaction(draft({ amount: '0.01' }));
    const raw = await mockDb.getAllAsync<{ amount_paise: number }>('SELECT amount_paise FROM transactions ORDER BY id');
    expect(raw.map((r) => r.amount_paise)).toEqual([9999, 1]);
    const dash = await finance.getDashboard(now, now);
    expect(dash.expensePaise).toBe(10000);
    expect(dash.spentTodayPaise).toBe(10000);
  });

  it('creates, reads, updates and deletes a transaction', async () => {
    const id = await finance.createTransaction(
      draft({ amount: '149.50', description: '  Lunch  ', note: 'with team', paymentMethod: 'google_pay' }),
    );
    let t = await finance.getTransaction(id);
    expect(t).toMatchObject({ type: 'expense', amountPaise: 14950, description: 'Lunch', note: 'with team', paymentMethod: 'google_pay', occurredOn: key(now) });

    await finance.updateTransaction(id, draft({ type: 'income', amount: '2000', categoryId: categoryId.Salary, paymentMethod: 'bank_transfer' }));
    t = await finance.getTransaction(id);
    expect(t).toMatchObject({ type: 'income', amountPaise: 200000, categoryId: categoryId.Salary });

    await finance.deleteTransaction(id);
    expect(await finance.getTransaction(id)).toBeNull();
  });

  it.each([
    [{ amount: '' }, 'Enter an amount.'],
    [{ amount: '0' }, 'Amount must be more than zero.'],
    [{ categoryId: null }, 'Choose a category.'],
    [{ paymentMethod: null }, 'Choose how it was paid.'],
    [{ type: 'income' as const, paymentMethod: null }, 'Choose how it was received.'],
    [{ description: 'x'.repeat(201) }, 'Description must be 200 characters or fewer.'],
    [{ note: 'x'.repeat(501) }, 'Note must be 500 characters or fewer.'],
  ])('rejects %p', async (overrides, message) => {
    await expect(finance.createTransaction(draft(overrides))).rejects.toThrow(message);
    expect(await finance.listTransactions()).toHaveLength(0);
  });

  it('allows dates up to tomorrow but not later (PRD 4.B)', async () => {
    await expect(finance.createTransaction(draft({ date: addDays(now, 1) }))).resolves.toBeGreaterThan(0);
    await expect(finance.createTransaction(draft({ date: addDays(now, 2) }))).rejects.toThrow(/more than a day ahead/);
    await expect(finance.createTransaction(draft({ date: subMonths(now, 14) }))).resolves.toBeGreaterThan(0);
  });

  it('filters history by search, type, category, payment method and date range, newest first', async () => {
    await finance.createTransaction(draft({ description: 'Swiggy dinner', amount: '450', date: addDays(now, -1) }));
    await finance.createTransaction(draft({ description: 'Uber', amount: '220', categoryId: categoryId.Transportation, paymentMethod: 'paytm' }));
    await finance.createTransaction(draft({ type: 'income', description: 'Salary', amount: '50000', categoryId: categoryId.Salary, paymentMethod: 'bank_transfer', date: subMonths(now, 2) }));
    await finance.createTransaction(draft({ description: '50% off sale', note: 'shoes', categoryId: categoryId.Shopping }));

    const titles = async (f: Parameters<typeof finance.listTransactions>[0]) =>
      (await finance.listTransactions(f)).map((t) => t.description);

    expect(await titles({})).toEqual(['50% off sale', 'Uber', 'Swiggy dinner', 'Salary']);
    expect(await titles({ search: 'swig' })).toEqual(['Swiggy dinner']);
    expect(await titles({ search: 'SHOES' })).toEqual(['50% off sale']);
    expect(await titles({ search: '50%' })).toEqual(['50% off sale']);
    expect(await titles({ search: '%' })).toEqual(['50% off sale']);
    expect(await titles({ type: 'income' })).toEqual(['Salary']);
    expect(await titles({ categoryId: categoryId.Transportation })).toEqual(['Uber']);
    expect(await titles({ paymentMethod: 'paytm' })).toEqual(['Uber']);
    expect(await titles({ ...finance.rangeForPreset('this_month', now) })).not.toContain('Salary');
  });

  it('builds the dashboard from live data: period totals, category breakdown, 6-month trend, recent', async () => {
    await finance.createTransaction(draft({ amount: '300', categoryId: categoryId.Food }));
    await finance.createTransaction(draft({ amount: '200', categoryId: categoryId.Food }));
    await finance.createTransaction(draft({ amount: '1000', categoryId: categoryId.Rent }));
    await finance.createTransaction(draft({ type: 'income', amount: '5000', categoryId: categoryId.Salary, paymentMethod: 'bank_transfer' }));
    await finance.createTransaction(draft({ amount: '700', date: subMonths(now, 2) }));
    await finance.createTransaction(draft({ amount: '999', date: subMonths(now, 7) }));

    const d = await finance.getDashboard(now, now);
    expect(d.hasAnyTransactions).toBe(true);
    expect(d.incomePaise).toBe(500000);
    expect(d.expensePaise).toBe(150000);
    expect(d.netPaise).toBe(350000);
    expect(d.expenseByCategory).toEqual([
      { categoryId: categoryId.Rent, totalPaise: 100000, count: 1 },
      { categoryId: categoryId.Food, totalPaise: 50000, count: 2 },
    ]);
    expect(d.trend).toHaveLength(finance.TREND_MONTHS);
    expect(d.trend[5]).toEqual({ month: finance.toMonthKey(now), incomePaise: 500000, expensePaise: 150000 });
    expect(d.trend[3]).toEqual({ month: finance.toMonthKey(subMonths(now, 2)), incomePaise: 0, expensePaise: 70000 });
    expect(d.trend.map((m) => m.expensePaise)).not.toContain(99900); // 7 months ago is outside the window
    expect(d.recent).toHaveLength(5);

    const earlier = await finance.getDashboard(subMonths(now, 2), now);
    expect(earlier.expensePaise).toBe(70000);
    expect(earlier.spentTodayPaise).toBe(150000); // "today" tiles ignore the selected month
  });

  it('reports an empty dashboard honestly', async () => {
    const d = await finance.getDashboard(now, now);
    expect(d).toMatchObject({ hasAnyTransactions: false, incomePaise: 0, expensePaise: 0, netPaise: 0, expenseByCategory: [], recent: [] });
    expect(d.trend.every((m) => m.expensePaise === 0 && m.incomePaise === 0)).toBe(true);
  });

  it("summarises today's spending by category for Home", async () => {
    await finance.createTransaction(draft({ amount: '120', categoryId: categoryId.Food }));
    await finance.createTransaction(draft({ amount: '80', categoryId: categoryId.Transportation }));
    await finance.createTransaction(draft({ amount: '500', date: addDays(now, -40) }));
    const s = await finance.getHomeSummary(now);
    expect(s.spentTodayPaise).toBe(20000);
    expect(s.todayByCategory.map((c) => c.categoryId)).toEqual([categoryId.Food, categoryId.Transportation]);
  });

  it('keeps transactions when their category is deleted', async () => {
    const id = await finance.createTransaction(draft({ categoryId: categoryId.Food }));
    await mockDb.runAsync('DELETE FROM categories WHERE id = ?', [categoryId.Food]);
    expect((await finance.getTransaction(id))?.categoryId).toBeNull();
  });

  it('suggests a category id from the description', async () => {
    const categories = await listCategoriesByScope('finance');
    expect(finance.suggestCategoryId('zomato', 'expense', categories)).toBe(categoryId.Food);
    expect(finance.suggestCategoryId('random', 'expense', categories)).toBeNull();
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
});
