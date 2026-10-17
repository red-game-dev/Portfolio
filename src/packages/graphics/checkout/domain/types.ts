import type { RigSkin } from "@/packages/graphics/rig";

// How a way to pay meets the terminal: a chip card inserted into the reader at the foot, a card tapped on the
// contactless sign, a card swiped down the stripe reader at the side, a phone wallet held to it, or a QR code on
// the terminal's screen scanned by a phone.
export type CheckoutGesture = "insert" | "tap" | "swipe" | "wallet" | "scan";

// The full story, for a terminal the reader pays at: the cashier keys the amount and opens the app, then the
// customer pays. The quick one, for a switch, starts with the amount already asked for.
export type CheckoutVariant = "full" | "quick";

// A mark drawn from SVG path data on its own grid, each part filled or outlined in its own colour.
export interface MarkPart {
  d: string;
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
}

export interface MarkShape {
  width: number;
  height: number;
  parts: MarkPart[];
}

export interface CheckoutLook {
  gesture: CheckoutGesture;
  // Which of the terminal's three apps takes it: 0 the card app, 1 QR pay, 2 the crypto app.
  app: number;
  // A card's print or a phone's screen, top left to bottom right.
  face: [string, string];
  mark: MarkShape;
}

// A skin dresses the scene for one way to pay: what the customer holds, the app, the total on the screen, and
// the accent the screen glows in.
export interface CheckoutSkin extends RigSkin {
  look: CheckoutLook;
  amount: string;
  accent: string;
}

export interface Pose {
  x: number;
  y: number;
  // Radians, turning clockwise.
  angle: number;
}

export type ScreenState = "idle" | "keying" | "apps" | "ask" | "pin" | "processing" | "approved";

export interface CheckoutFrame {
  // Each hand by its fingertip (the pointing hands) or its grip (the holding hand); null while off the scene.
  cashier: Pose | null;
  customerGrip: Pose | null;
  customerPoint: Pose | null;
  // What the customer holds, by its centre; behind the terminal while it is in a reader, in front otherwise.
  item: Pose | null;
  isItemBehind: boolean;
  screen: {
    state: ScreenState;
    // Characters of the amount keyed so far, digits of the PIN entered so far.
    typed: number;
    pin: number;
    // The key or app being pressed, by index, or null.
    pressed: number | null;
    // 0 to 1 through the processing spinner's turn.
    spinner: number;
  };
  // 0 to 1: the contactless sign's glow, the phone camera's sweep, the receipt printed.
  waves: number;
  sweep: number;
  receipt: number;
}
