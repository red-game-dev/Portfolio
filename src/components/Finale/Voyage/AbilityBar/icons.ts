import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import {
  faAnglesRight,
  faAtom,
  faBatteryFull,
  faBolt,
  faBullseye,
  faCubes,
  faDice,
  faEyeSlash,
  faFireFlameCurved,
  faFlask,
  faGamepad,
  faGasPump,
  faGem,
  faHourglassHalf,
  faHurricane,
  faMagnet,
  faRobot,
  faShieldHalved,
  faSnowflake,
  faSun,
  faToolbox,
  faWrench,
} from "@fortawesome/free-solid-svg-icons";

import type { BarSlot, BoostId } from "@/packages/games/voyage";

// Each boost's icon on the bar and in the Loadout.
const BOOST_ICONS: Readonly<Record<BoostId, IconDefinition>> = {
  afterburner: faFireFlameCurved,
  overcharge: faBolt,
  tractor: faMagnet,
  decoy: faBullseye,
  solarSail: faSun,
  magneticShield: faShieldHalved,
  ionBurn: faAtom,
  bulletTime: faHourglassHalf,
  wingman: faRobot,
  blockShield: faCubes,
  luckyRoll: faDice,
  pixelBlink: faGamepad,
  cloak: faEyeSlash,
  warpJump: faAnglesRight,
  prism: faGem,
  heatSink: faSnowflake,
  gravityWell: faHurricane,
};

// The consumables by what they do; a spare part fitted from the bar shows a spanner.
const ITEM_ICONS: Readonly<Record<string, IconDefinition>> = {
  repairKit: faToolbox,
  fuelCell: faGasPump,
  shieldCell: faBatteryFull,
  coolantFlask: faFlask,
};

export const slotIcon = (slot: BarSlot): IconDefinition => (slot.kind === "boost" ? BOOST_ICONS[slot.id] : ITEM_ICONS[slot.id] ?? faWrench);
