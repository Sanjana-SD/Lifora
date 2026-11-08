export type AutosaveStatus = 'idle' | 'saving' | 'saved' | 'error';

export interface Autosaver<T> {
  schedule: (value: T) => void;
  flush: () => Promise<void>;
  cancel: () => void;
}

/**
 * Debounced, strictly serialized saving. Saves never overlap: each one
 * waits for the previous to settle. That ordering matters for a new
 * note, where the first save inserts a row and every later save must
 * see the resulting id and update it instead of inserting again.
 */
export function createAutosaver<T>(
  save: (value: T) => Promise<void>,
  delayMs: number,
  onStatus?: (status: AutosaveStatus) => void,
): Autosaver<T> {
  let timer: ReturnType<typeof setTimeout> | null = null;
  let pending: { value: T } | null = null;
  let chain: Promise<void> = Promise.resolve();

  const run = (): Promise<void> => {
    if (!pending) return chain;
    const { value } = pending;
    pending = null;
    onStatus?.('saving');
    chain = chain
      .then(() => save(value))
      .then(
        () => onStatus?.('saved'),
        () => onStatus?.('error'),
      );
    return chain;
  };

  const clearTimer = () => {
    if (timer) clearTimeout(timer);
    timer = null;
  };

  return {
    schedule(value: T) {
      pending = { value };
      clearTimer();
      timer = setTimeout(() => {
        timer = null;
        void run();
      }, delayMs);
    },
    flush() {
      clearTimer();
      return run();
    },
    cancel() {
      clearTimer();
      pending = null;
    },
  };
}
