import { easeInOut } from "@/packages/math/easing";
import { RandomSource } from "@/packages/math/random";

import { LaunchConfig } from "../config";
import { LaunchSize, LaunchSnapshot, LaunchState } from "../domain/types";

interface LaunchSimulationOptions {
  config: LaunchConfig;
  random: RandomSource;
}

// The launch as plain state that only moves through `step`, so it can be tested frame by frame. Holding
// charges the engines and letting go early drains them; a single press charges them by itself; once full,
// the ship climbs, passing one band per zone, and settles in orbit.
export class LaunchSimulation {
  private readonly config: LaunchConfig;
  private readonly random: RandomSource;
  private readonly current: LaunchState;

  constructor(size: LaunchSize, { config, random }: LaunchSimulationOptions) {
    this.config = config;
    this.random = random;
    this.current = {
      size,
      status: "ready",
      charge: 0,
      isHeld: false,
      isAutoCharging: false,
      ascent: 0,
      altitude: 0,
      markers: config.markers,
      passed: 0,
      elapsedMs: 0,
      destructMs: 0,
      countdown: 0,
      explosion: 0,
      debris: [],
      stars: Array.from({ length: config.stars }, () => ({ x: random(), y: random(), size: 0.6 + random() * 1.6, depth: 0.3 + random() * 0.7 })),
    };
  }

  public get state(): Readonly<LaunchState> {
    return this.current;
  }

  public get snapshot(): LaunchSnapshot {
    const { status, passed, countdown } = this.current;

    return { status, passed, countdown };
  }

  public resize(size: LaunchSize): void {
    this.current.size = size;
  }

  public press(): void {
    if (this.isOnPad()) {
      this.current.status = "charging";
      this.current.isHeld = true;
    }
  }

  public release(): void {
    this.current.isHeld = false;
  }

  // One press, no holding: the engines fill by themselves and the ship goes.
  public launch(): void {
    if (this.isOnPad()) {
      this.current.status = "charging";
      this.current.isAutoCharging = true;
    }
  }

  // Straight to orbit, for readers who prefer no motion.
  public complete(): void {
    this.set({ status: "orbit", charge: 1, isHeld: false, isAutoCharging: false, ascent: 1, altitude: 1, passed: this.config.markers });
  }

  public reset(): void {
    this.set({
      status: "ready", charge: 0, isHeld: false, isAutoCharging: false, ascent: 0, altitude: 0, passed: 0, destructMs: 0, countdown: 0, explosion: 0, debris: [],
    });
  }

  // The button everyone was asked not to press: a countdown from orbit, the ship blows, and a new one is
  // rolled out and launched straight away.
  public selfDestruct(): void {
    if (this.current.status !== "orbit") {
      return;
    }

    this.set({
      status: "destructing",
      destructMs: 0,
      countdown: Math.ceil(this.config.countdownMs / 1000),
      explosion: 0,
      debris: Array.from({ length: this.config.debris }, () => ({
        angle: this.random() * Math.PI * 2,
        speed: 0.25 + this.random() * 0.75,
        size: 2 + this.random() * 5,
      })),
    });
  }

  public step(deltaMs: number): void {
    const state = this.current;

    state.elapsedMs += deltaMs;

    if (state.status === "charging") {
      this.charge(deltaMs);
    } else if (state.status === "launching") {
      this.climb(deltaMs);
    } else if (state.status === "destructing" || state.status === "exploding") {
      this.destruct(deltaMs);
    }
  }

  private destruct(deltaMs: number): void {
    const state = this.current;
    const { countdownMs, explodeMs } = this.config;

    state.destructMs += deltaMs;

    if (state.status === "destructing") {
      state.countdown = Math.max(1, Math.ceil((countdownMs - state.destructMs) / 1000));

      if (state.destructMs >= countdownMs) {
        this.set({ status: "exploding", countdown: 0 });
      }
    } else {
      state.explosion = Math.min(1, (state.destructMs - countdownMs) / explodeMs);

      if (state.explosion >= 1) {
        this.reset();
        this.launch();
      }
    }
  }

  private charge(deltaMs: number): void {
    const state = this.current;

    if (state.isHeld || state.isAutoCharging) {
      state.charge = Math.min(1, state.charge + deltaMs / (state.isHeld ? this.config.chargeMs : this.config.autoChargeMs));
    } else {
      state.charge = Math.max(0, state.charge - deltaMs / this.config.drainMs);
    }

    if (state.charge >= 1) {
      this.set({ status: "launching", isAutoCharging: false });
    } else if (state.charge <= 0 && !state.isHeld && !state.isAutoCharging) {
      state.status = "ready";
    }
  }

  private climb(deltaMs: number): void {
    const state = this.current;

    state.ascent = Math.min(1, state.ascent + deltaMs / this.config.ascentMs);
    state.altitude = easeInOut(state.ascent);
    // Band i sits at altitude i / (markers + 1), so the last is passed before orbit.
    state.passed = Math.min(state.markers, Math.floor(state.altitude * (state.markers + 1)));

    if (state.ascent >= 1) {
      this.complete();
    }
  }

  // Every change of several fields at once goes through here, so each is checked against the state's type.
  private set(changes: Partial<LaunchState>): void {
    Object.assign(this.current, changes);
  }

  private isOnPad(): boolean {
    return this.current.status === "ready" || this.current.status === "charging";
  }
}
