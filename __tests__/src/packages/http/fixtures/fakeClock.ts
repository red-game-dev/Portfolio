// fetchff keeps a timer for a cached or deduplicated read (its timeout, its dedupe window), and on the retried and
// shared paths one can outlive the read, which holds a Jest worker open after its tests end. Reads that cache run on
// Jest's clock instead, so those timers are fake and dropped with it; the clock moves on until the call settles, so a
// retry's delay still passes. Promises, streams and microtasks keep the real clock, which a response body needs.
export const useFetchClock = () => {
  beforeEach(() => {
    jest.useFakeTimers({ doNotFake: ["nextTick", "queueMicrotask", "setImmediate"] });
  });

  afterEach(() => {
    jest.useRealTimers();
  });
};

export const settled = async <T>(call: Promise<T>): Promise<T> => {
  let isDone = false;
  const watched = call.finally(() => {
    isDone = true;
  });

  // Each step lets the real event loop run (setImmediate keeps the real clock), so a response lands between steps.
  while (!isDone) {
    jest.advanceTimersByTime(50);
    await new Promise((resolve) => setImmediate(resolve));
  }

  return watched;
};
