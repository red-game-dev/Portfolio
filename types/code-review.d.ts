export interface CodeReviewCount {
  // Exact, or rounded down. Never rounded up.
  value: number;
  label: string;
  detail?: string;
}

export interface CodeReviewHighlight {
  name: string;
  detail: string;
  counts: CodeReviewCount[];
  quote?: string;
  points: string[];
}

export interface CodeReviewContent {
  scope: string;
  // "{count}" is replaced, for the screen reader version of each square grid.
  squaresLabel: string;
  totals: CodeReviewCount[];
  highlights: CodeReviewHighlight[];
}
