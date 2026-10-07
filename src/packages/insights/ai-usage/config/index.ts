export const AI_USAGE_CONFIG = {
  // Cells per bar. The largest row fills its bar and the rest scale to it.
  barCells: 32,
  // Counts are shown as floors rounded down to this step, so "3,050+" never overstates 3,085.
  countStep: 50,
} as const;
