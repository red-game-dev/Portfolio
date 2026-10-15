// A read kept with cacheSeconds leaves fetchff a timer for as long as it is kept (30 s here), on a one second interval
// that holds a Jest worker open after its tests end. Reads that cache run on Jest's clock instead (node environment
// only: the steps yield through setImmediate), and the fake clock is run out before the real one comes back, so the
// interval clears itself rather than leaving fetchff waiting on a clock that is gone. Promises, streams and
// microtasks keep the real clock, which a response body needs.
export const useFetchClock = () => {
  beforeEach(() => {
    jest.useFakeTimers({ doNotFake: ["nextTick", "queueMicrotask", "setImmediate"] });
  });

  afterEach(() => {
    jest.runAllTimers();
    jest.useRealTimers();
  });
};

const STEP_MS = 50;
// Longer than any wait a read makes on its own (a retry's 400 ms, the site channel's 8 s timeout), yet only tens of
// milliseconds of real time, so a call that never settles fails here, long before the test's own timeout.
const MOST_STEPS = 1200;

// Moves Jest's clock on until the call settles, letting the real event loop run between steps so a response lands, and
// a retry's delay passes.
export const settled = async <T>(call: Promise<T>): Promise<T> => {
  let isDone = false;
  const done = () => {
    isDone = true;
  };

  call.then(done, done);

  for (let step = 0; !isDone; step += 1) {
    if (step === MOST_STEPS) {
      throw new Error(`The call had not settled after ${(STEP_MS * MOST_STEPS) / 1000} s on Jest's clock`);
    }

    jest.advanceTimersByTime(STEP_MS);
    await new Promise((resolve) => setImmediate(resolve));
  }

  return call;
};
