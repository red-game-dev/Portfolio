import { RandomSource } from "@/packages/math/random";

import { LiveTableConfig } from "../config";
import {
  LiveTableEvent,
  LiveTableOpponent,
  LiveTablePhase,
  LiveTablePlayResult,
  LiveTableScene,
  LiveTableSnapshot,
  LiveTableThrow
} from "../domain/types";

export interface LiveTableSimulationDependencies {
  config: LiveTableConfig;
  random: RandomSource;
}

// Bets are only taken while they are open: "place your bets" and "final bets".
const OPEN_PHASES: LiveTablePhase[] = ["place", "final"];

// The rules of the table, with no drawing and no clock of its own: time only moves through step(), and
// randomness only comes from the injected source, so a round replays exactly in tests.
export class LiveTableSimulation {
  private readonly config: LiveTableConfig;
  private readonly random: RandomSource;
  private readonly deck: string[];
  private now = 0;
  private phaseIndex = 0;
  private phaseElapsed = 0;
  private round = 1;
  private hand: string[];
  private played: string[] = [];
  private opponents: LiveTableOpponent[];
  private throws: LiveTableThrow[] = [];
  private nextThrowId = 1;

  constructor(cards: string[], { config, random }: LiveTableSimulationDependencies) {
    this.config = config;
    this.random = random;
    this.deck = [...cards];
    this.hand = [...cards];
    this.opponents = this.freshOpponents();
  }

  public get phase(): LiveTablePhase {
    return this.config.phases[this.phaseIndex].phase;
  }

  public get isOpen(): boolean {
    return OPEN_PHASES.includes(this.phase);
  }

  public get snapshot(): LiveTableSnapshot {
    return {
      phase: this.phase,
      round: this.round,
      hand: [...this.hand],
      played: [...this.played],
      opponents: this.opponents.map((opponent) => ({ ...opponent })),
      canPlay: this.isOpen && this.hand.length > 0,
    };
  }

  public get scene(): LiveTableScene {
    return {
      now: this.now,
      phase: this.phase,
      phaseProgress: Math.min(1, this.phaseElapsed / this.config.phases[this.phaseIndex].ms),
      opponents: this.opponents,
      throws: this.throws,
      playedCount: this.played.length,
    };
  }

  public step(deltaMs: number): LiveTableEvent[] {
    const events: LiveTableEvent[] = [];

    this.now += deltaMs;
    this.phaseElapsed += deltaMs;

    if (this.isOpen) {
      this.opponentsPlay(deltaMs, events);
    }

    while (this.phaseElapsed >= this.config.phases[this.phaseIndex].ms) {
      this.phaseElapsed -= this.config.phases[this.phaseIndex].ms;
      this.phaseIndex = (this.phaseIndex + 1) % this.config.phases.length;

      if (this.phaseIndex === 0) {
        this.round += 1;
        this.throws = [];
        this.opponents = this.freshOpponents();
        events.push({ type: "sweep" });
      }

      events.push({ type: "phase", phase: this.phase, round: this.round });
    }

    return events;
  }

  public play(card: string): LiveTablePlayResult {
    if (!this.isOpen) {
      return { accepted: false, reason: "closed" };
    }

    if (!this.hand.includes(card)) {
      return { accepted: false, reason: "not-in-hand" };
    }

    this.hand = this.hand.filter((held) => held !== card);
    this.played = [...this.played, card];

    return { accepted: true };
  }

  // Picks every card back up, in the order it was dealt.
  public redeal(): void {
    this.hand = [...this.deck];
    this.played = [];
  }

  private opponentsPlay(deltaMs: number, events: LiveTableEvent[]): void {
    const chance = this.config.opponentThrowsPerSecond * (deltaMs / 1000);

    this.opponents = this.opponents.map((opponent) => {
      if (opponent.cardsLeft === 0 || this.random() >= chance) {
        return opponent;
      }

      this.throws = [...this.throws, { id: this.nextThrowId, seat: opponent.seat, thrownAt: this.now }];
      this.nextThrowId += 1;
      events.push({ type: "throw", seat: opponent.seat });

      return { ...opponent, cardsLeft: opponent.cardsLeft - 1 };
    });
  }

  private freshOpponents(): LiveTableOpponent[] {
    return Array.from({ length: this.config.opponents }, (_, seat) => ({ seat, cardsLeft: this.config.opponentHand }));
  }
}
