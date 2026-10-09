import { Entity } from "../domain/types";

// Cells are keyed by one number, packed from their column and row, so no string is made per lookup in the hot
// loop. Columns and rows must stay within this many cells of the origin either way.
const SPAN = 32768;
const keyOf = (column: number, row: number) => (column + SPAN) * SPAN * 2 + (row + SPAN);
// The marks that stop a query reporting an entity twice are only needed within one query, so they are
// forgotten every so many refills rather than kept for every entity there ever was.
const FORGET_EVERY = 600;

// A uniform grid for finding what is near a point without testing everything against everything: insert each
// thing into the cells it overlaps, then ask about a circle and get only the things in the cells it covers.
// Cleared and refilled every step; queries never report the same entity twice.
export class SpatialHash {
  private readonly cellSize: number;
  private readonly cells = new Map<number, Entity[]>();
  private readonly seen = new Map<Entity, number>();
  private query = 0;
  private refills = 0;

  constructor(cellSize: number) {
    this.cellSize = cellSize;
  }

  // Empties every cell for the next refill, keeping the arrays of cells in use and dropping the ones the last
  // fill left empty, so the grid does not grow with every place the world has been.
  public clear(): void {
    this.cells.forEach((cell, key) => {
      if (cell.length === 0) {
        this.cells.delete(key);
      } else {
        cell.length = 0;
      }
    });
    this.refills += 1;

    if (this.refills % FORGET_EVERY === 0) {
      this.seen.clear();
    }
  }

  public insert(entity: Entity, x: number, y: number, radius: number): void {
    this.forCells(x, y, radius, (key) => {
      const cell = this.cells.get(key);

      if (cell) {
        cell.push(entity);
      } else {
        this.cells.set(key, [entity]);
      }
    });
  }

  public near(x: number, y: number, radius: number, visit: (entity: Entity) => void): void {
    this.query += 1;
    this.forCells(x, y, radius, (key) => {
      this.cells.get(key)?.forEach((entity) => {
        if (this.seen.get(entity) !== this.query) {
          this.seen.set(entity, this.query);
          visit(entity);
        }
      });
    });
  }

  // Forgets entities that are gone, so the bookkeeping does not grow over a long run.
  public prune(isAlive: (entity: Entity) => boolean): void {
    this.seen.forEach((_, entity) => {
      if (!isAlive(entity)) {
        this.seen.delete(entity);
      }
    });
  }

  private forCells(x: number, y: number, radius: number, visit: (key: number) => void): void {
    const size = this.cellSize;
    const left = Math.floor((x - radius) / size);
    const right = Math.floor((x + radius) / size);
    const top = Math.floor((y - radius) / size);
    const bottom = Math.floor((y + radius) / size);

    for (let cx = left; cx <= right; cx += 1) {
      for (let cy = top; cy <= bottom; cy += 1) {
        visit(keyOf(cx, cy));
      }
    }
  }
}
