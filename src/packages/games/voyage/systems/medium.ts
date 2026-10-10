import { Medium } from "../domain/state";
import { VoyageContext } from "./context";

const DENSER: readonly Medium[] = ["void", "open", "haze", "belt", "nebula", "ring"];

// The densest part of space a point is in: real space is thinnest between galaxies and thickest in rings and
// nebulae, though even there it is far emptier than any air.
export const mediumAt = ({ state }: VoyageContext, x: number, y: number): Medium => {
  if (state.phase === "lost") {
    return "void";
  }

  const style = state.cosmos?.style;
  let medium: Medium = style === "void" ? "void" : style === "nebula" ? "haze" : "open";
  const thicker = (next: Medium) => {
    medium = DENSER.indexOf(next) > DENSER.indexOf(medium) ? next : medium;
  };
  const { system } = state;
  const out = Math.hypot(x - system.star.x, y - system.star.y);

  if (system.belts.some((belt) => out >= belt.inner && out <= belt.outer)) {
    thicker("belt");
  }

  state.cosmos?.phenomena.forEach((phenomenon) => {
    if (phenomenon.kind === "nebula" && Math.hypot(x - phenomenon.x, y - phenomenon.y) < phenomenon.radius) {
      thicker("nebula");
    }
  });

  system.bodies.forEach((body) => {
    const away = body.rings ? Math.hypot(x - body.x, y - body.y) / body.radius : 0;

    if (body.rings && away >= body.rings.inner && away <= body.rings.outer) {
      thicker("ring");
    }
  });

  return medium;
};
