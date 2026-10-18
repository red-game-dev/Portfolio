import { dailyNote, dailyResult, questCard } from "@/components/Finale/Voyage/career";
import { descentHint, descentMethod, descentRows } from "@/components/Finale/Voyage/descent";
import { ledgerMemo } from "@/components/Finale/Voyage/economy";
import {
  CARD_MS, isKeptNotice, isQuestNotice, isUrgentNotice, lineMs, MESSAGE_MS, messageMs, QueuedLine, queueLine, replyLine, strandedLine, voyageMessage,
  voyageNotice, voyagePlace,
} from "@/components/Finale/Voyage/messages";
import { surfaceHeading, surfaceHint, surfaceLines } from "@/components/Finale/Voyage/surface";
import { formatClock, formatDistance, telemetryRows } from "@/components/Finale/Voyage/telemetry";
import { portfolioData } from "@/data/resume";
import {
  DescentView, GALAXY_KINDS, MODULE_IDS, SOLAR_SYSTEM, STAR_CLASSES, STORY, SurfaceInfo, VoyageSnapshot, WORLD_CLASS_IDS,
} from "@/packages/games/voyage";

const { voyage } = portfolioData.finale;
const universes = ["The Matrix", "AI", "Chain", "Casino", "Game world"];
const at = (snapshot: Partial<VoyageSnapshot> = {}, au = 1): VoyageSnapshot => ({
  status: "flying",
  phase: "solar",
  universe: -1,
  universes: 0,
  universeName: null,
  cosmos: null,
  hull: 1000,
  maxHull: 1000,
  shields: 400,
  maxShields: 400,
  fuel: 100,
  maxFuel: 100,
  score: 0,
  passing: null,
  landedOn: null,
  surface: null,
  descent: null,
  homecoming: null,
  stranded: null,
  boosts: { active: [], cooldowns: {}, blocks: 0 },
  weapons: { ammo: { rounds: 300, missiles: 0, mines: 0, slugs: 0, cells: 0, shells: 0 }, ready: {}, shots: {}, streak: 0 },
  people: null,
  maze: null,
  modules: { hull: 1, engines: 1, shields: 1, sensors: 1, fuel: 1, radiators: 1 },
  waypoint: null,
  target: null,
  boss: null,
  autoFire: true,
  incoming: null,
  level: 0,
  faults: [],
  salvage: null,
  perks: [],
  perkOffer: null,
  dockable: null,
  docked: null,
  distress: null,
  bossMove: null,
  telemetry: {
    gravity: 0.12,
    dominant: null,
    altitudeKm: null,
    speedKmS: 17.3,
    au,
    toHoleAu: null,
    pressureBar: null,
    hullTemperatureC: 20,
    outsideC: 5,
    sunlight: 1361,
    radiation: 65,
    timeDilation: 1,
    missionTime: Date.parse("2026-10-09T12:00:00Z"),
    medium: "open",
    tides: 0,
  },
  ...snapshot,
});

describe("the voyage's messages", () => {
  test("every body, belt and place the compass can point to has a name, and so does every system", () => {
    const ids = [SOLAR_SYSTEM.star.id, ...SOLAR_SYSTEM.bodies.map((body) => body.id), ...SOLAR_SYSTEM.belts.map((belt) => belt.id), "edge", "singularity", "hole"];

    expect(ids.filter((id) => !voyage.stops[id])).toEqual([]);
    expect(MODULE_IDS.filter((id) => !voyage.systems.names[id])).toEqual([]);
  });

  test("each stop is said once as it comes up, and nothing is said while nothing changes", () => {
    const moon = at({ passing: "moon" });

    expect(voyageMessage(voyage, moon, at(), universes)).toBe("Passing the Moon");
    expect(voyageMessage(voyage, moon, moon, universes)).toBeNull();
    expect(voyageMessage(voyage, at({ passing: "jupiter" }, 5), moon, universes)).toBe("Passing Jupiter");
  });

  test("the black hole, being lost in it, and where the ship comes out", () => {
    const pluto = at({ passing: "pluto" }, 39.5);
    const singularity = at({ phase: "singularity", passing: "pluto" });
    const lost = at({ phase: "lost", passing: "pluto" });

    expect(voyageMessage(voyage, singularity, pluto, universes)).toBe(voyage.singularity);
    expect(voyageMessage(voyage, lost, singularity, universes)).toBe(voyage.lost);
    const arrival = at({ phase: "universe", universe: 0, universes: 1, cosmos: { galaxy: "barred", star: "redSupergiant", companions: ["blue"] } });

    expect(voyageMessage(voyage, arrival, lost, universes))
      .toBe("You wake up in The Matrix, in a barred spiral galaxy, round a red supergiant and a blue star");
    expect(voyageMessage(voyage, at({ phase: "universe", universe: 3, universes: 2 }), at({ phase: "lost", universe: 0, universes: 1 }), universes))
      .toBe("Thrown into Casino, in a spiral galaxy, round no star at all");
  });

  test("landings, lift offs, emergency burns and the moment a black hole takes the ship are said with the body's name", () => {
    expect(voyageNotice(voyage, { kind: "landed", body: "mars", speed: null })).toBe("Landed on Mars");
    expect(voyageNotice(voyage, { kind: "landed", body: "mars", speed: 0.78 })).toBe("Landed on Mars at 0.8 m/s");
    expect(voyageNotice(voyage, { kind: "descent", body: "mars", phase: "supersonic" })).toBe("Supersonic parachute open");
    expect(voyageNotice(voyage, { kind: "descent", body: "mars", phase: "down" })).toBeNull();
    expect(voyageNotice(voyage, { kind: "hardLanding", body: "moon", speed: 9.42, safe: 3 }))
      .toBe("Down on the Moon at 9.4 m/s, more than the 3 m/s it can take: the legs gave way");
    expect(voyageNotice(voyage, { kind: "emergency", body: "jupiter" })).toContain("Jupiter");
    expect(voyageNotice(voyage, { kind: "captured", isSingularity: true })).toBe(voyage.captured);
    expect(voyageNotice(voyage, { kind: "destroyed" })).toBeNull();
  });

  test("stranded with no fuel: a rescue coming home, or the run's end out in the universes, then rescued days later", () => {
    expect(voyageNotice(voyage, { kind: "stranded", body: "venus", seconds: 15, isRescue: true, isOver: false }))
      .toBe("No fuel to lift off Venus: a rescue is on its way");
    expect(voyageNotice(voyage, { kind: "stranded", body: null, seconds: 15, isRescue: false, isOver: false }))
      .toBe("Adrift with no fuel: load a fuel cell within 15 s, or the run ends here");
    expect(voyageNotice(voyage, { kind: "stranded", body: null, seconds: 0, isRescue: false, isOver: true }))
      .toBe("Stranded with no fuel, and nobody comes this far out");
    expect(voyageNotice(voyage, { kind: "rescued", from: "venus", days: 146 })).toBe("Rescued from Venus: 146 days later, a new rocket stands on the pad");
    expect(strandedLine(voyage, at({ stranded: { secondsLeft: 9, isRescue: true } }))).toBe("No fuel to lift off: rescue in 9 s");
    expect(strandedLine(voyage, at())).toBeNull();
  });

  test("flares, storms, failing systems, a hull heating in a star's light and a melting hull are said as they happen", () => {
    expect(voyageNotice(voyage, { kind: "flare", flareClass: "X", isHeading: true })).toContain("class X");
    expect(voyageNotice(voyage, { kind: "flare", flareClass: "C", isHeading: false })).toBe("Solar flare, class C");
    expect(voyageNotice(voyage, { kind: "storm", isTurned: false })).toBe(voyage.storm);
    expect(voyageNotice(voyage, { kind: "storm", isTurned: true })).toBe(voyage.stormTurned);
    expect(voyageNotice(voyage, { kind: "failing", module: "sensors", isGone: false })).toBe("Sensors failing");
    expect(voyageNotice(voyage, { kind: "failing", module: "engines", isGone: true })).toBe("Engines lost");
    expect(voyageNotice(voyage, { kind: "melting", temperatureC: 641.4 })).toContain("641");
    expect(voyageNotice(voyage, { kind: "heating", temperatureC: 65.4, star: "sun" }))
      .toBe("The hull is heating up, 65 \u00b0C this close to the Sun. Burn away before the fuel boils and the sensors fail.");
    expect(voyageNotice(voyage, { kind: "heating", temperatureC: 70, star: "Veldara" })).toContain("close to Veldara.");
    expect(isUrgentNotice({ kind: "heating", temperatureC: 70, star: "sun" })).toBe(true);
  });

  test("rocks headed for worlds, what they do, the boss and the strange things are said as they happen", () => {
    expect(voyageNotice(voyage, { kind: "impactAlert", target: "mars", diameterKm: 3.24, seconds: 21.6 }))
      .toBe("Impact alert: a 3.2 km rock will hit Mars in 22 seconds");
    expect(voyageNotice(voyage, { kind: "impact", target: "moon", outcome: "crater", craterKm: 48.3 })).toBe("the Moon was hit: a crater 48 km across");
    expect(voyageNotice(voyage, { kind: "impact", target: "Veldara II", outcome: "shattered", craterKm: 0 })).toContain("Veldara II is gone");
    expect(voyageNotice(voyage, { kind: "deflected", target: "earth" })).toBe("Pushed off course: it will miss Earth");
    expect(voyageNotice(voyage, { kind: "boss", name: "Thalix Swarm", isFallen: true })).toBe("Thalix Swarm's leader falls");
    expect(voyageNotice(voyage, { kind: "supernova", seconds: 14.6, isBlown: false })).toContain("15 seconds");
    expect(voyageNotice(voyage, { kind: "burst", seconds: 0, isFired: true })).toBe(voyage.burst);
    expect(voyageNotice(voyage, { kind: "heard" })).toBe(voyage.heard);
  });

  test("a universe past the zones is called by its own name", () => {
    expect(voyagePlace(voyage, at({ phase: "universe", universe: 7, universes: 8, universeName: "Veldara Reach" }), universes)).toBe("Universe 8: Veldara Reach");
  });

  test("the top of the screen gives the distance on the way out, then the universe and how many so far", () => {
    expect(voyagePlace(voyage, at({}, 5.2), universes)).toBe("5.2 AU from the Sun");
    expect(voyagePlace(voyage, at({ phase: "universe", universe: 1, universes: 3 }), universes)).toBe("Universe 3: AI");
    expect(voyagePlace(voyage, at({ phase: "lost" }), universes)).toBe(voyage.lost);
  });
});

describe("the voyage's telemetry", () => {
  test("shows only what is worth reading now, in real units", () => {
    const deepSpace = telemetryRows(voyage, at()).map((row) => row.label);
    const nearJupiter = telemetryRows(voyage, at({
      telemetry: { ...at().telemetry, gravity: 24.79, dominant: "jupiter", altitudeKm: 3200, speedKmS: 21, au: 5.2, pressureBar: 0.4, hullTemperatureC: 640 },
      waypoint: { id: "saturn", name: null, distanceKm: 652000000 },
    }));

    expect(deepSpace).not.toContain(voyage.telemetry.altitude);
    expect(deepSpace).not.toContain(voyage.telemetry.dilation);
    expect(nearJupiter.find((row) => row.label === voyage.telemetry.gravity)?.value).toBe("24.79 m/s², Jupiter");
    expect(nearJupiter.find((row) => row.label === voyage.telemetry.altitude)?.value).toBe("3,200 km");
    expect(nearJupiter.find((row) => row.label === voyage.telemetry.next)?.value).toBe("Saturn, 652.0 million km");
  });

  test("clocks slowing by a black hole show as a factor", () => {
    const rows = telemetryRows(voyage, at({ telemetry: { ...at().telemetry, timeDilation: 2.4 } }));

    expect(rows.find((row) => row.label === voyage.telemetry.dilation)?.value).toBe("×2.40");
  });

  test("with the sensors gone, what they measure reads no signal; the clock and the hull's temperature still read", () => {
    const rows = telemetryRows(voyage, at({ modules: { ...at().modules, sensors: 0.1 } }));

    expect(rows.find((row) => row.label === voyage.telemetry.gravity)?.value).toBe(voyage.telemetry.noSignal);
    expect(rows.find((row) => row.label === voyage.telemetry.temperature)?.value).toBe("20 °C");
    expect(rows.find((row) => row.label === voyage.telemetry.clock)?.value).toBe("9 Oct 2026, 12:00 UTC");
  });

  test("the mission clock reads as a date and time in UTC", () => {
    expect(formatClock(voyage, Date.parse("2026-12-24T23:05:00Z"))).toBe("24 Dec 2026, 23:05 UTC");
  });

  test("distances read in millions of km once they are that far", () => {
    expect(formatDistance(voyage, 1500000)).toBe("1.5 million km");
    expect(formatDistance(voyage, 42000)).toBe("42,000 km");
  });
});

describe("the voyage's words for what the universes hold", () => {
  test("every kind of galaxy, star and world has a name, a note and a phrase", () => {
    const career = voyage.career;

    GALAXY_KINDS.forEach((kind) => {
      expect(career.galaxies[kind]?.name).toBeTruthy();
      expect(voyage.galaxyPhrases[kind]).toBeTruthy();
    });
    Object.keys(STAR_CLASSES).forEach((kind) => {
      expect(career.stars[kind]?.note).toBeTruthy();
      expect(voyage.starPhrases[kind]).toBeTruthy();
    });
    WORLD_CLASS_IDS.forEach((kind) => expect(career.kinds[kind]?.note).toBeTruthy());
  });
});

describe("the voyage's cards", () => {
  const DESCENT: DescentView = {
    method: "powered", phase: "powered", altitude: 12400, speed: 1180, fall: 22, load: 0.3, heating: 0, throttle: 0.8, canFly: true, isPilot: false, isUnderFire: false,
    reserve: 90, safeSpeed: 3, pace: 47,
  };
  const HOME: SurfaceInfo = { body: "earth", pad: null, name: null, isHome: true, latitude: 27.1, longitude: -72.4, hours: 9.5, biome: "ocean" };

  test("the way down reads its height, speeds, load and pace, and what the pilot can do", () => {
    const text = (rows: Array<{ text: string }>) => rows.map((row) => row.text);

    expect(text(descentRows(voyage, DESCENT))).toEqual(["Altitude 12 km", "Speed 1,180 m/s", "Falling 22 m/s", "Load 0.3 g", "Playing 47 times faster than life"]);
    expect(text(descentRows(voyage, { ...DESCENT, altitude: 140, speed: 4.6, fall: 4.6, load: 0, pace: 1 })))
      .toEqual(["Altitude 140 m", "Speed 4.6 m/s", "Falling 4.6 m/s", "In real time"]);
    // A compact HUD keeps how high and how fast falling, what a pilot landing by hand reads.
    expect(text(descentRows(voyage, DESCENT).filter((row) => row.isSlim))).toEqual(["Altitude 12 km", "Falling 22 m/s"]);
    expect(descentHint(voyage, DESCENT, false)).toEqual(["Flown by the guidance"]);
    expect(descentHint(voyage, { ...DESCENT, isUnderFire: true }, true)).toEqual(["Under fire from the ground: hold Up or W, or press and hold, to abort the landing"]);
    // With the pilot's hand on the burn, the burn lands the ship, so the card says how to land rather than how to abort.
    expect(descentHint(voyage, { ...DESCENT, isUnderFire: true, isPilot: true, reserve: 41 }, true)[0]).toMatch(/^Hold Up or W/);
    expect(descentHint(voyage, DESCENT, true)).toEqual(["You take the burn at the low gate, 150 m up"]);
    expect(descentHint(voyage, { ...DESCENT, method: "probe", canFly: false }, true)).toEqual(["Nothing to fly by hand here: it comes down by itself"]);
    expect(descentHint(voyage, { ...DESCENT, isPilot: true, reserve: 41 }, true)).toEqual([
      "Hold Up or W, or press and hold, to burn. Touch down under 3 m/s.",
      "Burn left: 41 s",
    ]);
    expect(descentMethod(voyage, { ...DESCENT, method: "parachutes" }, true)).toBe(voyage.descent.home);
    expect(descentMethod(voyage, { ...DESCENT, method: "probe" }, false)).toBe("Parachutes all the way down, as Huygens fell to Titan");
  });

  test("home, the card says the crew is being picked up, then names the pad days later with the new rocket ready", () => {
    const recovery = at({ surface: HOME, homecoming: { stage: "recovery", days: 3, isSea: true } });
    const pad = at({
      surface: { ...HOME, pad: "Starbase, Texas", latitude: 25.99, longitude: -97.15, biome: "desert" },
      homecoming: { stage: "pad", days: 3, isSea: true },
    });

    expect(surfaceHeading(voyage, recovery)).toBe("On Earth");
    expect(surfaceLines(voyage, recovery, "Starbase, Texas")).toContain("The recovery ship is alongside, lifting the capsule aboard");
    expect(surfaceHint(voyage, recovery, "Starbase, Texas")).toBe("A new rocket is being readied at Starbase, Texas");
    expect(surfaceHeading(voyage, pad)).toBe("At Starbase, Texas");
    expect(surfaceLines(voyage, pad, "Starbase, Texas")).toEqual(expect.arrayContaining(["3 days later", "A new rocket stands fuelled and ready."]));
    expect(surfaceHint(voyage, pad, "Starbase, Texas")).toBe("Burn to launch it");
    expect(voyageNotice(voyage, { kind: "recovered", body: "earth", days: 3 })).toBe("3 days later, a new rocket stands on the pad");
  });

  test("down among a people, the card names them and how they meet the ship, and the notices say it", () => {
    const welcomed = at({ surface: { ...HOME, body: "u6-2", isHome: false, biome: "grassland" }, people: { name: "Kesh Concord", disposition: "neutral" } });
    const fired = at({ surface: { ...HOME, body: "u6-2", isHome: false, biome: "grassland" }, people: { name: "Kesh Concord", disposition: "hostile" } });

    expect(surfaceLines(voyage, welcomed, null)).toEqual(expect.arrayContaining(["Home of the Kesh Concord", voyage.surface.welcome]));
    expect(surfaceLines(voyage, fired, null)).toContain(voyage.surface.hostile);
    expect(voyageNotice(voyage, { kind: "hosted", body: "Veldara c", faction: "Kesh Concord" }))
      .toBe("The Kesh Concord of Veldara c welcome you: they mend your ship and give you a gift");
    expect(voyageNotice(voyage, { kind: "groundFire", body: "Veldara c", faction: "Kesh Concord" })).toBe("The Kesh Concord of Veldara c open fire from the ground");
  });

  test("elsewhere the card names the world, its ground, the spot and the local time", () => {
    const moon = at({ surface: { ...HOME, body: "moon", isHome: false, biome: "regolith" } });

    expect(surfaceHeading(voyage, moon)).toBe("On the Moon");
    expect(surfaceLines(voyage, moon, null)[0]).toBe("Cratered regolith");
    expect(surfaceHint(voyage, moon, null)).toBe("Burn to lift off");
  });

  test("the story names every chapter and step, says each step paid, each chapter's line and how the next opens", () => {
    const copy = voyage.career.story;

    STORY.forEach((chapter) => {
      expect(copy.chapters[chapter.id]?.title).toBeTruthy();
      expect(copy.chapters[chapter.id]?.intro).toBeTruthy();
      expect(copy.chapters[chapter.id]?.line).toBeTruthy();
      chapter.steps.forEach((step) => expect(copy.steps[step.id]).toBeTruthy());
    });
    expect(Object.keys(copy.chapters).sort()).toEqual(STORY.map(({ id }) => id).sort());
    expect(Object.keys(copy.steps).sort()).toEqual(STORY.flatMap(({ steps }) => steps.map(({ id }) => id)).sort());

    expect(voyageNotice(voyage, { kind: "storyStep", step: "launchMoon", xp: 80, coin: 50 })).toBe("Story: Land on the Moon. +80 XP, +50 Red Coin");
    expect(voyageNotice(voyage, { kind: "storyChapter", chapter: "matrix" })).toBe(`The Matrix complete. The signal decodes: ${copy.chapters.matrix.line}`);
    expect(voyageNotice(voyage, { kind: "storyOpened", chapter: "ai" })).toBe(`AI: ${copy.chapters.ai.intro}`);
    expect(voyageNotice(voyage, { kind: "storyOpened", chapter: null })).toBe(copy.told);
    expect(ledgerMemo(voyage, "story:chainBounty")).toBe("Story: Bring down 5 hostiles");
  });

  test("a line stays long enough to read, kept lines are never crowded out, and a danger is said at once", () => {
    expect(messageMs("Landed")).toBe(MESSAGE_MS.least);
    expect(messageMs("x".repeat(100))).toBe(6000);
    expect(messageMs("x".repeat(400))).toBe(MESSAGE_MS.most);

    const line = (id: number, isKept = false, isUrgent = false): QueuedLine => ({ id, text: String(id), isKept, isUrgent });
    const ids = (lines: QueuedLine[]) => lines.map(({ id }) => id);
    const kept = [line(1), line(2, true), line(3, true), line(4, true)];

    // The line on screen stays; the oldest that may go makes room.
    expect(ids(queueLine([line(1), line(2, true), line(3), line(4, true)], line(5), 4))).toEqual([1, 2, 4, 5]);
    // With only kept lines waiting, a plain line is the one left out, and another kept line waits past the limit.
    expect(ids(queueLine(kept, line(5), 4))).toEqual([1, 2, 3, 4]);
    expect(ids(queueLine(kept, line(5, true), 4))).toEqual([1, 2, 3, 4, 5]);
    // A danger cuts in at once: a plain line it cuts short is gone, a kept one is said again after it.
    expect(ids(queueLine([line(1), line(2)], line(9, true, true), 4))).toEqual([9, 2]);
    expect(ids(queueLine([line(1, true), line(2)], line(9, true, true), 4))).toEqual([9, 1, 2]);
    expect(ids(queueLine([], line(9, true, true), 4))).toEqual([9]);
    // The answer to a press takes the place of a plain line, but waits a kept one out.
    expect(ids(replyLine([line(1), line(2)], line(7)))).toEqual([7, 2]);
    expect(ids(replyLine([line(1, true), line(2)], line(7)))).toEqual([7, 1, 2]);

    expect(isKeptNotice({ kind: "storyChapter", chapter: "ai" })).toBe(true);
    expect(isKeptNotice({ kind: "discovered", entry: "worlds:mars" })).toBe(false);
    expect(isUrgentNotice({ kind: "impactAlert", target: "Earth", diameterKm: 2, seconds: 30 })).toBe(true);
    expect(isKeptNotice({ kind: "captured", isSingularity: true })).toBe(true);
    expect(isUrgentNotice({ kind: "storyOpened", chapter: "ai" })).toBe(false);
    expect(isQuestNotice({ kind: "missionDone", mission: "landMoon", xp: 60, coin: 40 })).toBe(true);
    expect(isQuestNotice({ kind: "storyStep", step: "launchMoon", xp: 80, coin: 50 })).toBe(true);
    expect(isQuestNotice({ kind: "discovered", entry: "worlds:mars" })).toBe(false);
  });

  test("a quest done shows a card: its kind, its name, what it paid, and for a chapter the line it decoded to", () => {
    const words = voyage.hangar.quests.card;

    expect(questCard(voyage, { kind: "missionDone", mission: "landMoon", xp: 60, coin: 40 }))
      .toEqual({ title: words.mission, name: voyage.career.missions.landMoon, xp: 60, coin: 40, line: null });
    expect(questCard(voyage, { kind: "storyStep", step: "launchMoon", xp: 80, coin: 50 }))
      .toEqual({ title: words.step, name: voyage.career.story.steps.launchMoon, xp: 80, coin: 50, line: null });
    expect(questCard(voyage, { kind: "storyChapter", chapter: "matrix" }))
      .toEqual({ title: words.chapter, name: voyage.career.story.chapters.matrix.title, xp: 0, coin: 0, line: voyage.career.story.chapters.matrix.line });
    expect(questCard(voyage, { kind: "storyOpened", chapter: "ai" })).toBeNull();

    // A mission's card is kept: the answer to a press waits it out rather than replacing it.
    const card = questCard(voyage, { kind: "missionDone", mission: "landMoon", xp: 60, coin: 40 });
    const missionCard = { id: 1, text: "Mission complete", isKept: true, isUrgent: false, card };

    expect(replyLine([missionCard], { id: 2, text: "Slot 3 is empty", isKept: false, isUrgent: false }).map(({ id }) => id)).toEqual([2, 1]);

    // A card stays long enough for what it paid to be seen, even when its words are short.
    expect(lineMs({ text: "Mission complete", card: null })).toBe(MESSAGE_MS.least);
    expect(lineMs({ text: "Mission complete", card: { title: "", name: "", xp: 1, coin: 1, line: null } })).toBe(CARD_MS);
  });
});

describe("the daily voyage's words", () => {
  test("write the day's scores grouped, as the card writes the run's own", () => {
    expect(dailyResult(voyage, 1234567)).toBe("Daily voyage: 1,234,567");
    expect(dailyNote(voyage, 1234567)).toBe(`${voyage.career.daily.note} Today's best: 1,234,567`);
    expect(dailyNote(voyage, 0)).toBe(voyage.career.daily.note);
  });
});
