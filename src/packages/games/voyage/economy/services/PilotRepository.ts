import { Repository, StoreAdapter } from "@/packages/browser/store";

import { newCareer } from "../../career/services/Career";
import { GhostRun } from "../../domain/ghost";
import { newArmoryProfile } from "../../gear/services/Armory";
import { isGhostRun } from "../../guards/isGhostRun";
import { newProgressProfile } from "../../progress/services/Progress";
import { newBar } from "../config/bar";
import { PilotProfile } from "../domain/profile";
import { isPilotProfile } from "../guards/isPilotProfile";
import { newEconomyProfile } from "./Hangar";

// The shape version this code writes: 2 added the career, 3 the boosts and the ability bar, 4 the armoury and
// the pilot's progress.
const VERSION = 4;

// A pilot who has never flown.
export const newProfile = (): PilotProfile => ({ ...newEconomyProfile(), career: newCareer(), armory: newArmoryProfile(), progress: newProgressProfile() });

const isGhostOrNone = (value: unknown): value is GhostRun | null => value === null || isGhostRun(value);

// A profile from before careers keeps its hangar and starts its career; one from before boosts starts with none
// found and the ability bar laid out as a new pilot's; one from before the armoury is fitted as a new pilot's
// rocket, with no levels or stars yet (its bar grows to six slots as it is read).
const migrate = (data: unknown, from: number): unknown => {
  if (typeof data !== "object" || data === null) {
    return data;
  }

  const withCareer = from < 2 ? { ...data, career: newCareer() } : data;
  const withBoosts = from < 3 ? { ...withCareer, boosts: {}, bar: newBar() } : withCareer;

  return from < 4 ? { ...withBoosts, armory: newArmoryProfile(), progress: newProgressProfile() } : withBoosts;
};

const KEY = "pilot";
const GHOST_KEY = "ghost";

// A pilot's profile kept in the browser, wherever the adapter keeps it: read back checked and brought up from
// older versions (a new pilot when nothing valid is kept), written with its version, and wiped on request.
// Nothing leaves the device.
export class PilotRepository {
  private readonly repository: Repository<PilotProfile>;
  // The best daily voyage's ghost, kept apart: it is large, and read only for a daily voyage.
  private readonly ghost: Repository<GhostRun | null>;

  constructor(adapter: StoreAdapter) {
    this.ghost = new Repository<GhostRun | null>(adapter, GHOST_KEY, { version: 1, isValid: isGhostOrNone, fallback: () => null });
    this.repository = new Repository(adapter, KEY, { version: VERSION, isValid: isPilotProfile, fallback: newProfile, migrate });
  }

  public load(): Promise<PilotProfile> {
    return this.repository.load();
  }

  public save(profile: PilotProfile): Promise<boolean> {
    return this.repository.save(profile);
  }

  public async clear(): Promise<void> {
    await Promise.all([this.repository.clear(), this.ghost.clear()]);
  }

  public clearGhost(): Promise<void> {
    return this.ghost.clear();
  }

  public loadGhost(): Promise<GhostRun | null> {
    return this.ghost.load();
  }

  public saveGhost(run: GhostRun): Promise<boolean> {
    return this.ghost.save(run);
  }

  public close(): void {
    this.repository.close();
  }
}
