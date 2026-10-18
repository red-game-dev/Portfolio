import { readVersioned, Repository, RepositoryOptions, StoreAdapter, Versioned } from "@/packages/browser/store";
import { isRecord } from "@/packages/core/domain";

import { isCareerProfile } from "../../career/guards/isCareerProfile";
import { newCareer } from "../../career/services/Career";
import { GhostRun } from "../../domain/ghost";
import { isArmoryProfile } from "../../gear/guards/isArmoryProfile";
import { newArmoryProfile } from "../../gear/services/Armory";
import { isGhostRun } from "../../guards/isGhostRun";
import { isProgressProfile } from "../../progress/guards/isProgressProfile";
import { newProgressProfile } from "../../progress/services/Progress";
import { newBar } from "../config/bar";
import { PilotProfile } from "../domain/profile";
import { isPilotProfile } from "../guards/isPilotProfile";
import { newEconomyProfile } from "./Hangar";

// The shape version this code writes: 2 added the career, 3 the boosts and the ability bar, 4 the armoury and
// the pilot's progress, 5 the DevOps universe as the fourth of a run.
const VERSION = 5;

// The DevOps universe came in fourth, after the chain: a story chapter at or past it moves on one, and so do the stars
// won in a universe at or past it (keyed by its place in a run, from 0).
const DEVOPS_CHAPTER = 4;
const DEVOPS_UNIVERSE = 3;

const makeRoomForDevops = (data: Record<string, unknown>): Record<string, unknown> => {
  const career = isRecord(data.career) ? data.career : null;
  const story = career && isRecord(career.story) ? career.story : null;
  const progress = isRecord(data.progress) ? data.progress : null;
  const stars = progress && isRecord(progress.stars) ? progress.stars : null;
  const movedStory = story && typeof story.chapter === "number" && story.chapter >= DEVOPS_CHAPTER
    ? { ...career, story: { ...story, chapter: story.chapter + 1 } }
    : career;
  const movedStars = stars
    ? Object.fromEntries(Object.entries(stars).map(([key, value]) => {
      const place = /^u:(\d+)$/.exec(key);

      return [place && Number(place[1]) >= DEVOPS_UNIVERSE ? `u:${Number(place[1]) + 1}` : key, value];
    }))
    : null;

  return {
    ...data,
    ...(movedStory ? { career: movedStory } : {}),
    ...(movedStars ? { progress: { ...progress, stars: movedStars } } : {}),
  };
};

// A pilot who has never flown.
export const newProfile = (): PilotProfile => ({ ...newEconomyProfile(), career: newCareer(), armory: newArmoryProfile(), progress: newProgressProfile() });

const isGhostOrNone = (value: unknown): value is GhostRun | null => value === null || isGhostRun(value);

// A profile from before careers keeps its hangar and starts its career; one from before boosts starts with none
// found and the ability bar laid out as a new pilot's; one from before the armoury is fitted as a new pilot's
// rocket, with no levels or stars yet (its bar grows to six slots as it is read).
const migrate = (data: unknown, from: number): unknown => {
  if (!isRecord(data)) {
    return data;
  }

  const withCareer = from < 2 ? { ...data, career: newCareer() } : data;
  const withBoosts = from < 3 ? { ...withCareer, boosts: {}, bar: newBar() } : withCareer;

  const withArmory = from < 4 ? { ...withBoosts, armory: newArmoryProfile(), progress: newProgressProfile() } : withBoosts;

  return from < 5 ? makeRoomForDevops(withArmory) : withArmory;
};

// A career, armoury or progress that no longer checks out is started again on its own, so the hangar's ship, hold and
// money (and every other part) are kept; only a broken hangar part loses the whole pilot.
const repair = (data: unknown): unknown => {
  if (typeof data !== "object" || data === null) {
    return data;
  }

  const record: Record<string, unknown> = { ...data };

  if (!isCareerProfile(record.career)) {
    record.career = newCareer();
  }

  if (!isArmoryProfile(record.armory)) {
    record.armory = newArmoryProfile();
  }

  if (!isProgressProfile(record.progress)) {
    record.progress = newProgressProfile();
  }

  return record;
};

const OPTIONS: RepositoryOptions<PilotProfile> = { version: VERSION, isValid: isPilotProfile, fallback: newProfile, migrate, repair };

// A pilot ready to travel to another device: the profile with the version it was written in, so the device it lands on
// brings it up to date and checks it as it does its own.
export const pilotEnvelope = (profile: PilotProfile): Versioned<PilotProfile> => ({ version: VERSION, data: profile });

// A pilot that came from elsewhere (a link or a file), read as this device reads its own: null when it does not check
// out or was written by a newer release.
export const readPilot = (stored: unknown): PilotProfile | null => readVersioned(stored, OPTIONS);

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
    this.repository = new Repository(adapter, KEY, OPTIONS);
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
