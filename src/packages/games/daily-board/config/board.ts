// How many runs a day's board shows and how many it keeps behind them (the rest are dropped as better ones come), how
// long a day's board is kept (a week from its first run, then gone), the highest score it believes, and the letters a
// pilot may type: one to three, A to Z.
export const BOARD = {
  size: 10,
  keep: 100,
  keepMs: 7 * 24 * 60 * 60 * 1000,
  maxScore: 10_000_000,
  initials: /^[A-Z]{1,3}$/,
};

// Initials a board will not show, however the run went.
export const BLOCKED_INITIALS: readonly string[] = [
  "ASS", "CUM", "DIC", "DIK", "FAG", "FCK", "FUC", "FUK", "FKU", "KKK", "NAZ", "NIG", "SEX", "SUK", "TIT", "WTF", "XXX",
];
