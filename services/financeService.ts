import {
  addDays,
  endOfMonth,
  endOfWeek,
  format,
  parse,
  startOfDay,
  startOfMonth,
  startOfWeek,
  subMonths,
} from 'date-fns';

import * as transactionRepository from '@/database/repositories/transactionRepository';
import type { Category } from '@/types/category';
import type {
  CategoryTotal,
  MonthTotal,
  Transaction,
  TransactionDraft,
  TransactionFilters,
  TransactionRecord,
  TransactionType,
} from '@/types/transaction';
import { suggestCategoryName } from '@/utils/categorySuggestion';
import { parseAmountToPaise } from '@/utils/money';
import { ValidationError } from '@/utils/validationUtils';

export const DESCRIPTION_MAX_LENGTH = 200;
export const NOTE_MAX_LENGTH = 500;
export const TREND_MONTHS = 6;

// ---- Dates: transactions are keyed by local calendar day ('yyyy-MM-dd').

export const toDateKey = (date: Date) => format(date, 'yyyy-MM-dd');
export const fromDateKey = (key: string) => parse(key, 'yyyy-MM-dd', new Date());
export const toMonthKey = (date: Date) => format(date, 'yyyy-MM');

export function monthRange(month: Date): { from: string; to: string } {
  return { from: toDateKey(startOfMonth(month)), to: toDateKey(endOfMonth(month)) };
}

/** Latest allowed date: tomorrow (PRD 4.B). Planned payments belong to recurring expenses, not here. */
export function latestAllowedDate(now: Date = new Date()): Date {
  return addDays(startOfDay(now), 1);
}

// ---- Validation

export function validateDraft(draft: TransactionDraft, now: Date = new Date()): TransactionRecord {
  const amount = parseAmountToPaise(draft.amount);
  if (!amount.ok) throw new ValidationError(amount.error);

  if (startOfDay(draft.date) > latestAllowedDate(now)) {
    throw new ValidationError("Dates more than a day ahead aren't allowed. Record a payment once it has happened.");
  }
  if (draft.categoryId === null) throw new ValidationError('Choose a category.');
  if (draft.paymentMethod === null) {
    throw new ValidationError(draft.type === 'income' ? 'Choose how it was received.' : 'Choose how it was paid.');
  }

  const description = draft.description.trim();
  if (description.length > DESCRIPTION_MAX_LENGTH) {
    throw new ValidationError(`Description must be ${DESCRIPTION_MAX_LENGTH} characters or fewer.`);
  }
  const note = draft.note.trim();
  if (note.length > NOTE_MAX_LENGTH) throw new ValidationError(`Note must be ${NOTE_MAX_LENGTH} characters or fewer.`);

  return {
    type: draft.type,
    amountPaise: amount.paise,
    occurredOn: toDateKey(draft.date),
    categoryId: draft.categoryId,
    paymentMethod: draft.paymentMethod,
    description,
    note,
  };
}

export function draftFromTransaction(t: Transaction, amount: string): TransactionDraft {
  return {
    type: t.type,
    amount,
    date: fromDateKey(t.occurredOn),
    categoryId: t.categoryId,
    paymentMethod: t.paymentMethod,
    description: t.description,
    note: t.note,
  };
}

/** Live suggestion while typing a description (PRD 4.D): the matching category's id, if it exists. */
export function suggestCategoryId(description: string, type: TransactionType, categories: Category[]): number | null {
  const name = suggestCategoryName(description, type);
  return (name && categories.find((c) => c.name === name)?.id) || null;
}

// ---- CRUD

export async function createTransaction(draft: TransactionDraft): Promise<number> {
  return transactionRepository.insertTransaction(validateDraft(draft));
}

export async function updateTransaction(id: number, draft: TransactionDraft): Promise<void> {
  await transactionRepository.updateTransaction(id, validateDraft(draft));
}

export const deleteTransaction = transactionRepository.deleteTransaction;
export const getTransaction = transactionRepository.getTransaction;
export const listTransactions = (filters: TransactionFilters = {}) => transactionRepository.listTransactions(filters);

// ---- History filters

export type DateRangePreset = 'all' | 'this_month' | 'last_month' | 'last_90_days';

export const DATE_RANGE_LABELS: Record<DateRangePreset, string> = {
  all: 'All time',
  this_month: 'This month',
  last_month: 'Last month',
  last_90_days: 'Last 90 days',
};

export function rangeForPreset(preset: DateRangePreset, now: Date = new Date()): { from: string | null; to: string | null } {
  switch (preset) {
    case 'this_month':
      return monthRange(now);
    case 'last_month':
      return monthRange(subMonths(now, 1));
    case 'last_90_days':
      return { from: toDateKey(addDays(now, -89)), to: toDateKey(now) };
    default:
      return { from: null, to: null };
  }
}

/** Groups a newest-first list into day sections with each day's net (income − expense). */
export function groupByDay(transactions: Transaction[]): { date: string; netPaise: number; data: Transaction[] }[] {
  const sections: { date: string; netPaise: number; data: Transaction[] }[] = [];
  for (const t of transactions) {
    let section = sections[sections.length - 1];
    if (!section || section.date !== t.occurredOn) {
      section = { date: t.occurredOn, netPaise: 0, data: [] };
      sections.push(section);
    }
    section.data.push(t);
    section.netPaise += t.type === 'income' ? t.amountPaise : -t.amountPaise;
  }
  return sections;
}

// ---- Dashboard (PRD 4.A): every figure is computed live from transactions.

export interface FinanceDashboard {
  hasAnyTransactions: boolean;
  /** Spending relative to today, independent of the selected month. */
  spentTodayPaise: number;
  spentThisWeekPaise: number;
  spentThisMonthPaise: number;
  /** The selected month. */
  incomePaise: number;
  expensePaise: number;
  netPaise: number;
  expenseByCategory: CategoryTotal[];
  /** TREND_MONTHS months ending with the selected one, oldest first, zero-filled. */
  trend: MonthTotal[];
  recent: Transaction[];
}

/** Fills months with no transactions so the trend always has TREND_MONTHS bars. */
export function fillTrend(rows: MonthTotal[], endMonth: Date): MonthTotal[] {
  const byMonth = new Map(rows.map((r) => [r.month, r]));
  return Array.from({ length: TREND_MONTHS }, (_, i) => {
    const key = toMonthKey(subMonths(endMonth, TREND_MONTHS - 1 - i));
    return byMonth.get(key) ?? { month: key, incomePaise: 0, expensePaise: 0 };
  });
}

export async function getDashboard(month: Date, now: Date = new Date()): Promise<FinanceDashboard> {
  const today = toDateKey(now);
  const selected = monthRange(month);
  const trendFrom = toDateKey(startOfMonth(subMonths(month, TREND_MONTHS - 1)));

  const [count, todayTotals, weekTotals, monthNowTotals, selectedTotals, byCategory, byMonth, recent] = await Promise.all([
    transactionRepository.countTransactions(),
    transactionRepository.sumByType(today, today),
    transactionRepository.sumByType(toDateKey(startOfWeek(now)), toDateKey(endOfWeek(now))),
    transactionRepository.sumByType(monthRange(now).from, monthRange(now).to),
    transactionRepository.sumByType(selected.from, selected.to),
    transactionRepository.sumByCategory('expense', selected.from, selected.to),
    transactionRepository.sumByMonth(trendFrom, selected.to),
    transactionRepository.listTransactions({}, 5),
  ]);

  return {
    hasAnyTransactions: count > 0,
    spentTodayPaise: todayTotals.expensePaise,
    spentThisWeekPaise: weekTotals.expensePaise,
    spentThisMonthPaise: monthNowTotals.expensePaise,
    incomePaise: selectedTotals.incomePaise,
    expensePaise: selectedTotals.expensePaise,
    netPaise: selectedTotals.incomePaise - selectedTotals.expensePaise,
    expenseByCategory: byCategory,
    trend: fillTrend(byMonth, month),
    recent,
  };
}

// ---- Home dashboard card (PRD 1.2): only "today" and "this month" aggregates are queried.

export interface FinanceHomeSummary {
  hasAnyTransactions: boolean;
  spentTodayPaise: number;
  todayByCategory: CategoryTotal[];
  monthExpensePaise: number;
  monthIncomePaise: number;
}

export async function getHomeSummary(now: Date = new Date()): Promise<FinanceHomeSummary> {
  const today = toDateKey(now);
  const month = monthRange(now);
  const [count, todayByCategory, monthTotals] = await Promise.all([
    transactionRepository.countTransactions(),
    transactionRepository.sumByCategory('expense', today, today),
    transactionRepository.sumByType(month.from, month.to),
  ]);
  return {
    hasAnyTransactions: count > 0,
    spentTodayPaise: todayByCategory.reduce((sum, c) => sum + c.totalPaise, 0),
    todayByCategory,
    monthExpensePaise: monthTotals.expensePaise,
    monthIncomePaise: monthTotals.incomePaise,
  };
}
