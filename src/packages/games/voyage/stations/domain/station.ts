import type { AmmoType } from "../../gear/domain/gear";

// Where a ship can dock and trade: a station keeping its orbit round a world, or a trader met in space.
export type PortKind = "station" | "trader";

// A station keeping its orbit round a world (by id): its angle round it now, how far out (world units) and how fast
// it goes round (radians a second), where it is and how it moves this step, how big it is, the seed its trade is made
// from, and the faction that keeps it (-1 for a free port).
export interface Station {
  id: string;
  anchor: string;
  angle: number;
  distance: number;
  rate: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  seed: number;
  faction: number;
}

// A port near enough and slow enough to dock at, or the one the ship is docked at: what kind, which (a station's id, or
// a trader's entity), the world a station circles, who keeps it, the seed its trade comes from, and how deep the run
// is (a universe's index, -1 at home), which makes it dearer and better stocked.
export interface Port {
  kind: PortKind;
  id: string;
  anchor: string | null;
  faction: number;
  seed: number;
  depth: number;
}

export type ServiceId = "repair" | "refuel" | "recharge";

// What a port offers, as the UI shows it: things to buy and their price, ammunition by the pack (what is aboard and
// the most the racks hold), mending, a full tank and full shields with whether the ship needs them, what the hold
// could sell there and for how much each, and the Red Coin to spend.
export interface MarketGood {
  id: string;
  price: number;
}

export interface MarketAmmo {
  type: AmmoType;
  count: number;
  price: number;
  aboard: number;
  rack: number;
}

export interface MarketService {
  id: ServiceId;
  price: number;
  isNeeded: boolean;
}

export interface MarketSale {
  id: string;
  count: number;
  price: number;
}

export interface StationView {
  port: Port;
  goods: MarketGood[];
  ammo: MarketAmmo[];
  services: MarketService[];
  sales: MarketSale[];
  coin: number;
}
