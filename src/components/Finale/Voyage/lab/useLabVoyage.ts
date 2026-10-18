import { useMemo, useRef } from "react";

import type { useVoyage } from "@/components/Finale/Voyage/hooks/useVoyage";
import type { LabMoment } from "@/components/Finale/Voyage/lab/moments";
import {
  Armory, armoryView, Career, GEAR_BASES, Hangar, ITEMS, newProfile, Progress, progressView, rackFor, resolveVoyageConfig, SolarSystemSource, stationView, SystemService,
  VoyageSimulation,
} from "@/packages/games/voyage";
import type { RunSummary, VoyageNotice, VoyageSnapshot } from "@/packages/games/voyage";
import { createSeededRandom } from "@/packages/math/random";

// Where the voyage dialog gets everything it shows: the live game, or the lab's still life of it.
export type VoyageSource = typeof useVoyage;

export type { LabMoment };

// A run's end with every figure the card shows, gear found and badges won among them.
const LAB_SUMMARY: RunSummary = {
  seconds: 754, score: 1234567, places: 9, landings: 3, kills: 42, bestStreak: 7, coin: 1250, exp: 980, levels: 2, level: 6, universes: 2, stars: 4,
  gear: GEAR_BASES.slice(-3).map((base) => ({ base: base.id, rarity: "legendary" })),
  achievements: ["firstFlight", "firstLanding", "moonWalker", "redPlanet"],
  isDaily: false,
};

// The same end, of a daily run.
const LAB_DAILY_SUMMARY: RunSummary = { ...LAB_SUMMARY, isDaily: true };

// The station round Earth, as a port the ship is docked at, as deep as the lab's universe so every good is on sale.
const LAB_PORT = { kind: "station" as const, id: "lab-earth", anchor: "earth", faction: -1, seed: 7, depth: 6 };

// Today's sky at its fullest: a shower at its peak, two planets close together and one opposite the Sun.
const LAB_SKY = [
  { id: "shower:perseids", kind: "shower" as const, subjects: ["perseids"], isPeak: true },
  { id: "conjunction:mars:jupiter", kind: "conjunction" as const, subjects: ["mars", "jupiter"], isPeak: false },
  { id: "opposition:saturn", kind: "opposition" as const, subjects: ["saturn"], isPeak: false },
];

// Noon UTC on a fixed day, so the lab shows the same sky every time.
const EPOCH = Date.parse("2026-10-09T12:00:00Z");

// The day of a daily run's board: the lab's own, long past, so the board takes no run from it (it takes today's and
// yesterday's only) and a run sent from the lab is refused.
const LAB_DAY = "2026-10-09";

// Whether a moment is a run's end, a daily one's among them.
const isRunOver = (moment: LabMoment) => moment === "over" || moment === "daily";

// A run just begun from Earth, as the simulation itself describes it.
const startingSnapshot = (): VoyageSnapshot => {
  const config = resolveVoyageConfig({});
  const system = new SystemService(new SolarSystemSource(), config.layout).getView();
  const simulation = new VoyageSimulation(system, { config, random: createSeededRandom(7), epochMs: EPOCH });

  simulation.setView(2, 1.4);
  simulation.start();

  return simulation.snapshot;
};

// Every panel the HUD can show in flight at once, each at its longest: deep in a maze universe (the longest place there
// is), a locked target and the universe's boss with long names, a rock on its way, a call for help, a wreck being
// salvaged, a port alongside, three faults, hurt systems, a boss's attack winding up and a countdown with no fuel to
// leave.
export const worstFlight = (base: VoyageSnapshot): VoyageSnapshot => ({
  ...base,
  status: "flying",
  phase: "universe",
  universe: 7,
  universes: 7,
  universeName: "Kethrionvale",
  maze: { system: "Vash Toranis", systems: 8, explored: 3, isExit: false },
  hull: base.maxHull * 0.42,
  shields: base.maxShields * 0.3,
  fuel: base.maxFuel * 0.25,
  score: 1234567,
  modules: { ...base.modules, engines: 0.62, sensors: 0.35, radiators: 0.81 },
  target: { name: "Vanguard Interceptor of the Outer Reach", level: 27, disposition: "hostile", role: "fighter", hull: 340, maxHull: 600, shields: 80, maxShields: 200 },
  boss: { name: "The Warden of the Last Light", level: 30, disposition: "hostile", role: "boss", hull: 4200, maxHull: 9000, shields: 900, maxShields: 2000 },
  incoming: { target: "earth", diameterKm: 12.4, seconds: 48, hp: 300, maxHp: 900, isOnCourse: true },
  faults: [{ id: 1, kind: "misfire" }, { id: 2, kind: "fuelLeak" }, { id: 3, kind: "breach" }],
  salvage: { kind: "starship", progress: 0.4, origin: null },
  dockable: { kind: "station", anchor: "earth", anchorName: null, faction: null },
  distress: { seconds: 40, progress: 0.3, isNear: true },
  bossMove: "nova",
  stranded: { secondsLeft: 25, isRescue: true },
});

// Coming down on Mars under its parachute, the world's card and the telemetry both wanting the corners.
export const worstDescent = (base: VoyageSnapshot): VoyageSnapshot => ({
  ...base,
  status: "flying",
  landedOn: "mars",
  surface: { body: "mars", pad: null, name: null, isHome: false, latitude: -4.5, longitude: 137.4, hours: 14.2, biome: "desert" },
  descent: {
    method: "chuteAndBurn", phase: "main", altitude: 8400, speed: 120, fall: 95, load: 2.1, heating: 0.2, throttle: 0, canFly: true, isPilot: false,
    isUnderFire: false, reserve: 1, safeSpeed: 6, pace: 40,
  },
  people: { name: "Ochre Assembly", disposition: "territorial" },
});


const noop = () => undefined;

// The voyage as a still life, for the HUD lab: a new pilot's hangar, career, armoury and progress (as a first visit has
// them) and a snapshot holding every panel at once, with nothing running and nothing kept. Shaped as the live hook is,
// so the dialog draws it unchanged. The line it says is a chapter of the story told (the one given, its decoded line the
// longest), the largest thing the line's place shows and the one that stays longest, said once.
export const labVoyage = (moment: LabMoment, chapter: string): VoyageSource => function useLabVoyage(): ReturnType<VoyageSource> {
  const stickRef = useRef<HTMLDivElement>(null);
  const notices = useMemo<VoyageNotice[]>(() => [
    { kind: "storyChapter", chapter },
    ...(moment === "daily" ? [{ kind: "daily" as const, day: LAB_DAY, score: LAB_SUMMARY.score, isBest: true }] : []),
  ], []);
  const views = useMemo(() => {
    const profile = newProfile();
    const armory = new Armory(profile.armory);
    const progress = new Progress(profile.progress);
    const hangar = new Hangar(profile, { weapons: armory.port() });
    const career = new Career(profile.career);
    const base = startingSnapshot();
    const flying = moment === "descent" ? worstDescent(base) : worstFlight(base);
    const snapshot: VoyageSnapshot = {
      ...flying,
      ...(moment === "ready" ? { status: "ready" } : {}),
      ...(isRunOver(moment) ? { status: "over" } : {}),
      ...(moment === "perk" ? { perkOffer: ["hotBarrels", "heavyRounds", "thickPlating"], perks: ["hotBarrels", "thickPlating"] } : {}),
      ...(moment === "station" ? { docked: { kind: "station", anchor: "earth", anchorName: null, faction: null } } : {}),
    };
    const status = { isFlying: true, faults: snapshot.faults, hull: 0.42, fuel: 0.25, shields: 0.3, heat: 0.4 };
    const station = moment === "station"
      ? stationView(LAB_PORT, {
        cargo: hangar.view().cargo,
        coin: hangar.purse.RED,
        ammo: armory.stock,
        rack: (type) => rackFor(type, 0),
        missing: { repair: 0.58, refuel: 0.75, recharge: 0.7 },
      }, ITEMS)
      : null;

    return {
      snapshot,
      station,
      economy: hangar.view(status),
      career: career.view(),
      gear: armoryView(armory, hangar, progress),
      progress: progressView(progress),
    };
  }, []);

  return {
    ...views,
    zoomStep: noop,
    look: noop,
    setCovered: noop,
    transfer: { link: async () => null, file: async () => null, read: async () => null, adopt: noop },
    landing: { time: "compressed", control: "auto" },
    summary: moment === "daily" ? LAB_DAILY_SUMMARY : moment === "over" ? LAB_SUMMARY : null,
    isManual: false,
    stickRef,
    drawShip: noop,
    guideSpawn: noop,
    notices,
    takeNotices: noop,
    isPhoto: moment === "photo",
    togglePhoto: noop,
    savePhoto: noop,
    isHangarOpen: moment === "hangar",
    setHangar: noop,
    act: () => false,
    follow: () => false,
    castOff: noop,
    choosePerk: noop,
    composePhoto: () => null,
    skyToday: LAB_SKY,
    isReady: true,
    isPaused: moment === "paused",
    isMapOpen: moment === "map",
    play: noop,
    pause: () => false,
    resume: noop,
    toggleMap: () => false,
    toggleGuns: noop,
    onKeyDown: () => false,
    onKeyUp: noop,
    onPointerDown: noop,
    onPointerMove: noop,
    onPointerEnd: noop,
  };
};
