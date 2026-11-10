import { useCallback } from 'react';

import * as taskService from '@/services/taskService';
import { useFocusedQuery } from './useFocusedQuery';

export function useTasks() {
  const { data, ...rest } = useFocusedQuery(taskService.listTasks);
  return { tasks: data ?? [], ...rest };
}

export function useTask(id: number) {
  const fetcher = useCallback(() => taskService.getTask(id), [id]);
  const { data, ...rest } = useFocusedQuery(fetcher);
  return { task: data ?? null, notFound: data === null, ...rest };
}
