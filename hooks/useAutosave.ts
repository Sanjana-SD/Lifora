import { useEffect, useMemo, useRef, useState } from 'react';

import { createAutosaver, type AutosaveStatus } from '@/utils/autosave';

export function useAutosave<T>(save: (value: T) => Promise<void>, delayMs = 600) {
  const [status, setStatus] = useState<AutosaveStatus>('idle');
  const saveRef = useRef(save);
  saveRef.current = save;

  const autosaver = useMemo(
    () => createAutosaver<T>((value) => saveRef.current(value), delayMs, setStatus),
    [delayMs],
  );

  // Flush, not cancel: leaving the screen mid-debounce must not drop the
  // last keystrokes. Callers that want to discard (e.g. delete) call
  // cancel() themselves first.
  useEffect(
    () => () => {
      void autosaver.flush();
    },
    [autosaver],
  );

  return { status, schedule: autosaver.schedule, flush: autosaver.flush, cancel: autosaver.cancel };
}
