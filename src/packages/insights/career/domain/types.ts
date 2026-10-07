export interface Tenure {
  // "Nov 2019" or "2025". A year on its own counts from January.
  from: string;
  // Same format. Missing means it is still going.
  to?: string;
}

export interface MonthRange {
  start: number;
  end: number;
}
