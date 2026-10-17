import { ellipsoid, roundCone, smoothMax, smoothMin, sphere } from "@/packages/graphics/sdf";
import type { Box, Field, Primitive } from "@/packages/graphics/sdf";
import { normalize, Vec3, vec3 } from "@/packages/math/space";

import { ADULT_HEAD } from "../config/anatomy";

// The head as signed distance fields: the skin blended from the skull's and the face's masses, its features (brow,
// cheekbones, nose, lips, ears) blended in more tightly, and its hollows (the eye sockets, the nostrils, the mouth's
// line) carved out; the hair a shell over the skull, cut at the hairline; the eyes in their sockets.

export type HeadAnatomy = typeof ADULT_HEAD;

export interface HeadField {
  skin: Field;
  hair: Field;
  bounds: Box;
  hairBounds: Box;
  // Each eye's middle, and its radius.
  eyes: Vec3[];
  eyeRadius: number;
  // How near a point is to the lips, for their colour.
  lips: Field;
}

const X = vec3(1, 0, 0);

const Y = vec3(0, 1, 0);

const Z = vec3(0, 0, 1);

const oval = (x: number, y: number, z: number, rx: number, ry: number, rz: number): Primitive => ellipsoid(vec3(x, y, z), [X, Y, Z], [rx, ry, rz]);

const pair = (make: (side: number) => Primitive): Primitive[] => [make(1), make(-1)];

// How softly the head's masses join, its features join them, its sockets are carved, its lids laid on, and its
// hollows carved.
const SOFTNESS = { masses: 14, features: 6, sockets: 4, lids: 3, hollows: 1.2 } as const;

export const headField = (head: HeadAnatomy = ADULT_HEAD): HeadField => {
  const { eyes, nose, mouth, ears, brow, hairline } = head;
  const masses = [
    // The skull, the forehead, the middle of the face reaching down to the jaw, the jaw, the lower face, and the neck.
    oval(0, 140, -18, 72, 76, 94),
    oval(0, 150, 38, 60, 44, 46),
    oval(0, 90, 30, 56, 60, 52),
    // The jaw: the lower face's width, set back behind the mouth so it rounds the face rather than pushing it forward.
    oval(0, 46, 0, 52, 36, 62),
    // Below the mouth, the lower face rounding forward into the chin.
    oval(0, 30, 28, 34, 26, 38),
    roundCone(vec3(0, 35, -22), vec3(0, -80, -26), 42, 48),
  ];
  const lips = [oval(0, mouth.y + 3.5, 80, mouth.width - 6, 4, 6.5), oval(0, mouth.y - 4, 78, mouth.width - 8, 4.5, 6.5)];
  const features = [
    ...pair((side) => oval(side * 36, 99, 48, 12, 7, 10)),
    oval(0, brow, 72, 48, 7, 10),
    roundCone(vec3(0, eyes.y + 2, 78), vec3(0, nose.base + 14, nose.tip - 4), 6, 7.5),
    oval(0, nose.base + 7, nose.tip - 3, 9, 8.5, 8),
    ...pair((side) => oval(side * 9, nose.base + 4, 85, 6, 5.5, 6)),
    ...lips,
    oval(0, mouth.y + 11, 82, 7, 5, 5),
    oval(0, 14, 48, 15, 10, 12),
    ...pair((side) => oval(side * (ears.out - 4), ears.y, -12, 6, 28, 16)),
  ];
  // The eye sockets carved, then the lids laid back over each eye, the upper just over the iris's top.
  const sockets = pair((side) => sphere(vec3(side * eyes.apart, eyes.y, 70), 13));
  const lids = [
    ...pair((side) => oval(side * eyes.apart, eyes.y + 10, 61, 15, 6, 12.5)),
    ...pair((side) => oval(side * eyes.apart, eyes.y - 9, 60, 14, 4, 11.5)),
  ];
  const hollows = [...pair((side) => oval(side * 5, nose.base, 91, 2.6, 1.8, 3)), oval(0, mouth.y, 85.5, mouth.width - 7, 0.7, 4)];

  const skin: Field = (x, y, z) => {
    let distance = masses[0].distance(x, y, z);

    for (let index = 1; index < masses.length; index += 1) {
      distance = smoothMin(distance, masses[index].distance(x, y, z), SOFTNESS.masses);
    }

    for (const feature of features) {
      distance = smoothMin(distance, feature.distance(x, y, z), SOFTNESS.features);
    }

    for (const socket of sockets) {
      distance = smoothMax(distance, -socket.distance(x, y, z), SOFTNESS.sockets);
    }

    for (const lid of lids) {
      distance = smoothMin(distance, lid.distance(x, y, z), SOFTNESS.lids);
    }

    for (const hollow of hollows) {
      distance = smoothMax(distance, -hollow.distance(x, y, z), SOFTNESS.hollows);
    }

    return distance;
  };

  // The hair: a shell over the skull, kept above a line sloping from the hairline at the forehead down the back of the
  // head, and outside the skin.
  const shell = oval(0, 149, -18, 80, 86, 105);
  const slope = normalize(vec3(0, 1, -(hairline.front - hairline.back) / 170));
  const from = vec3(0, hairline.front, 60);
  const hair: Field = (x, y, z) => {
    const above = (x - from.x) * slope.x + (y - from.y) * slope.y + (z - from.z) * slope.z;

    return smoothMax(smoothMax(shell.distance(x, y, z), -above, 14), -skin(x, y, z) + 1.2, 5);
  };

  return {
    skin,
    hair,
    bounds: { min: vec3(-90, -95, -125), max: vec3(90, 225, 112) },
    hairBounds: { min: vec3(-88, 60, -128), max: vec3(88, 232, 82) },
    eyes: [vec3(eyes.apart, eyes.y, 58), vec3(-eyes.apart, eyes.y, 58)],
    eyeRadius: eyes.radius,
    lips: (x, y, z) => Math.min(lips[0].distance(x, y, z), lips[1].distance(x, y, z)),
  };
};
