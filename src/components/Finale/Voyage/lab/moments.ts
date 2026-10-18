// The moments the lab can hold the HUD at: in flight with everything it can show at once, coming down on a world with
// its card beside the telemetry, and each thing that lies over the HUD or takes its place: the card before a run, the
// pause card, the card at a run's end and at a daily run's with the day's board, the choice of a perk, the hangar, a
// port's trade, photo mode and the map. Kept apart from the lab itself, so the lab's page and the check read the list
// without loading the game.
export const HUD_MOMENTS = ["flight", "descent"] as const;

export const OVER_MOMENTS = ["ready", "paused", "over", "daily", "perk", "hangar", "station", "photo", "map"] as const;

export const LAB_MOMENTS = [...HUD_MOMENTS, ...OVER_MOMENTS] as const;

export type LabMoment = typeof LAB_MOMENTS[number];
