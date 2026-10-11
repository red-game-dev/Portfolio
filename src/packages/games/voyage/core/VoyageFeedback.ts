import type { LoopHandle, MusicThemeId, PlayOptions, SoundCue } from "@/packages/audio/synth";
import type { HapticName } from "@/packages/browser/haptics";

import { VoyageNotice } from "../domain/notices";
import { ION_TIERS } from "../renderers/paint/ships";
import { tierOf } from "../economy/config/tiers";
import { VoyageSimulation } from "./VoyageSimulation";

// What the voyage needs of a sound engine: one-shot cues, a loop for the engines, a score to cross into, how hard
// it plays, and holding it all still. A `SoundEngine` from audio/synth is one.
export interface SoundPort {
  play(cue: SoundCue, options?: PlayOptions): boolean;
  loop(id: "engine" | "ionEngine" | "heat" | "beam"): LoopHandle;
  music(theme: MusicThemeId | null, options?: { intensity?: number }): void;
  setMusicIntensity(intensity: number): void;
  suspend(): Promise<void>;
  resume(): Promise<void>;
}

// A buzz by its name, where the device and the reader allow one.
export type Vibrate = (name: HapticName) => void;

// What each kind of shot sounds like, ours louder than theirs.
const SHOT_CUES: Readonly<Record<string, SoundCue>> = {
  cannon: "cannon",
  laser: "laser",
  missile: "missile",
  spit: "hit",
  photoid: "railgun",
  mine: "mine",
  flak: "flak",
  backup: "backupShot",
  rail: "railgun",
  emp: "emp",
};

// How loud the others' shots and a hit landing on them are against the ship's own.
const THEIR_SHOTS = 0.35;
const OUR_HITS = 0.4;
// Music changes intensity only by more than this, so it is not told every frame.
const INTENSITY_STEP = 0.05;

// Turns a run into sound, music and a buzz: every shot, hit, kill, find and moment as a cue; the engines as a loop
// that follows the thrust; a score for wherever the ship is (our solar system, each universe's style, a boss),
// building with the fight; and short buzzes on hits, kills and finds. It holds nothing it cannot give back: the
// loop stops and the score fades when it is paused or disposed.
export class VoyageFeedback {
  private engine: LoopHandle | null = null;
  private engineId: "engine" | "ionEngine" | null = null;
  private theme: MusicThemeId | null = null;
  private intensity = 0;

  constructor(private readonly simulation: VoyageSimulation, private sound: SoundPort | null, private vibrate: Vibrate | null) {}

  public setSound(sound: SoundPort | null): void {
    if (sound !== this.sound) {
      this.silence();
      this.sound = sound;
    }
  }

  public setVibrate(vibrate: Vibrate | null): void {
    this.vibrate = vibrate;
  }

  public attach(): () => void {
    const { events } = this.simulation;
    const play = (cue: SoundCue, options?: PlayOptions) => this.sound?.play(cue, options);
    const buzz = (name: HapticName) => this.vibrate?.(name);
    const offs = [
      events.on("fired", ({ kind, team }) => {
        const cue = SHOT_CUES[kind];

        if (cue) {
          play(cue, team === "ship" ? undefined : { volume: THEIR_SHOTS });
        }
      }),
      events.on("hit", ({ toShields, amount }) => {
        play(toShields > 0 ? "shieldHit" : "hit");
        buzz(amount > 150 ? "bigHit" : "hit");
      }),
      events.on("struck", () => play("hit", { volume: OUR_HITS })),
      events.on("downed", ({ role }) => {
        play(role === "boss" ? "bigExplosion" : "explosion");
        buzz(role === "boss" ? "explosion" : "tap");
      }),
      events.on("destroyed", () => {
        play("bigExplosion");
        buzz("explosion");
      }),
      events.on("collected", ({ kind }) => {
        play(kind === "coin" ? "coin" : "pickup");
        buzz("pickup");
      }),
      events.on("boostFound", () => play("core")),
      events.on("boosted", () => play("boost")),
      events.on("opened", () => play("chest")),
      events.on("landed", () => play("landing")),
      events.on("tookOff", () => play("takeoff")),
      events.on("captured", () => play("warp")),
      events.on("wormhole", () => play("warp")),
      events.on("gate", () => play("gate")),
      events.on("blocked", () => play("blocked")),
      events.on("dry", () => play("dryFire")),
      events.on("streak", () => play("streak")),
      events.on("blast", () => play("explosion", { volume: 0.6 })),
      events.on("impactAlert", () => play("warning")),
      events.on("flare", ({ isHeading }) => {
        if (isHeading) {
          play("warning");
        }
      }),
      events.on("failing", () => play("alarm")),
      events.on("melting", () => play("alarm")),
    ];

    return () => offs.forEach((off) => off());
  }

  // The pilot's moments, which come as notices rather than events: a level, an achievement, stars, an enhancement.
  public notice(notice: VoyageNotice): void {
    const play = (cue: SoundCue) => this.sound?.play(cue);

    switch (notice.kind) {
      case "levelUp":
        play("levelUp");
        this.vibrate?.("levelUp");
        break;
      case "achievement":
        play("achievement");
        break;
      case "stars":
        play("star");
        break;
      case "loot":
        play("pickup");
        break;
      case "enhanced":
        play(notice.outcome === "success" ? "enhanceSuccess" : notice.outcome === "fell" ? "enhanceFall" : "enhanceFail");
        break;
      default:
        break;
    }
  }

  // Every frame: the engines' loop follows the thrust (an ion drive's for the great ships), and the score follows
  // where the ship is and how hard the fight is.
  public frame(): void {
    const { sound, simulation } = this;

    if (!sound) {
      return;
    }

    const { state, world } = simulation;
    const ship = world.stores.ship.get(state.ship);
    const isFlying = state.status === "flying" && state.phase !== "lost";
    const thrust = isFlying && ship ? ship.thrust : 0;
    const wanted = ION_TIERS.includes(tierOf(state.level)) ? "ionEngine" : "engine";

    if (thrust > 0.02 && this.engineId !== wanted) {
      this.engine?.stop();
      this.engine = sound.loop(wanted);
      this.engineId = wanted;
    }

    this.engine?.set({ intensity: thrust, pitch: 1 + thrust * 0.15 });

    const theme: MusicThemeId = state.status !== "flying" ? "menu" : state.boss ? "boss" : state.phase === "universe" ? state.cosmos?.style ?? "void" : "solar";

    if (theme !== this.theme) {
      this.theme = theme;
      sound.music(theme, { intensity: this.intensity });
    }

    let threats = 0;

    for (const alien of world.stores.alien.values) {
      threats += alien.threat > 0 && alien.mode === "chase" ? 1 : 0;
    }

    const intensity = state.boss ? 1 : Math.min(1, threats / 4);

    if (Math.abs(intensity - this.intensity) > INTENSITY_STEP) {
      this.intensity = intensity;
      sound.setMusicIntensity(intensity);
    }
  }

  // Held still (the game paused, the tab hidden): the engines quiet and the audio held; and back.
  public pause(): void {
    this.engine?.set({ intensity: 0 });
    void this.sound?.suspend();
  }

  public resume(): void {
    void this.sound?.resume();
  }

  public dispose(): void {
    this.silence();
  }

  private silence(): void {
    this.engine?.stop();
    this.engine = null;
    this.engineId = null;
    this.sound?.music(null);
    this.theme = null;
  }
}
