import { addDays, endOfMonth, endOfWeek, format, parse, startOfMonth, startOfWeek, subMonths } from 'date-fns';

import type { PaymentMethod } from '@/constants/paymentMethods';
import * as transactionRepository from '@/database/repositories/transactionRepository';
import type { Category } from '@/types/category';
import type {
  CategoryTotal,
  DayTotal,
  ImportSummary,
  MonthTotal,
  PayeeTotal,
  Transaction,
  TransactionEdit,
  TransactionFilters,
  TransactionRecord,
  TransactionType,
} from '@/types/transaction';
import { suggestCategoryName } from '@/utils/categorySuggestion';
import { parseStatementText, type ParsedRow, type ParsedStatement } from '@/utils/statementParser';
import { ValidationError } from '@/utils/validationUtils';
import { readPdfText } from './documentTextService';

// Finance is fed only by bank statements: transactions are imported from a
// PDF the user downloads from net banking, reviewed, then saved. Nothing is
// typed in by hand, so every figure traces back to the bank's own record.

export const PAYEE_MAX_LENGTH = 60;
export const NOTE_MAX_LENGTH = 500;
export const TREND_MONTHS = 6;

// ---- Dates: transactions are keyed by local calendar day ('yyyy-MM-dd').

export const toDateKey = (date: Date) => format(date, 'yyyy-MM-dd');
export const fromDateKey = (key: string) => parse(key, 'yyyy-MM-dd', new Date());
export const toMonthKey = (date: Date) => format(date, 'yyyy-MM');

export function monthRange(month: Date): { from: string; to: string } {
  return { from: toDateKey(startOfMonth(month)), to: toDateKey(endOfMonth(month)) };
}

// ---- Import

export interface ImportCandidate {
  key: string;
  row: ParsedRow;
  /** Starts as the parsed direction; the user sets it for rows needing review. */
  type: TransactionType | null;
  categoryId: number | null;
  /** Matches a transaction already saved (same day, amount and narration). */
  duplicate: boolean;
  /** Checked for import. Duplicates and rows needing review start unchecked. */
  selected: boolean;
}

/** Reads a statement PDF on the device. Throws DocumentReadError (password, scanned, unsupported). */
export async function readStatement(uri: string, password?: string): Promise<ParsedStatement> {
  return parseStatementText(await readPdfText(uri, password));
}

/** Category for a statement line: keyword rules first, then channel defaults, else Uncategorized. */
export function suggestCategoryFor(row: ParsedRow, type: TransactionType | null, categories: Category[]): number | null {
  const byName = (name: string) => categories.find((c) => c.name === name)?.id ?? null;
  const name =
    suggestCategoryName(`${row.counterparty} ${row.narration}`, type ?? 'expense') ??
    (row.channel === 'ATM' ? 'Transfers' : row.channel === 'Charges' ? 'Bills and Utilities' : null);
  return (name && byName(name)) || byName('Uncategorized');
}

const tokens = (s: string) => new Set(s.toLowerCase().split(/[^a-z0-9]+/).filter((t) => t.length > 1));

/** Same narration, allowing for spacing and punctuation differences between downloads. */
export function similarNarration(a: string, b: string): boolean {
  const ta = tokens(a);
  const tb = tokens(b);
  if (ta.size === 0 || tb.size === 0) return false;
  let shared = 0;
  ta.forEach((t) => {
    if (tb.has(t)) shared += 1;
  });
  return shared / Math.min(ta.size, tb.size) >= 0.8;
}

/** PRD 4.C.3: exact date and amount, and a matching reference or near-identical narration. */
export function isDuplicate(row: ParsedRow, type: TransactionType | null, existing: Transaction[]): boolean {
  return existing.some(
    (t) =>
      t.occurredOn === row.date &&
      t.amountPaise === row.amountPaise &&
      (type === null || t.type === type) &&
      ((row.reference !== null && t.externalReference === row.reference) || similarNarration(t.note, row.narration)),
  );
}

export async function prepareImport(statement: ParsedStatement, categories: Category[]): Promise<ImportCandidate[]> {
  const existing =
    statement.periodFrom && statement.periodTo
      ? await transactionRepository.listTransactions({ from: statement.periodFrom, to: statement.periodTo })
      : [];
  return statement.rows.map((row, i) => {
    const duplicate = isDuplicate(row, row.type, existing);
    return {
      key: `${i}`,
      row,
      type: row.type,
      categoryId: suggestCategoryFor(row, row.type, categories),
      duplicate,
      selected: !duplicate && row.reviewReason === null,
    };
  });
}

/** A row can be imported once its direction is known and its date isn't in the future. */
export const canImport = (c: ImportCandidate) => c.type !== null && !/future/.test(c.row.reviewReason ?? '');

function paymentMethodFor(row: ParsedRow): PaymentMethod {
  // A label only (PRD 4.B): UPI is never assumed to be any particular app.
  return row.channel === 'Card' ? 'card' : 'bank_transfer';
}

export async function commitImport(input: {
  fileName: string;
  bankName: string | null;
  candidates: ImportCandidate[];
}): Promise<{ importId: number; imported: number }> {
  const chosen = input.candidates.filter((c) => c.selected && canImport(c));
  if (chosen.length === 0) throw new ValidationError('Choose at least one transaction to import.');
  const records: TransactionRecord[] = chosen.map((c) => ({
    type: c.type as TransactionType,
    amountPaise: c.row.amountPaise,
    occurredOn: c.row.date,
    categoryId: c.categoryId,
    paymentMethod: paymentMethodFor(c.row),
    description: c.row.counterparty.slice(0, PAYEE_MAX_LENGTH),
    note: c.row.narration.slice(0, NOTE_MAX_LENGTH),
    externalReference: c.row.reference,
    isDuplicateReviewed: !c.duplicate,
  }));
  const importId = await transactionRepository.insertImportBatch({
    fileName: input.fileName,
    bankName: input.bankName,
    skippedCount: input.candidates.length - chosen.length,
    records,
  });
  return { importId, imported: records.length };
}

export const getLastImport = transactionRepository.getLastImport;

// ---- Viewing and correcting

export const deleteTransaction = transactionRepository.deleteTransaction;
export const getTransaction = transactionRepository.getTransaction;
export const listTransactions = (filters: TransactionFilters = {}) => transactionRepository.listTransactions(filters);

export async function updateTransactionDetails(id: number, edit: TransactionEdit): Promise<void> {
  const description = edit.description.trim();
  if (!description) throw new ValidationError("Payee name can't be empty.");
  if (description.length > PAYEE_MAX_LENGTH) {
    throw new ValidationError(`Payee name must be ${PAYEE_MAX_LENGTH} characters or fewer.`);
  }
  await transactionRepository.updateTransactionDetails(id, { ...edit, description });
}

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
  lastImport: ImportSummary | null;
  /** Spending relative to today, independent of the selected month. */
  spentTodayPaise: number;
  spentThisWeekPaise: number;
  spentThisMonthPaise: number;
  /** The selected month. */
  incomePaise: number;
  expensePaise: number;
  netPaise: number;
  expenseByCategory: CategoryTotal[];
  topPayees: PayeeTotal[];
  /** Every day of the selected month, zero-filled. */
  daily: DayTotal[];
  /** TREND_MONTHS months ending with the selected one, oldest first, zero-filled. */
  trend: MonthTotal[];
  recent: Transaction[];
}

/** Fills months with no transactions so the trend always has TREND_MONTHS entries. */
export function fillTrend(rows: MonthTotal[], endMonth: Date): MonthTotal[] {
  const byMonth = new Map(rows.map((r) => [r.month, r]));
  return Array.from({ length: TREND_MONTHS }, (_, i) => {
    const key = toMonthKey(subMonths(endMonth, TREND_MONTHS - 1 - i));
    return byMonth.get(key) ?? { month: key, incomePaise: 0, expensePaise: 0 };
  });
}

/** One entry per day of the month, zero-filled. */
export function fillDays(rows: DayTotal[], month: Date): DayTotal[] {
  const byDay = new Map(rows.map((r) => [r.date, r]));
  const first = startOfMonth(month);
  const count = endOfMonth(month).getDate();
  return Array.from({ length: count }, (_, i) => {
    const key = toDateKey(addDays(first, i));
    return byDay.get(key) ?? { date: key, incomePaise: 0, expensePaise: 0 };
  });
}

export async function getDashboard(month: Date, now: Date = new Date()): Promise<FinanceDashboard> {
  const today = toDateKey(now);
  const selected = monthRange(month);
  const current = monthRange(now);
  const trendFrom = toDateKey(startOfMonth(subMonths(month, TREND_MONTHS - 1)));

  const [count, lastImport, todayTotals, weekTotals, monthNowTotals, selectedTotals, byCategory, payees, byDay, byMonth, recent] =
    await Promise.all([
      transactionRepository.countTransactions(),
      transactionRepository.getLastImport(),
      transactionRepository.sumByType(today, today),
      transactionRepository.sumByType(toDateKey(startOfWeek(now)), toDateKey(endOfWeek(now))),
      transactionRepository.sumByType(current.from, current.to),
      transactionRepository.sumByType(selected.from, selected.to),
      transactionRepository.sumByCategory('expense', selected.from, selected.to),
      transactionRepository.sumByPayee('expense', selected.from, selected.to, 5),
      transactionRepository.sumByDay(selected.from, selected.to),
      transactionRepository.sumByMonth(trendFrom, selected.to),
      transactionRepository.listTransactions({}, 5),
    ]);

  return {
    hasAnyTransactions: count > 0,
    lastImport,
    spentTodayPaise: todayTotals.expensePaise,
    spentThisWeekPaise: weekTotals.expensePaise,
    spentThisMonthPaise: monthNowTotals.expensePaise,
    incomePaise: selectedTotals.incomePaise,
    expensePaise: selectedTotals.expensePaise,
    netPaise: selectedTotals.incomePaise - selectedTotals.expensePaise,
    expenseByCategory: byCategory,
    topPayees: payees,
    daily: fillDays(byDay, month),
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
  lastImport: ImportSummary | null;
}

export async function getHomeSummary(now: Date = new Date()): Promise<FinanceHomeSummary> {
  const today = toDateKey(now);
  const month = monthRange(now);
  const [count, todayByCategory, monthTotals, lastImport] = await Promise.all([
    transactionRepository.countTransactions(),
    transactionRepository.sumByCategory('expense', today, today),
    transactionRepository.sumByType(month.from, month.to),
    transactionRepository.getLastImport(),
  ]);
  return {
    hasAnyTransactions: count > 0,
    spentTodayPaise: todayByCategory.reduce((sum, c) => sum + c.totalPaise, 0),
    todayByCategory,
    monthExpensePaise: monthTotals.expensePaise,
    monthIncomePaise: monthTotals.incomePaise,
    lastImport,
  };
}
