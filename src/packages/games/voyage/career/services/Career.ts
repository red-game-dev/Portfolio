import { CODEX, CODEX_IDS } from "../config/codex";
import { BOARD_SIZE, contractFor, MISSIONS, missionById } from "../config/missions";
import { rankFor, RANKS } from "../config/ranks";
import { advance, targetOf } from "../core/MissionBoard";
import { CareerEvent, CareerProfile, CareerView, MissionDone, MissionProgress, MissionSpec } from "../domain/career";

// A pilot who has done nothing yet.
export const newCareer = (): CareerProfile => ({ xp: 0, active: [], done: [], contracts: 0, codex: [], daily: null });

// What came of something happening: the missions it finished, and the new rank if it promoted the pilot.
export interface CareerOutcome {
  done: MissionDone[];
  promoted: number | null;
}

// A pilot's career between and during runs: three missions on the board at a time, offered in order as rank
// allows (contracts once every mission is done), each counting what happens until it is done and pays its
// experience and Red Coin; ranks from the experience; the codex of everything seen; and each day's daily voyage.
// It pays nothing itself: what missions pay comes back for the hangar to credit. Listeners hear every change.
export class Career {
  private profile: CareerProfile;
  private readonly listeners = new Set<() => void>();

  constructor(profile: CareerProfile = newCareer()) {
    this.profile = Career.clean(profile);
    this.fill();
  }

  public get xp(): number {
    return this.profile.xp;
  }

  public get rank(): number {
    return rankFor(this.profile.xp);
  }

  // A career as kept, with anything this code no longer knows left out.
  private static clean(profile: CareerProfile): CareerProfile {
    return {
      xp: Math.max(0, Math.floor(profile.xp)),
      active: profile.active.filter((entry) => missionById(entry.id) !== null).slice(0, BOARD_SIZE)
.map((entry) => ({ ...entry })),
      done: [...profile.done],
      contracts: Math.max(0, Math.floor(profile.contracts)),
      codex: profile.codex.filter((id) => CODEX_IDS.has(id)),
      daily: profile.daily ? { ...profile.daily } : null,
    };
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.add(listener);

    return () => this.listeners.delete(listener);
  }

  // Counts something that happened against every mission on the board; finishes, pays and replaces those it
  // completes.
  public record(event: CareerEvent): CareerOutcome {
    const rankBefore = this.rank;
    const done: MissionDone[] = [];
    let isChanged = false;

    this.profile.active = this.profile.active.filter((entry) => {
      const mission = missionById(entry.id);

      if (!mission) {
        return false;
      }

      const progress = Math.min(targetOf(mission.goal), advance(mission.goal, entry.progress, event));

      if (progress !== entry.progress) {
        entry.progress = progress;
        isChanged = true;
      }

      if (progress >= targetOf(mission.goal)) {
        done.push({ mission, xp: mission.xp, coin: mission.coin });

        return false;
      }

      return true;
    });

    done.forEach(({ mission, xp }) => {
      this.profile.xp += xp;
      this.profile.done.push(mission.id);
      this.profile.contracts += mission.id.startsWith("contract:") ? 1 : 0;
    });

    if (done.length > 0) {
      this.fill();
    }

    if (isChanged || done.length > 0) {
      this.changed();
    }

    const rank = this.rank;

    return { done, promoted: rank > rankBefore ? rank : null };
  }

  // Marks something seen in the codex; whether it was new.
  public discover(id: string): boolean {
    if (!CODEX_IDS.has(id) || this.profile.codex.includes(id)) {
      return false;
    }

    this.profile.codex.push(id);
    this.changed();

    return true;
  }

  public hasFound(id: string): boolean {
    return this.profile.codex.includes(id);
  }

  // A daily voyage flown: its score, and whether it was the day's best.
  public recordDaily(day: string, score: number): boolean {
    const daily = this.profile.daily?.day === day ? this.profile.daily : { day, best: 0, runs: 0 };
    const isBest = score > daily.best;

    this.profile.daily = { day, best: Math.max(daily.best, score), runs: daily.runs + 1 };
    this.changed();

    return isBest;
  }

  public dailyBest(day: string): number {
    return this.profile.daily?.day === day ? this.profile.daily.best : 0;
  }

  public view(): CareerView {
    const { xp } = this.profile;
    const rank = this.rank;
    const next = RANKS[rank + 1];
    const found = new Set(this.profile.codex);

    return {
      xp,
      rank,
      rankId: RANKS[rank].id,
      nextRank: next ? { id: next.id, xp: next.xp } : null,
      rankFloor: RANKS[rank].xp,
      missions: this.profile.active.map((entry) => ({ entry, mission: missionById(entry.id) }))
        .filter((item): item is { entry: MissionProgress; mission: MissionSpec } => item.mission !== null)
        .map(({ entry, mission }) => ({ mission, progress: entry.progress, target: targetOf(mission.goal) })),
      done: this.profile.done.length,
      codex: CODEX.map((entry) => ({ entry, isFound: found.has(entry.id) })),
      found: CODEX.filter((entry) => found.has(entry.id)).length,
      daily: this.profile.daily ? { ...this.profile.daily } : null,
    };
  }

  public toProfile(): CareerProfile {
    return {
      ...this.profile,
      active: this.profile.active.map((entry) => ({ ...entry })),
      done: [...this.profile.done],
      codex: [...this.profile.codex],
      daily: this.profile.daily ? { ...this.profile.daily } : null,
    };
  }

  // Takes on a career kept elsewhere (another tab's newer save, a reset).
  public replace(profile: CareerProfile): void {
    this.profile = Career.clean(profile);
    this.fill();
    this.changed();
  }

  // Keeps the board full: the next missions in order that the rank allows and are not done or on it, then
  // contracts.
  private fill(): void {
    const rank = this.rank;
    const taken = (id: string) => this.profile.done.includes(id) || this.profile.active.some((entry) => entry.id === id);
    let contract = this.profile.contracts;

    while (this.profile.active.length < BOARD_SIZE) {
      const next = MISSIONS.find((mission) => mission.minRank <= rank && !taken(mission.id));
      const offered = next ?? (MISSIONS.every((mission) => taken(mission.id)) ? contractFor(contract) : null);

      if (!offered) {
        break;
      }

      if (!next) {
        contract += 1;

        if (taken(offered.id)) {
          continue;
        }
      }

      this.profile.active.push({ id: offered.id, progress: 0 });
    }
  }

  private changed(): void {
    this.listeners.forEach((listener) => listener());
  }
}
