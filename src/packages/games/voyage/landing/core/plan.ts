import { LANDING } from "../config";
import { LandingPlan, LandingWorld } from "../domain/landing";
import { ballisticFor, orbitalSpeed, terminalSpeed } from "../utils/air";

// A parachute sized to bring a craft to `speed` at the ground of that world, within what a canopy can be.
const chuteFor = (speed: number, world: LandingWorld, density: number) =>
  Math.min(LANDING.largestChute, Math.max(LANDING.smallestChute, ballisticFor(speed, world.gravity, density)));

// How a craft comes down on a world, chosen from the world itself as the missions chose: no air worth having
// means a powered descent; air so thick a drag plate alone brings a lander down slowly enough means Venera's way;
// air thick enough for parachutes to set it down gently means Huygens's; parachutes that need a moment's burn to
// finish means a capsule's; and air too thin for parachutes to finish means Mars's, a supersonic parachute and
// then the engine. Every world of ours gets its real way down, and every world a universe makes gets the one its
// air and gravity call for.
export const planLanding = (world: LandingWorld): LandingPlan => {
  const { air, gravity, radius } = world;

  if (!air || air.density < LANDING.thinAir) {
    const { startAltitude, thrust, body, touchdown, safe, gate } = LANDING.powered;

    return {
      method: "powered",
      startAltitude,
      startAngle: 0,
      startSpeed: orbitalSpeed(gravity, radius, startAltitude),
      stages: [{ phase: "powered", ballistic: body, thrust }],
      touchdownSpeed: touchdown,
      safeSpeed: safe,
      seaSafeSpeed: null,
      handover: gate.altitude,
      gate,
    };
  }

  const { density, scaleHeight, soundSpeed } = air;
  const startAltitude = LANDING.entryScaleHeights * scaleHeight;
  const startSpeed = orbitalSpeed(gravity, radius, startAltitude);
  const entry = (method: LandingPlan["method"], angle: number) => ({
    method, startAltitude, startAngle: angle, startSpeed, seaSafeSpeed: null, handover: null, gate: null,
  });

  if (terminalSpeed(LANDING.dragPlate.plate, gravity, density) <= LANDING.dragPlate.limit) {
    const plan = LANDING.dragPlate;

    return {
      ...entry("dragPlate", plan.angle),
      stages: [
        { phase: "entry", ballistic: plan.entry },
        { phase: "main", belowAltitude: plan.mainScaleHeights * scaleHeight, belowSpeed: plan.mainMach * soundSpeed, ballistic: plan.main },
        { phase: "dragPlate", belowAltitude: plan.plateScaleHeights * scaleHeight, ballistic: Math.min(plan.plate, ballisticFor(plan.touchdown, gravity, density)) },
      ],
      touchdownSpeed: plan.touchdown,
      safeSpeed: plan.safe,
    };
  }

  const probeChute = chuteFor(LANDING.probe.touchdown, world, density);

  if (terminalSpeed(probeChute, gravity, density) <= LANDING.probe.limit) {
    const plan = LANDING.probe;

    return {
      ...entry("probe", plan.angle),
      stages: [
        { phase: "entry", ballistic: plan.entry },
        { phase: "drogue", belowSpeed: plan.drogueMach * soundSpeed, ballistic: plan.drogue },
        { phase: "main", belowAltitude: plan.mainScaleHeights * scaleHeight, ballistic: probeChute },
      ],
      touchdownSpeed: plan.touchdown,
      safeSpeed: plan.safe,
    };
  }

  const mains = chuteFor(LANDING.parachutes.touchdown, world, density);

  if (terminalSpeed(mains, gravity, density) <= LANDING.parachutes.limit) {
    const plan = LANDING.parachutes;
    const scale = scaleHeight / plan.referenceScaleHeight;

    return {
      ...entry("parachutes", plan.angle),
      stages: [
        { phase: "entry", ballistic: plan.entry, lift: plan.lift },
        { phase: "drogue", belowAltitude: plan.drogueAltitude * scale, belowSpeed: plan.drogueMach * soundSpeed, ballistic: plan.drogue },
        { phase: "main", belowAltitude: plan.mainAltitude * scale, belowSpeed: plan.mainSpeed, ballistic: mains },
        { phase: "softLanding", ballistic: mains, thrust: plan.softThrust },
      ],
      touchdownSpeed: plan.softTouchdown,
      safeSpeed: plan.safe,
      seaSafeSpeed: plan.seaSafe,
    };
  }

  const plan = LANDING.chuteAndBurn;

  return {
    ...entry("chuteAndBurn", plan.angle),
    stages: [
      { phase: "entry", ballistic: plan.entry, lift: plan.lift },
      { phase: "supersonic", belowSpeed: plan.chuteMach * soundSpeed, ballistic: plan.chute },
      { phase: "powered", belowAltitude: plan.poweredAltitude * (scaleHeight / plan.referenceScaleHeight), ballistic: plan.body, thrust: plan.thrust },
    ],
    touchdownSpeed: plan.touchdown,
    safeSpeed: plan.safe,
    handover: LANDING.powered.gate.altitude,
    gate: LANDING.powered.gate,
  };
};
