import { RegionClues, RegionCode } from "../domain/types";

// Says which region a device is in from what it tells about itself, or nothing. Each adapter reads one clue; the till
// service asks them in order and takes the first answer.
export abstract class RegionResolver {
  public abstract readonly id: string;

  public abstract resolve(clues: RegionClues): RegionCode | null;
}
