import { useCallback } from 'react';

import * as financeService from '@/services/financeService';
import type { TransactionFilters } from '@/types/transaction';
import { useFocusedQuery } from './useFocusedQuery';

export function useFinanceDashboard(month: Date) {
  // Keyed on the month string so a new Date for the same month doesn't refetch.
  const monthKey = financeService.toMonthKey(month);
  const fetcher = useCallback(() => financeService.getDashboard(financeService.fromDateKey(`${monthKey}-01`)), [monthKey]);
  const { data, ...rest } = useFocusedQuery(fetcher);
  return { dashboard: data ?? null, ...rest };
}

export function useTransactions(filters: TransactionFilters) {
  const { search, type, categoryId, paymentMethod, from, to } = filters;
  const fetcher = useCallback(
    () => financeService.listTransactions({ search, type, categoryId, paymentMethod, from, to }),
    [search, type, categoryId, paymentMethod, from, to],
  );
  const { data, ...rest } = useFocusedQuery(fetcher);
  return { transactions: data ?? [], ...rest };
}

export function useTransaction(id: number) {
  const fetcher = useCallback(() => financeService.getTransaction(id), [id]);
  const { data, ...rest } = useFocusedQuery(fetcher);
  return { transaction: data ?? null, notFound: data === null, ...rest };
}

export function useFinanceHomeSummary() {
  const { data, ...rest } = useFocusedQuery(financeService.getHomeSummary);
  return { summary: data ?? null, ...rest };
}
