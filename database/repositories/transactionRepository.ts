import { isPaymentMethod } from '@/constants/paymentMethods';
import type {
  CategoryTotal,
  MonthTotal,
  Transaction,
  TransactionFilters,
  TransactionRecord,
  TransactionType,
} from '@/types/transaction';
import { getDatabase } from '../database';

interface TransactionRow {
  id: number;
  type: TransactionType;
  amount_paise: number;
  occurred_on: string;
  description: string;
  note: string;
  category_id: number | null;
  payment_method: string;
  source: 'manual' | 'import';
  created_at: string;
}

const NOW = "strftime('%Y-%m-%dT%H:%M:%fZ', 'now')";

function mapRow(row: TransactionRow): Transaction {
  return {
    id: row.id,
    type: row.type,
    amountPaise: row.amount_paise,
    occurredOn: row.occurred_on,
    description: row.description,
    note: row.note,
    categoryId: row.category_id,
    paymentMethod: isPaymentMethod(row.payment_method) ? row.payment_method : 'other',
    source: row.source,
    createdAt: row.created_at,
  };
}

function recordParams(r: TransactionRecord) {
  return [r.type, r.amountPaise, r.occurredOn, r.description, r.note, r.categoryId, r.paymentMethod];
}

type Bind = string | number;

/** WHERE clause for the history filters; every value is bound, never interpolated. */
function whereClause(filters: TransactionFilters): { sql: string; params: Bind[] } {
  const parts: string[] = [];
  const params: Bind[] = [];
  const term = filters.search?.trim();
  if (term) {
    // Escape LIKE wildcards so "50%" searches for the literal text.
    const like = `%${term.replace(/[\\%_]/g, (c) => `\\${c}`)}%`;
    parts.push("(description LIKE ? ESCAPE '\\' OR note LIKE ? ESCAPE '\\')");
    params.push(like, like);
  }
  if (filters.type) {
    parts.push('type = ?');
    params.push(filters.type);
  }
  if (filters.categoryId != null) {
    parts.push('category_id = ?');
    params.push(filters.categoryId);
  }
  if (filters.paymentMethod) {
    parts.push('payment_method = ?');
    params.push(filters.paymentMethod);
  }
  if (filters.from) {
    parts.push('occurred_on >= ?');
    params.push(filters.from);
  }
  if (filters.to) {
    parts.push('occurred_on <= ?');
    params.push(filters.to);
  }
  return { sql: parts.length ? `WHERE ${parts.join(' AND ')}` : '', params };
}

export async function listTransactions(filters: TransactionFilters = {}, limit?: number): Promise<Transaction[]> {
  const db = await getDatabase();
  const { sql, params } = whereClause(filters);
  const rows = await db.getAllAsync<TransactionRow>(
    `SELECT * FROM transactions ${sql} ORDER BY occurred_on DESC, id DESC${limit ? ' LIMIT ?' : ''}`,
    limit ? [...params, limit] : params,
  );
  return rows.map(mapRow);
}

export async function getTransaction(id: number): Promise<Transaction | null> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<TransactionRow>('SELECT * FROM transactions WHERE id = ?', [id]);
  return row ? mapRow(row) : null;
}

export async function countTransactions(): Promise<number> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<{ n: number }>('SELECT COUNT(*) AS n FROM transactions');
  return row?.n ?? 0;
}

export async function insertTransaction(record: TransactionRecord): Promise<number> {
  const db = await getDatabase();
  const result = await db.runAsync(
    'INSERT INTO transactions (type, amount_paise, occurred_on, description, note, category_id, payment_method) VALUES (?, ?, ?, ?, ?, ?, ?)',
    recordParams(record),
  );
  return result.lastInsertRowId;
}

export async function updateTransaction(id: number, record: TransactionRecord): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    `UPDATE transactions SET type = ?, amount_paise = ?, occurred_on = ?, description = ?, note = ?, category_id = ?, payment_method = ?, updated_at = ${NOW} WHERE id = ?`,
    [...recordParams(record), id],
  );
}

export async function deleteTransaction(id: number): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM transactions WHERE id = ?', [id]);
}

/** Income and expense sums over an inclusive date range, in paise. */
export async function sumByType(from: string, to: string): Promise<{ incomePaise: number; expensePaise: number }> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<{ income: number | null; expense: number | null }>(
    `SELECT
       SUM(CASE WHEN type = 'income' THEN amount_paise ELSE 0 END) AS income,
       SUM(CASE WHEN type = 'expense' THEN amount_paise ELSE 0 END) AS expense
     FROM transactions WHERE occurred_on BETWEEN ? AND ?`,
    [from, to],
  );
  return { incomePaise: row?.income ?? 0, expensePaise: row?.expense ?? 0 };
}

/** Per-category totals for one type over a range, largest first. */
export async function sumByCategory(type: TransactionType, from: string, to: string): Promise<CategoryTotal[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<{ category_id: number | null; total: number; n: number }>(
    `SELECT category_id, SUM(amount_paise) AS total, COUNT(*) AS n
     FROM transactions WHERE type = ? AND occurred_on BETWEEN ? AND ?
     GROUP BY category_id ORDER BY total DESC`,
    [type, from, to],
  );
  return rows.map((r) => ({ categoryId: r.category_id, totalPaise: r.total, count: r.n }));
}

/** Income and expense per calendar month ('yyyy-MM') over a range; months with no rows are absent. */
export async function sumByMonth(from: string, to: string): Promise<MonthTotal[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<{ month: string; income: number; expense: number }>(
    `SELECT substr(occurred_on, 1, 7) AS month,
       SUM(CASE WHEN type = 'income' THEN amount_paise ELSE 0 END) AS income,
       SUM(CASE WHEN type = 'expense' THEN amount_paise ELSE 0 END) AS expense
     FROM transactions WHERE occurred_on BETWEEN ? AND ?
     GROUP BY month ORDER BY month ASC`,
    [from, to],
  );
  return rows.map((r) => ({ month: r.month, incomePaise: r.income, expensePaise: r.expense }));
}
