// An adult's head and neck in millimetres, facing forward: x to the head's own left, y up from the chin, z forward
// out of the face. Laid out on the face's thirds, as artists and anatomists draw it: hairline, brow, the base of the
// nose and the chin each about 62 apart; the eyes at half the head's height, an eye's width apart; the mouth a third of
// the way from the nose to the chin; the ears between the brow and the nose.
export const ADULT_HEAD = {
  // Chin to crown, across, and front to back.
  height: 230,
  width: 150,
  depth: 195,
  brow: 125,
  eyes: { y: 115, apart: 31, radius: 12 },
  nose: { base: 64, tip: 96 },
  mouth: { y: 43, width: 24 },
  ears: { y: 95, out: 74 },
  // Where the hair starts at the forehead, and how far down the back it comes.
  hairline: { front: 178, back: 72 },
} as const;
