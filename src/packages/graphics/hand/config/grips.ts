import { vec3 } from "@/packages/math/space";

import { HandGrip } from "../domain/types";
import { HAND_POSES } from "./poses";

// How the right hand holds what it holds. Each was found by searching the pose and the thing's place in the hand
// together, scored by sampling the thing's whole volume against the hand's flesh: no flesh inside it anywhere, the
// thumb's pad on its face (towards the viewer), a finger on its back, most of it showing, and the arm running the way
// the picture needs. A test holds each to that, so a change to the hand's anatomy or a pose that would let a finger
// pass through a card fails there. Places are in the hand's millimetres, the hand in the grip's pose.
export const HAND_GRIPS = {
  // A card held to a screen by its corner, between the thumb and the side of the curled index finger.
  card: {
    pose: HAND_POSES.card,
    centre: vec3(6.09, 99.56, -76.33),
    along: vec3(0.5847, -0.3495, -0.7321),
    face: vec3(0.6235, -0.3838, 0.6812),
    size: { width: 85.7, height: 54.3, thickness: 1.09 },
  },
  // A card held by its end, the arm below and to the right of it: pushed up into a chip reader or drawn down a stripe.
  cardEnd: {
    pose: HAND_POSES.card,
    centre: vec3(-13.77, 151.68, -54.46),
    along: vec3(0.0421, 0.9033, -0.4269),
    face: vec3(0.9838, -0.1119, -0.1399),
    size: { width: 85.7, height: 54.3, thickness: 1.09 },
  },
  // A phone held from above, its screen showing.
  phone: {
    pose: HAND_POSES.phone,
    centre: vec3(-4.16, 100.17, -62.88),
    along: vec3(0.5749, -0.5597, 0.5968),
    face: vec3(-0.7719, -0.613, 0.1687),
    size: { width: 42.9, height: 82.9, thickness: 10.9 },
  },
} satisfies Record<string, HandGrip>;
