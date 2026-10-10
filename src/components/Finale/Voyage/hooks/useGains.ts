import { useEffect, useRef, useState } from "react";

// How long a gain stays beside its count (ms), its float's length.
export const GAIN_MS = 1200;

export interface Gain {
  id: number;
  amount: number;
}

// What a count rose by, if it rose: the first reading is what was kept, not a gain, and a fall is a spending.
export const gainOf = (previous: number | null, value: number): number | null => (previous !== null && value > previous ? value - previous : null);

// Each rise of a count, shown briefly beside it as it floats away, so the reader sees where coin comes from as it
// comes in. Rises close together add up into one, which floats again from the start, rather than piling up.
export const useGains = (value: number | null): Gain | null => {
  const [gain, setGain] = useState<Gain | null>(null);
  const last = useRef<number | null>(null);
  const nextId = useRef(0);

  useEffect(() => {
    // A count that goes away (the economy reloading) starts afresh: its next reading is not a gain.
    if (value === null) {
      last.current = null;

      return;
    }

    const amount = gainOf(last.current, value);

    last.current = value;

    if (amount !== null) {
      nextId.current += 1;

      const id = nextId.current;

      setGain((current) => ({ id, amount: (current?.amount ?? 0) + amount }));
    }
  }, [value]);

  useEffect(() => {
    if (!gain) {
      return undefined;
    }

    const timer = window.setTimeout(() => setGain(null), GAIN_MS);

    return () => window.clearTimeout(timer);
  }, [gain]);

  return gain;
};
