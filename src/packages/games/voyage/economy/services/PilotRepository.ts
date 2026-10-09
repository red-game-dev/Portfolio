import { Repository, StoreAdapter } from "@/packages/browser/store";

import { PilotProfile } from "../domain/profile";
import { isPilotProfile } from "../guards/isPilotProfile";
import { newProfile } from "./Hangar";

// The shape version this code writes.
const VERSION = 1;
const KEY = "pilot";

// A pilot's profile kept in the browser, wherever the adapter keeps it: read back checked (a new pilot when
// nothing valid is kept), written with its version, and wiped on request. Nothing leaves the device.
export class PilotRepository {
  private readonly repository: Repository<PilotProfile>;

  constructor(adapter: StoreAdapter) {
    this.repository = new Repository(adapter, KEY, { version: VERSION, isValid: isPilotProfile, fallback: newProfile });
  }

  public load(): Promise<PilotProfile> {
    return this.repository.load();
  }

  public save(profile: PilotProfile): Promise<boolean> {
    return this.repository.save(profile);
  }

  public clear(): Promise<void> {
    return this.repository.clear();
  }
}
