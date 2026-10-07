import { RainGrid, RainMessageCell } from "../domain/types";

// Centres the lines on the grid, one row apart, with a blank cell either side so passing streams
// never touch the letters. A line wider than the grid is cut, not wrapped: wrapping would move the
// message while it assembles.
export const layoutMessage = (lines: string[], grid: RainGrid): RainMessageCell[] => {
  const top = Math.max(0, Math.floor((grid.rows - lines.length) / 2));

  return lines
    .flatMap((line, lineIndex) => {
      const glyphs = [" ", ...Array.from(line).slice(0, Math.max(0, grid.columns - 2)), " "];
      const left = Math.max(0, Math.floor((grid.columns - glyphs.length) / 2));

      return glyphs.map((glyph, index) => ({ column: left + index, row: top + lineIndex, glyph }));
    })
    .filter((cell) => cell.row < grid.rows && cell.column < grid.columns)
    .map((cell, order) => ({ ...cell, order, lockedAt: null }));
};
