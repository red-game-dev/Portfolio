// How long a payment at the reader's terminal takes: the way to pay meets the terminal and is approved at
// `APPROVE_SHARE` of the story, the next drawing opening at that moment, and the screen waits for the next
// payment `RESET_MS` after it.
export const TERMINAL_PAY_MS = 1600;

export const APPROVE_SHARE = 0.6;

export const RESET_MS = 2200;

// The terminal drawn larger where there is room beside the ways to pay.
export const TERMINAL_SCALE = { narrow: 1, wide: 1.3 } as const;
