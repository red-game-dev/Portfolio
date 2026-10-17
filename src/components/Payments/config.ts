import { PAY_APPS, PAY_GESTURES, payAppOf, PaymentMethodId } from "@/config/payments";
import { approvedAt, keysFor, storyMs } from "@/packages/graphics/checkout";
import type { CheckoutAmount } from "@/packages/graphics/checkout";

// The counter waits for the next payment this long after a story ends.
export const RESET_MS = 600;

// How long the page waits for the counter to start a payment before counting its approval from the press anyway.
export const START_WAIT_MS = 2500;

// No total: a switch, which carries no words, shows a bar in its place.
export const NO_AMOUNT: CheckoutAmount = { text: "", prefix: "", suffix: "", keyed: "" };

const storyOf = (method: PaymentMethodId, amount: CheckoutAmount) => [PAY_GESTURES[method], PAY_APPS.indexOf(payAppOf(method)), keysFor(amount)] as const;

// How long a payment at the reader's counter takes, read from its story at a real counter's pace: the cashier keys
// the amount and opens the app, then the customer pays (a chip card also keys its PIN).
export const payMsOf = (method: PaymentMethodId, amount: CheckoutAmount) => storyMs("full", ...storyOf(method, amount));

// When, in milliseconds, the terminal approves the payment, for the page to say so then.
export const approvedMsOf = (method: PaymentMethodId, amount: CheckoutAmount) => approvedAt("full", ...storyOf(method, amount)) * payMsOf(method, amount);

// The counter drawn larger where there is room beside the ways to pay, and smaller on the narrowest phones, where
// the room inside the section is less than the counter is wide.
export const TERMINAL_SCALE = { narrowest: 0.78, narrower: 0.9, narrow: 1, wide: 1.3 } as const;
