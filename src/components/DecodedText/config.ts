export const DECODE_TIMING = {
  // Time for each character to resolve, left to right.
  characterMs: 28,
  // How often the unresolved bits flip while they wait.
  tickMs: 60,
} as const;
