export interface RateWindow {
  limit: number;
  windowMs: number;
}

// Says whether a key may act now, counting the attempt.
export interface Limiter {
  take(key: string): Promise<boolean>;
}

// A ceiling on what can be spent per period, in whatever unit the caller counts.
export interface Quota {
  hasRoom(): Promise<boolean>;
  spend(amount: number): Promise<void>;
}
