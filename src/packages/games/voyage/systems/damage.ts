import { angleBetween } from "@/packages/physics/newtonian";

import { Decal } from "../domain/components";
import { DamageKind } from "../domain/events";
import { VoyageContext } from "./context";
import { shipOf } from "./queries";

const MAX_DECALS = 16;

// The hull share the warm up never lets the hull drop below: heavily damaged, smoking, but flying.
const SAFE_FLOOR = 0.12;

const kindFor = (share: number): Decal["kind"] => (share > 0.6 ? "dent" : share > 0.3 ? "scorch" : "breach");

// Every kind of damage goes through here: shields take it first, the hull takes what is left, and the hull is
// marked where it was hit, in the ship's own frame, so the mark turns with the ship. Marks grow worse as the hull
// fails; past a limit a new hit deepens the nearest old one instead of adding more.
export const applyDamage = (context: VoyageContext, amount: number, worldAngle: number, kind: DamageKind): void => {
  const parts = shipOf(context);
  const { state, config, events, random } = context;

  if (!parts || amount <= 0 || state.status !== "flying") {
    return;
  }

  const { body, ship, health } = parts;
  const toShields = Math.min(health.shields, amount);
  const isSafe = config.isSolarSafe && state.phase !== "universe";
  const floor = isSafe ? health.maxHull * SAFE_FLOOR : 0;
  const toHull = Math.max(0, Math.min(amount - toShields, health.hull - floor));

  health.shields -= toShields;
  health.hull -= toHull;
  health.rechargeIn = config.ship.shieldDelayMs;

  if (toHull > 0) {
    const angle = angleBetween(ship.angle, worldAngle);
    const severity = Math.min(1, toHull / 250);
    const kindNow = kindFor(health.hull / health.maxHull);

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
