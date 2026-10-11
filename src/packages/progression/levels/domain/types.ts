// How experience turns into levels: the highest level, and what each level asks to reach the next, `base` times the
// level raised to `growth`, so the first levels come quickly and each one after asks a little more.
export interface LevelCurveSpec {
  cap: number;
  base: number;
  growth: number;
}

// Where a total of experience stands: the level, how much of it is into that level, what the next level asks in
// all, and that as a share (1 at the cap).
export interface LevelStanding {
  level: number;
  into: number;
  toNext: number;
  share: number;
  isCapped: boolean;
}
