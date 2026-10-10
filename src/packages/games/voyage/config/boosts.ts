import { BoostId, BoostOrigin, BoostSpec } from "../domain/boosts";

const boost = (id: BoostId, origin: BoostSpec["origin"], weight: number, durationS: number, cooldownS: number, strength: number, perLevel = 0): BoostSpec => ({
  id,
  origin,
  weight,
  durationS,
  cooldownS,
  strength,
  perLevel,
});

// Every boost, what its strength means, and how it grows with each level:
// - afterburner: thrust and top speed times this, for a few seconds past the space's limit;
// - overcharge: shields filled to this times their most, held there while it lasts;
// - tractor: coins and cores drawn in from this many times as far;
// - decoy: a flare thrown behind that hostiles chase and their missiles follow (strength is how far behind);
// - solarSail: a push away from the Sun (world units/s^2 at Earth's sunlight), growing as sunlight does, as a real
//   sail's radiation pressure does;
// - magneticShield: a field that turns aside a solar storm's particles, as Earth's does;
// - ionBurn: fuel used at this share of the usual, at most of the thrust, as an ion engine trades push for economy;
// - bulletTime (the Matrix): everything but the ship runs at this share of its speed;
// - wingman (AI): a drone flying alongside, the gun firing this many times as fast;
// - blockShield (Chain): this many blocks that each take one hit whole, confirmed one by one;
// - luckyRoll (Casino): another boost at random, this many levels better at best;
// - pixelBlink (Game world): a jump this far ahead (world units);
// - cloak (nebula): unseen by hostiles, twice as long inside a nebula;
// - warpJump (void): a jump this far ahead (world units);
// - prism (crystal): each shot split into this many more, fanned out;
// - heatSink (ember): the hull held at no warmer than this (Celsius), nothing wearing from heat;
// - gravityWell (abyss): a mass this strong (mu) set ahead, pulling rocks and hostiles in, real gravity included.
export const BOOSTS: Readonly<Record<BoostId, BoostSpec>> = {
  afterburner: boost("afterburner", "anywhere", 5, 4, 12, 1.6, 0.1),
  overcharge: boost("overcharge", "anywhere", 3, 10, 25, 1.5, 0.1),
  tractor: boost("tractor", "anywhere", 5, 8, 15, 4, 1),
  decoy: boost("decoy", "anywhere", 3, 6, 20, 1.5),
  solarSail: boost("solarSail", "solar", 5, 20, 30, 0.6, 0.15),
  magneticShield: boost("magneticShield", "solar", 3, 15, 30, 1),
  ionBurn: boost("ionBurn", "solar", 4, 20, 25, 0.25, -0.03),
  bulletTime: boost("bulletTime", "matrix", 1, 4, 25, 0.45, -0.04),
  wingman: boost("wingman", "neural", 1, 20, 40, 2, 0.25),
  blockShield: boost("blockShield", "blocks", 1, 30, 30, 3, 1),
  luckyRoll: boost("luckyRoll", "chips", 1, 0, 20, 1),
  pixelBlink: boost("pixelBlink", "pixels", 1, 0, 6, 4, 0.5),
  cloak: boost("cloak", "nebula", 1, 10, 35, 1),
  warpJump: boost("warpJump", "void", 1, 0, 30, 18, 2),
  prism: boost("prism", "crystal", 1, 12, 30, 2),
  heatSink: boost("heatSink", "ember", 1, 12, 30, 20, -2),
  gravityWell: boost("gravityWell", "abyss", 1, 8, 30, 12, 2),
};

export const BOOST_IDS: readonly BoostId[] = Object.values(BOOSTS).map((spec) => spec.id);

// Each core, and each boost on the bar, takes the colour of where it is from: white for anywhere, the Sun's
// orange for our solar system, each universe its own.
export const BOOST_COLOURS: Readonly<Record<BoostOrigin, string>> = {
  anywhere: "#f4f0ff",
  solar: "#ffb347",
  matrix: "#4bffa5",
  neural: "#4fd8ff",
  blocks: "#b48cff",
  chips: "#ff5c9a",
  pixels: "#ffc857",
  nebula: "#ff9df0",
  void: "#9aa8ff",
  crystal: "#7df9ff",
  ember: "#ff7a45",
  abyss: "#3fd0c9",
};

// Finding the same boost again raises it: the finds that reach each level, from the first.
export const LEVEL_FINDS: readonly number[] = [1, 3, 6, 10, 15];

// Each level past the first makes a boost last this share longer.
export const DURATION_PER_LEVEL = 0.15;
