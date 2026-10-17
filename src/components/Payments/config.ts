import { approvedAt, CheckoutGesture, keysFor } from "@/packages/graphics/checkout";

// How long a payment at the reader's counter takes: the cashier keys the amount and opens the app, then the
// customer pays; a chip card also keys its PIN, so its story runs longer. The counter waits for the next payment
// `RESET_MS` after the story ends.
export const TERMINAL_PAY_MS = 4600;

export const TERMINAL_PIN_PAY_MS = 6000;

export const RESET_MS = 900;

export const payMsOf = (gesture: CheckoutGesture) => (gesture === "insert" ? TERMINAL_PIN_PAY_MS : TERMINAL_PAY_MS);

// When, in milliseconds, the terminal approves a payment in the full story, for the page to say so then.
export const approvedMsOf = (gesture: CheckoutGesture, app: number, amount: string) =>
  approvedAt("full", gesture, app, keysFor(amount)) * payMsOf(gesture);

// The counter drawn larger where there is room beside the ways to pay, and smaller on the narrowest phones, where
// the room inside the section is less than the counter is wide.
export const TERMINAL_SCALE = { narrowest: 0.78, narrower: 0.9, narrow: 1, wide: 1.3 } as const;
