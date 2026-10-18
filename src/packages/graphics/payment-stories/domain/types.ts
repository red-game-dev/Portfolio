// The stories the payments drawings open with, told in a panel the size of the counter's scene (300 by 210).
export type StoryId = "route" | "authorise" | "sync" | "split";

// The pictures the stories use, each an icon's path on its own grid.
export type StoryIconName = "gateway" | "bank" | "till" | "network" | "cloud" | "platform" | "seller" | "developer";

export interface StoryIcon {
  width: number;
  height: number;
  path: string;
}

export type StoryIcons = Record<StoryIconName, StoryIcon>;

// The colours a story is told in: the section's accent, a failure's red, a receipt's paper and a coin's gold.
export interface StoryLook {
  accent: string;
  failure: string;
  paper: string;
  gold: [string, string];
}

export interface Point {
  x: number;
  y: number;
}

// How a step went: waiting, the payment passing through, refused by a provider, or approved.
export type Tone = "idle" | "lit" | "failed" | "approved";

export interface StoryNode {
  id: string;
  at: Point;
  icon: StoryIconName;
  // 0 to 1: how brightly it glows as the payment reaches it.
  glow: number;
  tone: Tone;
  // 0 to 1: how hard it shakes as it fails.
  shake: number;
  // A tick or a cross drawn on its corner, 0 to 1 of the way through.
  mark: { kind: "tick" | "cross"; progress: number } | null;
}

// A wire between two nodes, bowed by `bend`, lit from its start to `lit` (0 to 1) in its tone.
export interface StoryWire {
  from: Point;
  to: Point;
  bend: number;
  lit: number;
  tone: Tone;
}

// A payment on its way along a wire, `at` of the way (0 to 1), heading out along it (1) or back (-1), its trail
// behind it.
export interface StoryPacket {
  wire: StoryWire;
  at: number;
  heading: 1 | -1;
  tone: Tone;
  size: number;
}

export interface StoryBurst {
  at: Point;
  progress: number;
  tone: Tone;
}

export interface StoryReceipt {
  at: Point;
  turn: number;
  opacity: number;
}

export interface StoryCoin {
  at: Point;
  radius: number;
  spin: number;
  opacity: number;
}

// The till's signal: out (bars dark, a slash through them) or back, `bars` of four lit.
export interface StorySignal {
  at: Point;
  isLost: boolean;
  bars: number;
}

export interface StoryFrame {
  wires: StoryWire[];
  nodes: StoryNode[];
  packets: StoryPacket[];
  bursts: StoryBurst[];
  receipts: StoryReceipt[];
  coins: StoryCoin[];
  signal: StorySignal | null;
}
