import { normalize, vec3 } from "@/packages/math/space";

import { HandAnatomy } from "../domain/types";

// An adult's right hand, about 189 millimetres from the wrist to the tip of the middle finger and 83 across the
// knuckles, lying palm down: x across towards the little finger, y along the fingers, z up from its back. The bones
// follow the published proportions of the hand (each phalanx about 0.6 of the one before it, the middle finger
// longest, the knuckles on an arc), the widths a hand's at each joint.
export const RIGHT_HAND: HandAnatomy = {
  fingers: {
    index: { base: vec3(-12, 22, 0), knuckle: vec3(-27, 96, 1), splay: -4, lengths: [38, 23, 21], widths: [18.6, 17.4, 16, 14.6] },
    middle: { base: vec3(-2, 24, 0.5), knuckle: vec3(-7.5, 100, 2), splay: 0, lengths: [41, 26, 22], widths: [19, 17.8, 16.4, 15] },
    ring: { base: vec3(8, 23, 0), knuckle: vec3(12.5, 97, 0.5), splay: 4, lengths: [38, 25, 22], widths: [18, 16.8, 15.4, 14.2] },
    pinky: { base: vec3(16, 19, -1), knuckle: vec3(30, 88, -2), splay: 9, lengths: [30, 18, 19], widths: [16, 15, 13.8, 12.6] },
  },
  thumb: {
    base: vec3(-22, 18, -10),
    knuckle: vec3(-44, 50, -13),
    direction: normalize(vec3(-0.3, 0.94, 0.15)),
    back: normalize(vec3(-0.7, 0.1, 0.7)),
    lengths: [32, 30],
    widths: [24, 22, 20.5, 18],
  },
  palm: { thickness: 32 },
  wrist: { width: 58, thickness: 34 },
  forearm: { length: 90, width: 64, thickness: 42 },
  nails: { length: 0.56, width: 0.66 },
};
