// The daily voyage's board: the best runs of a day, each kept as the initials the pilot typed and the score, nothing
// else about them.
export interface BoardEntry {
  initials: string;
  score: number;
}

// A run offered to a day's board.
export interface BoardSubmission {
  day: string;
  initials: string;
  score: number;
}

// A day's board as the UI shows it, and where a run just put on it stands (1 for the best; null when it is not among
// those shown).
export interface BoardView {
  day: string;
  entries: BoardEntry[];
  rank: number | null;
}

export type BoardRefusal = "invalid" | "busy" | "unavailable";
