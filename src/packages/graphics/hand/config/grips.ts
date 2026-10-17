import { vec3 } from "@/packages/math/space";

import { HandGrip } from "../domain/types";
import { HAND_POSES } from "./poses";

// How the right hand holds what it holds. Each was found by searching the pose and the thing's place in the hand
// together, scored by sampling the thing's whole volume against the hand's flesh: no flesh inside it anywhere, the
// thumb's pad on its face (towards the viewer), a finger on its back, most of it showing, and the arm running the way
// the picture needs (a phone's top kept clear of the hand, for its camera and NFC). A test holds each to that, so a
// change to the hand's anatomy or a pose that would let a finger pass through a card fails there. Places are in the
// hand's millimetres, the hand in the grip's pose.
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
  // A phone the size of a real one, held from the bottom, its screen showing and its top half clear of the hand.
  phone: {
    pose: HAND_POSES.phone,
    centre: vec3(-10.54, 142.47, -85.67),
    along: vec3(-0.6981, 0.1332, 0.7035),
    face: vec3(-0.686, -0.4058, -0.6039),
    size: { width: 71.4, height: 147.1, thickness: 7.9 },
  },
} satisfies Record<string, HandGrip>;
