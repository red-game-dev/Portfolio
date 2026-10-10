import {
  DEFAULT_VOYAGE_CONFIG,
  NO_INPUT,
  resolveVoyageConfig,
  SolarSystemSource,
  StarSystem,
  SystemService,
  VoyageConfig,
  VoyageInput,
  VoyageSimulation,
} from "@/packages/games/voyage";
import { createSeededRandom } from "@/packages/math/random";

export const defaults = DEFAULT_VOYAGE_CONFIG;
// Noon UTC on 9 October 2026: every test flies the same sky.
export const EPOCH = Date.parse("2026-10-09T12:00:00Z");

const systemOf = (): StarSystem => new SystemService(new SolarSystemSource(), defaults.layout).getView();

// Nothing spawns round the ship and the star stays quiet, so a test sees only what it sets up.
const CALM: Partial<VoyageConfig> = {
  spawn: { ...defaults.spawn, open: 0, belt: 0, universe: 0, universeGrowth: 0, pickups: 0, cometEvery: [1e6, 1e6] },
  weather: { ...defaults.weather, every: [1e6, 1e6] },
  faults: { ...defaults.faults, rate: 0 },
};

// A run already flying from Earth in a calm sky.
export const createFlying = (overrides: Partial<VoyageConfig> = {}, seed = 7): VoyageSimulation => {
  const simulation = new VoyageSimulation(systemOf(), { config: resolveVoyageConfig({ ...CALM, ...overrides }), random: createSeededRandom(seed), epochMs: EPOCH });

  simulation.setView(2, 1.4);
  simulation.start();

  return simulation;
};

export const partsOf = (simulation: VoyageSimulation) => {
  const { stores } = simulation.world;
  const body = stores.body.get(simulation.state.ship);
  const ship = stores.ship.get(simulation.state.ship);
  const health = stores.health.get(simulation.state.ship);

  if (!body || !ship || !health) {
    throw new Error("the ship is gone");
  }

  return { body, ship, health };
};

// Sets the ship just inside a world's surface, moving with it, so the next step lands it.
export const touchDown = (simulation: VoyageSimulation, id: string): void => {
  const place = simulation.state.system.bodies.find((body) => body.id === id);

  if (!place) {
    throw new Error(`no ${id} in the system`);
  }

  const { body } = partsOf(simulation);
  const contact = place.radius + body.radius * 0.9;

  Object.assign(body, { x: place.x + contact, y: place.y, prevX: place.x + contact, prevY: place.y, vx: place.vx, vy: place.vy });
  simulation.step(defaults.stepMs * 2);
};

// Steps until the way down is over (or a limit passes), with the input given each step; returns the ms it took.
export const untilDown = (simulation: VoyageSimulation, input: (simulation: VoyageSimulation) => VoyageInput = () => NO_INPUT, limitMs = 60000): number => {
  let elapsed = 0;

  while (simulation.state.descent?.downAt === null && elapsed < limitMs) {
    simulation.step(100, input(simulation));
    elapsed += 100;
  }

  return elapsed;
};
