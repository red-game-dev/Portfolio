import { DEG } from "@/packages/math/angles";
import { clamp } from "@/packages/math/clamp";

import { LANDING } from "../config";
import { LandingAir, LandingPlan, LandingStage, LandingWorld } from "../domain/landing";
import { ballisticFor, densityAt, orbitalSpeed, terminalSpeed } from "../utils/air";
import { flyAhead, isSoftTouchdown } from "./descent";

// A stage gated by speed opens only once the stage before has slowed the craft to its gate, so a shield is sized to
// slow it to this share of the gate.
const OPENING = 0.85;
// An engine lit through the air starts this many times as high as it needs to stop the fall at full thrust.
const BURN_MARGIN = 1.5;
// A burn needs the air to have slowed the craft to at most this share of its speed from orbit; any faster and the
// air has barely touched it.
const SLOWED = 0.5;
// Coming down on the engine alone, it starts where drag at orbital speed is no more than this share of the pull.
const DRAG_SHARE = 0.01;

// A parachute sized to bring a craft to `speed` at the ground of that world, within what a canopy can be.
const chuteFor = (speed: number, world: LandingWorld, density: number) =>
  clamp(ballisticFor(speed, world.gravity, density), LANDING.smallestChute, LANDING.largestChute);

// Whether a way down works: flown ahead by the guidance, as mission planners fly theirs before committing, it
// reaches the ground in one piece.
const landsSoftly = (world: LandingWorld, plan: LandingPlan): boolean => isSoftTouchdown(flyAhead(world, plan), plan, world);

// How high an engine of that thrust (in the world's g) must be lit to stop a craft of that ballistic coefficient
// falling at terminal speed, no lower than `from`: where the stopping distance at full thrust, with a margin, fits
// above the low gate. Air thins upwards and the fall quickens with it, so it is found by stepping up until the two
// agree; where they never do below `ceiling`, the air is too thin for a burn to be lit in time.
const burnAltitude = (world: LandingWorld, ballistic: number, thrust: number, from: number, ceiling: number): number | null => {
  const braking = 2 * (thrust - 1) * world.gravity;
  let altitude = from;

  for (let pass = 0; pass < 40; pass += 1) {
    const speed = terminalSpeed(ballistic, world.gravity, densityAt(world.air, altitude));
    const needed = Math.max(from, LANDING.powered.gate.altitude + (BURN_MARGIN * speed * speed) / braking);

    if (needed > ceiling) {
      return null;
    }

    if (Math.abs(needed - altitude) < 1) {
      return needed;
    }

    altitude = needed;
  }

  return null;
};

// Apollo's way: on the engine all the way from orbit, from 15 km where there is no air, or from where the air is
// too thin to slow the craft much.
const powered = (world: LandingWorld, startAltitude: number): LandingPlan => {
  const { thrust, body, touchdown, safe, gate } = LANDING.powered;

  return {
    method: "powered",
    startAltitude,
    startAngle: 0,
    startSpeed: orbitalSpeed(world.gravity, world.radius, startAltitude),
    stages: [{ phase: "powered", ballistic: body, thrust }],
    touchdownSpeed: touchdown,
    safeSpeed: safe,
    seaSafeSpeed: null,
    handover: gate.altitude,
    gate,
  };
};

// Where drag at orbital speed on the powered descent's body is no more than `DRAG_SHARE` of the pull.
const aboveAir = (world: LandingWorld, air: LandingAir): number => {
  const speed = orbitalSpeed(world.gravity, world.radius, 0);
  const height = air.scaleHeight * Math.log((air.density * speed * speed) / (2 * LANDING.powered.body * DRAG_SHARE * world.gravity));

  return Math.max(LANDING.powered.startAltitude, height);
};

// Where entry begins and how fast, for a way down through the air.
const entryFor = (world: LandingWorld, air: LandingAir, method: LandingPlan["method"], angle: number) => {
  const startAltitude = LANDING.entryScaleHeights * air.scaleHeight;

  return {
    method, startAltitude, startAngle: angle, startSpeed: orbitalSpeed(world.gravity, world.radius, startAltitude), seaSafeSpeed: null, handover: null, gate: null,
  };
};

// Venera's way, where a plate no more than `plate` brings the lander down slowly enough.
const dragPlate = (world: LandingWorld, air: LandingAir): LandingPlan | null => {
  const plan = LANDING.dragPlate;
  const { density, scaleHeight, soundSpeed } = air;

  if (terminalSpeed(plan.plate, world.gravity, density) > plan.limit) {
    return null;
  }

  const stages: LandingStage[] = [
    { phase: "entry", ballistic: plan.entry },
    { phase: "main", belowAltitude: plan.mainScaleHeights * scaleHeight, belowSpeed: plan.mainMach * soundSpeed, ballistic: plan.main },
    { phase: "dragPlate", belowAltitude: plan.plateScaleHeights * scaleHeight, ballistic: Math.min(plan.plate, ballisticFor(plan.touchdown, world.gravity, density)) },
  ];

  return { ...entryFor(world, air, "dragPlate", plan.angle), stages, touchdownSpeed: plan.touchdown, safeSpeed: plan.safe };
};

// Huygens's way, where parachutes alone set a probe down gently enough.
const probe = (world: LandingWorld, air: LandingAir): LandingPlan | null => {
  const plan = LANDING.probe;
  const chute = chuteFor(plan.touchdown, world, air.density);

  if (terminalSpeed(chute, world.gravity, air.density) > plan.limit) {
    return null;
  }

  const stages: LandingStage[] = [
    { phase: "entry", ballistic: plan.entry },
    { phase: "drogue", belowSpeed: plan.drogueMach * air.soundSpeed, ballistic: plan.drogue },
    { phase: "main", belowAltitude: plan.mainScaleHeights * air.scaleHeight, ballistic: chute },
  ];

  return { ...entryFor(world, air, "probe", plan.angle), stages, touchdownSpeed: plan.touchdown, safeSpeed: plan.safe };
};

// A capsule's way, where parachutes need only a moment's burn to finish.
const parachutes = (world: LandingWorld, air: LandingAir): LandingPlan | null => {
  const plan = LANDING.parachutes;
  const mains = chuteFor(plan.touchdown, world, air.density);

  if (terminalSpeed(mains, world.gravity, air.density) > plan.limit) {
    return null;
  }

  const scale = air.scaleHeight / plan.referenceScaleHeight;
  const stages: LandingStage[] = [
    { phase: "entry", ballistic: plan.entry, lift: plan.lift },
    { phase: "drogue", belowAltitude: plan.drogueAltitude * scale, belowSpeed: plan.drogueMach * air.soundSpeed, ballistic: plan.drogue },
    { phase: "main", belowAltitude: plan.mainAltitude * scale, belowSpeed: plan.mainSpeed, ballistic: mains },
    { phase: "softLanding", ballistic: mains, thrust: plan.softThrust },
  ];

  return { ...entryFor(world, air, "parachutes", plan.angle), stages, touchdownSpeed: plan.softTouchdown, safeSpeed: plan.safe, seaSafeSpeed: plan.seaSafe };
};

// Mars's way: a supersonic parachute, then the engine from where it can stop what the parachute leaves. The heat
// shield is made broader (a lighter ballistic coefficient, down to `lightestEntry`) where the air is too thin for
// Mars's to slow it below the parachute's speed in time, as a mission to a thinner world would build it.
const chuteAndBurn = (world: LandingWorld, air: LandingAir): LandingPlan | null => {
  const plan = LANDING.chuteAndBurn;
  const startAltitude = LANDING.entryScaleHeights * air.scaleHeight;
  const burn = burnAltitude(world, plan.chute, plan.thrust, plan.poweredAltitude * (air.scaleHeight / plan.referenceScaleHeight), startAltitude / 2);

  if (burn === null) {
    return null;
  }

  const start = entryFor(world, air, "chuteAndBurn", plan.angle);
  const chuteSpeed = plan.chuteMach * air.soundSpeed;
  // As heavy a shield as still slows the craft to the parachute's speed by the burn: at terminal speed there, and
  // with air enough along the way.
  const column = (densityAt(air, burn) * air.scaleHeight) / Math.sin(plan.angle * DEG);
  const entry = Math.floor(Math.min(plan.entry, ballisticFor(OPENING * chuteSpeed, world.gravity, densityAt(air, burn)),
    column / (2 * Math.log(start.startSpeed / (OPENING * chuteSpeed)))));

  if (entry < plan.lightestEntry) {
    return null;
  }

  const stages: LandingStage[] = [
    { phase: "entry", ballistic: entry, lift: plan.lift },
    { phase: "supersonic", belowSpeed: chuteSpeed, ballistic: plan.chute },
    { phase: "powered", belowAltitude: burn, ballistic: plan.body, thrust: plan.thrust },
  ];

  return { ...start, stages, touchdownSpeed: plan.touchdown, safeSpeed: plan.safe, handover: LANDING.powered.gate.altitude, gate: LANDING.powered.gate };
};

// A reusable booster's way, where no parachute could open in time: through the air on the heat shield alone, then
// the engine lit high enough to stop the fall.
const retroBurn = (world: LandingWorld, air: LandingAir): LandingPlan | null => {
  const plan = LANDING.retroBurn;
  const start = entryFor(world, air, "retroBurn", plan.angle);
  const burn = burnAltitude(world, plan.entry, plan.thrust, plan.lowestBurn, start.startAltitude / 2);

  if (burn === null || terminalSpeed(plan.entry, world.gravity, densityAt(air, burn)) > SLOWED * start.startSpeed) {
    return null;
  }

  return {
    ...start,
    stages: [
      { phase: "entry", ballistic: plan.entry, lift: plan.lift },
      { phase: "powered", belowAltitude: burn, ballistic: plan.entry, thrust: plan.thrust },
    ],
    touchdownSpeed: plan.touchdown,
    safeSpeed: plan.safe,
    handover: LANDING.powered.gate.altitude,
    gate: LANDING.powered.gate,
  };
};

// How a craft comes down on a world, chosen from the world itself as the missions chose: no air worth having
// means a powered descent; air so thick a drag plate alone brings a lander down slowly enough means Venera's way;
// air thick enough for parachutes to set it down gently means Huygens's; parachutes that need a moment's burn to
// finish means a capsule's; and air too thin for parachutes to finish means Mars's, a supersonic parachute and
// then the engine. Each is taken only once flown ahead it lands in one piece; where none does, the heat shield and
// then the engine, and where the air barely slows the craft at all, the engine from above it. Every world of ours
// gets its real way down, and every world a universe makes gets the one its air and gravity call for.
export const planLanding = (world: LandingWorld): LandingPlan => {
  const { air } = world;

  if (!air || air.density < LANDING.thinAir) {
    return powered(world, LANDING.powered.startAltitude);
  }

  const ways = [dragPlate, probe, parachutes, chuteAndBurn, retroBurn];

  for (const way of ways) {
    const plan = way(world, air);

    if (plan && landsSoftly(world, plan)) {
      return plan;
    }
  }

  return powered(world, aboveAir(world, air));
};
