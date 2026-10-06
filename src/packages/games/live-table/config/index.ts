import { LiveTablePhaseTiming } from "../domain/types";

export interface LiveTableConfig {
  framesPerSecond: number;
  maxStepMs: number;
  maxPixelRatio: number;
  // A round: bets open, final bets, no more bets, then the result and a new round.
  phases: LiveTablePhaseTiming[];
  opponents: number;
  // Cards each other player holds at the start of a round.
  opponentHand: number;
  // How often another player throws while bets are open, per second.
  opponentThrowsPerSecond: number;
  // How long a thrown card takes to land.
  throwMs: number;
}

export interface LiveTableTheme {
  felt: string;
  feltEdge: string;
  rim: string;
  spot: string;
  cardBack: string;
  cardBackPattern: string;
  cardEdge: string;
  chips: string[];
}

export type LiveTableConfigOverrides = Partial<LiveTableConfig>;

export const DEFAULT_LIVE_TABLE_CONFIG: LiveTableConfig = {
  // The felt moves slowly; half the display rate is plenty and halves the work.
  framesPerSecond: 30,
  maxStepMs: 100,
  maxPixelRatio: 2,
  phases: [
    { phase: "place", ms: 9000 },
    { phase: "final", ms: 3500 },
    { phase: "closed", ms: 3000 },
    { phase: "reveal", ms: 2500 },
  ],
  opponents: 4,
  opponentHand: 5,
  opponentThrowsPerSecond: 0.18,
  throwMs: 450,
};

export const DEFAULT_LIVE_TABLE_THEME: LiveTableTheme = {
  felt: "#0f5a3a",
  feltEdge: "#062417",
  rim: "#c9a227",
  spot: "rgba(255, 255, 255, 0.22)",
  cardBack: "#7a1022",
  cardBackPattern: "rgba(255, 255, 255, 0.18)",
  cardEdge: "#f4efe6",
  chips: ["#d6264f", "#2b6cd6", "#f4efe6", "#1f9d55", "#111111"],
};

export const resolveLiveTableConfig = (overrides: LiveTableConfigOverrides = {}): LiveTableConfig => ({ ...DEFAULT_LIVE_TABLE_CONFIG, ...overrides });
