import { LANDING } from "../config";
import { DescentState, LandingPlan, LandingStage, LandingWorld } from "../domain/landing";
import { densityAt } from "../utils/air";

// Standard gravity, for the load the crew feels.
const G0 = 9.80665;
// Steps are kept short where things change fast: a fiftieth of the time to cover the height left, a fifth of the
// time drag takes to change the speed, and never longer than half a second.
const HEIGHT_SHARE = 0.02;
const DRAG_SHARE = 0.2;
const LONGEST_STEP = 0.5;
const SHORTEST_STEP = 0.001;
// While a pilot flies, the engine also leans to cancel any drift sideways over this many seconds.
const DRIFT_SECONDS = 4;
// A lifting capsule holds its lift fully up while falling at least this fast (m/s).
const LIFT_FALL = 50;

// What the pilot asks for: whether they fly at all (the preference), and how hard they burn now (0 to 1).
export interface PilotControl {
  isManual: boolean;
  throttle: number;
}

export const AUTOPILOT: PilotControl = { isManual: false, throttle: 0 };

// The craft at the top of its way down: at the entry interface (or the start of the powered descent), moving at
// orbital speed, at the plan's angle below level.
export const startDescent = (plan: LandingPlan): DescentState => {
  const angle = (plan.startAngle * Math.PI) / 180;

  return {
    time: 0,
    altitude: plan.startAltitude,
    across: plan.startSpeed * Math.cos(angle),
    up: -plan.startSpeed * Math.sin(angle),
    stage: 0,
    phase: plan.stages[0].phase,
    heating: 0,
    load: 0,
    throttle: 0,
    isLit: false,
    isPilot: false,
    reserve: LANDING.reserve,
    isDown: false,
    impactSpeed: 0,
  };
};

// Whether the next stage begins: below its altitude and slower than its speed. The soft landing rockets fire at the
// height their burn needs to bring the descent to the touchdown speed at the ground, as the capsule's altimeter
// times them, and never over water, where the capsule splashes down.
const isDue = (stage: LandingStage, state: DescentState, world: LandingWorld, plan: LandingPlan, gravity: number): boolean => {
  if (stage.phase === "softLanding") {
    const push = (stage.thrust ?? 0) * world.gravity - gravity;
    const fall = -state.up;

    return !world.isWater && push > 0 && fall > plan.touchdownSpeed && state.altitude <= (fall * fall - plan.touchdownSpeed ** 2) / (2 * push);
  }

  const speed = Math.hypot(state.across, state.up);

  return state.altitude <= (stage.belowAltitude ?? Infinity) && speed <= (stage.belowSpeed ?? Infinity);
};

// The engine's push this step, written here so a step makes nothing.
const push = { across: 0, up: 0 };

// The vertical speed the guidance wants (m/s, negative down). Above the low gate: no faster than it could still stop
// by the gate on part of the thrust left over from holding the craft up, and no faster than reaches the gate just as
// the braking sideways runs out, so it arrives there slow and upright, as Apollo's braking phase did. Below it:
// easing from the gate's speed to the touchdown speed as the ground comes up.
const wantedFall = (state: DescentState, plan: LandingPlan, full: number, effectiveGravity: number): number => {
  const { margin, braking } = LANDING.guidance;
  const gate = plan.gate ?? { altitude: 0, speed: plan.touchdownSpeed };

  if (state.altitude <= gate.altitude) {
    return -(plan.touchdownSpeed + (gate.speed - plan.touchdownSpeed) * (gate.altitude > 0 ? state.altitude / gate.altitude : 0));
  }

  const height = state.altitude - gate.altitude;
  const stoppable = Math.sqrt(gate.speed * gate.speed + 2 * Math.max(0.05, margin * (full - effectiveGravity)) * height);
  const brakeTime = Math.abs(state.across) / (braking * full);
  const inStep = brakeTime > 0 ? height / brakeTime : Infinity;

  return -Math.max(gate.speed, Math.min(stoppable, inStep));
};

// How the guidance burns: upwards first, enough to close on the fall it wants, then whatever thrust is left braking
// the speed sideways. The engine lights the first time either asks for anything, the late start that costs least.
const guide = (state: DescentState, plan: LandingPlan, full: number, effectiveGravity: number): void => {
  const { braking, response } = LANDING.guidance;
  const vertical = Math.min(full, Math.max(0, effectiveGravity + (wantedFall(state, plan, full, effectiveGravity) - state.up) / response));
  const room = Math.sqrt(Math.max(0, full * full - vertical * vertical));
  const sideways = Math.min(braking * full, Math.abs(state.across) / response, room);

  push.up = vertical;
  push.across = -Math.sign(state.across) * sideways;
  state.throttle = Math.hypot(push.across, push.up) / full;
  state.isLit = state.isLit || state.throttle > 0;
};

// How much of a lifting capsule's lift points up: all of it while it falls, banked away as it levels, so it slows
// high in thin air without skipping back out.
const liftUp = (state: DescentState) => Math.min(1, Math.max(0, -state.up / LIFT_FALL));

// One step of `dt` seconds: gravity weakening with height and eased by speed across (the curve of the world falling
// away under a craft in orbit), drag from the air at this height on the craft as it is now (held to the reefed
// load under a parachute), and the engine, flown by the guidance or the pilot. Then the next stage, if due; a
// pilot takes over at the low gate if flying by hand; and the ground, met at whatever speed is left.
export const stepDescent = (state: DescentState, world: LandingWorld, plan: LandingPlan, dt: number, control: PilotControl = AUTOPILOT): void => {
  if (state.isDown) {
    return;
  }

  // Flying by hand turned off mid descent: the guidance takes back over.
  if (state.isPilot && !control.isManual) {
    state.isPilot = false;
    state.phase = plan.stages[state.stage].phase;
  }

  const stage = plan.stages[state.stage];
  const distance = world.radius + state.altitude;
  const gravity = world.gravity * (world.radius / distance) ** 2;
  const effectiveGravity = gravity - (state.across * state.across) / distance;
  const speed = Math.hypot(state.across, state.up);
  const density = densityAt(world.air, state.altitude);
  const isChute = stage.phase === "drogue" || stage.phase === "main" || stage.phase === "supersonic" || stage.phase === "softLanding";
  const drag = Math.min((density * speed * speed) / (2 * stage.ballistic), isChute ? LANDING.reefedLoad * G0 : Infinity);
  const full = (stage.thrust ?? 0) * world.gravity;

  push.across = 0;
  push.up = 0;

  if (state.isPilot) {
    state.throttle = state.reserve > 0 ? Math.min(1, Math.max(0, control.throttle)) : 0;
    state.reserve = Math.max(0, state.reserve - state.throttle * dt);

    const thrust = state.throttle * full;

    push.across = Math.max(-thrust * 0.5, Math.min(thrust * 0.5, -state.across / DRIFT_SECONDS));
    push.up = Math.sqrt(Math.max(0, thrust * thrust - push.across * push.across));
  } else if (stage.phase === "softLanding") {
    state.throttle = -state.up > plan.touchdownSpeed ? 1 : 0;
    push.up = state.throttle * full;
  } else if (full > 0) {
    guide(state, plan, full, effectiveGravity);
  } else {
    state.throttle = 0;
  }

  // Drag against the velocity, and a capsule's lift across it, on the side that points up.
  const lift = drag * (stage.lift ?? 0) * liftUp(state);
  const dragAcross = speed > 0 ? (-state.across * drag + -state.up * lift) / speed : 0;
  const dragUp = speed > 0 ? (-state.up * drag + state.across * lift) / speed : 0;
  const heat = LANDING.heatReference;

  state.across += (dragAcross + push.across) * dt;
  state.up += (dragUp + push.up - effectiveGravity) * dt;
  state.load = Math.hypot(dragAcross + push.across, dragUp + push.up) / G0;
  state.heating = Math.sqrt(density / heat.density) * (speed / heat.speed) ** 3;
  state.time += dt;

  const next = plan.stages[state.stage + 1];

  if (next && isDue(next, state, world, plan, gravity)) {
    state.stage += 1;
    state.phase = next.phase;
  }

  if (control.isManual && plan.handover !== null && state.phase === "powered" && state.altitude <= plan.handover) {
    state.isPilot = true;
    state.phase = "pilot";
  }

  const drop = state.up * dt;

  if (state.altitude + drop <= 0) {
    state.isDown = true;
    state.impactSpeed = Math.hypot(state.across, state.up);
    state.altitude = 0;
    state.across = 0;
    state.up = 0;
    state.throttle = 0;
    state.heating = 0;
    state.load = 0;
    state.phase = "down";

    return;
  }

  state.altitude += drop;
};

// What the craft could take where it came down: a capsule splashing down takes more than one landing on its legs.
export const safeSpeedOf = (plan: LandingPlan, world: LandingWorld): number => (world.isWater && plan.seaSafeSpeed !== null ? plan.seaSafeSpeed : plan.safeSpeed);

// Whether it came down in one piece.
export const isSoftTouchdown = (state: DescentState, plan: LandingPlan, world: LandingWorld): boolean => state.isDown && state.impactSpeed <= safeSpeedOf(plan, world);

// How long the next step can be and stay true to the motion.
export const stepSize = (state: DescentState, world: LandingWorld, plan: LandingPlan): number => {
  const speed = Math.max(0.1, Math.hypot(state.across, state.up));
  const density = densityAt(world.air, state.altitude);
  const drag = (density * speed * speed) / (2 * plan.stages[state.stage].ballistic);
  const byHeight = (HEIGHT_SHARE * Math.max(2, state.altitude)) / speed;
  const byDrag = drag > 0 ? (DRAG_SHARE * speed) / drag : LONGEST_STEP;

  return Math.max(SHORTEST_STEP, Math.min(LONGEST_STEP, byHeight, byDrag));
};

// `seconds` of the way down, in as many steps as the motion needs.
export const advanceDescent = (state: DescentState, world: LandingWorld, plan: LandingPlan, seconds: number, control: PilotControl = AUTOPILOT): void => {
  let left = seconds;

  while (left > 0 && !state.isDown) {
    const dt = Math.min(left, stepSize(state, world, plan));

    stepDescent(state, world, plan, dt, control);
    left -= dt;
  }
};

// The whole way down flown ahead by the guidance, for how long it takes (seconds): to the ground, or to the low gate
// where a pilot flying by hand would take over. A host plays the descent faster by how long this is.
export const rehearse = (world: LandingWorld, plan: LandingPlan, isManual = false): number => {
  const state = startDescent(plan);
  const control: PilotControl = { isManual, throttle: 0 };
  // Nothing lands in more than a day; this only guards against a plan that never reaches the ground.
  const longest = 86400;

  while (!state.isDown && !state.isPilot && state.time < longest) {
    advanceDescent(state, world, plan, 60, control);
  }

  return state.time;
};
