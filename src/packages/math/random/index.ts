// Returns a float in [0, 1), like Math.random. Code that takes one of these instead of calling
// Math.random directly can be replayed exactly in tests.
export type RandomSource = () => number;

const MODULUS = 2147483647;
const MULTIPLIER = 16807;

// Park-Miller generator: tiny, seedable and free of bitwise operators. Good for repeatable visuals,
// procedural content and tests. Not for anything security related.
export const createSeededRandom = (seed: number): RandomSource => {
  let state = Math.abs(Math.floor(seed)) % MODULUS || 1;

  return () => {
    state = (state * MULTIPLIER) % MODULUS;

    return (state - 1) / (MODULUS - 1);
  };
};

export const randomBetween = (random: RandomSource, min: number, max: number) => min + random() * (max - min);

// One of `items`, each as likely as the others, for one draw of `random` (undefined when there are none). The
// index is held below the length, so a source that ever returned 1 still lands on the last item.
export const pick = <T>(random: RandomSource, items: readonly T[]): T => items[Math.min(items.length - 1, Math.floor(random() * items.length))];
