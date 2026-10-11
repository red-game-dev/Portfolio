import { PaintSpec, TrailSpec } from "../progress/domain/progress";
import { NO_EXTRAS, ShipExtras } from "./paint/ships";

// How the pilot's ship looks: the paint it wears (none keeps the theme's), its engine trail, and the fitted pieces
// that show on the hull.
export interface ShipLook {
  paint: PaintSpec | null;
  trail: TrailSpec | null;
  extras: ShipExtras;
}

export const NO_LOOK: ShipLook = { paint: null, trail: null, extras: NO_EXTRAS };
