// In orbit the page asks whether the reader wants to play, and keeps the answer, so it is asked only once in this
// browser; nothing opens by itself (WCAG 2.2.1: no time limit the reader did not choose).
export const INVITE_KEY = "redgame.voyageInvite";

export type InviteChoice = "taken" | "declined";

export const isInviteChoice = (value: unknown): value is InviteChoice => value === "taken" || value === "declined";
