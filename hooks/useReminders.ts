import { useCallback } from 'react';

import * as reminderService from '@/services/reminderService';
import { useFocusedQuery } from './useFocusedQuery';

export function useReminders() {
  const { data, ...rest } = useFocusedQuery(reminderService.listReminders);
  return { reminders: data ?? [], ...rest };
}

export function usePendingReminders() {
  const { data, ...rest } = useFocusedQuery(reminderService.listPendingReminders);
  return { reminders: data ?? [], ...rest };
}

export function useReminder(id: number) {
  const fetcher = useCallback(() => reminderService.getReminder(id), [id]);
  const { data, ...rest } = useFocusedQuery(fetcher);
  return { reminder: data ?? null, notFound: data === null, ...rest };
}
