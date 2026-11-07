import { useEffect, useState } from 'react';

// Re-renders consumers roughly once a minute so "today" and the
// greeting stay correct across midnight without needing an app
// restart (PRD Module 1.4), without the cost of a per-second timer.
export function useCurrentDate(intervalMs: number = 60_000): Date {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);

  return now;
}
