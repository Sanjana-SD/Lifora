import { useCallback } from 'react';

import * as noteService from '@/services/noteService';
import { useFocusedQuery } from './useFocusedQuery';

export function useNotes(search: string) {
  const fetcher = useCallback(() => noteService.listNotes(search), [search]);
  const { data, ...rest } = useFocusedQuery(fetcher);
  return { notes: data ?? [], ...rest };
}

export function useRecentNotes(limit = 3) {
  const fetcher = useCallback(() => noteService.listRecentNotes(limit), [limit]);
  const { data, ...rest } = useFocusedQuery(fetcher);
  return { notes: data ?? [], ...rest };
}
