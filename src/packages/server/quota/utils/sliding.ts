// The sliding window estimate: the previous window's count, weighted by how much of it still overlaps the last
// window, plus the current window's count. Two counters per key, close to an exact log, cheap for a shared store.
export const slidingCount = (previous: number, current: number, elapsed: number): number => previous * (1 - elapsed) + current;
