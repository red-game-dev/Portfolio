import { LevelCurve, LevelStanding } from "@/packages/progression/levels";

import { PILOT_CURVE } from "../../gear/config/levels";
import { ACHIEVEMENTS, COUNTERS } from "../config/achievements";
import { DEFAULT_PAINT, DEFAULT_TRAIL, PAINTS, STAR_UNLOCKS, TRAILS } from "../config/cosmetics";
import { ProgressOutcome, ProgressProfile } from "../domain/progress";

export const PILOT_LEVELS = new LevelCurve(PILOT_CURVE);

// The steps of the guided first flight.
export const GUIDE_STEPS = 6;

export const newProgressProfile = (): ProgressProfile => ({
  exp: 0,
  stars: {},
  achievements: {},
  counters: {},
  cosmetics: { paint: DEFAULT_PAINT, trail: DEFAULT_TRAIL, owned: [DEFAULT_PAINT, DEFAULT_TRAIL] },
  guide: { step: 0, isDone: false },
});

const NOTHING: ProgressOutcome = { levels: 0, level: 1, achievements: [], cosmetics: [] };

const isCosmetic = (id: string) => PAINTS.some((paint) => paint.id === id) || TRAILS.some((trail) => trail.id === id);

// Everything a pilot carries from run to run beyond the hangar and the career: experience and the level it sets,
// the best stars won in each universe and daily voyage, lifetime counts and the achievements read from them, the
// paints and trails owned and chosen, and the guided first flight. Every change says what it unlocked, so the
// host can announce it; listeners hear every change, to save it and show it.
export class Progress {
  private profile: ProgressProfile;
  private readonly now: () => number;
  private readonly listeners = new Set<() => void>();

  constructor(profile: ProgressProfile = newProgressProfile(), { now = Date.now }: { now?: () => number } = {}) {
    this.now = now;
    this.profile = this.clean(profile);
  }

  public get level(): number {
    return PILOT_LEVELS.levelOf(this.profile.exp);
  }

  public get standing(): LevelStanding {
    return PILOT_LEVELS.standing(this.profile.exp);
  }

  public get exp(): number {
    return this.profile.exp;
  }

  public get starTotal(): number {
    return Object.values(this.profile.stars).reduce((sum, stars) => sum + stars, 0);
  }

  public get paint(): string {
    return this.profile.cosmetics.paint;
  }

  public get trail(): string {
    return this.profile.cosmetics.trail;
  }

  public get guide(): Readonly<ProgressProfile["guide"]> {
    return this.profile.guide;
  }

  public counter(name: string): number {
    return this.profile.counters[name] ?? 0;
  }

  public hasAchievement(id: string): boolean {
    return this.profile.achievements[id] !== undefined;
  }

  public owns(cosmetic: string): boolean {
    return this.profile.cosmetics.owned.includes(cosmetic);
  }

  public stars(key: string): number {
    return this.profile.stars[key] ?? 0;
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.add(listener);

    return () => this.listeners.delete(listener);
  }

  public replace(profile: ProgressProfile): void {
    this.profile = this.clean(profile);
    this.changed();
  }

  // Experience earned; the level it reaches is a lifetime best too.
  public gainExp(amount: number): ProgressOutcome {
    if (amount <= 0) {
      return { ...NOTHING, level: this.level };
    }

    const before = this.level;

    this.profile.exp = Math.min(PILOT_LEVELS.startOf(PILOT_LEVELS.cap), this.profile.exp + Math.round(amount));

    const level = this.level;

    // A new level may unlock something; experience alone only needs saving and showing.
    if (level === before) {
      this.changed();

      return { ...NOTHING, level };
    }

    return { ...this.record("pilotLevel", level), levels: level - before, level };
  }

  // A lifetime count moved: added to, or a new best where that is how it counts.
  public record(counter: string, value = 1): ProgressOutcome {
    const before = this.profile.counters[counter] ?? 0;
    const next = COUNTERS[counter] === "best" ? Math.max(before, value) : before + value;

    if (next === before) {
      return { ...NOTHING, level: this.level };
    }

    this.profile.counters[counter] = next;

    return this.settle();
  }

  // Something distinct seen for the first time (a world landed on, by its id), which counts once.
  public seen(prefix: string, id: string, distinct: string): ProgressOutcome {
    const key = `${prefix}:${id}`;

    if (this.profile.counters[key]) {
      return { ...NOTHING, level: this.level };
    }

    this.profile.counters[key] = 1;

    const count = Object.keys(this.profile.counters).filter((name) => name.startsWith(`${prefix}:`)).length;

    this.profile.counters[distinct] = Math.max(this.profile.counters[distinct] ?? 0, count);

    return this.settle();
  }

  // The stars won in a universe or a daily voyage, kept only where better than before; returns how many more.
  public recordStars(key: string, stars: number): { gained: number; outcome: ProgressOutcome } {
    const won = Math.max(0, Math.min(3, Math.floor(stars)));
    const before = this.profile.stars[key] ?? 0;

    if (won <= before) {
      return { gained: 0, outcome: { ...NOTHING, level: this.level } };
    }

    this.profile.stars[key] = won;

    if (won === 3) {
      this.profile.counters.perfectUniverses = (this.profile.counters.perfectUniverses ?? 0) + 1;
    }

    this.profile.counters.starTotal = Math.max(this.profile.counters.starTotal ?? 0, this.starTotal);

    return { gained: won - before, outcome: this.settle() };
  }

  // Wears a paint or an engine trail the pilot owns.
  public choose(kind: "paint" | "trail", id: string): boolean {
    const isKind = kind === "paint" ? PAINTS.some((paint) => paint.id === id) : TRAILS.some((trail) => trail.id === id);

    if (!isKind || !this.owns(id)) {
      return false;
    }

    this.profile.cosmetics[kind] = id;
    this.changed();

    return true;
  }

  // The guided first flight moves on a step, or is done (finished or skipped).
  public guideTo(step: number): void {
    if (this.profile.guide.isDone || step <= this.profile.guide.step) {
      return;
    }

    this.profile.guide = { step, isDone: step >= GUIDE_STEPS };
    this.changed();
  }

  public finishGuide(): void {
    if (!this.profile.guide.isDone) {
      this.profile.guide = { step: GUIDE_STEPS, isDone: true };
      this.changed();
    }
  }

  public toProfile(): ProgressProfile {
    const { exp, stars, achievements, counters, cosmetics, guide } = this.profile;

    return {
      exp,
      stars: { ...stars },
      achievements: { ...achievements },
      counters: { ...counters },
      cosmetics: { ...cosmetics, owned: [...cosmetics.owned] },
      guide: { ...guide },
    };
  }

  // Unlocks every achievement its count now reaches and every cosmetic it, or the stars, now give.
  private settle(): ProgressOutcome {
    const achievements: string[] = [];
    const cosmetics: string[] = [];
    const own = (cosmetic: string | null) => {
      if (cosmetic && !this.owns(cosmetic)) {
        this.profile.cosmetics.owned.push(cosmetic);
        cosmetics.push(cosmetic);
      }
    };

    ACHIEVEMENTS.forEach((spec) => {
      if (!this.hasAchievement(spec.id) && (this.profile.counters[spec.counter] ?? 0) >= spec.target) {
        this.profile.achievements[spec.id] = this.now();
        achievements.push(spec.id);
        own(spec.reward);
      }
    });

    const total = this.starTotal;

    STAR_UNLOCKS.forEach((unlock) => {
      if (unlock.stars !== null && total >= unlock.stars) {
        own(unlock.cosmetic);
      }
    });

    this.changed();

    return { levels: 0, level: this.level, achievements, cosmetics };
  }

  // A profile read in: counts and stars as whole numbers, only cosmetics there are, and the defaults always owned
  // and worn where what was worn is gone.
  private clean(profile: ProgressProfile): ProgressProfile {
    const owned = [...new Set([DEFAULT_PAINT, DEFAULT_TRAIL, ...profile.cosmetics.owned.filter(isCosmetic)])];
    const paint = owned.includes(profile.cosmetics.paint) && PAINTS.some((spec) => spec.id === profile.cosmetics.paint) ? profile.cosmetics.paint : DEFAULT_PAINT;
    const trail = owned.includes(profile.cosmetics.trail) && TRAILS.some((spec) => spec.id === profile.cosmetics.trail) ? profile.cosmetics.trail : DEFAULT_TRAIL;

    return {
      exp: Math.max(0, profile.exp),
      stars: { ...profile.stars },
      achievements: { ...profile.achievements },
      counters: { ...profile.counters },
      cosmetics: { paint, trail, owned },
      guide: { ...profile.guide },
    };
  }

  private changed(): void {
    this.listeners.forEach((listener) => listener());
  }
}
