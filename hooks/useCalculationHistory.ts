import * as historyService from '@/services/calculationHistoryService';
import { useFocusedQuery } from './useFocusedQuery';

export function useCalculationHistory() {
  const { data, ...rest } = useFocusedQuery(historyService.listHistory);
  return { entries: data ?? [], ...rest };
}
