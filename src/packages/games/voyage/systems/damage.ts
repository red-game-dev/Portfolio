import { angleBetween } from "@/packages/math/angles";

import { Decal, ModuleId } from "../domain/components";
import { DamageKind } from "../domain/events";
import { VoyageContext } from "./context";
import { shipOf } from "./queries";

const MAX_DECALS = 16;

// The hull share the warm up never lets the hull drop below: heavily damaged, smoking, but flying.
const SAFE_FLOOR = 0.12;

// Kinds of damage that come as one hit, which a block shield's block can take whole. Fire from the ground comes as a
// steady stream instead, a little every step, so it is not among them: it would spend every block in a moment.
const BLOCKED: readonly DamageKind[] = ["weapon", "impact", "crash"];

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

// A slow loss of hull with no single place it comes from, such as air venting through a breach: no mark and no
// hit to announce, and in the warm up the same floor as any other harm.
export const bleedHull = (context: VoyageContext, amount: number): void => {
  const parts = shipOf(context);
  const { state, config } = context;

  if (!parts || amount <= 0 || state.status !== "flying") {
    return;
  }

  const { health } = parts;
  const floor = config.isSolarSafe && state.phase !== "universe" ? health.maxHull * SAFE_FLOOR : 0;

  health.hull = Math.max(Math.min(health.hull, floor), health.hull - amount);
};

// Every kind of damage goes through here: shields take it first, the hull takes what is left, the hull is
// marked where it was hit (in the ship's own frame, so the mark turns with it), and a strike wears the system
// under it. Marks grow worse as the hull fails; past a limit a new hit deepens the nearest old one instead. In
// the warm up the hull keeps a floor against everything but the star's own heat.
export const applyDamage = (context: VoyageContext, raw: number, worldAngle: number, kind: DamageKind): void => {
  const parts = shipOf(context);
  const { state, config, events, random } = context;

  if (!parts || raw <= 0 || state.status !== "flying") {
    return;
  }

  // The fittings turn away a share of every hit, though not the heat of melting plating.
  const amount = kind === "melt" ? raw : raw * (1 - config.ship.resist);

  const { body, ship, health, modules } = parts;

  // A block shield takes a whole hit on each block, one block a hit.
  if (state.blocks > 0 && BLOCKED.includes(kind)) {
    state.blocks -= 1;
    events.emit("blocked", { left: state.blocks });

    return;
  }

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

// The most tidal stretch (world units, 2 mu L / r^3 across the ship's length) a hull takes, how hard it tears past
// it for each multiple over, and the hardest it tears (hull a second). Near a dead star, or a black hole: the lighter
// the hole, the further out it tears, since its pull changes more sharply across a ship's length at the same few
// horizons out, as real stellar black holes tear apart what falls in before it reaches them. The cap is what lets
// a ship plunge through to the universe beyond with its hull in tatters, while one that lingers close is torn up.
export const TIDAL_LIMIT = 0.5;
const TIDAL_TEAR = 160;
const HARDEST_TEAR = 320;

// Tides past what the hull takes tear at it, from the side facing what pulls.
export const tear = (context: VoyageContext, tidal: number, towards: number, dt: number): void => {
  if (tidal > TIDAL_LIMIT) {
    applyDamage(context, Math.min(HARDEST_TEAR, TIDAL_TEAR * (tidal / TIDAL_LIMIT - 1)) * dt, towards, "tidal");
  }
};
