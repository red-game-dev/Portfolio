export const sleep = (ms: number, signal?: AbortSignal): Promise<void> => new Promise((resolve) => {
  if (signal?.aborted) {
    resolve();

    return;
  }

  const timer = setTimeout(resolve, ms);

  signal?.addEventListener("abort", () => {
    clearTimeout(timer);
    resolve();
  }, { once: true });
});

// One signal that aborts when the caller's does or when `ms` runs out, and a cleanup for the timer.
export const withTimeout = (ms: number, signal?: AbortSignal): { signal: AbortSignal; clear: () => void } => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  const onAbort = () => controller.abort();

  if (signal?.aborted) {
    controller.abort();
  } else {
    signal?.addEventListener("abort", onAbort, { once: true });
  }

  return {
    signal: controller.signal,
    clear: () => {
      clearTimeout(timer);
      signal?.removeEventListener("abort", onAbort);
    },
  };
};
