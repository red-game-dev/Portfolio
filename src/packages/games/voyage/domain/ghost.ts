// A run flown before, kept to fly beside: the day of the daily voyage it was, its score, how often the ship was
// sampled (ms), and the samples, four numbers each: x, y, the angle the ship faced, and where it was (the phase's
// code times 1000 plus the universe), so it is drawn only where the ship is too.
export interface GhostRun {
  day: string;
  score: number;
  every: number;
  samples: number[];
}

export const GHOST_STRIDE = 4;
