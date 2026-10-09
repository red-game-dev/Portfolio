import { toValidationResult, ValidationResult, Validator } from "@/packages/core/domain";

import { SolarSystemData } from "../domain/content";

// The rules the layout depends on: the way out starts at 1 AU and only goes outward, every body is a real size
// and pulls, air matches its kind, the belts sit inside the route, and the black hole waits past the last body.
export class SolarSystemValidator extends Validator<SolarSystemData> {
  public validate({ bodies, belts, singularityAu }: SolarSystemData): ValidationResult {
    const errors: string[] = [];
    const last = bodies[bodies.length - 1];

    if (bodies.length < 2 || bodies[0].au !== 1) {
      errors.push("the route needs at least two bodies and must start at 1 AU");
    }

    bodies.forEach((body, index) => {
      if (index > 0 && body.au <= bodies[index - 1].au) {
        errors.push(`${body.id} is not further from the Sun than the body before it`);
      }

      if (body.radiusKm <= 0 || body.surfaceGravity <= 0) {
        errors.push(`${body.id} needs a positive radius and surface gravity`);
      }

      if (Math.abs(body.offset) > 1) {
        errors.push(`${body.id} sits more than one step to the side`);
      }

      if ((body.atmosphere === "none") !== (body.surfacePressureBar === 0)) {
        errors.push(`${body.id} has air that does not match its kind`);
      }
    });

    belts.forEach((belt) => {
      if (belt.fromAu >= belt.toAu || belt.fromAu < 1 || (last && belt.toAu > last.au)) {
        errors.push(`${belt.id} must run outward and lie inside the route`);
      }
    });

    if (last && singularityAu <= last.au) {
      errors.push("the black hole must lie past the last body");
    }

    return toValidationResult(errors);
  }
}
