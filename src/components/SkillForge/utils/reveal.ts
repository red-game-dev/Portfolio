// Each card starts a little after the one before it, spread over this share of the clock, so even the last
// card of a long station has time to finish.
export const STAGGER_SHARE = 0.5;

// How many characters of a card's name have resolved at `progress` (0 to 1) on the station's shared clock.
// Every card is fully revealed by progress 1, however long the station.
export const revealedCharacters = (progress: number, index: number, count: number, length: number) => {
  const start = (index / Math.max(1, count)) * STAGGER_SHARE;
  const local = Math.min(1, Math.max(0, (progress - start) / (1 - STAGGER_SHARE)));

  return Math.floor(local * length);
};
