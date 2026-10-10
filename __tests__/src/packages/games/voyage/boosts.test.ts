import { BOOSTS, boostToFind, levelForFinds, NO_INPUT, VoyageEvents, VoyageSimulation, VoyageState } from "@/packages/games/voyage";
import { createSeededRandom } from "@/packages/math/random";

import { createFlying, defaults, partsOf } from "./fixtures/simulation";

const BURN = { ...NO_INPUT, thrust: 1 };

const heard = <K extends keyof VoyageEvents>(simulation: VoyageSimulation, kind: K): Array<VoyageEvents[K]> => {
  const events: Array<VoyageEvents[K]> = [];

  simulation.events.on(kind, (payload) => events.push(payload));

  return events;
};

// The ship somewhere quiet, out between Earth and Mars, at rest.
const outThere = (simulation: VoyageSimulation) => {
  const { star } = simulation.state.system;
  const { body } = partsOf(simulation);
  const x = star.x + 26;

  Object.assign(body, { x, y: star.y, prevX: x, prevY: star.y, vx: 0, vy: 0 });
};

// Through to a universe made from a seed, out of the solar system.
const intoUniverse = (simulation: VoyageSimulation) => {
  const state = simulation.state as VoyageState;

  state.runSeed = 9000;
  state.universes = 5;
  state.phase = "lost";
  state.phaseMs = 1e9;
  simulation.step(defaults.stepMs * 2);
};

describe("voyage boosts", () => {
  test("a boost levels up as more of its cores are found, to the fifth level at most", () => {
    expect([0, 1, 2, 3, 5, 6, 10, 15, 99].map(levelForFinds)).toEqual([0, 1, 1, 2, 2, 3, 4, 5, 5]);
  });

  test("cores are mostly the place's own: our solar system's at home, a universe's style's out there, the rest found anywhere", () => {
    const random = createSeededRandom(5);
    const solar = Array.from({ length: 400 }, () => boostToFind(random, "solar", 0.6, 0.1));
    const matrix = Array.from({ length: 400 }, () => boostToFind(random, "matrix", 0.6, 0.1));
    const voids = Array.from({ length: 600 }, () => boostToFind(random, "void", 0.6, 0.1));

    solar.forEach((id) => expect(["solar", "anywhere"]).toContain(id ? BOOSTS[id].origin : null));
    expect(solar.filter((id) => id && BOOSTS[id].origin === "solar").length).toBeGreaterThan(200);
    expect(matrix.filter((id) => id === "bulletTime").length).toBeGreaterThan(200);
    // The deep's own, now and then another deep style's.
    expect(voids.filter((id) => id === "warpJump").length).toBeGreaterThan(300);
    expect(voids.some((id) => id && ["cloak", "prism", "heatSink", "gravityWell"].includes(id))).toBe(true);
  });

  test("a core drifts in near the ship now and then, and flying through it finds it", () => {
    const simulation = createFlying({ boosts: { ...defaults.boosts, every: [1, 1] } });
    const found = heard(simulation, "boostFound");

    outThere(simulation);
    simulation.step(1500);

    const { stores } = simulation.world;
    const core = stores.pickup.entities.find((entity) => stores.pickup.get(entity)?.kind === "boost");
    const at = core !== undefined ? stores.body.get(core) : undefined;

    expect(at).toBeDefined();

    if (at) {
      Object.assign(partsOf(simulation).body, { x: at.x, y: at.y, prevX: at.x, prevY: at.y });
    }

    simulation.step(defaults.stepMs * 2);
    expect(found).toHaveLength(1);
    expect(BOOSTS[found[0].boost]).toBeDefined();
  });

  test("a boost runs out when its time is up and cannot be used again until it has cooled down", () => {
    const simulation = createFlying();

    outThere(simulation);
    expect(simulation.boost("afterburner", 1)).toBe(true);
    expect(simulation.state.boosts.map((active) => active.id)).toEqual(["afterburner"]);
    expect(simulation.boost("afterburner", 1)).toBe(false);

    simulation.step(BOOSTS.afterburner.durationS * 1000 + 100);
    expect(simulation.state.boosts).toEqual([]);
    expect(simulation.snapshot.boosts.cooldowns.afterburner).toBeGreaterThan(0);

    simulation.step((BOOSTS.afterburner.cooldownS - BOOSTS.afterburner.durationS) * 1000);
    expect(simulation.boost("afterburner", 1)).toBe(true);
  });

  test("an afterburner goes past the space's speed limit while it lasts", () => {
    const plain = createFlying();
    const burning = createFlying();

    [plain, burning].forEach(outThere);
    burning.boost("afterburner", 1);
    plain.step(3000, BURN);
    burning.step(3000, BURN);

    const speed = (simulation: VoyageSimulation) => Math.hypot(partsOf(simulation).body.vx, partsOf(simulation).body.vy);

    expect(speed(burning)).toBeGreaterThan(defaults.ship.maxSpeed * 1.2);
    expect(speed(plain)).toBeLessThanOrEqual(defaults.ship.maxSpeed + 1e-6);
  });

  test("an overcharge holds the shields past their most, and a block shield takes whole hits, a block each", () => {
    const simulation = createFlying();
    const blocked = heard(simulation, "blocked");

    outThere(simulation);
    simulation.boost("overcharge", 1);
    simulation.step(500);
    expect(partsOf(simulation).health.shields).toBeGreaterThan(partsOf(simulation).health.maxShields * 1.4);

    simulation.boost("blockShield", 1);
    expect(simulation.snapshot.boosts.blocks).toBe(3);
    // The gun would shoot the rock down before it hit.
    simulation.setAutoFire(false);

    const shields = partsOf(simulation).health.shields;
    const { stores } = simulation.world;
    const rock = simulation.world.spawn();
    const { body } = partsOf(simulation);

    // A rock thrown at the ship hits a block, not the shields.
    stores.body.set(rock, { x: body.x + 0.5, y: body.y, vx: -3, vy: 0, prevX: body.x + 0.5, prevY: body.y, radius: 0.1, mass: 1 });
    stores.hazard.set(rock, { shape: 0, isIcy: false, isComet: false });
    simulation.step(300);

    expect(blocked.length).toBeGreaterThan(0);
    expect(simulation.snapshot.boosts.blocks).toBeLessThan(3);
    expect(partsOf(simulation).health.shields).toBeGreaterThanOrEqual(shields - 1);
  });

  test("a blink jumps ahead along the heading, stopping short of a world; a jump cannot be used standing on one", () => {
    const simulation = createFlying();

    outThere(simulation);

    const { body, ship } = partsOf(simulation);
    const startX = body.x;

    ship.angle = 0;
    expect(simulation.boost("pixelBlink", 1)).toBe(true);
    expect(body.x - startX).toBeCloseTo(BOOSTS.pixelBlink.strength, 3);

    // Pointed at Mars from just short of it: the jump ends outside it.
    const mars = simulation.state.system.bodies.find((place) => place.id === "mars");

    if (!mars) {
      throw new Error("expected Mars");
    }

    Object.assign(body, { x: mars.x - mars.radius - 1, y: mars.y, prevX: mars.x - mars.radius - 1, prevY: mars.y });
    ship.angle = 0;
    simulation.step(BOOSTS.pixelBlink.cooldownS * 1000 + 100);
    Object.assign(body, { x: mars.x - mars.radius - 1, y: mars.y, prevX: mars.x - mars.radius - 1, prevY: mars.y, vx: 0, vy: 0 });
    simulation.boost("pixelBlink", 1);
    expect(Math.hypot(body.x - mars.x, body.y - mars.y)).toBeGreaterThan(mars.radius);

    ship.landedOn = "mars";
    expect(simulation.boost("warpJump", 1)).toBe(false);
  });

  test("a heat sink keeps the hull cool close to the Sun, and a magnetic shield turns a solar storm aside", () => {
    const simulation = createFlying();
    const { star } = simulation.state.system;
    const { body, ship, health } = partsOf(simulation);
    // Held just above the Sun, where the hull would otherwise cook.
    const hold = (out: number) => Object.assign(body, { x: star.x + out, y: star.y, prevX: star.x + out, prevY: star.y, vx: 0, vy: 0 });

    simulation.boost("heatSink", 1);

    for (let held = 0; held < 40; held += 1) {
      hold(star.radius * 2.2);
      simulation.step(100);
    }

    expect(ship.temperatureC).toBeLessThan(defaults.thermal.ratings.sensors);

    // Further out, a storm's shell reaching the ship.
    const storms = heard(simulation, "storm");

    hold(20);
    simulation.boost("magneticShield", 1);

    const shields = health.shields;

    (simulation.state as VoyageState).storms.push({ angle: 0, width: Math.PI, radius: 19.9, speed: 2, strength: 1, hasHitShip: false, hasHitEarth: true });
    simulation.step(300);
    expect(storms.length).toBeGreaterThan(0);
    expect(storms[0].strength).toBe(0);
    expect(health.shields).toBeGreaterThanOrEqual(shields - 1);
  });

  test("a solar sail pushes away from the Sun, harder closer in", () => {
    const near = createFlying();
    const far = createFlying();
    const { star } = near.state.system;

    [[near, 12], [far, 40]].forEach(([simulation, out]) => {
      const run = simulation as VoyageSimulation;
      const { body } = partsOf(run);
      const x = star.x + (out as number);

      Object.assign(body, { x, y: star.y, prevX: x, prevY: star.y, vx: 0, vy: 0 });
      run.boost("solarSail", 1);
      run.step(1000);
    });

    // Net of the Sun's own pull, the sail drives the ship outward, and more so where the light is strong.
    const outward = (simulation: VoyageSimulation) => partsOf(simulation).body.vx;
    const pulledOnly = createFlying();
    const { body } = partsOf(pulledOnly);

    Object.assign(body, { x: star.x + 12, y: star.y, prevX: star.x + 12, prevY: star.y, vx: 0, vy: 0 });
    pulledOnly.step(1000);
    expect(outward(near) - outward(pulledOnly)).toBeGreaterThan(0.3);
    expect(outward(near) - outward(pulledOnly)).toBeGreaterThan(outward(far));
  });

  test("a gravity well pulls a rock in, and bullet time slows everything but the ship", () => {
    const simulation = createFlying();

    outThere(simulation);

    const { stores } = simulation.world;
    const { body, ship } = partsOf(simulation);
    const rock = simulation.world.spawn();

    ship.angle = 0;
    stores.body.set(rock, { x: body.x + 3, y: body.y + 2, vx: 0, vy: 0, prevX: body.x + 3, prevY: body.y + 2, radius: 0.05, mass: 1 });
    stores.hazard.set(rock, { shape: 0, isIcy: false, isComet: false });
    simulation.boost("gravityWell", 1);
    simulation.step(500);

    const at = stores.body.get(rock);

    // Pulled down towards the well, three units ahead of where the ship was.
    expect(at?.vy).toBeLessThan(-0.5);

    const slow = createFlying();

    outThere(slow);

    const drifter = slow.world.spawn();
    const ahead = partsOf(slow).body;

    slow.world.stores.body.set(drifter, { x: ahead.x + 5, y: ahead.y, vx: 1, vy: 0, prevX: ahead.x + 5, prevY: ahead.y, radius: 0.05, mass: 1 });
    slow.boost("bulletTime", 1);
    slow.step(1000);
    expect((slow.world.stores.body.get(drifter)?.x ?? 0) - (ahead.x + 5)).toBeLessThan(0.6);
  });

  test("cloaked, hostiles lose the ship and the gun holds its fire; a decoy draws their missiles", () => {
    const simulation = createFlying({ spawn: { ...defaults.spawn, open: 0, belt: 0, universe: 0, universeGrowth: 0, pickups: 0 } });

    intoUniverse(simulation);
    expect(simulation.state.phase).toBe("universe");

    const { stores } = simulation.world;
    const fired = heard(simulation, "fired");

    stores.alien.values.forEach((alien) => {
      alien.threat = 1;
      alien.mode = "chase";
    });
    simulation.boost("cloak", 1);
    stores.alien.values.forEach((alien) => expect(alien.threat).toBe(0));
    simulation.step(1500);
    expect(fired.filter((shot) => shot.team === "ship")).toHaveLength(0);

    // A missile on its way after the ship turns after the flare.
    const shot = simulation.world.spawn();
    const { body } = partsOf(simulation);

    stores.body.set(shot, { x: body.x + 2, y: body.y, vx: -1, vy: 0, prevX: body.x + 2, prevY: body.y, radius: 0.02, mass: 0.001 });
    stores.projectile.set(shot, { owner: shot, team: "aliens", kind: "missile", damage: 10, ttl: 5, target: simulation.state.ship });
    simulation.boost("decoy", 1);
    expect(stores.projectile.get(shot)?.target).toBe(simulation.state.decoy);
  });

  test("a lucky roll sets another boost to work", () => {
    const simulation = createFlying();
    const boosted = heard(simulation, "boosted");

    outThere(simulation);
    expect(simulation.boost("luckyRoll", 1)).toBe(true);
    expect(boosted.map((event) => event.boost)).toContain("luckyRoll");
    expect(boosted.some((event) => event.boost !== "luckyRoll")).toBe(true);
  });
});
