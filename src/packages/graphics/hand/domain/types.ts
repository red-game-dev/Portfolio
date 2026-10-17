import type { Vec3 } from "@/packages/math/space";

export type FingerName = "index" | "middle" | "ring" | "pinky";

export type DigitName = FingerName | "thumb";

// A finger's bones from its base in the wrist to its tip, in millimetres, for a right hand lying palm down: x across
// towards the little finger, y along the fingers, z up from the back of the hand. Widths are at the knuckle, the two
// joints and the tip.
export interface FingerAnatomy {
  // Where its metacarpal starts, in the wrist.
  base: Vec3;
  // Its knuckle, where the finger leaves the palm.
  knuckle: Vec3;
  // Degrees it fans out from straight ahead, towards the little finger.
  splay: number;
  // The three phalanges, knuckle to tip (the last with the fingertip's flesh).
  lengths: [number, number, number];
  widths: [number, number, number, number];
}

export interface ThumbAnatomy {
  // Its metacarpal's base, its knuckle, and the direction it then points.
  base: Vec3;
  knuckle: Vec3;
  direction: Vec3;
  // The way its nail faces.
  back: Vec3;
  lengths: [number, number];
  widths: [number, number, number, number];
}

export interface HandAnatomy {
  fingers: Record<FingerName, FingerAnatomy>;
  thumb: ThumbAnatomy;
  // The palm's thickness, back to front, and the wrist's width and thickness.
  palm: { thickness: number };
  wrist: { width: number; thickness: number };
  // How much of the forearm comes with the hand, before a sleeve covers it.
  forearm: { length: number; width: number; thickness: number };
  nails: { length: number; width: number };
}

// How a digit is bent, in degrees: each joint towards the palm from the knuckle out, and the knuckle's turn sideways.
export interface DigitPose {
  curl: [number, number, number];
  splay?: number;
}

export interface ThumbPose extends DigitPose {
  // Across the palm, towards the little finger (opposition), and turned on its own axis.
  across?: number;
  roll?: number;
}

export interface HandPose {
  fingers: Record<FingerName, DigitPose>;
  thumb: ThumbPose;
}
