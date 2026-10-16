import { APPROVED_AT } from "@/components/Payments/scene/Counter";

// How long a payment at the reader's counter takes: the cashier rings it up and sends the total, the customer pays,
// and it is approved at `APPROVE_SHARE` of the story, the next drawing opening at that moment; the counter waits for
// the next payment `RESET_MS` after it.
export const TERMINAL_PAY_MS = 3200;

export const APPROVE_SHARE = APPROVED_AT;

export const RESET_MS = 2600;

// The counter drawn larger where there is room beside the ways to pay.
export const TERMINAL_SCALE = { narrow: 1, wide: 1.3 } as const;
