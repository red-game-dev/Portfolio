// The real ways down the methods follow, from the missions that flew them. Altitudes for parachutes are given
// for the world they were built for and scaled by the scale height of the world they open in, so a parachute
// opens where the air is as thick as it was there; speeds that are a Mach number scale with that world's speed of
// sound.
export const LANDING = {
  // Where entry begins, in scale heights of the world's air: 14 is Earth's 120 km entry interface.
  entryScaleHeights: 14,
  // Air thinner than this at the ground (kg/m^3) slows nothing: Pluto's and Triton's millionths of a bar are
  // flown through as if there were none.
  thinAir: 0.001,
  // A canopy can be made no larger than the smallest ballistic coefficient here (kg/m^2) nor so small that it is
  // above the largest and still be a parachute.
  smallestChute: 2.5,
  largestChute: 60,
  // Parachutes open reefed, so the jolt of opening is held to this many Earth g.
  reefedLoad: 4,
  // Heating is told against a capsule's peak coming home from low orbit (density, kg/m^3, and speed, m/s).
  heatReference: { density: 3e-4, speed: 7000 },
  // A pilot flying by hand has this many seconds of burn for the last hundred and fifty metres (Apollo 11 landed
  // with under 30 left).
  reserve: 90,
  // The powered descent's guidance: it keeps the fall slow enough to stop on this share of the thrust left over
  // from holding the craft up, brakes sideways on this share of full thrust, closes on the speed it wants over
  // this many seconds, and falls no faster than reaches the low gate as the sideways speed runs out.
  guidance: { margin: 0.5, braking: 0.8, response: 1.5 },
  // Crew Dragon and Soyuz coming home from low orbit: in at 1.5 degrees, a ballistic coefficient of about 600
  // kg/m^2 and a lift to drag ratio of about 0.27 flown to keep the load down, drogues at 5.5 km below Mach 0.75,
  // three mains at 1.8 km below 100 m/s sized for about 6.7 m/s at the ground, and on land the soft landing rockets
  // fired a moment before touchdown to bring it to 1.5 m/s. A capsule takes 3 m/s on land and splashes down at 12.
  parachutes: {
    angle: 1.5,
    entry: 600,
    lift: 0.27,
    referenceScaleHeight: 8400,
    drogueAltitude: 5500,
    drogueMach: 0.75,
    drogue: 150,
    mainAltitude: 1800,
    mainSpeed: 100,
    touchdown: 6.7,
    softThrust: 4,
    softTouchdown: 1.5,
    safe: 3,
    seaSafe: 12,
    // Parachutes that leave more than this at the ground need an engine to finish the job.
    limit: 12,
  },
  // Curiosity and Perseverance at Mars: a ballistic coefficient of about 145 kg/m^2 and a lift to drag ratio of
  // about 0.24, flown to stay high and slow down where the air is thin, the supersonic parachute at Mach 1.9, then
  // dropped at 2.1 km (or higher, where the fall under it is faster) for a powered descent on an engine of about
  // three Mars g down to 0.75 m/s. A thinner world gets a broader shield, down to an inflatable's 40 kg/m^2.
  chuteAndBurn: {
    angle: 12,
    entry: 145,
    lightestEntry: 40,
    lift: 0.24,
    referenceScaleHeight: 11100,
    chuteMach: 1.9,
    chute: 15,
    poweredAltitude: 2100,
    thrust: 2.9,
    body: 400,
    touchdown: 0.75,
    safe: 3,
  },
  // A reusable booster coming home, where no parachute could open in time: through the air on its own drag at about
  // 400 kg/m^2 with a little lift, then the engine at about three g, lit no lower than 600 m and high enough to stop
  // the fall, down to 0.75 m/s. Its legs take 3.
  retroBurn: {
    angle: 12,
    entry: 400,
    lift: 0.1,
    thrust: 3,
    lowestBurn: 600,
    touchdown: 0.75,
    safe: 3,
  },
  // Huygens at Titan: a ballistic coefficient of about 37 kg/m^2, its large parachute at Mach 1.5, swapped high up
  // (about six scale heights, 125 km) for a smaller one that let it fall faster, reaching the ground at 4.5 m/s
  // two and a half hours later. Parachutes alone will do where they leave no more than `limit` at the ground.
  probe: {
    angle: 12,
    entry: 37,
    drogueMach: 1.5,
    drogue: 6.7,
    mainScaleHeights: 6.07,
    touchdown: 4.5,
    safe: 6,
    limit: 5.5,
  },
  // Venera at Venus: in at a ballistic coefficient of about 300 kg/m^2, a parachute at about four scale heights
  // (62 km) below Mach 0.8 that slows it to tens of metres a second, let go at three (48 km) to fall faster through
  // the heat on a drag plate alone, which brought the lander down at 7 to 8 m/s on air 65 times as thick as Earth's.
  // A world takes this way down where a plate no more than `plate` kg/m^2 brings it to the ground at no more than
  // `limit`.
  dragPlate: {
    angle: 12,
    entry: 300,
    mainScaleHeights: 3.9,
    mainMach: 0.8,
    main: 25,
    plateScaleHeights: 3,
    plate: 250,
    touchdown: 7.5,
    safe: 9,
    limit: 9,
  },
  // Apollo's lunar module: powered descent from 15 km at orbital speed on an engine of about twice the local
  // gravity, through the low gate at 150 m no faster than 5 m/s, to touchdown at about 1 m/s. Its legs take 3.
  powered: {
    startAltitude: 15000,
    thrust: 2,
    body: 400,
    touchdown: 1,
    safe: 3,
    gate: { altitude: 150, speed: 5 },
  },
};
