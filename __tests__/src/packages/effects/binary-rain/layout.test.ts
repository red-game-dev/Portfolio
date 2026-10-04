import { createGrid, DEFAULT_RAIN_CONFIG, layoutMessage, resolveRainConfig } from "@/packages/effects/binary-rain";

describe("effects/binary-rain layout", () => {
  test("uses the smaller font below the narrow breakpoint", () => {
    expect(createGrid(320, 240, DEFAULT_RAIN_CONFIG).fontSize).toBe(DEFAULT_RAIN_CONFIG.narrowFontSize);
    expect(createGrid(900, 300, DEFAULT_RAIN_CONFIG).fontSize).toBe(DEFAULT_RAIN_CONFIG.wideFontSize);
  });

  test("covers the whole surface with cells", () => {
    const grid = createGrid(900, 300, DEFAULT_RAIN_CONFIG);

    expect(grid.columns * grid.cellWidth).toBeGreaterThanOrEqual(900);
    expect(grid.rows * grid.cellHeight).toBeGreaterThanOrEqual(300);
  });

  test("centres each line with a blank cell either side and numbers cells in reading order", () => {
    const grid = createGrid(900, 300, DEFAULT_RAIN_CONFIG);
    const cells = layoutMessage(["33,000+ prompts", "Feb to Oct 2026"], grid);
    const firstLine = cells.filter((cell) => cell.row === cells[0].row);

    expect(firstLine.map((cell) => cell.glyph).join("")).toBe(" 33,000+ prompts ");
    expect(new Set(cells.map((cell) => cell.row)).size).toBe(2);
    expect(cells.map((cell) => cell.order)).toEqual(cells.map((_, index) => index));
    expect(cells.every((cell) => cell.lockedAt === null)).toBe(true);

    const left = firstLine[0].column;
    const right = grid.columns - 1 - firstLine[firstLine.length - 1].column;

    expect(Math.abs(left - right)).toBeLessThanOrEqual(1);
  });

  test("cuts a line that is wider than the grid instead of wrapping it", () => {
    const grid = createGrid(100, 100, DEFAULT_RAIN_CONFIG);
    const cells = layoutMessage(["a line far longer than this grid can hold"], grid);

    expect(cells).toHaveLength(grid.columns);
    expect(cells.every((cell) => cell.column < grid.columns)).toBe(true);
  });

  test("resolveRainConfig merges theme overrides over the defaults", () => {
    const config = resolveRainConfig({ framesPerSecond: 24, theme: { trail: "#123456" } });

    expect(config.framesPerSecond).toBe(24);
    expect(config.theme.trail).toBe("#123456");
    expect(config.theme.head).toBe(DEFAULT_RAIN_CONFIG.theme.head);
  });
});
