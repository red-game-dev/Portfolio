// Every timing in the section, in one place, so the sequence can be tuned as a whole.
export const AI_USAGE_MOTION = {
  // Task mix: rows start one after another and each row fills left to right.
  rowDelayMs: 110,
  bitDelayMs: 22,
  // Agent pipeline: one pass of the signal from the first stage to the last.
  signalLoopSeconds: 4.8,
  // Timeline: how long the rail takes to draw from the first milestone to the last.
  railSeconds: 1.6,
  // Screen: one sweep of the scan beam.
  scanBeamSeconds: 7,
} as const;
