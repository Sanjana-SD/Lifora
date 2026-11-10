import { useCallback, useMemo } from 'react';

import { listCategoriesByScope } from '@/database/repositories/categoryRepository';
import * as calendarService from '@/services/calendarService';
import type { Category, CategoryScope } from '@/types/category';
import { useFocusedQuery } from './useFocusedQuery';

export function useOccurrences(rangeStart: Date, rangeEnd: Date) {
  const startMs = rangeStart.getTime();
  const endMs = rangeEnd.getTime();
  const fetcher = useCallback(
    () => calendarService.listOccurrences(new Date(startMs), new Date(endMs)),
    [startMs, endMs],
  );
  const { data, ...rest } = useFocusedQuery(fetcher);
  return { occurrences: data ?? [], ...rest };
}

export function useUpcomingEvents() {
  const { data, ...rest } = useFocusedQuery(useCallback(() => calendarService.listUpcoming(), []));
  return { occurrences: data ?? [], ...rest };
}

export function useEventSearch(term: string) {
  const fetcher = useCallback(() => calendarService.searchEvents(term), [term]);
  const { data, ...rest } = useFocusedQuery(fetcher);
  return { results: data ?? [], ...rest };
}

export function useOccurrence(seriesId: number, originalStart: Date | null) {
  const startMs = originalStart?.getTime() ?? NaN;
  const fetcher = useCallback(
    () => (Number.isNaN(startMs) ? Promise.resolve(null) : calendarService.getOccurrence(seriesId, new Date(startMs))),
    [seriesId, startMs],
  );
  const { data, ...rest } = useFocusedQuery(fetcher);
  return { occurrence: data ?? null, notFound: data === null, ...rest };
}

export function useCategories(scope: CategoryScope) {
  const fetcher = useCallback(() => listCategoriesByScope(scope), [scope]);
  const { data, ...rest } = useFocusedQuery(fetcher);
  return { categories: data ?? [], ...rest };
}

export function useCategoryMap(scope: CategoryScope): Map<number, Category> {
  const { categories } = useCategories(scope);
  return useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories]);
}
