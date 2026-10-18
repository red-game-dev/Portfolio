import { TIME_ZONE_REGION } from "../config/timeZones";
import { RegionClues, RegionCode } from "../domain/types";
import { RegionResolver } from "./RegionResolver";

// Where the device's clock is set to: the surest clue to where it is, since people set their clock where they live.
export class TimeZoneRegion extends RegionResolver {
  public readonly id = "timeZone";
  private readonly zones: Readonly<Record<string, RegionCode>>;

  constructor(zones: Readonly<Record<string, RegionCode>> = TIME_ZONE_REGION) {
    super();
    this.zones = zones;
  }

  public resolve({ timeZone }: RegionClues): RegionCode | null {
    return timeZone ? this.zones[timeZone] ?? null : null;
  }
}
