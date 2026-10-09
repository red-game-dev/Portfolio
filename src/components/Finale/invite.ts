// The first time a reader reaches orbit, the journey carries on by itself after a short count unless they say no
// thanks; either answer is kept, so it is asked by itself only once in this browser.
export const INVITE_KEY = "redgame.voyageInvite";
export const INVITE_SECONDS = 5;

export type InviteChoice = "taken" | "declined";

export const isInviteChoice = (value: unknown): value is InviteChoice => value === "taken" || value === "declined";

export type InviteEvent = { kind: "watch"; isWatching: boolean } | { kind: "tick" };

// The seconds left on the count, null while it is not running: it starts full as the reader watches the ship in
// orbit, starts over if they look away, and counts down to zero, when the journey goes on.
export const nextCount = (count: number | null, event: InviteEvent): number | null => {
  if (event.kind === "watch") {
    return event.isWatching ? count ?? INVITE_SECONDS : null;
  }

  return count === null ? null : Math.max(0, count - 1);
};
