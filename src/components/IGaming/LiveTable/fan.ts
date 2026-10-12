// How the hand is laid out. A fan tucks each card under the next, leaving a strip to read; it is used only where the
// whole hand fits with strips wide enough to read, and a row to swipe through is used everywhere else.
export const CARD_WIDTH = 112;
// How far each card tucks under the next: at least this much, and at most that much before even a sideways name has no
// room. Past NARROW_TUCK a strip is too thin for its name across, so the name runs up the strip like a book's spine.
const LEAST_TUCK = -46;
const MOST_TUCK = -76;
const NARROW_TUCK = -56;
// Room kept either side for the cards' tilt.
const ROOM = 24;

// The offset of each card after the first, in pixels (negative, tucked under the one before), or null for a row.
export const fanStep = (width: number, count: number): number | null => {
  if (width <= 0 || count < 2) {
    return null;
  }

  const step = (width - ROOM - CARD_WIDTH * count) / (count - 1);

  return step < MOST_TUCK ? null : Math.min(LEAST_TUCK, Math.round(step));
};

// Whether the strips are narrow enough that each tucked card's name runs up it rather than across.
export const isSpineStep = (step: number): boolean => step < NARROW_TUCK;
