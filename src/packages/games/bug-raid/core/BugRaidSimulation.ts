import { randomBetween, RandomSource } from "@/packages/math/random";

import { BugRaidConfig } from "../config";
import { Bug, BugRaidSize, BugRaidSnapshot, BugRaidState } from "../domain/types";
import { compact } from "../utils/compact";
import { clamp, distanceSquared } from "../utils/geometry";
import { pickKind, spawnInterval } from "../utils/spawn";

export interface BugRaidSimulationDependencies {
  config: BugRaidConfig;
  random: RandomSource;
}

// Pure game rules: bugs spawn at the top and walk down towards production, strikes squash them, waves
// speed everything up and every bug that gets through costs a life. No DOM and no clock of its own, so
// it plays the same in a browser, a worker or a test.
export class BugRaidSimulation {
  public readonly state: BugRaidState;
  private readonly config: BugRaidConfig;
  private readonly random: RandomSource;
  private nextId = 0;
  private spawnInMs = 0;

  constructor(size: BugRaidSize, { config, random }: BugRaidSimulationDependencies) {
    this.config = config;
    this.random = random;
    this.state = {
      size,
      status: "ready",
      bugs: [],
      splats: [],
      cursor: { x: size.width / 2, y: size.height / 2, isVisible: false },
      score: 0,
      lives: config.lives,
      wave: 1,
      elapsedMs: 0,
    };
  }

  public get snapshot(): BugRaidSnapshot {
    const { status, score, lives, wave } = this.state;

    return { status, score, lives, wave };
  }

  public start(): void {
    const { state } = this;

    state.status = "playing";
    state.bugs = [];
    state.splats = [];
    state.score = 0;
    state.lives = this.config.lives;
    state.wave = 1;
    state.elapsedMs = 0;
    this.spawnInMs = 0;
  }

  // Keeps everything inside the new bounds, so a resize mid game never strands a bug off screen.
  public resize(size: BugRaidSize): void {
    const { state } = this;

    state.size = size;
    state.cursor.x = clamp(state.cursor.x, 0, size.width);
    state.cursor.y = clamp(state.cursor.y, 0, size.height);
    state.bugs.forEach((bug) => {
      const { radius } = this.config.kinds[bug.kind];

      bug.x = clamp(bug.x, radius, Math.max(radius, size.width - radius));
    });
  }

  public step(deltaMs: number): void {
    const { state } = this;

    this.ageSplats(deltaMs);

    if (state.status !== "playing") {
      return;
    }

    state.elapsedMs += deltaMs;
    state.wave = 1 + Math.floor(state.elapsedMs / this.config.waveEveryMs);
    this.spawnInMs -= deltaMs;

    if (this.spawnInMs <= 0) {
      state.bugs.push(this.createBug());
      this.spawnInMs += spawnInterval(state.wave, this.config.spawnEveryMs, this.config.spawnSpeedup, this.config.minSpawnEveryMs);
    }

    this.moveBugs(deltaMs);
  }

  // Squashes the topmost bug within reach of (x, y). Returns whether anything was hit.
  public strike(x: number, y: number): boolean {
    const { state } = this;

    if (state.status !== "playing") {
      return false;
    }

    const index = this.findTopmostInReach(x, y);

    if (index === -1) {
      return false;
    }

    const target = state.bugs[index];

    target.hitsLeft -= 1;

    if (target.hitsLeft <= 0) {
      state.bugs.splice(index, 1);
      state.splats.push({ x: target.x, y: target.y, ageMs: 0 });
      state.score += this.config.kinds[target.kind].points * state.wave;
    }

    return true;
  }

  // Moves the keyboard cursor by whole steps, for example (-1, 0) for one press of the left arrow.
  public aim(stepsX: number, stepsY: number): void {
    const { cursor, size } = this.state;

    cursor.isVisible = true;
    cursor.x = clamp(cursor.x + stepsX * this.config.cursorStep, 0, size.width);
    cursor.y = clamp(cursor.y + stepsY * this.config.cursorStep, 0, size.height);
  }

  public strikeAtCursor(): boolean {
    this.state.cursor.isVisible = true;

    return this.strike(this.state.cursor.x, this.state.cursor.y);
  }

  // Bugs are drawn in array order, so the last one in reach is the one on top.
  private findTopmostInReach(x: number, y: number): number {
    const { bugs } = this.state;

    for (let index = bugs.length - 1; index >= 0; index -= 1) {
      const bug = bugs[index];
      const reach = this.config.kinds[bug.kind].radius + this.config.strikeSlop;

      if (distanceSquared(x, y, bug.x, bug.y) <= reach * reach) {
        return index;
      }
    }

    return -1;
  }

  private createBug(): Bug {
    const kind = pickKind(this.config.kinds, this.random);
    const { radius, minSpeed, maxSpeed, hits, sidestepEveryMs } = this.config.kinds[kind];

    this.nextId += 1;

    return {
      id: this.nextId,
      kind,
      x: randomBetween(this.random, radius, Math.max(radius, this.state.size.width - radius)),
      y: -radius,
      speed: randomBetween(this.random, minSpeed, maxSpeed),
      hitsLeft: hits,
      phase: this.random() * Math.PI * 2,
      sidestepInMs: sidestepEveryMs,
    };
  }

  private moveBugs(deltaMs: number): void {
    const { state } = this;
    const speedFactor = this.config.speedPerWave ** (state.wave - 1);
    const productionTop = state.size.height - this.config.productionHeight;
    let breaches = 0;

    compact(state.bugs, (bug) => {
      const { radius, sidestepEveryMs } = this.config.kinds[bug.kind];

      bug.y += (bug.speed * speedFactor * deltaMs) / 1000;

      if (sidestepEveryMs > 0) {
        this.sidestep(bug, radius, sidestepEveryMs, deltaMs);
      }

      if (bug.y + radius < productionTop) {
        return true;
      }

      breaches += 1;

      return false;
    });

    state.lives = Math.max(0, state.lives - breaches);

    if (state.lives === 0) {
      state.status = "over";
    }
  }

  // Flaky bugs jump sideways now and then, which is what makes them flaky.
  private sidestep(bug: Bug, radius: number, everyMs: number, deltaMs: number): void {
    bug.sidestepInMs -= deltaMs;

    if (bug.sidestepInMs > 0) {
      return;
    }

    const direction = this.random() < 0.5 ? -1 : 1;

    bug.sidestepInMs += everyMs;
    bug.x = clamp(bug.x + direction * radius * 3, radius, Math.max(radius, this.state.size.width - radius));
  }

  private ageSplats(deltaMs: number): void {
    const { state } = this;

    if (state.splats.length === 0) {
      return;
    }

    compact(state.splats, (splat) => {
      splat.ageMs += deltaMs;

      return splat.ageMs < this.config.splatMs;
    });
  }
}
