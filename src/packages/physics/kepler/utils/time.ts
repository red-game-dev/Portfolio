// Julian Day of 2000 January 1, 12:00 TT, the epoch every element here is measured from.
export const J2000 = 2451545;

const MS_PER_DAY = 86400000;

// Julian Day of the Unix epoch.
const UNIX_EPOCH_JD = 2440587.5;

// The Julian Day for a moment given in ms since the Unix epoch (UTC; the half minute between UTC and TT is far
// below what these positions resolve).
export const julianDay = (ms: number): number => UNIX_EPOCH_JD + ms / MS_PER_DAY;

export const daysSinceJ2000 = (jd: number): number => jd - J2000;

export const centuriesSinceJ2000 = (jd: number): number => (jd - J2000) / 36525;
