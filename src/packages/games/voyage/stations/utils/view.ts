import type { ItemSpec } from "../../economy/domain/items";
import type { AmmoStock, AmmoType } from "../../gear/domain/gear";
import { Port, ServiceId, StationView } from "../domain/station";
import { ammoFor, goodsFor, salesFor, servicesFor } from "./market";

// What a port needs to know of the pilot to show its trade: what is in the hold, the Red Coin to spend, the ammunition
// aboard and the most each rack holds, and how much of a full hull, tank and shields the ship is missing (0 to 1).
export interface Customer {
  cargo: ReadonlyArray<{ id: string; count: number }>;
  coin: number;
  ammo: AmmoStock;
  rack: (type: AmmoType) => number;
  missing: Readonly<Record<ServiceId, number>>;
}

// Everything a port offers the pilot docked there, as plain data for the UI.
export const stationView = (port: Port, customer: Customer, catalog: Readonly<Record<string, ItemSpec>>): StationView => ({
  port,
  goods: goodsFor(port, catalog),
  ammo: ammoFor(port, customer.ammo, customer.rack),
  services: servicesFor(port, customer.missing),
  sales: salesFor(port, customer.cargo, catalog),
  coin: customer.coin,
});
