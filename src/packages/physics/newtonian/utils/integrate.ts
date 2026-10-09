import { Kinematic } from "../domain/types";

// One step of semi-implicit (symplectic) Euler: velocity first, then position with the new velocity. Cheap,
// stable for orbits at a fixed step, and it keeps energy bounded where explicit Euler spirals outward.
export const integrate = (body: Kinematic, ax: number, ay: number, dt: number): void => {
  body.vx += ax * dt;
  body.vy += ay * dt;
  body.x += body.vx * dt;
  body.y += body.vy * dt;
};

// Linear damping, applied as an exact decay so it does not depend on the step size.
export const damp = (body: Kinematic, rate: number, dt: number): void => {
  const keep = Math.exp(-rate * dt);

  body.vx *= keep;
  body.vy *= keep;
};
