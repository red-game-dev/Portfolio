export interface PixelPath {
  color: string;
  // An SVG path in pixel units: one unit square per pixel of this colour.
  d: string;
}

// Turns rows of palette keys into one SVG path per colour, so a sprite is a handful of elements instead of
// one per pixel. Runs of the same colour on a row become one rectangle. Keys missing from the palette,
// conventionally ".", are transparent.
export const toPixelPaths = (rows: string[], palette: Record<string, string>): PixelPath[] => {
  const segments = new Map<string, string[]>();

  rows.forEach((row, y) => {
    let x = 0;

    while (x < row.length) {
      const key = row[x];
      let end = x + 1;

      while (end < row.length && row[end] === key) {
        end += 1;
      }

      const color = palette[key];

      if (color) {
        const list = segments.get(color) ?? [];

        list.push(`M${x} ${y}h${end - x}v1h${x - end}z`);
        segments.set(color, list);
      }

      x = end;
    }
  });

  return [...segments.entries()].map(([color, parts]) => ({ color, d: parts.join("") }));
};

// The width and height a set of rows covers, for the SVG viewBox.
export const spriteSize = (rows: string[]) => ({ width: Math.max(0, ...rows.map((row) => row.length)), height: rows.length });
