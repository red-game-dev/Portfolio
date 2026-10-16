import { APPROVED_AT } from "@/components/Payments/scene/Counter";

// How long a payment at the reader's counter takes: the cashier rings it up and sends the total, the customer pays,
// and it is approved at `APPROVE_SHARE` of the story, the next drawing opening at that moment; the counter waits for
// the next payment `RESET_MS` after it.
export const TERMINAL_PAY_MS = 3200;

export const APPROVE_SHARE = APPROVED_AT;

export const RESET_MS = 2600;

// The counter drawn larger where there is room beside the ways to pay, and smaller on the narrowest phones, where
// the room inside the section is less than the counter is wide.
export const TERMINAL_SCALE = { narrowest: 0.78, narrower: 0.9, narrow: 1, wide: 1.3 } as const;
