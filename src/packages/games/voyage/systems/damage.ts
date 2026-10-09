import { angleBetween } from "@/packages/physics/newtonian";

import { Decal, ModuleId } from "../domain/components";
import { DamageKind } from "../domain/events";
import { VoyageContext } from "./context";
import { shipOf } from "./queries";

const MAX_DECALS = 16;

// The hull share the warm up never lets the hull drop below: heavily damaged, smoking, but flying.
const SAFE_FLOOR = 0.12;

// Kinds of damage that strike a part of the ship, and so the system under it.
const STRIKES: readonly DamageKind[] = ["impact", "crash", "crush"];

const kindFor = (share: number): Decal["kind"] => (share > 0.6 ? "dent" : share > 0.3 ? "scorch" : "breach");

// The system under a point of the hull, by its angle in the ship's frame (0 is the nose): sensors in the nose,
// the tank and the shield generator along the flanks, the engines and radiators in the tail.
export const moduleAt = (angle: number): ModuleId => {
  const away = Math.abs(angle);

  if (away < 0.6) {
    return "sensors";
  }

  if (away > 2.5) {
    return away > 2.85 ? "engines" : "radiators";
  }

  return angle > 0 ? "fuel" : "shields";
};

// Every kind of damage goes through here: shields take it first, the hull takes what is left, the hull is
// marked where it was hit (in the ship's own frame, so the mark turns with it), and a strike wears the system
// under it. Marks grow worse as the hull fails; past a limit a new hit deepens the nearest old one instead. In
// the warm up the hull keeps a floor against everything but the star's own heat.
export const applyDamage = (context: VoyageContext, amount: number, worldAngle: number, kind: DamageKind): void => {
  const parts = shipOf(context);
  const { state, config, events, random } = context;

  if (!parts || amount <= 0 || state.status !== "flying") {
    return;
  }

  const { body, ship, health, modules } = parts;
  const toShields = Math.min(health.shields, amount);
  const isSafe = config.isSolarSafe && state.phase !== "universe" && kind !== "melt";
  const floor = isSafe ? health.maxHull * SAFE_FLOOR : 0;
  const toHull = Math.max(0, Math.min(amount - toShields, health.hull - floor));

  health.shields -= toShields;
  health.hull -= toHull;
  health.rechargeIn = config.ship.shieldDelayMs;

  if (toHull > 0) {
    const angle = angleBetween(ship.angle, worldAngle);
    const severity = Math.min(1, toHull / 250);
    const kindNow = kindFor(health.hull / health.maxHull);

    if (STRIKES.includes(kind)) {
      const struck = moduleAt(angle);

      modules[struck] = Math.max(0, modules[struck] - (toHull / health.maxHull) * 1.5);
    }

    if (health.decals.length < MAX_DECALS) {
      health.decals.push({ angle, severity, kind: kindNow, seed: random() });
    } else {
      const nearest = health.decals.reduce((best, decal) => (Math.abs(angleBetween(decal.angle, angle)) < Math.abs(angleBetween(best.angle, angle)) ? decal : best));

      nearest.severity = Math.min(1, nearest.severity + severity);
      nearest.kind = kindNow;
    }
  }

  events.emit("hit", {
    x: body.x + Math.cos(worldAngle) * body.radius,
    y: body.y + Math.sin(worldAngle) * body.radius,
    angle: worldAngle,
    amount,
    toShields,
    toHull,
    kind,
  });
};
