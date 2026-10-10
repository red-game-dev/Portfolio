export { createFieldSample, GravityField } from "./core/GravityField";
export { densityAt, dragDeceleration, entryHeating } from "./utils/atmosphere";
export { damp, integrate } from "./utils/integrate";
export { circularSpeed, escapeSpeed, muForSurfaceGravity, surfaceGravity } from "./utils/orbits";
export { innermostStableOrbit, tidalAcceleration, timeDilation } from "./utils/relativity";
export { angleOf, clampLengthInto, directionInto, distance, length } from "./utils/vector";
export type { Atmosphere, FieldSample, GravitySource, Kinematic, Vec2 } from "./domain/types";
