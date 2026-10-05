// Perceived brightness (Rec. 709 weights) of each RGBA pixel, 0 to 1, in one pass.
export const luminanceOf = (rgba: ArrayLike<number>): Float32Array => {
  const values = new Float32Array(Math.floor(rgba.length / 4));

  for (let index = 0; index < values.length; index += 1) {
    const offset = index * 4;

    values[index] = (0.2126 * rgba[offset] + 0.7152 * rgba[offset + 1] + 0.0722 * rgba[offset + 2]) / 255;
  }

  return values;
};

// Which glyph a cell shows at a moment: stable for `flickerMs`, then free to flip. A cheap integer hash,
// so the pattern looks random without a random source or any state per cell.
export const glyphFor = (cell: number, now: number, flickerMs: number): "0" | "1" => {
  const tick = Math.floor(now / flickerMs);

  return Math.floor(Math.abs(Math.sin(cell * 12.9898 + tick * 78.233) * 43758.5453)) % 2 === 0 ? "0" : "1";
};
