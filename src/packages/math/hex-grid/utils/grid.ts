// Pointy topped hexagons one unit wide. Rows overlap by a quarter of a hex and odd rows shift half a hex
// right, the "odd-r" layout most strategy maps use.
export const HEX_HEIGHT = 2 / Math.sqrt(3);

const ROW_STEP = HEX_HEIGHT * 0.75;

export interface HexCell {
  column: number;
  row: number;
  // Top left corner, in hex widths.
  x: number;
  y: number;
}

export interface HexGrid {
  columns: number;
  rows: number;
  // The grid's bounding box, in hex widths.
  width: number;
  height: number;
  cells: HexCell[];
}

export const createHexGrid = (columns: number, rows: number): HexGrid => {
  const cells: HexCell[] = [];

  for (let row = 0; row < rows; row += 1) {
    for (let column = 0; column < columns; column += 1) {
      cells.push({ column, row, x: column + (row % 2) * 0.5, y: row * ROW_STEP });
    }
  }

  return {
    columns,
    rows,
    width: columns + (rows > 1 ? 0.5 : 0),
    height: rows > 0 ? (rows - 1) * ROW_STEP + HEX_HEIGHT : 0,
    cells,
  };
};

// The centre of a cell, in hex widths.
export const hexCentre = ({ x, y }: HexCell) => ({ x: x + 0.5, y: y + HEX_HEIGHT / 2 });

// Walks the grid left to right, then right to left on the next row, and so on, skipping blocked cells:
// the order a travel route takes across a map.
export const snakePath = (grid: HexGrid, isBlocked: (cell: HexCell) => boolean = () => false): HexCell[] => {
  const path: HexCell[] = [];

  for (let row = 0; row < grid.rows; row += 1) {
    const cells = grid.cells.filter((cell) => cell.row === row);
    const ordered = row % 2 === 0 ? cells : [...cells].reverse();

    path.push(...ordered.filter((cell) => !isBlocked(cell)));
  }

  return path;
};

// The fewest rows that leave `count` free cells when `blockedPerRow` cells of every row are taken.
export const rowsFor = (count: number, columns: number, blockedPerRow = 0) => Math.max(1, Math.ceil(count / Math.max(1, columns - blockedPerRow)));
