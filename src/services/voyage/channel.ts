// The channel tabs tell one another on that they saved a pilot, so an open voyage takes the newer one on. Apart from the
// pilot module so the voyage's sync can name it without loading the game.
export const PILOT_CHANNEL = "redgame.voyage";

// What a tab says when it saves: when, and whether the visitor replaced the pilot with one from another device, which
// every other tab takes on even over changes of its own still waiting to be saved.
export interface PilotSaved {
  savedAt: number;
  isReplaced: boolean;
}

// A message on the channel as a save, including a bare time from a tab still running an older release.
export const pilotSavedOf = (data: unknown): PilotSaved | null => {
  if (typeof data === "number") {
    return { savedAt: data, isReplaced: false };
  }

  if (typeof data === "object" && data !== null && "savedAt" in data && typeof data.savedAt === "number") {
    return { savedAt: data.savedAt, isReplaced: "isReplaced" in data && data.isReplaced === true };
  }

  return null;
};
