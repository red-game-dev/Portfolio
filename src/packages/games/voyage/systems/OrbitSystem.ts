import type { System } from "@/packages/games/engine";

import { VoyageContext } from "./context";
import { missionTime, placeBodies } from "./orbits";

// Moves the system on with the mission clock: every planet round the Sun on its real orbit, every moon round
// its planet, a universe's worlds round their star, every body turning at its own rate. Runs first, so
// everything after sees where they are.
export class OrbitSystem implements System<VoyageContext> {
  public readonly name = "orbits";

  public update({ state }: VoyageContext, dt: number): void {
    if (state.phase === "lost") {
      return;
    }

    placeBodies(state.system, missionTime(state.clock, state.elapsedMs), dt);
  }
}
