import type { Canvas2DContext } from "@/packages/graphics/canvas";
import type { RigSkin } from "@/packages/graphics/rig";
import type { Finish } from "@/packages/graphics/stage3d";

// How a way to pay meets the terminal: a chip card inserted into the reader at the foot, a card tapped on the
// contactless sign, a card swiped down the stripe reader at the side, a phone wallet held to it, or a QR code on
// the terminal's screen scanned by a phone.
export type CheckoutGesture = "insert" | "tap" | "swipe" | "wallet" | "scan" | "face";

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

// A card as its issuer made it: its finish, its print and the ink its marks are in, the issuer's mark (a monogram, the
// holder's portrait as a halftone across it, or the issuer's own mark), the holder and the number's last four.
export interface CardDesign {
  finish: Finish;
  face: [string, string];
  ink: string;
  issuer: "monogram" | "portrait" | "mark";
  // The issuer's own mark, printed where a monogram would be.
  issuerMark?: MarkShape;
  holder: string;
  lastFour: string;
}

export interface CheckoutLook {
  gesture: CheckoutGesture;
  // Which of the terminal's three apps takes it: 0 the card app, 1 QR pay, 2 the crypto app.
  app: number;
  // A card's print or a phone's screen, top left to bottom right.
  face: [string, string];
  mark: MarkShape;
  // A card's own design, and the holder's portrait for one that prints it; a card without one is printed plainly.
  card?: CardDesign;
  portrait?: CanvasImageSource | null;
  // Paying by face: the customer as the terminal's front camera sees them.
  customer?: CanvasImageSource | null;
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
  // How near the camera it is: 1 at the terminal's face, more as a hand lifts towards the camera.
  scale: number;
  // Reached along a reader's guide (onto and down the stripe, up into the chip slot): straight, without the arc of a
  // free move or settling past it, which would take the card into the terminal.
  isGuided?: boolean;
}

// Where the camera looks, as the rig takes it: the scene point at the middle of the view and the zoom.
export interface CheckoutCamera {
  x: number;
  y: number;
  zoom: number;
}

// Where each moving part was a moment ago, for its motion blur.
export interface CheckoutTrail {
  cashier: Pose | null;
  customerGrip: Pose | null;
  customerPoint: Pose | null;
  item: Pose | null;
}

export type ScreenState = "idle" | "keying" | "apps" | "ask" | "pin" | "face" | "processing" | "approved";

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
  camera: CheckoutCamera;
  // The parts as they were a frame and two frames ago, nearest first.
  trail: CheckoutTrail[];
  // How much the customer's hand holds what it carries: 1 holding, 0 let go (a card left in the reader).
  hold: number;
}

// What draws the checkout's hands and what the customer holds on a 3D stage, from outside this package: each frame
// into the checkout's canvas, at the stage's quality, saying when the stage loses its GPU, and giving its scene back.
export interface CheckoutStage {
  draw(context: Canvas2DContext, frame: CheckoutFrame): void;
  quality(): number;
  setQuality(level: number): void;
  onLost(listener: () => void): () => void;
  release(): void;
}
