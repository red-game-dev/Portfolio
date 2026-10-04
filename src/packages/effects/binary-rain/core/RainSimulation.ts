import { randomBetween, RandomSource } from "@/packages/math/random";

import { RainConfig } from "../config";
import { GlyphSource, RainColumn, RainGrid, RainMessageCell, RainState, RainStream } from "../domain/types";
import { cellKey } from "../utils/grid";
import { layoutMessage } from "../utils/message";

export interface RainSimulationDependencies {
  config: RainConfig;
  glyphs: GlyphSource;
  random: RandomSource;
}

// Pure state machine: streams fall, glyphs flicker, the message locks in. No DOM, no clock of its
// own, so it runs the same in a browser, a worker or a test.
export class RainSimulation {
  public readonly state: RainState;
  private readonly config: RainConfig;
  private readonly glyphs: GlyphSource;
  private readonly random: RandomSource;

  constructor(grid: RainGrid, lines: string[], { config, glyphs, random }: RainSimulationDependencies) {
    this.config = config;
    this.glyphs = glyphs;
    this.random = random;

    const message = layoutMessage(lines, grid);

    this.state = {
      grid,
      columns: Array.from({ length: grid.columns }, () => this.createColumn(grid)),
      message,
      locked: new Uint8Array(grid.columns * grid.rows),
      armedAt: null,
    };
  }

  public get isArmed(): boolean {
    return this.state.armedAt !== null;
  }

  // Starts assembling the message. Every column that carries a letter gets a fresh stream from above
  // the screen, so the letters lock in as that stream falls through them.
  public arm(now: number): void {
    if (this.isArmed) {
      return;
    }

    this.state.armedAt = now;

    new Set(this.state.message.map((cell) => cell.column)).forEach((column) => {
      this.state.columns[column].stream = this.createStream(this.state.grid, false);
    });
  }

  // Puts every letter in place at once, for reduced motion and after a resize. `lockedAt` defaults far
  // in the past so nothing flashes.
  public lockAll(lockedAt = Number.NEGATIVE_INFINITY): void {
    this.state.armedAt = this.state.armedAt ?? lockedAt;

    this.state.message.forEach((cell) => {
      this.lock(cell, cell.lockedAt ?? lockedAt);
    });
  }

  public step(deltaMs: number, now: number): void {
    this.advanceStreams(deltaMs / 1000);

    if (this.isArmed) {
      this.lockReachedLetters(now);
    }
  }

  private advanceStreams(deltaSeconds: number): void {
    const { grid, columns } = this.state;

    columns.forEach((column) => {
      column.stream.head += column.stream.speed * deltaSeconds;

      if (column.stream.head - column.stream.length > grid.rows) {
        column.stream = this.createStream(grid, false);
      }

      if (this.random() < this.config.flickerChance) {
        column.glyphs[Math.floor(this.random() * grid.rows)] = this.glyphs.next(this.random);
      }
    });
  }

  private lockReachedLetters(now: number): void {
    const armedFor = now - (this.state.armedAt ?? now);

    this.state.message.forEach((cell) => {
      if (cell.lockedAt !== null) {
        return;
      }

      const hasStreamPassed = Math.floor(this.state.columns[cell.column].stream.head) >= cell.row;
      const isOverdue = armedFor >= this.config.forceLockAfterMs + cell.order * this.config.forceLockStaggerMs;

      if (hasStreamPassed || isOverdue) {
        this.lock(cell, now);
      }
    });
  }

  private lock(cell: RainMessageCell, lockedAt: number): void {
    cell.lockedAt = lockedAt;
    this.state.locked[cellKey(this.state.grid, cell.column, cell.row)] = 1;
  }

  // A scattered stream can start anywhere, which is how the first frame looks mid shower instead of
  // empty. A respawned one always starts above the top edge.
  private createStream(grid: RainGrid, isScattered: boolean): RainStream {
    const { minSpeed, maxSpeed, minTrail, maxTrailRatio } = this.config;

    return {
      head: isScattered ? randomBetween(this.random, -grid.rows, grid.rows) : randomBetween(this.random, -grid.rows * 0.75, 0),
      speed: randomBetween(this.random, minSpeed, maxSpeed),
      length: Math.round(randomBetween(this.random, minTrail, Math.max(minTrail + 2, grid.rows * maxTrailRatio))),
    };
  }

  private createColumn(grid: RainGrid): RainColumn {
    return {
      glyphs: Array.from({ length: grid.rows }, () => this.glyphs.next(this.random)),
      stream: this.createStream(grid, true),
    };
  }
}
