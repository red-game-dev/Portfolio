import { createHexGrid, HEX_HEIGHT, hexCentre, rowsFor, snakePath } from "@/packages/math/hex-grid";

describe("math/hex-grid", () => {
  test("odd rows shift half a hex and rows overlap by a quarter", () => {
    const grid = createHexGrid(3, 2);

    expect(grid.cells).toHaveLength(6);
    expect(grid.cells[3]).toEqual({ column: 0, row: 1, x: 0.5, y: HEX_HEIGHT * 0.75 });
    expect(grid.width).toBe(3.5);
    expect(grid.height).toBeCloseTo(HEX_HEIGHT * 1.75);
  });

  test("a single row has no half hex overhang", () => {
    expect(createHexGrid(4, 1).width).toBe(4);
  });

  test("the snake path alternates direction and skips blocked cells", () => {
    const grid = createHexGrid(3, 2);
    const path = snakePath(grid, (cell) => cell.column === 1 && cell.row === 1);

    expect(path.map((cell) => `${cell.column},${cell.row}`)).toEqual(["0,0", "1,0", "2,0", "2,1", "0,1"]);
  });

  test("rowsFor leaves room for every item around the blocked cells", () => {
    expect(rowsFor(14, 6, 1)).toBe(3);
    expect(rowsFor(0, 6)).toBe(1);
  });

  test("a cell's centre sits half a hex in", () => {
    expect(hexCentre({ column: 0, row: 0, x: 0, y: 0 })).toEqual({ x: 0.5, y: HEX_HEIGHT / 2 });
  });
});
