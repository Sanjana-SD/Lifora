import { useFocusEffect } from 'expo-router';
import { useCallback, useRef, useState } from 'react';

interface QueryState<T> {
  data: T | undefined;
  loading: boolean;
  error: Error | null;
  reload: () => Promise<void>;
}

/**
 * Loads data from the local database whenever the screen gains focus
 * or `fetcher` changes, so lists reflect edits made on other screens
 * (PRD Module 1.4: no separate cache that can drift out of sync).
 * Out-of-order responses (e.g. fast typing in search) are discarded.
 */
export function useFocusedQuery<T>(fetcher: () => Promise<T>): QueryState<T> {
  const [data, setData] = useState<T | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const requestId = useRef(0);

  const reload = useCallback(async () => {
    const id = ++requestId.current;
    setLoading(true);
    try {
      const result = await fetcher();
      if (id === requestId.current) {
        setData(result);
        setError(null);
      }
    } catch (e) {
      if (id === requestId.current) setError(e instanceof Error ? e : new Error(String(e)));
    } finally {
      if (id === requestId.current) setLoading(false);
    }
  }, [fetcher]);

  useFocusEffect(
    useCallback(() => {
      void reload();
    }, [reload]),
  );

  return { data, loading, error, reload };
}
