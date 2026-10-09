import type { System } from "@/packages/games/engine";
import { randomBetween } from "@/packages/math/random";

import { FAULT_KINDS, FAULT_MODULE, FaultKind } from "../domain/faults";
import { VoyageContext } from "./context";
import { bleedHull } from "./damage";
import { faultSeverity } from "./faults";
import { shipOf } from "./queries";

// Faults are rolled for once a second, not every step.
const CHECK_MS = 1000;

// Things break down. Once a second each sound system may fail, likelier the more it is worn, the hotter it runs
// past what it was built for, and out in the universes; never more than a few at once, and never one already
// broken. While it lasts, a fault does its harm: some here (a fuel leak drains the tank, a coolant leak heats the
// hull, a breach bleeds it), the rest where the system works (a misfire in the engines' control, a glitch in the
// guns' aim, a dead emitter in the shields' recharge). A fault lasts until it is fixed with parts from the hold,
// or patched up by hand on the ground.
export class MalfunctionSystem implements System<VoyageContext> {
  public readonly name = "malfunction";
  private sinceCheck = 0;
  private onGround = 0;

  public reset(): void {
    this.sinceCheck = 0;
    this.onGround = 0;
  }

  public update(context: VoyageContext, dt: number): void {
    const { state, config } = context;
    const parts = shipOf(context);

    if (!parts || state.status !== "flying" || state.phase === "lost" || state.capture) {
      return;
    }

    const { ship } = parts;
    const { faults } = config;
    const leak = faultSeverity(state, "fuelLeak");
    const coolant = faultSeverity(state, "coolantLeak");
    const breach = faultSeverity(state, "breach");

    if (leak > 0) {
      ship.fuel = Math.max(0, ship.fuel - faults.leak * leak * dt);
    }

    if (coolant > 0) {
      ship.temperatureC += faults.coolant * coolant * dt;
    }

    if (breach > 0) {
      bleedHull(context, faults.breach * breach * dt);
    }

    this.patchOnGround(context, dt);

    this.sinceCheck += dt * 1000;

    if (this.sinceCheck >= CHECK_MS) {
      this.sinceCheck -= CHECK_MS;
      this.roll(context);
    }
  }

  // Landed, the crew can get out and patch the ship up by hand: the oldest fault is fixed, for nothing, after a
  // few seconds on the ground, then the next. Nothing breaks down on the ground either.
  private patchOnGround(context: VoyageContext, dt: number): void {
    const { state, config, events } = context;
    const parts = shipOf(context);

    if (!parts?.ship.landedOn || state.faults.length === 0) {
      this.onGround = 0;

      return;
    }

    this.onGround += dt;

    if (this.onGround >= config.faults.groundFixSeconds) {
      const [oldest] = state.faults;

      this.onGround = 0;
      state.faults = state.faults.slice(1);
      events.emit("fixed", { kind: oldest.kind });
    }
  }

  private roll(context: VoyageContext): void {
    const { state, config, random, events } = context;
    const parts = shipOf(context);

    if (!parts || state.faults.length >= config.faults.max || parts.ship.landedOn) {
      return;
    }

    const { ship, modules } = parts;
    const { faults, thermal } = config;
    const away = state.phase === "universe" ? faults.universeFactor : 1;

    FAULT_KINDS.forEach((kind: FaultKind) => {
      const system = FAULT_MODULE[kind];
      const worn = 1 - modules[system];
      const hot = Math.max(0, (ship.temperatureC - thermal.ratings[system]) / Math.max(100, thermal.ratings[system]));
      const chance = faults.rate * (1 + faults.wearFactor * worn) * (1 + faults.heatFactor * hot) * away;

      if (state.faults.length < faults.max && faultSeverity(state, kind) === 0 && random() < chance) {
        state.faults.push({ id: state.nextFaultId, kind, at: state.elapsedMs, severity: randomBetween(random, 0.4, 1) });
        state.nextFaultId += 1;
        events.emit("fault", { kind, module: system });
      }
    });
  }
}
