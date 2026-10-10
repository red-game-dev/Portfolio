import type { System } from "@/packages/games/engine";

import { VoyageContext } from "./context";
import { rescueHome } from "./homecoming";
import { shipOf } from "./queries";

// A ship with no fuel can neither lift off nor steer, so it is stranded: on a world (Venus's heat boils a Rocket's
// tank dry and its pressure wrecks the engines), or adrift. Fuel loaded in time (a fuel cell from the hold, a people's
// gift) ends it. Otherwise, after `descent.strandedSeconds`: in our solar system, the warm up, a rescue brings the
// crew home to a new rocket on the pad; out in the universes nobody is coming, and the run is over. Not while coming
// down, being picked up at home, falling into a black hole, or lost between universes.
export class StrandedSystem implements System<VoyageContext> {
  public readonly name = "stranded";

  public update(context: VoyageContext): void {
    const { state, config, events } = context;
    const parts = shipOf(context);
    const isComingDown = state.descent !== null && state.descent.downAt === null;
    const isOut = state.phase !== "solar" && state.phase !== "universe";

    if (!parts || state.status !== "flying" || isOut || state.capture || state.homecoming || isComingDown || parts.ship.fuel > 0) {
      state.stranded = null;

      return;
    }

    const body = parts.ship.landedOn;
    const isRescue = state.phase === "solar" && config.isSolarSafe;
    const seconds = config.descent.strandedSeconds;

    if (!state.stranded) {
      state.stranded = { since: state.elapsedMs };
      events.emit("stranded", { body, seconds, isRescue, isOver: false });

      return;
    }

    if (state.elapsedMs - state.stranded.since < seconds * 1000) {
      return;
    }

    state.stranded = null;

    const days = isRescue ? rescueHome(context, parts, config.descent.rescueFewestDays) : null;

    if (days !== null) {
      events.emit("rescued", { from: body, days });

      return;
    }

    state.status = "over";
    state.phaseMs = 0;
    events.emit("stranded", { body, seconds: 0, isRescue: false, isOver: true });
  }
}
