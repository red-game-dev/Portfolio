import { HandPose } from "../domain/types";

// Hands at work, each joint's bend in degrees: relaxed, pointing with the index finger (the others curled, the thumb
// tucked against the middle finger), pressing (the pointing fingertip giving a little), and pinching a card or a phone
// between the thumb's pad and the index fingertip's.
export const HAND_POSES = {
  relaxed: {
    fingers: { index: { curl: [10, 16, 8] }, middle: { curl: [14, 20, 10] }, ring: { curl: [17, 23, 11] }, pinky: { curl: [20, 25, 12] } },
    thumb: { curl: [4, 10, 8], across: 8 },
  },
  point: {
    fingers: {
      index: { curl: [4, 6, 4] },
      middle: { curl: [68, 86, 44], splay: -2 },
      ring: { curl: [70, 86, 44], splay: -3 },
      pinky: { curl: [72, 84, 40], splay: -5 },
    },
    thumb: { curl: [8, 18, 16], across: 10 },
  },
  press: {
    fingers: {
      index: { curl: [8, 14, 12] },
      middle: { curl: [68, 86, 44], splay: -2 },
      ring: { curl: [70, 86, 44], splay: -3 },
      pinky: { curl: [72, 84, 40], splay: -5 },
    },
    thumb: { curl: [8, 18, 16], across: 10 },
  },
  // The thumb's pad and the index fingertip's facing each other a card's thickness apart (found by searching the
  // joints for the pinch), the other fingers curled behind.
  card: {
    fingers: {
      index: { curl: [38, 79, 33] },
      middle: { curl: [52, 89, 39], splay: -2 },
      ring: { curl: [58, 93, 39], splay: -3 },
      pinky: { curl: [64, 95, 35], splay: -4 },
    },
    thumb: { curl: [8, 25, 12], across: 1 },
  },
  // The same pinch opened to a phone's thickness, found the same way.
  phone: {
    fingers: {
      index: { curl: [40, 64, 34] },
      middle: { curl: [54, 74, 40], splay: -2 },
      ring: { curl: [60, 78, 40], splay: -3 },
      pinky: { curl: [66, 80, 36], splay: -4 },
    },
    thumb: { curl: [12, 14, 21], across: 2 },
  },
} satisfies Record<string, HandPose>;

export type HandPoseName = keyof typeof HAND_POSES;
