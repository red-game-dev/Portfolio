import { StarSystem } from "../domain/content";

// A copy of a system to fly in, so nothing one run does to its worlds (where they are, a world struck or broken
// apart) is still there in the next.
export const cloneSystem = (system: StarSystem): StarSystem => ({
  ...system,
  star: { ...system.star },
  bodies: system.bodies.map((body) => ({ ...body, real: { ...body.real } })),
  belts: system.belts.map((belt) => ({ ...belt })),
});
