export interface RovingOptions {
  // Whether Home and End jump to either end. On by default, as the tabs pattern asks; a row that never had them
  // can leave them to the browser.
  ends?: boolean;
}

// Where focus goes next in a row of choices (tabs, cards, options) that is crossed with the keyboard as one
// stop: arrows step and wrap, Home and End jump to either end. Both arrow pairs work, so the same row can
// lay out horizontally on a phone and vertically on a desktop. Any other key returns null.
export const rovingTarget = (key: string, active: number, count: number, { ends = true }: RovingOptions = {}): number | null => {
  if (count <= 0) {
    return null;
  }

  const last = count - 1;

  switch (key) {
    case "ArrowRight":
    case "ArrowDown":
      return active >= last ? 0 : active + 1;
    case "ArrowLeft":
    case "ArrowUp":
      return active <= 0 ? last : active - 1;
    case "Home":
      return ends ? 0 : null;
    case "End":
      return ends ? last : null;
    default:
      return null;
  }
};
