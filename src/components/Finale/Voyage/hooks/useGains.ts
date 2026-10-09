import { useEffect, useRef, useState } from "react";

// How long a gain stays beside its count (ms), its float's length, and how many may show at once.
export const GAIN_MS = 1200;
const MAX_GAINS = 3;

export interface Gain {
  id: number;
  amount: number;
}

// What a count rose by, if it rose: the first reading is what was kept, not a gain, and a fall is a spending.
export const gainOf = (previous: number | null, value: number): number | null => (previous !== null && value > previous ? value - previous : null);

// Every rise of a count, each shown briefly beside it as it floats away, so the reader sees where coin comes from
// as it comes in.
export const useGains = (value: number | null): Gain[] => {
  const [gains, setGains] = useState<Gain[]>([]);
  const last = useRef<number | null>(null);
  const nextId = useRef(0);
  const timers = useRef(new Set<number>());

  useEffect(() => {
    const pending = timers.current;

    return () => pending.forEach((timer) => window.clearTimeout(timer));
  }, []);

  useEffect(() => {
    if (value === null) {
      return;
    }

    const amount = gainOf(last.current, value);

    last.current = value;

    if (amount === null) {
      return;
    }

    nextId.current += 1;

    const gain = { id: nextId.current, amount };
    const timer = window.setTimeout(() => {
      timers.current.delete(timer);
      setGains((current) => current.filter((entry) => entry.id !== gain.id));
    }, GAIN_MS);

    timers.current.add(timer);
    setGains((current) => [...current, gain].slice(-MAX_GAINS));
  }, [value]);

  return gains;
};
