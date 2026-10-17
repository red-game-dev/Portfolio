import { HandPose } from "../domain/types";

// Hands at work, each joint's bend in degrees: relaxed, pointing with the index finger (the others curled, the thumb
// tucked against the middle finger), pressing (the pointing fingertip giving a little), and holding a card or a phone.
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
  // Holding a card, the pose its grips were found in (see grips.ts): the card between the thumb's pad and the side of
  // the curled index finger, as a key is held, the other fingers curled into the palm out of its way.
  card: {
    fingers: {
      index: { curl: [50, 51, 10] },
      middle: { curl: [90, 100, 60], splay: -2 },
      ring: { curl: [98, 103, 62], splay: -3 },
      pinky: { curl: [103.6, 104, 62], splay: -4 },
    },
    thumb: { curl: [15.5, 16, 6], across: 26, roll: 0 },
  },
  // Holding a phone from above, its screen to the viewer: the fingers flat behind it, the thumb on its face.
  phone: {
    fingers: {
      index: { curl: [26, 34, 13.75] },
      middle: { curl: [30, 30, 15], splay: -2 },
      ring: { curl: [54, 33, 17], splay: -3 },
      pinky: { curl: [66, 34, 17], splay: -4 },
    },
    thumb: { curl: [11, 24, 13], across: 25, roll: 0 },
  },
} satisfies Record<string, HandPose>;

export type HandPoseName = keyof typeof HAND_POSES;
