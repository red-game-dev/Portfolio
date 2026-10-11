import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import {
  faArrowRightLong,
  faAtom,
  faBomb,
  faBurst,
  faCrosshairs,
  faFire,
  faForward,
  faGasPump,
  faLocationArrow,
  faMoon,
  faPlaneUp,
  faRing,
  faRocket,
  faSatelliteDish,
  faShield,
  faShieldHalved,
  faStar,
  faTemperatureLow,
  faUserAstronaut,
  faWaveSquare,
} from "@fortawesome/free-solid-svg-icons";

import { faGalaxy } from "@/config/icons";
import type { GearSlot, ShipWeaponKind } from "@/packages/games/voyage";

// Each slot's icon on the ship's sheet.
export const SLOT_ICONS: Readonly<Record<GearSlot, IconDefinition>> = {
  cockpit: faUserAstronaut,
  armor: faShield,
  engines: faFire,
  wings: faPlaneUp,
  shield: faShieldHalved,
  sensors: faSatelliteDish,
  tank: faGasPump,
  radiators: faTemperatureLow,
  primary: faCrosshairs,
  pods: faRocket,
  reactor: faAtom,
  drive: faForward,
  halo: faRing,
};

// Each weapon's icon on the bar and in the forge.
export const WEAPON_ICONS: Readonly<Record<ShipWeaponKind, IconDefinition>> = {
  missile: faLocationArrow,
  mine: faBomb,
  railgun: faArrowRightLong,
  emp: faWaveSquare,
  flak: faBurst,
};

// Each tier of the enhancement ladder's badge.
export const TIER_ICONS: Readonly<Record<string, IconDefinition>> = { moon: faMoon, star: faStar, galaxy: faGalaxy };

// Each tier's colour: moonlight, starlight and a galaxy's violet.
export const TIER_COLOURS: Readonly<Record<string, string>> = { moon: "#c9d6ff", star: "#ffd76a", galaxy: "#c58bff" };
