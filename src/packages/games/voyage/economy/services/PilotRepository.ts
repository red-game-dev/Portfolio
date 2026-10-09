import { Repository, StoreAdapter } from "@/packages/browser/store";

import { newCareer } from "../../career/services/Career";
import { GhostRun } from "../../domain/ghost";
import { isGhostRun } from "../../guards/isGhostRun";
import { PilotProfile } from "../domain/profile";
import { isPilotProfile } from "../guards/isPilotProfile";
import { newEconomyProfile } from "./Hangar";

// The shape version this code writes: 2 added the career.
const VERSION = 2;

// A pilot who has never flown.
export const newProfile = (): PilotProfile => ({ ...newEconomyProfile(), career: newCareer() });

const isGhostOrNone = (value: unknown): value is GhostRun | null => value === null || isGhostRun(value);

// A profile from before careers keeps its hangar and starts its career.
const migrate = (data: unknown, from: number): unknown => (from < 2 && typeof data === "object" && data !== null ? { ...data, career: newCareer() } : data);
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
