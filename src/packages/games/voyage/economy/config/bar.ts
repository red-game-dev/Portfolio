import { BarSlot } from "../domain/profile";

// The ability bar's slots, keyed 1 to 4.
export const BAR_SLOTS = 4;

// The most charges of one boost the ship can carry.
export const MAX_CHARGES = 9;

// A new pilot's bar: the fuel cell and repair kit of the starter kit, two slots left for the first boosts found.
export const newBar = (): Array<BarSlot | null> => [{ kind: "item", id: "fuelCell" }, { kind: "item", id: "repairKit" }, null, null];
