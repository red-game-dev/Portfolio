import { DEG } from "@/packages/math/angles";
import { clamp } from "@/packages/math/clamp";

import { GlobePose } from "../domain/types";

export type Vec3 = [number, number, number];

// How far round towards the viewer the light sits, so a globe shows more day than night, as a planet seen a
// little from the sunward side does.
export const PHASE = 0.55;

// A globe's frame in its own view space, where x points along the screen at `angle` (towards its light, or away
// from it when turned), y is the screen direction a quarter turn anticlockwise from that, and z comes out of the
// screen at the viewer.
export interface GlobeFrame {
  angle: number;
  // The body's north pole, its "front" (the direction of longitude `spin` on the equator, facing the viewer as
  // far as the tilt allows) and its east (towards the light).
  pole: Vec3;
  front: Vec3;
  east: Vec3;
  // Towards the light.
  light: Vec3;
  // The longitude (radians) that faces the viewer.
  spin: number;
}

// The frame for a pose: the pole tipped towards the viewer by the view elevation, the light at the subsolar
// latitude, and the spin chosen so the point under the light is the subsolar longitude.
export const globeFrame = (pose: GlobePose, phase = PHASE): GlobeFrame => {
  const elevation = pose.viewElevation * DEG;
  const declination = pose.subsolarLatitude * DEG;
  const pole: Vec3 = [0, Math.cos(elevation), Math.sin(elevation)];
  const front: Vec3 = [0, -Math.sin(elevation), Math.cos(elevation)];
  const east: Vec3 = [1, 0, 0];
  const across = Math.cos(declination);
  const up = Math.sin(declination);
  // Turned, the light sits along -x.
  const side = pose.isTurned ? -1 : 1;
  const sideways = across * Math.cos(phase) * side;
  const towards = across * Math.sin(phase);
  const light: Vec3 = [
    sideways * east[0] + towards * front[0] + up * pole[0],
    sideways * east[1] + towards * front[1] + up * pole[1],
    sideways * east[2] + towards * front[2] + up * pole[2],
  ];

  const angle = pose.lightAngle + (pose.isTurned ? Math.PI : 0);
  let spin = pose.subsolarLongitude * DEG - Math.atan2(sideways, towards);

  if (pose.facing !== undefined) {
    // Longitude 0 towards the screen direction it faces, on the near side of the globe.
    const towardsEast = Math.cos(pose.facing - angle);
    const near = Math.sqrt(Math.max(0, 1 - towardsEast * towardsEast));

    spin = -Math.atan2(towardsEast, near * Math.cos(elevation));
  }

  return { angle, pole, front, east, light, spin };
};

// Whether to turn a globe so its north stays nearer the top of the screen: once its light is well to the left,
// and back once it is well to the right, holding the last answer in between so it never flips back and forth.
export const northUp = (lightAngle: number, wasTurned: boolean): boolean => {
  const across = Math.cos(lightAngle);

  return across < -0.2 ? true : across > 0.2 ? false : wasTurned;
};

const dot = (a: Vec3, b: Vec3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];

// The latitude and longitude (radians) under a view space normal, the way the shader reads them.
export const surfacePoint = (frame: GlobeFrame, normal: Vec3): { latitude: number; longitude: number } => ({
  latitude: Math.asin(clamp(dot(normal, frame.pole), -1, 1)),
  longitude: frame.spin + Math.atan2(dot(normal, frame.east), dot(normal, frame.front)),
});
