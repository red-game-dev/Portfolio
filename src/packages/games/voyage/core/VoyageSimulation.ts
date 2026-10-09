import { clamp } from "@/packages/math/clamp";
import { RandomSource, randomBetween } from "@/packages/math/random";

import { VoyageConfig } from "../config";
import { VoyageHole, VoyageInput, VoyageSize, VoyageSnapshot, VoyageState } from "../domain/types";

interface VoyageSimulationOptions {
  config: VoyageConfig;
  random: RandomSource;
}

// The line things are timed to pass, as a share of the screen's height: where the ship sits at rest.
const PASS_LINE = 0.74;
// How far up the ship may fly, as a share of the screen's height.
const CEILING = 0.28;
// A hole pulls from this many of its radii away.
const PULL_RANGE = 9;
// The most a pull can move the ship, in world units a second: an ordinary hole can be escaped at full
// thrust, the singularity cannot.
const PULL_CAP = 1.25;
const SINGULARITY_PULL_CAP = 4;

const NO_INPUT: VoyageInput = { direction: { x: 0, y: 0 }, target: null };

// The voyage as plain state that only moves through `step`, so every part of it can be tested frame by frame:
// out from Earth past each planet to Pluto, into the black hole beyond it, then from universe to universe,
// each crossed through another hole. Rocks knock the score back on the way out and cost shields past the black
// hole, pickups score, and the run ends with the last shield.
export class VoyageSimulation {
  private readonly config: VoyageConfig;
  private readonly random: RandomSource;
  private current: VoyageState;

  constructor(size: VoyageSize, { config, random }: VoyageSimulationOptions) {
    this.config = config;
    this.random = random;
    this.current = this.fresh(size, "ready");
  }

  public get state(): Readonly<VoyageState> {
    return this.current;
  }

  public get snapshot(): VoyageSnapshot {
    const { status, phase, universe, universes, shields, score, au, passing } = this.current;

    return { status, phase, universe, universes, shields, score: Math.floor(score), au: Math.round(au * 10) / 10, passing };
  }

  // Keeps everything where it was on screen, relative to the new size.
  public resize(size: VoyageSize): void {
    const state = this.current;
    const next = this.measure(size);

    if (state.width > 0 && state.height > 0) {
      const sx = next.width / state.width;
      const sy = next.height / state.height;
      const move = (point: { x: number; y: number }) => {
        point.x *= sx;
        point.y *= sy;
      };

      move(state.ship);
      state.bodies.forEach(move);
      state.hazards.forEach(move);
      state.items.forEach(move);

      if (state.hole) {
        move(state.hole);
      }

      if (state.capture) {
        move(state.capture.centre);
      }

      state.departureY *= sy;
    }

    this.set(next);
  }

  // A new run from Earth, whatever the last one ended in.
  public start(): void {
    this.current = this.fresh(this.current.size, "flying");
  }

  public step(deltaMs: number, input: VoyageInput = NO_INPUT): void {
    const state = this.current;

    if (state.status === "ready") {
      return;
    }

    const dt = deltaMs / 1000;

    state.elapsedMs += deltaMs;
    state.phaseMs += deltaMs;
    state.flash = Math.max(0, state.flash - dt * 2.5);

    if (state.status === "over") {
      return;
    }

    if (state.capture) {
      this.spiral(deltaMs);

      return;
    }

    if (state.phase === "lost") {
      this.crossLost();

      return;
    }

    if (state.phase === "solar") {
      this.chart();
    } else if (state.phase === "singularity") {
      this.approachSingularity(dt);
    } else {
      this.roamUniverse(deltaMs);
    }

    this.fly(dt, deltaMs, input);
  }

  // Where the solar system run has got to: the distance, the stops passed, and the singularity after Pluto.
  private chart(): void {
    const state = this.current;
    const { route, solarMs } = this.config;
    const last = route[route.length - 1].au;
    const progress = Math.min(1, state.phaseMs / solarMs);

    state.au = 1 + (last - 1) * progress * progress;

    while (state.nextStop < route.length) {
      const stop = route[state.nextStop];

      if (stop.until !== undefined) {
        if (state.au < stop.au) {
          break;
        }
      } else {
        // Seconds until it should be level with the ship, and how long it takes to slide down to there.
        const untilPass = (Math.sqrt((stop.au - 1) / (last - 1)) * solarMs - state.phaseMs) / 1000;
        const passY = state.height * PASS_LINE;

        if (untilPass > (passY + stop.radius + 0.05) / state.speed) {
          break;
        }

        state.bodies.push({
          id: stop.id,
          x: stop.side < 0 ? stop.radius * stop.inset : state.width - stop.radius * stop.inset,
          y: passY - untilPass * state.speed,
          radius: stop.radius,
        });
      }

      state.passing = stop.id;
      state.nextStop += 1;
    }

    const belt = route.find((stop) => stop.until !== undefined && state.au >= stop.au && state.au < stop.until);

    this.spawnHazards(belt?.every ?? this.config.hazardEveryMs);
    this.spawnPickups();

    if (progress >= 1) {
      this.enterSingularity();
    }
  }

  private enterSingularity(): void {
    const state = this.current;

    this.set({
      phase: "singularity",
      phaseMs: 0,
      hole: { x: state.width / 2, y: -0.4, radius: this.config.singularityRadius, vy: state.speed * 0.6, pull: this.config.holePull * 3 },
    });
  }

  // It drifts down to a third of the way, its pull growing until nothing escapes; if the ship somehow holds
  // out, it is taken anyway.
  private approachSingularity(dt: number): void {
    const state = this.current;
    const { hole } = state;

    if (!hole) {
      return;
    }

    if (hole.y < state.height * 0.32) {
      hole.y += hole.vy * dt;
    }

    hole.pull = this.config.holePull * (3 + (state.phaseMs / 1000) * 2.5);

    if (state.phaseMs >= this.config.singularityMs) {
      this.capture(hole);
    }
  }

  private roamUniverse(deltaMs: number): void {
    const state = this.current;
    const { universeSpeed, speedGrowth, maxSpeed, universeHazardEveryMs, minHazardEveryMs } = this.config;

    state.deepMs += deltaMs;
    state.speed = Math.min(maxSpeed, universeSpeed + speedGrowth * (state.deepMs / 60000));
    this.spawnHazards(Math.max(minHazardEveryMs, universeHazardEveryMs - (state.deepMs / 1000) * 6));
    this.spawnPickups();

    if (!state.hole && state.phaseMs >= state.timers.hole) {
      state.hole = {
        x: randomBetween(this.random, state.width * 0.22, state.width * 0.78),
        y: -0.35,
        radius: this.config.holeRadius,
        vy: state.speed * 0.55,
        pull: this.config.holePull,
      };
    }
  }

  // The ship, everything around it, what it hits and what takes it.
  private fly(dt: number, deltaMs: number, input: VoyageInput): void {
    const state = this.current;
    const scroll = state.speed * dt;

    this.steer(dt, deltaMs, input);

    state.flown += scroll;
    state.score += this.config.scoring.perUnit * scroll;
    state.departureY += scroll;
    state.bodies.forEach((body) => {
      body.y += scroll;
    });
    state.items.forEach((item) => {
      item.y += scroll;
    });
    state.hazards.forEach((hazard) => {
      hazard.x += hazard.vx * dt;
      hazard.y += hazard.vy * dt;
      hazard.angle += hazard.spin * dt;
    });

    if (state.hole && state.phase !== "singularity") {
      state.hole.y += state.hole.vy * dt;
    }

    const below = state.height + 0.3;

    state.bodies = state.bodies.filter((body) => body.y - body.radius < below);
    state.items = state.items.filter((item) => item.y - item.radius < below);
    state.hazards = state.hazards.filter((hazard) => hazard.y - hazard.radius < below && hazard.x > -0.3 && hazard.x < state.width + 0.3);

    if (state.hole && state.hole.y - state.hole.radius > below) {
      state.hole = null;
      state.timers.hole = state.phaseMs + this.holeInterval();
    }

    this.collide();
  }

  private steer(dt: number, deltaMs: number, { direction, target }: VoyageInput): void {
    const state = this.current;
    const { ship } = state;
    const max = this.config.shipSpeed;
    let wantX = 0;
    let wantY = 0;

    if (target) {
      wantX = clamp((target.x - ship.x) * 9, -max, max);
      wantY = clamp((target.y - ship.y) * 9, -max, max);
    } else if (direction.x !== 0 || direction.y !== 0) {
      const length = Math.hypot(direction.x, direction.y);

      wantX = (direction.x / length) * max;
      wantY = (direction.y / length) * max;
    }

    // A little inertia, so the ship banks into a turn rather than snapping.
    const ease = Math.min(1, dt * 12);

    ship.vx += (wantX - ship.vx) * ease;
    ship.vy += (wantY - ship.vy) * ease;
    ship.x += ship.vx * dt;
    ship.y += ship.vy * dt;

    if (state.hole) {
      this.pull(state.hole, dt);
    }

    const radius = this.config.shipRadius;

    ship.x = clamp(ship.x, radius, state.width - radius);
    ship.y = clamp(ship.y, state.height * CEILING, state.height - radius * 1.6);
    ship.tilt = clamp(ship.vx / max, -1, 1);
    ship.invulnerableMs = Math.max(0, ship.invulnerableMs - deltaMs);
  }

  private pull(hole: VoyageHole, dt: number): void {
    const { ship } = this.current;
    const dx = hole.x - ship.x;
    const dy = hole.y - ship.y;
    const distance = Math.hypot(dx, dy);

    if (distance < hole.radius) {
      this.capture(hole);

      return;
    }

    if (distance > hole.radius * PULL_RANGE && this.current.phase !== "singularity") {
      return;
    }

    const cap = this.current.phase === "singularity" ? SINGULARITY_PULL_CAP : PULL_CAP;
    const speed = Math.min(cap, hole.pull / Math.max(distance * distance, 0.0025));

    ship.x += (dx / distance) * speed * dt;
    ship.y += (dy / distance) * speed * dt;
  }

  private collide(): void {
    const state = this.current;
    const { ship } = state;
    const radius = this.config.shipRadius;
    const touches = (x: number, y: number, reach: number) => Math.hypot(x - ship.x, y - ship.y) < reach;

    state.items = state.items.filter((item) => {
      if (!touches(item.x, item.y, radius + item.radius)) {
        return true;
      }

      if (item.kind === "shield") {
        state.shields = Math.min(this.config.shields, state.shields + 1);
      } else {
        state.pickups += 1;
        state.score += this.config.scoring.pickup;
      }

      return false;
    });

    state.hazards = state.hazards.filter((hazard) => {
      if (!touches(hazard.x, hazard.y, radius * 0.8 + hazard.radius * 0.85)) {
        return true;
      }

      if (ship.invulnerableMs <= 0) {
        if (this.config.isSolarSafe && state.phase !== "universe") {
          state.score = Math.max(0, state.score - this.config.scoring.knock);
        } else {
          state.shields -= 1;
        }

        state.flash = 1;
        ship.invulnerableMs = this.config.invulnerableMs;
      }

      return false;
    });

    if (state.shields <= 0 && state.status === "flying") {
      this.set({ status: "over", phaseMs: 0, shields: 0 });
    }
  }

  private capture(hole: VoyageHole): void {
    const { ship } = this.current;

    this.current.capture = {
      centre: { x: hole.x, y: hole.y },
      angle: Math.atan2(ship.y - hole.y, ship.x - hole.x),
      from: Math.max(hole.radius * 0.6, Math.hypot(ship.x - hole.x, ship.y - hole.y)),
      progress: 0,
    };
  }

  // Round and round and in: faster and closer as it goes, then gone.
  private spiral(deltaMs: number): void {
    const state = this.current;
    const capture = state.capture;

    if (!capture) {
      return;
    }

    const dt = deltaMs / 1000;

    capture.progress = Math.min(1, capture.progress + deltaMs / this.config.captureMs);
    capture.angle += dt * (4 + capture.progress * 12);

    const distance = capture.from * (1 - capture.progress) ** 2;

    state.ship.x = capture.centre.x + Math.cos(capture.angle) * distance;
    state.ship.y = capture.centre.y + Math.sin(capture.angle) * distance;

    if (capture.progress >= 1) {
      this.set({ phase: "lost", phaseMs: 0, capture: null, hole: null, bodies: [], hazards: [], items: [] });
    }
  }

  // Inside: long the first time, a moment after that.
  private crossLost(): void {
    const state = this.current;

    if (state.phaseMs < (state.universes === 0 ? this.config.lostMs : this.config.jumpMs)) {
      return;
    }

    const universe = state.universes === 0 ? 0 : this.nextUniverse();

    this.set({
      phase: "universe",
      phaseMs: 0,
      universe,
      universes: state.universes + 1,
      visited: state.visited.includes(universe) ? state.visited : [...state.visited, universe],
      score: state.score + this.config.scoring.universe,
      passing: null,
      speed: Math.min(this.config.maxSpeed, this.config.universeSpeed + this.config.speedGrowth * (state.deepMs / 60000)),
      ship: { ...state.ship, x: state.width / 2, y: state.height * PASS_LINE, vx: 0, vy: 0, tilt: 0, invulnerableMs: this.config.invulnerableMs },
      timers: { hazard: 1200, pickup: 800, shield: this.config.shieldEveryMs, hole: this.holeInterval() },
    });
  }

  // Somewhere new if there is anywhere left, and never where the ship just was.
  private nextUniverse(): number {
    const state = this.current;
    const all = Array.from({ length: this.config.universes }, (_, index) => index).filter((index) => index !== state.universe);
    const unseen = all.filter((index) => !state.visited.includes(index));
    const choices = unseen.length > 0 ? unseen : all;

    return choices[Math.min(choices.length - 1, Math.floor(this.random() * choices.length))] ?? 0;
  }

  private spawnHazards(everyMs: number): void {
    const state = this.current;

    while (state.phaseMs >= state.timers.hazard) {
      const radius = randomBetween(this.random, 0.026, 0.066);

      state.hazards.push({
        x: randomBetween(this.random, radius, state.width - radius),
        y: -radius - 0.05,
        radius,
        vx: randomBetween(this.random, -0.07, 0.07),
        vy: state.speed + randomBetween(this.random, 0, 0.18),
        angle: this.random() * Math.PI * 2,
        spin: randomBetween(this.random, -1.6, 1.6),
        shape: Math.floor(this.random() * 6),
      });
      state.timers.hazard += everyMs;
    }
  }

  private spawnPickups(): void {
    const state = this.current;

    while (state.phaseMs >= state.timers.pickup) {
      state.items.push({ x: randomBetween(this.random, 0.08, state.width - 0.08), y: -0.06, radius: 0.022, kind: "score" });
      state.timers.pickup += this.config.pickupEveryMs * randomBetween(this.random, 0.7, 1.3);
    }

    if (state.phaseMs >= state.timers.shield) {
      if (state.shields < this.config.shields) {
        state.items.push({ x: randomBetween(this.random, 0.12, state.width - 0.12), y: -0.08, radius: 0.03, kind: "shield" });
      }

      state.timers.shield += this.config.shieldEveryMs;
    }
  }

  private holeInterval(): number {
    const [min, max] = this.config.holeEveryMs;

    return randomBetween(this.random, min, max);
  }

  private measure(size: VoyageSize): Pick<VoyageState, "size" | "unit" | "width" | "height"> {
    const unit = Math.max(1, Math.min(size.width, size.height));

    return { size, unit, width: size.width / unit, height: size.height / unit };
  }

  private fresh(size: VoyageSize, status: VoyageState["status"]): VoyageState {
    const measured = this.measure(size);

    return {
      ...measured,
      status,
      phase: "solar",
      elapsedMs: 0,
      phaseMs: 0,
      au: 1,
      flown: 0,
      speed: this.config.solarSpeed,
      deepMs: 0,
      ship: { x: measured.width / 2, y: measured.height * PASS_LINE, radius: this.config.shipRadius, vx: 0, vy: 0, tilt: 0, invulnerableMs: 0 },
      shields: this.config.shields,
      score: 0,
      pickups: 0,
      universes: 0,
      universe: -1,
      visited: [],
      passing: null,
      nextStop: 0,
      departureY: measured.height * 0.88,
      bodies: [],
      hazards: [],
      items: [],
      hole: null,
      capture: null,
      flash: 0,
      timers: { hazard: this.config.hazardEveryMs, pickup: 1200, shield: this.config.shieldEveryMs, hole: this.holeInterval() },
    };
  }

  // Every change of several fields at once goes through here, so each is checked against the state's type.
  private set(changes: Partial<VoyageState>): void {
    Object.assign(this.current, changes);
  }
}
