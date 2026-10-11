import { createWarmedRandom } from "@/packages/math/random";

import type { ItemSpec } from "../../economy/domain/items";
import { AMMO_TYPES } from "../../gear/config/slots";
import type { AmmoStock } from "../../gear/domain/gear";
import { AMMO_PACKS, MARKET, STATION_GOODS } from "../config/market";
import { MarketAmmo, MarketGood, MarketSale, MarketService, Port, ServiceId } from "../domain/station";

// How much dearer a port is than one at home: more for every universe deep, more again for a trader.
export const priceFactor = (port: Port): number => MARKET.depthGrowth ** Math.max(0, port.depth + 1) * (port.kind === "trader" ? MARKET.traderMarkup : 1);

const round = (coin: number): number => Math.max(1, Math.round(coin));

// What a port has for sale and at what price, all from its seed: as many kinds as a station or a trader carries,
// of what is found that deep, each priced a few times its worth, nudged by the port's seed.
export const goodsFor = (port: Port, catalog: Readonly<Record<string, ItemSpec>>): MarketGood[] => {
  const random = createWarmedRandom(port.seed);
  const open = STATION_GOODS.filter((good) => good.from <= port.depth && (port.kind === "station" || good.isTraded) && catalog[good.id]);
  const goods: MarketGood[] = [];
  const stock = port.kind === "trader" ? MARKET.stock.trader : MARKET.stock.station;

  while (goods.length < stock && open.length > 0) {
    const [good] = open.splice(Math.floor(random() * open.length), 1);
    const spec = catalog[good.id];
    const nudge = 1 + (random() * 2 - 1) * MARKET.jitter;

    goods.push({ id: good.id, price: round(spec.value * MARKET.buyMarkup * priceFactor(port) * nudge) });
  }

  return goods;
};

// Ammunition by the pack at a port, with what is aboard and the most each rack holds; a trader sells only what its
// people fire too (rounds, shells and cells).
export const ammoFor = (port: Port, aboard: AmmoStock, rack: (type: keyof AmmoStock) => number): MarketAmmo[] => AMMO_TYPES
  .filter((type) => port.kind === "station" || type === "rounds" || type === "shells" || type === "cells")
  .map((type) => ({ type, count: AMMO_PACKS[type].count, price: round(AMMO_PACKS[type].price * priceFactor(port)), aboard: aboard[type], rack: rack(type) }));

const SERVICES: readonly ServiceId[] = ["repair", "refuel", "recharge"];

// Mending, a full tank and full shields, priced for what is missing (only a station's crews do them), and whether
// the ship needs each at all.
export const servicesFor = (port: Port, missing: Readonly<Record<ServiceId, number>>): MarketService[] => (port.kind === "station"
  ? SERVICES.map((id) => ({
    id,
    price: missing[id] > 0 ? round(MARKET[id] * missing[id] * priceFactor(port)) : 0,
    isNeeded: missing[id] > 0.005,
  }))
  : []);

// What a port pays for each of a kind of thing in the hold: half as much again as breaking it down, more deeper in.
export const salePrice = (port: Port, spec: ItemSpec): number =>
  round(spec.value * Math.min(MARKET.sellCeiling, MARKET.sellRate * MARKET.depthGrowth ** Math.max(0, port.depth + 1)));

// What the hold could sell at a port, the most valuable first.
export const salesFor = (port: Port, cargo: ReadonlyArray<{ id: string; count: number }>, catalog: Readonly<Record<string, ItemSpec>>): MarketSale[] => cargo
  .filter(({ id, count }) => count > 0 && catalog[id] && catalog[id].value > 0)
  .map(({ id, count }) => ({ id, count, price: salePrice(port, catalog[id]) }))
  .sort((first, second) => second.price - first.price);
