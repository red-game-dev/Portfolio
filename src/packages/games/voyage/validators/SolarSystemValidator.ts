import { toValidationResult, ValidationResult, Validator } from "@/packages/core/domain";

import { SolarSystemData } from "../domain/content";

// The rules the layout depends on: every id is unique; every body is a real size that pulls; a moon circles a
// planet listed before it, and nothing else circles a planet; air has pressure; rings sit outside their planet;
// belts run outward; and the black hole waits past every body and belt.
export class SolarSystemValidator extends Validator<SolarSystemData> {
  public validate({ star, bodies, belts, edgeAu }: SolarSystemData): ValidationResult {
    const errors: string[] = [];
    const seen = new Set<string>([star.id]);

    if (star.radiusKm <= 0 || star.surfaceGravity <= 0 || star.temperatureK <= 0) {
      errors.push("the star needs a positive radius, gravity and temperature");
    }

    bodies.forEach((body) => {
      if (seen.has(body.id)) {
        errors.push(`${body.id} is listed twice`);
      }

      if (body.radiusKm <= 0 || body.surfaceGravity <= 0) {
        errors.push(`${body.id} needs a positive radius and surface gravity`);
      }

      if (body.orbit.kind === "moon") {
        const { parent } = body.orbit;

        if (body.kind !== "moon" || !seen.has(parent) || parent === star.id || body.orbit.distanceKm <= 0 || body.orbit.periodDays === 0) {
          errors.push(`${body.id} must be a moon circling a body listed before it`);
        }
      } else if (body.kind === "moon" || body.orbit.elements.a.value <= 0 || body.orbit.elements.e.value >= 1) {
        errors.push(`${body.id} must circle the Sun on a closed orbit`);
      }

      if (body.air && body.air.pressureBar <= 0) {
        errors.push(`${body.id} has air with no pressure`);
      }

      if (body.air && body.air.molarMass <= 0) {
        errors.push(`${body.id} has air with no weight to its gas`);
      }

      if (body.rings && (body.rings.innerKm <= body.radiusKm || body.rings.outerKm <= body.rings.innerKm)) {
        errors.push(`${body.id} has rings that do not sit outside it`);
      }

      seen.add(body.id);
    });

    const furthest = Math.max(...bodies.map((body) => (body.orbit.kind === "sun" ? body.orbit.elements.a.value * (1 + body.orbit.elements.e.value) : 0)));

    belts.forEach((belt) => {
      if (belt.fromAu >= belt.toAu || belt.fromAu <= 0 || belt.toAu > edgeAu) {
        errors.push(`${belt.id} must run outward and lie inside the edge`);
      }
    });

    if (edgeAu <= furthest) {
      errors.push("the black hole must lie past every orbit");
    }

    return toValidationResult(errors);
  }
}
