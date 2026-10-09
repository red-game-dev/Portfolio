import { utcDay } from "@/packages/text/format";

// The day of the daily voyage at a moment: the UTC date, so everyone on Earth flies the same one.
export const dayKey = (moment: number): string => utcDay(moment);

// The day's seed: the same number for everyone that day, a different one each day (a polynomial hash of its
// date, kept within the seeded random's range without bitwise operators).
const MODULUS = 2147483647;

export const dailySeed = (day: string): number => {
  let hash = 7;

  for (let index = 0; index < day.length; index += 1) {
    hash = (hash * 131 + day.charCodeAt(index)) % MODULUS;
  }

  return (hash % (MODULUS - 1)) + 1;
};

// Noon UTC on the day, so the planets stand where they stood then for everyone flying it.
export const dailyEpoch = (day: string): number => Date.parse(`${day}T12:00:00Z`);
