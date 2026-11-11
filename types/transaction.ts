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
  createdAt: string;
}

/** What the add/edit form produces; the service validates and converts it. */
export interface TransactionDraft {
  type: TransactionType;
  /** As typed, e.g. "149.50"; converted to paise on save. */
  amount: string;
  date: Date;
  categoryId: number | null;
  paymentMethod: PaymentMethod | null;
  description: string;
  note: string;
}

/** A validated row, ready for the database. */
export interface TransactionRecord {
  type: TransactionType;
  amountPaise: number;
  occurredOn: string;
  categoryId: number;
  paymentMethod: PaymentMethod;
  description: string;
  note: string;
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
