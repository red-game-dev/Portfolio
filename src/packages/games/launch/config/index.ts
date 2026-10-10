import { LaunchMilestone, LaunchSite, LaunchVehicle } from "../domain/types";

export interface LaunchConfig {
  framesPerSecond: number;
  maxStepMs: number;
  // Holding for this long fills the engines.
  chargeMs: number;
  // After a single press, the engines fill by themselves in this long.
  autoChargeMs: number;
  // Let go early and the charge drains in this long.
  drainMs: number;
  // From lift off to orbit.
  ascentMs: number;
  // The moments called out on the way up, one per zone crossed.
  markers: number;
  stars: number;
  // The self destruct: its countdown, the explosion, and the pieces it leaves.
  countdownMs: number;
  explodeMs: number;
  debris: number;
}

export type LaunchConfigOverrides = Partial<LaunchConfig>;

export const DEFAULT_LAUNCH_CONFIG: LaunchConfig = {
  framesPerSecond: 60,
  maxStepMs: 50,
  chargeMs: 900,
  autoChargeMs: 650,
  drainMs: 500,
  ascentMs: 8500,
  markers: 5,
  stars: 110,
  countdownMs: 3000,
  explodeMs: 1300,
  debris: 26,
};

export const resolveLaunchConfig = (overrides: LaunchConfigOverrides = {}): LaunchConfig => ({ ...DEFAULT_LAUNCH_CONFIG, ...overrides });

// A reading along the climb: how far through it (0 to 1) and the value there.
export type Profile = ReadonlyArray<readonly [number, number]>;

// A real ascent to low orbit, as the broadcasts show it, against how far through the climb the board is: lift off
// clears the tower in seconds, Max Q comes about a minute in at 12 km, the first stage burns out near 70 km and
// two and a half minutes, and the second stage reaches orbit at about 200 km and 27,500 km/h some nine minutes
// after lift off.
export const ALTITUDE_KM: Profile = [[0, 0], [0.06, 0.4], [0.2, 12], [0.42, 68], [0.5, 80], [0.65, 115], [0.9, 195], [1, 200]];
export const SPEED_KMH: Profile = [[0, 0], [0.06, 160], [0.2, 1600], [0.42, 7200], [0.5, 7600], [0.65, 10500], [0.9, 27000], [1, 27500]];
export const CLOCK_S: Profile = [[0, 0], [0.06, 12], [0.2, 72], [0.42, 155], [0.5, 165], [0.65, 215], [0.9, 515], [1, 540]];
// Straight up off the pad, then the gravity turn: pitched over further the higher it goes (degrees from vertical).
export const PITCH_DEG: Profile = [[0, 0], [0.07, 0], [0.2, 14], [0.42, 34], [0.65, 50], [1, 62]];

export interface VehicleSpec {
  // Its height on the pad and its tower's (m), for scale.
  heightM: number;
  towerM: number;
  // What is called out on the way up and how far through the climb each comes.
  milestones: ReadonlyArray<readonly [LaunchMilestone, number]>;
}

export const VEHICLES: Readonly<Record<LaunchVehicle, VehicleSpec>> = {
  booster: {
    heightM: 70,
    towerM: 82,
    milestones: [["maxQ", 0.2], ["meco", 0.42], ["stageSeparation", 0.46], ["fairing", 0.62], ["seco", 0.92]],
  },
  heavy: {
    heightM: 98,
    towerM: 118,
    milestones: [["maxQ", 0.2], ["boosterSeparation", 0.34], ["meco", 0.55], ["stageSeparation", 0.59], ["seco", 0.92]],
  },
  steel: {
    heightM: 121,
    towerM: 146,
    milestones: [["maxQ", 0.2], ["meco", 0.4], ["hotStaging", 0.43], ["boostback", 0.52], ["seco", 0.92]],
  },
};

// A Florida pad with the Atlantic behind it, for when the host names none.
export const DEFAULT_LAUNCH_SITE: LaunchSite = { latitude: 28.6084, longitude: -80.6043, vehicle: "booster", land: "scrub", downrange: 1, hasSea: true };

export interface LaunchTheme {
  // The self destruct's warning, and the colour the broadcast readout is written in.
  alarm: string;
  readout: string;
}

export const DEFAULT_LAUNCH_THEME: LaunchTheme = {
  alarm: "#ff4d5e",
  readout: "#e8ecf5",
};

// What the broadcast readout is labelled with.
export interface LaunchLabels {
  altitude: string;
  speed: string;
}

export const DEFAULT_LAUNCH_LABELS: LaunchLabels = { altitude: "Altitude", speed: "Speed" };
