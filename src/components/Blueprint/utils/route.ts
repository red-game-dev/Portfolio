export interface Box {
  left: number;
  top: number;
  right: number;
  bottom: number;
}

export interface Route {
  d: string;
  // Where the label sits: the middle of the curve.
  mid: { x: number; y: number };
}

// Boxes closer than this along an axis are treated as touching, so the line goes the other way.
const MIN_GAP = 4;

const round = (value: number) => Math.round(value * 10) / 10;

const overlap = (startA: number, endA: number, startB: number, endB: number) => {
  const start = Math.max(startA, startB);
  const end = Math.min(endA, endB);

  return end - start > MIN_GAP ? (start + end) / 2 : null;
};

// The middle of a cubic curve: (p0 + 3 p1 + 3 p2 + p3) / 8.
const curveMid = (x1: number, y1: number, c1x: number, c1y: number, c2x: number, c2y: number, x2: number, y2: number) => ({
  x: round((x1 + 3 * c1x + 3 * c2x + x2) / 8),
  y: round((y1 + 3 * c1y + 3 * c2y + y2) / 8),
});

const horizontal = (a: Box, b: Box, isRightward: boolean): Route => {
  const x1 = isRightward ? a.right : a.left;
  const x2 = isRightward ? b.left : b.right;
  const shared = overlap(a.top, a.bottom, b.top, b.bottom);

  if (shared !== null) {
    return { d: `M${round(x1)},${round(shared)} L${round(x2)},${round(shared)}`, mid: { x: round((x1 + x2) / 2), y: round(shared) } };
  }

  const y1 = (a.top + a.bottom) / 2;
  const y2 = (b.top + b.bottom) / 2;
  const bend = (x2 - x1) / 2;
  const d = `M${round(x1)},${round(y1)} C${round(x1 + bend)},${round(y1)} ${round(x2 - bend)},${round(y2)} ${round(x2)},${round(y2)}`;

  return { d, mid: curveMid(x1, y1, x1 + bend, y1, x2 - bend, y2, x2, y2) };
};

const vertical = (a: Box, b: Box, isDownward: boolean): Route => {
  const y1 = isDownward ? a.bottom : a.top;
  const y2 = isDownward ? b.top : b.bottom;
  const shared = overlap(a.left, a.right, b.left, b.right);

  if (shared !== null) {
    return { d: `M${round(shared)},${round(y1)} L${round(shared)},${round(y2)}`, mid: { x: round(shared), y: round((y1 + y2) / 2) } };
  }

  const x1 = (a.left + a.right) / 2;
  const x2 = (b.left + b.right) / 2;
  const bend = (y2 - y1) / 2;
  const d = `M${round(x1)},${round(y1)} C${round(x1)},${round(y1 + bend)} ${round(x2)},${round(y2 - bend)} ${round(x2)},${round(y2)}`;

  return { d, mid: curveMid(x1, y1, x1, y1 + bend, x2, y2 - bend, x2, y2) };
};

// A connector from one box to another, leaving from the side that faces it. Boxes side by side get a
// horizontal line, boxes above one another a vertical one; straight where they line up, curved where
// they do not. Boxes that overlap (a node and its own group) have no route.
export const routeBetween = (a: Box, b: Box): Route | null => {
  if (b.left - a.right > MIN_GAP) {
    return horizontal(a, b, true);
  }

  if (a.left - b.right > MIN_GAP) {
    return horizontal(a, b, false);
  }

  if (b.top - a.bottom > MIN_GAP) {
    return vertical(a, b, true);
  }

  if (a.top - b.bottom > MIN_GAP) {
    return vertical(a, b, false);
  }

  return null;
};
