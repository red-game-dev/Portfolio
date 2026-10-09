import type { RandomSource } from "@/packages/math/random";

// One of `options`, each as likely as its weight; null when every weight is nothing.
export const pickWeighted = <T>(random: RandomSource, options: readonly T[], weight: (option: T) => number): T | null => {
  const total = options.reduce((sum, option) => sum + Math.max(0, weight(option)), 0);

  if (total <= 0) {
    return null;
  }

  let roll = random() * total;

  for (const option of options) {
    roll -= Math.max(0, weight(option));

    if (roll < 0) {
      return option;
    }
  }

  return options[options.length - 1];
};

// A whole number from `min` to `max`, both included.
export const randomInt = (random: RandomSource, min: number, max: number): number => min + Math.floor(random() * (max - min + 1));
