import { isPaymentMethod } from '@/constants/paymentMethods';
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
  external_reference: string | null;
  import_history_id: number | null;
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
    externalReference: row.external_reference,
    importHistoryId: row.import_history_id,
    createdAt: row.created_at,
  };
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

/**
 * Writes one statement import all-or-nothing (PRD 4.C step 16): the
 * import_history row and every chosen transaction, tagged with its batch.
 */
export async function insertImportBatch(batch: {
  fileName: string;
  bankName: string | null;
  skippedCount: number;
  records: TransactionRecord[];
}): Promise<number> {
  const db = await getDatabase();
  let importId = 0;
  await db.withTransactionAsync(async () => {
    const history = await db.runAsync(
      'INSERT INTO import_history (file_name, detected_format_label, imported_count, skipped_count) VALUES (?, ?, ?, ?)',
      [batch.fileName, batch.bankName, batch.records.length, batch.skippedCount],
    );
    importId = history.lastInsertRowId;
    for (const r of batch.records) {
      await db.runAsync(
        `INSERT INTO transactions (type, amount_paise, occurred_on, description, note, category_id, payment_method,
           source, import_history_id, external_reference, is_duplicate_reviewed)
         VALUES (?, ?, ?, ?, ?, ?, ?, 'import', ?, ?, ?)`,
        [
          r.type,
          r.amountPaise,
          r.occurredOn,
          r.description,
          r.note,
          r.categoryId,
          r.paymentMethod,
          importId,
          r.externalReference,
          r.isDuplicateReviewed ? 1 : 0,
        ],
      );
    }
  });
  return importId;
}

interface ImportRow {
  id: number;
  file_name: string;
  detected_format_label: string | null;
  imported_count: number;
  skipped_count: number;
  imported_at: string;
}

export async function getLastImport(): Promise<ImportSummary | null> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<ImportRow>('SELECT * FROM import_history ORDER BY imported_at DESC, id DESC LIMIT 1');
  return row
    ? {
        id: row.id,
        fileName: row.file_name,
        bankName: row.detected_format_label,
        importedCount: row.imported_count,
        skippedCount: row.skipped_count,
        importedAt: row.imported_at,
      }
    : null;
}

export async function updateTransactionDetails(id: number, edit: TransactionEdit): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    `UPDATE transactions SET type = ?, category_id = ?, description = ?, updated_at = ${NOW} WHERE id = ?`,
    [edit.type, edit.categoryId, edit.description, id],
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

/** Largest payees (by description) for one type over a range. */
export async function sumByPayee(type: TransactionType, from: string, to: string, limit: number): Promise<PayeeTotal[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<{ name: string; total: number; n: number }>(
    `SELECT MAX(description) AS name, SUM(amount_paise) AS total, COUNT(*) AS n
     FROM transactions WHERE type = ? AND occurred_on BETWEEN ? AND ? AND description <> ''
     GROUP BY lower(description) ORDER BY total DESC LIMIT ?`,
    [type, from, to, limit],
  );
  return rows.map((r) => ({ name: r.name, totalPaise: r.total, count: r.n }));
}

/** Income and expense per day over a range; days with no rows are absent. */
export async function sumByDay(from: string, to: string): Promise<DayTotal[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<{ day: string; income: number; expense: number }>(
    `SELECT occurred_on AS day,
       SUM(CASE WHEN type = 'income' THEN amount_paise ELSE 0 END) AS income,
       SUM(CASE WHEN type = 'expense' THEN amount_paise ELSE 0 END) AS expense
     FROM transactions WHERE occurred_on BETWEEN ? AND ?
     GROUP BY day ORDER BY day ASC`,
    [from, to],
  );
  return rows.map((r) => ({ date: r.day, incomePaise: r.income, expensePaise: r.expense }));
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
