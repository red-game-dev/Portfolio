import type { AmmoType } from "../../gear/domain/gear";

// How a port prices things. A thing costs a few times what it would break down for and sells for half as much again
// as breaking it down; deeper in, everything costs and pays more; a trader asks a little more than a station; each
// port's prices sit a little above or below by its own seed. A full hull and a full tank have a price at home.
export const MARKET = {
  buyMarkup: 4,
  sellRate: 1.5,
  depthGrowth: 1.15,
  traderMarkup: 1.2,
  jitter: 0.15,
  repair: 260,
  refuel: 90,
  recharge: 60,
  // How many kinds of thing a station and a trader have for sale.
  stock: { station: 6, trader: 4 },
};

// What ports can sell, from which universe (-1: at home too), and whether a trader carries it as well as a station.
export const STATION_GOODS: ReadonlyArray<{ id: string; from: number; isTraded: boolean }> = [
  { id: "repairKit", from: -1, isTraded: false },
  { id: "fuelCell", from: -1, isTraded: false },
  { id: "shieldCell", from: 0, isTraded: true },
  { id: "coolantFlask", from: -1, isTraded: false },
  { id: "hullPlate", from: -1, isTraded: false },
  { id: "nozzle", from: -1, isTraded: false },
  { id: "emitter", from: 0, isTraded: true },
  { id: "sensorArray", from: -1, isTraded: false },
  { id: "fuelLine", from: -1, isTraded: false },
  { id: "radiatorFin", from: -1, isTraded: false },
  { id: "scrap", from: -1, isTraded: true },
  { id: "wiring", from: -1, isTraded: true },
  { id: "titanium", from: -1, isTraded: true },
  { id: "carbon", from: -1, isTraded: true },
  { id: "circuits", from: -1, isTraded: true },
  { id: "moonstone", from: -1, isTraded: true },
  { id: "starShard", from: 1, isTraded: true },
  { id: "alloy", from: 1, isTraded: true },
  { id: "stabiliser", from: 3, isTraded: false },
];

// Ammunition sold by the pack, and what a pack costs at home.
export const AMMO_PACKS: Readonly<Record<AmmoType, { count: number; price: number }>> = {
  rounds: { count: 100, price: 30 },
  missiles: { count: 6, price: 70 },
  mines: { count: 4, price: 60 },
  slugs: { count: 4, price: 80 },
  cells: { count: 3, price: 70 },
  shells: { count: 20, price: 50 },
};

// The worlds at home a station keeps its orbit round. A station circles its world this many radii out (and a little
// more), this fast, at this size; a ship docks within `reach` of it, no faster than `speed` against it, and once it has
// left one it cannot dock again for `again` seconds.
export const HOME_PORTS: readonly string[] = ["earth", "mars", "jupiter", "saturn"];

export const PORT_ORBIT = { radii: 2.4, margin: 0.35, rate: 0.12, radius: 0.16 };

export const DOCKING = { reach: 0.4, speed: 0.6, again: 4, push: 0.25 };
