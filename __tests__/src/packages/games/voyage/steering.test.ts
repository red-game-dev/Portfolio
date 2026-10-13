import {
  DEFAULT_VOYAGE_CONFIG, DEFAULT_VOYAGE_THEME, Hangar, newProfile, VoyageGame, VoyageInput, VoyageRenderer, VoyageSimulation,
} from "@/packages/games/voyage";

import { createFlying, EPOCH } from "./fixtures/simulation";

// A renderer that draws nothing, with the radar where a test puts it.
const quietRenderer = (radarAt: (x: number, y: number) => boolean = () => false): VoyageRenderer => new Proxy({}, {
  get: (_, key) => (key === "surface" ? null : key === "radarAt" ? radarAt : () => () => undefined),
}) as unknown as VoyageRenderer;

const hostFor = (simulation: VoyageSimulation, renderer = quietRenderer()) => {
  const scheduler = { request: () => 0, cancel: () => undefined };
  const game = new VoyageGame(simulation, renderer, null, null, DEFAULT_VOYAGE_THEME, { hangar: new Hangar(newProfile()), scheduler });

  game.resize({ width: 800, height: 600 });

  return game;
};

// What the game would fly with this step.
const inputOf = (game: VoyageGame): VoyageInput => (game as unknown as { input(): VoyageInput }).input();

const shipOf = (simulation: VoyageSimulation) => {
  const body = simulation.world.stores.body.get(simulation.state.ship);

  if (!body) {
    throw new Error("the ship is gone");
  }

  return body;
};

const moonAngle = (simulation: VoyageSimulation) => {
  const { bodies } = simulation.state.system;
  const earth = bodies.find((body) => body.id === "earth");
  const moon = bodies.find((body) => body.id === "moon");

  if (!earth || !moon) {
    throw new Error("no Earth or Moon");
  }

  return Math.atan2(moon.y - earth.y, moon.x - earth.x);
};

describe("steering the voyage", () => {
  test("held keys fly the ship whatever the pointer does; let go, the ship coasts until the pointer moves again", () => {
    const simulation = createFlying();
    const game = hostFor(simulation);
    const pointer = { x: 700, y: 500 };
    const ship = shipOf(simulation);

    game.point(pointer);
    expect(inputOf(game).aim).not.toBeNull();

    // Pointing the way to fly: straight right of the ship, at full burn.
    game.setKeys({ turn: 0, thrust: 0, brake: false, lean: { x: 1, y: 0 } });
    game.point(pointer);
    expect(inputOf(game)).toMatchObject({ aim: { x: ship.x + 3, y: ship.y }, thrust: 1, brake: false });

    // Turning and burning: a mouse moving under held keys does not take over.
    game.setKeys({ turn: -1, thrust: 1, brake: true, lean: null });
    game.point(pointer);
    expect(inputOf(game)).toMatchObject({ aim: null, turn: -1, thrust: 1, brake: true });

    game.setKeys({ turn: 0, thrust: 0, brake: false, lean: null });
    game.point(null);
    expect(inputOf(game)).toMatchObject({ aim: null, turn: 0, thrust: 0, brake: false });
    game.point(pointer);
    expect(inputOf(game).aim).not.toBeNull();
  });

  test("a press on the radar is one only where it is drawn, and never in photo mode", () => {
    const simulation = createFlying();
    const game = hostFor(simulation, quietRenderer((x, y) => Math.hypot(x - 72, y - 528) <= 58));

    expect(game.isOnRadar({ x: 72, y: 528 })).toBe(true);
    expect(game.isOnRadar({ x: 400, y: 300 })).toBe(false);
    game.setPhotoMode(true);
    expect(game.isOnRadar({ x: 72, y: 528 })).toBe(false);
  });
});

describe("the mission clock", () => {
  test("runs as fast as the pilot picks: real, half an hour a second, or six hours, when the Moon goes round in under two minutes", () => {
    const { speeds } = DEFAULT_VOYAGE_CONFIG.clock;
    const turned = (speed: "real" | "fast" | "faster") => {
      const simulation = createFlying();

      simulation.setClockSpeed(speed);
      expect(simulation.state.clock.hoursPerSecond).toBe(speeds[speed]);

      const before = moonAngle(simulation);

      simulation.step(10000);

      return Math.abs(Math.atan2(Math.sin(moonAngle(simulation) - before), Math.cos(moonAngle(simulation) - before)));
    };

    // The Moon goes round Earth in 27.3 days: ten seconds at six hours a second is 60 hours, about 33 degrees.
    expect(turned("faster")).toBeCloseTo((60 / (27.32 * 24)) * Math.PI * 2, 1);
    expect(turned("faster") / turned("fast")).toBeCloseTo(12, 0);
    expect(turned("real")).toBeLessThan(1e-4);
  });

  test("a change of speed mid run carries on from the moment the clock reads, with nothing jumping", () => {
    const simulation = createFlying();

    simulation.step(5000);

    const before = moonAngle(simulation);
    const reading = simulation.snapshot.telemetry.missionTime;

    // One step later, at six hours a second, the clock has moved on by a minute or so, not by the hours flown before.
    simulation.setClockSpeed("faster");
    simulation.step(DEFAULT_VOYAGE_CONFIG.stepMs);
    expect(Math.abs(moonAngle(simulation) - before)).toBeLessThan(0.01);
    expect(simulation.snapshot.telemetry.missionTime - reading).toBeGreaterThan(0);
    expect(simulation.snapshot.telemetry.missionTime - reading).toBeLessThan(5 * 60 * 1000);
  });

  test("a new run keeps the pilot's speed, and the daily voyage always runs the usual one, so everyone meets the same sky", () => {
    const simulation = createFlying();

    simulation.setClockSpeed("faster");
    simulation.start(EPOCH);
    expect(simulation.state.clock).toEqual({ epochMs: EPOCH, hoursPerSecond: 6 });

    simulation.start(EPOCH, { day: "2026-10-09", seed: 42 });
    expect(simulation.state.clock).toEqual({ epochMs: EPOCH, hoursPerSecond: 0.5 });
    simulation.setClockSpeed("real");
    expect(simulation.state.clock).toEqual({ epochMs: EPOCH, hoursPerSecond: 0.5 });
  });
});
