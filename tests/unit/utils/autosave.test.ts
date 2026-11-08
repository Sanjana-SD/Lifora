import { createAutosaver, type AutosaveStatus } from '@/utils/autosave';

beforeEach(() => jest.useFakeTimers());
afterEach(() => jest.useRealTimers());

describe('createAutosaver', () => {
  it('debounces rapid changes into one save of the latest value', async () => {
    const save = jest.fn().mockResolvedValue(undefined);
    const saver = createAutosaver<string>(save, 500);

    saver.schedule('a');
    saver.schedule('ab');
    saver.schedule('abc');
    expect(save).not.toHaveBeenCalled();

    await jest.advanceTimersByTimeAsync(500);
    expect(save).toHaveBeenCalledTimes(1);
    expect(save).toHaveBeenCalledWith('abc');
  });

  it('flush saves immediately without waiting for the timer', async () => {
    const save = jest.fn().mockResolvedValue(undefined);
    const saver = createAutosaver<string>(save, 500);
    saver.schedule('typed just before leaving');
    await saver.flush();
    expect(save).toHaveBeenCalledWith('typed just before leaving');
    await jest.advanceTimersByTimeAsync(1000);
    expect(save).toHaveBeenCalledTimes(1);
  });

  it('flush with nothing pending does not save', async () => {
    const save = jest.fn().mockResolvedValue(undefined);
    const saver = createAutosaver<string>(save, 500);
    await saver.flush();
    expect(save).not.toHaveBeenCalled();
  });

  it('cancel drops the pending value', async () => {
    const save = jest.fn().mockResolvedValue(undefined);
    const saver = createAutosaver<string>(save, 500);
    saver.schedule('discard me');
    saver.cancel();
    await saver.flush();
    await jest.advanceTimersByTimeAsync(1000);
    expect(save).not.toHaveBeenCalled();
  });

  it('never runs saves concurrently, so a new note is inserted only once', async () => {
    let inFlight = 0;
    let maxInFlight = 0;
    let resolveFirst!: () => void;
    const save = jest.fn().mockImplementation(
      (value: string) =>
        new Promise<void>((resolve) => {
          inFlight++;
          maxInFlight = Math.max(maxInFlight, inFlight);
          const done = () => {
            inFlight--;
            resolve();
          };
          if (value === 'first') resolveFirst = done;
          else done();
        }),
    );
    const saver = createAutosaver<string>(save, 100);

    saver.schedule('first');
    await jest.advanceTimersByTimeAsync(100);
    saver.schedule('second');
    const flushed = saver.flush();

    expect(save).toHaveBeenCalledTimes(1);
    resolveFirst();
    await flushed;
    expect(save).toHaveBeenCalledTimes(2);
    expect(save.mock.calls.map((c) => c[0])).toEqual(['first', 'second']);
    expect(maxInFlight).toBe(1);
  });

  it('reports status and keeps working after a failed save', async () => {
    const statuses: AutosaveStatus[] = [];
    const save = jest.fn().mockRejectedValueOnce(new Error('disk full')).mockResolvedValue(undefined);
    const saver = createAutosaver<string>(save, 100, (s) => statuses.push(s));

    saver.schedule('x');
    await saver.flush();
    saver.schedule('y');
    await saver.flush();

    expect(statuses).toEqual(['saving', 'error', 'saving', 'saved']);
    expect(save).toHaveBeenLastCalledWith('y');
  });
});
