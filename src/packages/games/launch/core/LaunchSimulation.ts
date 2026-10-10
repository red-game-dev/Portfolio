import { TAU, wrapDegrees } from "@/packages/math/angles";
import { easeInOut } from "@/packages/math/easing";
import { RandomSource } from "@/packages/math/random";
import { julianDay, solarElevation, sunSubsolarPoint } from "@/packages/physics/kepler";

import { ALTITUDE_KM, CLOCK_S, DEFAULT_LAUNCH_SITE, LaunchConfig, PITCH_DEG, SPEED_KMH, VEHICLES } from "../config";
import { LaunchSite, LaunchSize, LaunchSnapshot, LaunchState } from "../domain/types";
import { profileAt } from "../utils/profile";

interface LaunchSimulationOptions {
  config: LaunchConfig;
  random: RandomSource;
  // The pad, and the real moment of the launch (ms since 1970), which sets the Sun over it.
  site?: LaunchSite;
  epochMs?: number;
}

// The launch as plain state that only moves through `step`, so it can be tested frame by frame. Holding
// charges the engines and letting go early drains them; a single press charges them by itself; once full,
// the rocket climbs as a real one does, its height, speed and clock read from a real ascent, the moments of
// the flight called out one per zone crossed, and settles in orbit. The Sun stands over the pad where it
// really stands at that moment, so a launch by night is flown in the dark.
export class LaunchSimulation {
  private readonly config: LaunchConfig;
  private readonly random: RandomSource;
  private readonly current: LaunchState;

  constructor(size: LaunchSize, { config, random, site = DEFAULT_LAUNCH_SITE, epochMs = Date.now() }: LaunchSimulationOptions) {
    const subsolar = sunSubsolarPoint(julianDay(epochMs));

    this.config = config;
    this.random = random;
    this.current = {
      altitudeKm: 0,
      speedKmh: 0,
      missionSeconds: 0,
      pitch: 0,
      site,
      sunElevation: solarElevation(subsolar, site.latitude, site.longitude),
      // East of the pad (the Sun not yet past its noon there) is the right of the view.
      sunSide: wrapDegrees(site.longitude - subsolar.longitude) < 0 ? 0.62 : -0.62,
      subsolarLatitude: subsolar.latitude,
      subsolarLongitude: subsolar.longitude,
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
    const { status, passed, countdown, site, markers } = this.current;
    const milestones = VEHICLES[site.vehicle].milestones.slice(0, markers);

    return { status, passed, countdown, milestone: passed > 0 ? milestones[Math.min(passed, milestones.length) - 1][0] : null };
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
    this.read();
  }

  public reset(): void {
    this.set({
      status: "ready", charge: 0, isHeld: false, isAutoCharging: false, ascent: 0, altitude: 0, passed: 0, destructMs: 0, countdown: 0, explosion: 0, debris: [],
    });
    this.read();
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
        angle: this.random() * TAU,
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
    this.read();

    if (state.ascent >= 1) {
      this.complete();
    }
  }

  // The broadcast's readings at this point of the climb, and the moments passed so far (the last before orbit).
  private read(): void {
    const state = this.current;
    const milestones = VEHICLES[state.site.vehicle].milestones.slice(0, state.markers);

    state.altitudeKm = profileAt(ALTITUDE_KM, state.ascent);
    state.speedKmh = profileAt(SPEED_KMH, state.ascent);
    state.missionSeconds = profileAt(CLOCK_S, state.ascent);
    state.pitch = profileAt(PITCH_DEG, state.ascent);
    state.passed = state.status === "orbit" ? state.markers : milestones.filter(([, at]) => state.ascent >= at).length;
  }

  // Every change of several fields at once goes through here, so each is checked against the state's type.
  private set(changes: Partial<LaunchState>): void {
    Object.assign(this.current, changes);
  }

  private isOnPad(): boolean {
    return this.current.status === "ready" || this.current.status === "charging";
  }
}
