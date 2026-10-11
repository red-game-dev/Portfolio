// How many runs a day's board shows, how long a day's board is kept (the week after it, then gone), the highest score
// it believes, and the letters a pilot may type: one to three, A to Z.
export const BOARD = {
  size: 10,
  keepMs: 8 * 24 * 60 * 60 * 1000,
  maxScore: 100_000_000,
  initials: /^[A-Z]{1,3}$/,
};

// Initials a board will not show, however the run went.
export const BLOCKED_INITIALS: readonly string[] = [
  "ASS", "CUM", "DIC", "DIK", "FAG", "FCK", "FUC", "FUK", "FKU", "KKK", "NAZ", "NIG", "SEX", "SUK", "TIT", "WTF", "XXX",
];
