import type { PaymentMethod } from '@/constants/paymentMethods';

export type TransactionType = 'income' | 'expense';

export interface Transaction {
  id: number;
  type: TransactionType;
  amountPaise: number;
  /** Local calendar date, 'yyyy-MM-dd'. */
  occurredOn: string;
  description: string;
  note: string;
  categoryId: number | null;
  paymentMethod: PaymentMethod;
  source: 'manual' | 'import';
  /** UPI/UTR/cheque reference from the statement. */
  externalReference: string | null;
  importHistoryId: number | null;
  createdAt: string;
}

/** A row ready for the database, built from a reviewed statement line. */
export interface TransactionRecord {
  type: TransactionType;
  amountPaise: number;
  occurredOn: string;
  categoryId: number | null;
  paymentMethod: PaymentMethod;
  /** The payee or payer, cleaned for display ("Swiggy"). */
  description: string;
  /** The bank's original narration. */
  note: string;
  externalReference: string | null;
  /** False only for suspected duplicates the user chose to import anyway. */
  isDuplicateReviewed: boolean;
}

/** What can be corrected after import. */
export interface TransactionEdit {
  type: TransactionType;
  categoryId: number | null;
  description: string;
}

export interface ImportSummary {
  id: number;
  fileName: string;
  bankName: string | null;
  importedCount: number;
  skippedCount: number;
  importedAt: string;
}

export interface PayeeTotal {
  name: string;
  totalPaise: number;
  count: number;
}

export interface DayTotal {
  /** 'yyyy-MM-dd' */
  date: string;
  expensePaise: number;
  incomePaise: number;
}

export interface TransactionFilters {
  search?: string;
  type?: TransactionType | null;
  categoryId?: number | null;
  paymentMethod?: PaymentMethod | null;
  /** Inclusive 'yyyy-MM-dd' bounds. */
  from?: string | null;
  to?: string | null;
}

export interface CategoryTotal {
  categoryId: number | null;
  totalPaise: number;
  count: number;
}

export interface MonthTotal {
  /** 'yyyy-MM' */
  month: string;
  incomePaise: number;
  expensePaise: number;
}
