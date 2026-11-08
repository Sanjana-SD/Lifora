import { useCallback } from 'react';

import * as checklistService from '@/services/checklistService';
import { useFocusedQuery } from './useFocusedQuery';

export function useChecklists() {
  const { data, ...rest } = useFocusedQuery(checklistService.listChecklists);
  return { checklists: data ?? [], ...rest };
}

export function useChecklist(id: number) {
  const fetcher = useCallback(() => checklistService.getChecklistWithItems(id), [id]);
  const { data, ...rest } = useFocusedQuery(fetcher);
  return { checklist: data?.checklist ?? null, items: data?.items ?? [], notFound: data === null, ...rest };
}
